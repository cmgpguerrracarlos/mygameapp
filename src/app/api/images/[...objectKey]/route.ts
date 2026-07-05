import { NextResponse } from "next/server";
import { getUploadedPhoto } from "@/lib/session-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ objectKey: string[] }> },
) {
  const { objectKey } = await params;
  const object = await getUploadedPhoto(objectKey.join("/"));

  if (!object) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
