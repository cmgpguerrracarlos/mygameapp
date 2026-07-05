import { NextResponse } from "next/server";
import { getSessionSummary } from "@/lib/session-store";

export async function GET() {
  const summary = await getSessionSummary();
  return NextResponse.json(summary);
}
