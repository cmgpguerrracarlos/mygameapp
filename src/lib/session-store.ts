import { randomUUID } from "crypto";
import { mkdir, readFile, readdir, rm, stat, unlink, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { getTournamentSummary, startTournament, stepTournament } from "@/lib/tournament";
import {
  EditableCompetitor,
  SessionRecord,
  StoredTournamentState,
  TournamentSummary,
} from "@/lib/types";

const SESSION_COOKIE = "bracket-blitz-session";
const SESSION_TTL_SECONDS = 4 * 60 * 60;
const SESSION_TTL_HOURS = SESSION_TTL_SECONDS / 3600;
const SESSION_KEY_PREFIX = "session:";
const uploadRoot = path.join(process.cwd(), ".data", "uploads");
const sessionsDir = path.join(process.cwd(), ".data", "sessions");

type CloudflareBindings = CloudflareEnv & {
  TOURNAMENT_SESSIONS_KV?: KVNamespace;
  TOURNAMENT_UPLOADS?: R2Bucket;
};

function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function makeStorageKey(sessionId: string, competitorId: string, safeFileName: string) {
  return `tournaments/${sessionId}/${competitorId}/${safeFileName}`;
}

function imageRouteForKey(storageKey: string) {
  return `/api/images/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}

async function getCloudflareBindings(): Promise<CloudflareBindings | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });

    if (env?.TOURNAMENT_SESSIONS_KV && env?.TOURNAMENT_UPLOADS) {
      return env as CloudflareBindings;
    }

    return null;
  } catch {
    return null;
  }
}

async function ensureLocalDirectories() {
  await mkdir(sessionsDir, { recursive: true });
  await mkdir(uploadRoot, { recursive: true });
}

function sessionFile(sessionId: string) {
  return path.join(sessionsDir, `${sessionId}.json`);
}

async function listKvKeys(namespace: KVNamespace, prefix: string) {
  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await namespace.list({ prefix, cursor });
    keys.push(...page.keys.map((entry) => entry.name));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return keys;
}

async function listR2Keys(bucket: R2Bucket, prefix: string) {
  const keys: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await bucket.list({ prefix, cursor });
    keys.push(...page.objects.map((entry) => entry.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return keys;
}

async function readStoredState(sessionId: string): Promise<StoredTournamentState | null> {
  const bindings = await getCloudflareBindings();

  if (bindings?.TOURNAMENT_SESSIONS_KV) {
    return bindings.TOURNAMENT_SESSIONS_KV.get<StoredTournamentState>(
      `${SESSION_KEY_PREFIX}${sessionId}`,
      "json",
    );
  }

  await ensureLocalDirectories();
  const raw = await readFile(sessionFile(sessionId), "utf8");
  return JSON.parse(raw) as StoredTournamentState;
}

async function writeStoredState(state: StoredTournamentState) {
  const bindings = await getCloudflareBindings();

  if (bindings?.TOURNAMENT_SESSIONS_KV) {
    await bindings.TOURNAMENT_SESSIONS_KV.put(
      `${SESSION_KEY_PREFIX}${state.session.id}`,
      JSON.stringify(state),
      { expirationTtl: SESSION_TTL_SECONDS },
    );
    return;
  }

  await ensureLocalDirectories();
  await writeFile(sessionFile(state.session.id), JSON.stringify(state, null, 2), "utf8");
}

async function deleteUploadedPhotos(sessionId: string) {
  const bindings = await getCloudflareBindings();

  if (bindings?.TOURNAMENT_UPLOADS) {
    const keys = await listR2Keys(bindings.TOURNAMENT_UPLOADS, `tournaments/${sessionId}/`);

    if (keys.length > 0) {
      await bindings.TOURNAMENT_UPLOADS.delete(keys);
    }

    return;
  }

  await rm(path.join(uploadRoot, "tournaments", sessionId), {
    recursive: true,
    force: true,
  });
}

async function removeStoredState(sessionId: string) {
  const bindings = await getCloudflareBindings();

  if (bindings?.TOURNAMENT_SESSIONS_KV) {
    await bindings.TOURNAMENT_SESSIONS_KV.delete(`${SESSION_KEY_PREFIX}${sessionId}`);
    return;
  }

  await unlink(sessionFile(sessionId)).catch(() => undefined);
}

export async function cleanupExpiredSessions() {
  const bindings = await getCloudflareBindings();

  if (bindings?.TOURNAMENT_SESSIONS_KV) {
    const sessionKeys = await listKvKeys(bindings.TOURNAMENT_SESSIONS_KV, SESSION_KEY_PREFIX);

    await Promise.all(
      sessionKeys.map(async (key) => {
        const state = await bindings.TOURNAMENT_SESSIONS_KV?.get<StoredTournamentState>(key, "json");

        if (!state?.session) {
          return;
        }

        if (!isExpired(state.session.expiresAt) && state.session.status !== "ended") {
          return;
        }

        await deleteUploadedPhotos(state.session.id);
        await bindings.TOURNAMENT_SESSIONS_KV?.delete(key);
      }),
    );

    return;
  }

  await ensureLocalDirectories();
  const files = await readdir(sessionsDir);

  await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(sessionsDir, fileName);
      const fileStats = await stat(filePath);

      if (!fileStats.isFile()) {
        return;
      }

      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as StoredTournamentState;

      if (!parsed.session || (!isExpired(parsed.session.expiresAt) && parsed.session.status !== "ended")) {
        return;
      }

      await deleteUploadedPhotos(parsed.session.id);
      await unlink(filePath).catch(() => undefined);
    }),
  );
}

export async function createSession() {
  await cleanupExpiredSessions();

  const id = randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const session: SessionRecord = {
    id,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "active",
  };

  const state: StoredTournamentState = {
    session,
    tournament: null,
    competitors: [],
    matches: [],
  };

  await writeStoredState(state);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return state;
}

export async function getCurrentSessionId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function loadState(sessionId: string) {
  await cleanupExpiredSessions();

  const parsed = await readStoredState(sessionId);

  if (!parsed) {
    throw new Error("Session not found.");
  }

  if (parsed.session.status !== "active" || isExpired(parsed.session.expiresAt)) {
    await endSession(sessionId);
    throw new Error("Session expired.");
  }

  return parsed;
}

export async function getSessionSummary() {
  const sessionId = await getCurrentSessionId();

  if (!sessionId) {
    return null;
  }

  try {
    const state = await loadState(sessionId);
    return getTournamentSummary(state);
  } catch {
    await clearSessionCookie();
    return null;
  }
}

export async function endSession(sessionId: string) {
  const existing = await readStoredState(sessionId).catch(() => null);

  if (existing) {
    existing.session.status = "ended";
    await deleteUploadedPhotos(existing.session.id);
  }

  await removeStoredState(sessionId);
}

export async function uploadCompetitorPhoto(
  sessionId: string,
  competitorId: string,
  fileName: string,
  contentType: string,
  bytes: ArrayBuffer,
) {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storageKey = makeStorageKey(sessionId, competitorId, safeFileName);
  const bindings = await getCloudflareBindings();

  if (bindings?.TOURNAMENT_UPLOADS) {
    await bindings.TOURNAMENT_UPLOADS.put(storageKey, bytes, {
      httpMetadata: {
        contentType: contentType || "application/octet-stream",
      },
    });
  } else {
    await ensureLocalDirectories();
    const diskPath = path.join(uploadRoot, storageKey);
    await mkdir(path.dirname(diskPath), { recursive: true });
    await writeFile(diskPath, Buffer.from(bytes));
  }

  return {
    photoUrl: imageRouteForKey(storageKey),
    photoStoragePath: storageKey,
  };
}

export async function getUploadedPhoto(objectKey: string) {
  const bindings = await getCloudflareBindings();

  if (bindings?.TOURNAMENT_UPLOADS) {
    const object = await bindings.TOURNAMENT_UPLOADS.get(objectKey);

    if (!object) {
      return null;
    }

    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType || "application/octet-stream",
    };
  }

  const diskPath = path.join(uploadRoot, objectKey);
  const body = await readFile(diskPath).catch(() => null);

  if (!body) {
    return null;
  }

  const extension = path.extname(diskPath).toLowerCase();
  const contentType =
    extension === ".png"
      ? "image/png"
      : extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".webp"
          ? "image/webp"
          : extension === ".gif"
            ? "image/gif"
            : "application/octet-stream";

  return { body, contentType };
}

export async function createTournament(
  sessionId: string,
  size: 2 | 4 | 8 | 16 | 32,
  competitors: EditableCompetitor[],
) {
  const state = await loadState(sessionId);
  startTournament(state, size, competitors);
  await writeStoredState(state);
  return getTournamentSummary(state);
}

export async function advanceTournament(sessionId: string): Promise<TournamentSummary> {
  const state = await loadState(sessionId);
  const summary = stepTournament(state);
  await writeStoredState(state);
  return summary;
}
