"use server";

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PHOTO_BYTES,
  reportFormSchema,
} from "@/lib/validations/report";

export type CreateReportState = { error?: string } | null;

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
  let photoFile: File | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_IMAGE_TYPES[photo.type]) {
      return { error: "Foto harus berformat JPG, PNG, WebP, atau GIF." };
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return { error: "Ukuran foto maksimal 2 MB." };
    }
    photoFile = photo;
  }

  const data = parsed.data;
  const latitude = data.latitude ? Number(data.latitude) : null;
  const longitude = data.longitude ? Number(data.longitude) : null;

  let reportId = "";
  try {
    const { rows } = await pool.query(
      `INSERT INTO reports (user_id, category_id, title, description, location, latitude, longitude, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'submitted')
       RETURNING id`,
      [
        user.id,
        data.category_id,
        data.title.trim(),
        data.description.trim(),
        data.location.trim(),
        latitude,
        longitude,
      ]
    );
    reportId = rows[0].id;
  } catch (err) {
    console.error("[createReport]", err);
    return { error: "Gagal menyimpan laporan. Coba lagi." };
  }

  if (photoFile) {
    const ext = ALLOWED_IMAGE_TYPES[photoFile.type];
    const filename = `${reportId}-${Date.now()}${ext}`;
    const relativePath = `${user.id}/${filename}`;
    const absoluteDir = path.join(process.cwd(), "uploads", user.id);
    const absolutePath = path.join(process.cwd(), "uploads", user.id, filename);
    try {
      await mkdir(absoluteDir, { recursive: true });
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      await writeFile(absolutePath, buffer);
      await pool.query(
        "INSERT INTO report_evidence (report_id, file_path) VALUES ($1, $2)",
        [reportId, relativePath]
      );
    } catch (err) {
      console.error("[uploadEvidence]", err);
      await unlink(absolutePath).catch(() => {});
      await pool.query("DELETE FROM reports WHERE id = $1", [reportId]).catch(() => {});
      return { error: "Gagal mengunggah foto. Pastikan koneksi stabil lalu coba lagi." };
    }
  }

  try {
    await pool.query(
      `INSERT INTO report_status_history (report_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, NULL, 'submitted', 'Laporan dikirim oleh warga')`,
      [reportId, user.id]
    );
  } catch (err) {
    console.error("[initialHistory]", err);
  }

  redirect(`/laporan/${reportId}?created=1`);
}
