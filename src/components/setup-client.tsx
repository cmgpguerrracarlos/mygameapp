"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EditableCompetitor } from "@/lib/types";

const sizeOptions = [2, 4, 8, 16, 32] as const;

function makeCompetitor(): EditableCompetitor {
  return {
    id: crypto.randomUUID(),
    name: "",
  };
}

export function SetupClient() {
  const router = useRouter();
  const [size, setSize] = useState<(typeof sizeOptions)[number]>(8);
  const [competitors, setCompetitors] = useState<EditableCompetitor[]>(() =>
    Array.from({ length: 8 }, () => makeCompetitor()),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = useMemo(() => competitors.every((competitor) => competitor.name.trim().length > 0), [competitors]);

  function resizeCompetitors(nextSize: (typeof sizeOptions)[number]) {
    setSize(nextSize);
    setCompetitors((current) => {
      if (current.length === nextSize) {
        return current;
      }

      if (current.length > nextSize) {
        return current.slice(0, nextSize);
      }

      return [...current, ...Array.from({ length: nextSize - current.length }, () => makeCompetitor())];
    });
  }

  function updateCompetitor(id: string, patch: Partial<EditableCompetitor>) {
    setCompetitors((current) =>
      current.map((competitor) => (competitor.id === id ? { ...competitor, ...patch } : competitor)),
    );
  }

  async function handleSubmit() {
    if (!isValid) {
      setError("Every competitor needs a name before the bracket can start.");
      return;
    }

    setSubmitting(true);
    setError("");

    const response = await fetch("/api/tournament/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        size,
        competitors,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setSubmitting(false);
      setError(payload.error ?? "Could not start the tournament.");
      return;
    }

    router.push("/tournament");
    router.refresh();
  }

  return (
    <section className="glass-panel-strong rounded-[2rem] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--ink-soft)]">Bracket size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => resizeCompetitors(option)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  size === option
                    ? "bg-[var(--accent)] text-white shadow-lg shadow-orange-300/40"
                    : "border border-[var(--line)] bg-white/80 text-[var(--foreground)] hover:border-[var(--accent)]"
                }`}
              >
                {option} players
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-400/30 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? "Building bracket..." : "Start Tournament"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {competitors.map((competitor, index) => (
          <article key={competitor.id} className="rounded-[1.6rem] border border-[var(--line)] bg-white/88 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-[var(--line)] bg-[var(--accent-soft)] text-2xl font-bold text-[var(--accent-strong)]">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                  Competitor {index + 1}
                </p>
                <input
                  value={competitor.name}
                  onChange={(event) => updateCompetitor(competitor.id, { name: event.target.value })}
                  placeholder="Enter a name"
                  className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[#fffdf9] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
    </section>
  );
}
