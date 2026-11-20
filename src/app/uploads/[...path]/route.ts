import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_IMAGE_TYPES } from "@/lib/validations/report";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await ctx.params;
  if (
    !parts?.length ||
    parts.some((p) => !p || p.includes("..") || p.includes("/") || p.includes("\\"))
  ) {
    return new Response("Bad request", { status: 400 });
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const absolutePath = path.join(uploadsRoot, ...parts);
  if (!absolutePath.startsWith(uploadsRoot)) {
    return new Response("Bad request", { status: 400 });
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mime =
    Object.entries(ALLOWED_IMAGE_TYPES).find(([, e]) => e === ext)?.[0] ??
    "application/octet-stream";

  let buffer: Buffer;
  try {
    buffer = await readFile(absolutePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
