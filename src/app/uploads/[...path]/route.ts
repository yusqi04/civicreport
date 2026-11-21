import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool, ensureDatabaseSchema } from "@/lib/db";
import { ALLOWED_IMAGE_TYPES } from "@/lib/validations/report";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await ctx.params;
  if (
    !parts?.length ||
    parts.some((p) => !p || p.includes("..") || p.includes("\\"))
  ) {
    return new Response("Bad request", { status: 400 });
  }

  const relativePath = parts.join("/");
  const ext = path.extname(parts[parts.length - 1]).toLowerCase();
  const defaultMime =
    Object.entries(ALLOWED_IMAGE_TYPES).find(([, e]) => e === ext)?.[0] ??
    "image/jpeg";

  // 1. Coba baca dari filesystem lokal jika ada (misal di development lokal)
  try {
    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    const absolutePath = path.join(uploadsRoot, ...parts);
    if (absolutePath.startsWith(uploadsRoot)) {
      const buffer = await readFile(absolutePath);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": defaultMime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch {
    // File di disk tidak ada / read-only filesystem di Vercel, lanjut ambil dari database
  }

  // 2. Ambil dari database Neon
  try {
    await ensureDatabaseSchema();
    const res = await pool.query<{ file_data: Buffer; mime_type: string | null }>(
      `SELECT file_data, mime_type FROM report_evidence WHERE file_path = $1 LIMIT 1`,
      [relativePath]
    );

    const row = res.rows[0];
    if (row && row.file_data) {
      const mime = row.mime_type || defaultMime;
      return new NextResponse(new Uint8Array(row.file_data), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (dbErr) {
    console.error("[uploads:route:db]", dbErr);
  }

  return new Response("Not found", { status: 404 });
}
