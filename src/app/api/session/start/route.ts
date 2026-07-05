import { NextResponse } from "next/server";
import { createSession } from "@/lib/session-store";

async function startSession(request: Request) {
  await createSession();
  return NextResponse.redirect(new URL("/setup", request.url), { status: 303 });
}

export async function GET(request: Request) {
  return startSession(request);
}

export async function POST(request: Request) {
  return startSession(request);
}
