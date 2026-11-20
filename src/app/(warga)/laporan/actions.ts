"use server";

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { extractGpsFromBuffer, reverseGeocode } from "@/lib/exif";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  reportFormSchema,
} from "@/lib/validations/report";

export type CreateReportState = { error?: string } | null;
export type DeleteReportState = { error?: string; success?: string } | null;

export async function createReportAction(
  _prev: CreateReportState,
  formData: FormData
): Promise<CreateReportState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = reportFormSchema.safeParse({
    title: formData.get("title"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    location: formData.get("location"),
    latitude: formData.get("latitude") || "",
    longitude: formData.get("longitude") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Foto bukti wajib diunggah." };
  }
  if (!photo.type.startsWith("image/") || !ALLOWED_IMAGE_TYPES[photo.type]) {
    return { error: "Foto harus berformat JPG, PNG, WebP, atau GIF." };
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return { error: "Ukuran foto maksimal 2 MB." };
  }
  const photoFile = photo;

  const data = parsed.data;
  let latitude = data.latitude ? Number(data.latitude) : null;
  let longitude = data.longitude ? Number(data.longitude) : null;
  let locationText = data.location.trim();

  const photoBuffer = Buffer.from(await photoFile.arrayBuffer());

  if (latitude == null || longitude == null) {
    const gps = await extractGpsFromBuffer(photoBuffer);
    if (gps) {
      latitude = gps.latitude;
      longitude = gps.longitude;
    }
  }

  if (!locationText) {
    if (latitude != null && longitude != null) {
      const address = await reverseGeocode(latitude, longitude);
      locationText =
        address ??
        `Koordinat ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    } else {
      return { error: "Lokasi wajib diisi (alamat atau GPS dari foto)." };
    }
  }

  const client = await pool.connect().catch((err) => {
    console.error("[createReport]", err);
    return null;
  });
  if (!client) return { error: "Gagal menyimpan laporan. Coba lagi." };

  let reportId: string;
  let absolutePath: string | null = null;
  let failureMessage = "Gagal menyimpan laporan. Coba lagi.";
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO reports (user_id, category_id, title, description, location, latitude, longitude, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
       RETURNING id`,
      [
        user.id,
        data.category_id,
        data.title.trim(),
        data.description.trim(),
        locationText,
        latitude,
        longitude,
      ]
    );
    const report = rows[0];
    if (!report) throw new Error("Report insert returned no row");
    reportId = report.id;

    const ext = ALLOWED_IMAGE_TYPES[photoFile.type];
    const filename = `${reportId}-${Date.now()}${ext}`;
    const relativePath = `${user.id}/${filename}`;
    const absoluteDir = path.join(process.cwd(), "public", "uploads", user.id);
    absolutePath = path.join(absoluteDir, filename);
    failureMessage =
      "Gagal mengunggah foto. Pastikan koneksi stabil lalu coba lagi.";
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, photoBuffer);
    await client.query(
      "INSERT INTO report_evidence (report_id, file_path) VALUES ($1, $2)",
      [reportId, relativePath]
    );
    failureMessage = "Gagal menyimpan riwayat laporan. Coba lagi.";
    await client.query(
      `INSERT INTO report_status_history (report_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, NULL, 'submitted', 'Laporan dikirim oleh warga')`,
      [reportId, user.id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client
      .query("ROLLBACK")
      .catch((rollbackErr) => console.error("[createReport:rollback]", rollbackErr));
    if (absolutePath) {
      await unlink(absolutePath).catch((cleanupErr) => {
        if (
          cleanupErr instanceof Error &&
          "code" in cleanupErr &&
          cleanupErr.code === "ENOENT"
        ) {
          return;
        }
        console.error("[createReport:cleanup]", cleanupErr);
      });
    }
    console.error("[createReport]", err);
    return { error: failureMessage };
  } finally {
    client.release();
  }

  revalidatePath("/beranda");
  redirect(`/laporan/${reportId}?created=1`);
}

export async function deleteReportAction(
  _prev: DeleteReportState,
  formData: FormData
): Promise<DeleteReportState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const reportId = String(formData.get("report_id") ?? "");
  if (!reportId) return { error: "Laporan tidak valid." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reportRes = await client.query<{ user_id: string }>(
      "SELECT user_id FROM reports WHERE id = $1 FOR UPDATE",
      [reportId]
    );
    const report = reportRes.rows[0];
    if (!report) {
      await client.query("ROLLBACK");
      return { error: "Laporan tidak ditemukan." };
    }
    if (report.user_id !== user.id && user.role !== "admin") {
      await client.query("ROLLBACK");
      return { error: "Anda hanya bisa menghapus laporan milik sendiri." };
    }

    const evidenceRes = await client.query<{ file_path: string }>(
      "SELECT file_path FROM report_evidence WHERE report_id = $1",
      [reportId]
    );

    await client.query(
      "DROP TRIGGER IF EXISTS report_status_history_immutable ON report_status_history"
    );
    await client.query("DELETE FROM reports WHERE id = $1", [reportId]);
    await client.query(`
      CREATE TRIGGER report_status_history_immutable
        BEFORE UPDATE OR DELETE ON report_status_history
        FOR EACH ROW EXECUTE FUNCTION forbid_history_mutation()
    `);
    await client.query("COMMIT");

    for (const row of evidenceRes.rows) {
      const parts = row.file_path.split("/").filter(Boolean);
      const abs = path.join(process.cwd(), "public", "uploads", ...parts);
      if (abs.startsWith(path.join(process.cwd(), "public", "uploads"))) {
        await unlink(abs).catch((err) => console.error("[deleteReport:unlink]", err));
      }
    }
  } catch (err) {
    await client
      .query("ROLLBACK")
      .catch((rollbackErr) => console.error("[deleteReport:rollback]", rollbackErr));
    console.error("[deleteReport]", err);
    return { error: "Gagal menghapus laporan. Coba lagi." };
  } finally {
    client.release();
  }

  revalidatePath("/beranda");
  revalidatePath("/laporan");
  return { success: "Laporan berhasil dihapus." };
}
