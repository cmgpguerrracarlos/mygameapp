import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Photo storage is no longer available in this simplified version." },
    { status: 410 },
  );
}
