"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { pool } from "@/lib/db";

export type ChangeStatusState = {
  error?: string;
  success?: string;
} | null;

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  submitted: ["verified", "rejected"],
  verified: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
};

const VALID_STATUS = [
  "submitted",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
] as const;

export async function changeStatusAction(
  _prev: ChangeStatusState,
  formData: FormData
): Promise<ChangeStatusState> {
  const admin = await requireAdmin();

  const reportId = String(formData.get("report_id") ?? "");
  const newStatus = String(formData.get("new_status") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!reportId) return { error: "Laporan tidak valid." };
  if (!(VALID_STATUS as readonly string[]).includes(newStatus)) {
    return { error: "Status tidak dikenal." };
  }
  if (newStatus === "rejected" && note.length < 3) {
    return { error: "Catatan wajib diisi untuk penolakan laporan." };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const currentRes = await client.query<{ status: string }>(
      "SELECT status FROM reports WHERE id = $1 FOR UPDATE",
      [reportId]
    );
    const current = currentRes.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return { error: "Laporan tidak ditemukan." };
    }
    if (current.status === newStatus) {
      await client.query("ROLLBACK");
      return { error: "Status laporan sudah sama." };
    }
    const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(newStatus)) {
      await client.query("ROLLBACK");
      return {
        error: `Transisi dari "${current.status}" ke "${newStatus}" tidak diizinkan.`,
      };
    }

    await client.query("UPDATE reports SET status = $2 WHERE id = $1", [
      reportId,
      newStatus,
    ]);
    await client.query(
      `INSERT INTO report_status_history (report_id, changed_by, old_status, new_status, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [reportId, admin.id, current.status, newStatus, note || null]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[changeStatus]", err);
    return { error: "Gagal memperbarui status. Coba lagi." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/laporan");
  revalidatePath(`/admin/laporan/${reportId}`);
  revalidatePath("/admin");
  return { success: "Status laporan berhasil diperbarui." };
}
