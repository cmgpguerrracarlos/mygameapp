import { NextResponse } from "next/server";
import { getCurrentSessionId, uploadCompetitorPhoto } from "@/lib/session-store";

export async function POST(request: Request) {
  const sessionId = await getCurrentSessionId();

  if (!sessionId) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  const formData = await request.formData();
  const competitorId = formData.get("competitorId");
  const file = formData.get("file");

  if (typeof competitorId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing competitor or file." }, { status: 400 });
  }

  const uploaded = await uploadCompetitorPhoto(
    sessionId,
    competitorId,
    file.name,
    file.type,
    await file.arrayBuffer(),
  );
  return NextResponse.json(uploaded);
}
