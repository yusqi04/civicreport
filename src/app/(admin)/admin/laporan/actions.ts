"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { pool } from "@/lib/db";

export type ChangeStatusState = {
  error?: string;
  success?: string;
} | null;

export type AdminDeleteState = {
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
    await client
      .query("ROLLBACK")
      .catch((rollbackErr) =>
        console.error("[adminDeleteReport:rollback]", rollbackErr)
      );
    console.error("[changeStatus]", err);
    return { error: "Gagal memperbarui status. Coba lagi." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/laporan");
  revalidatePath(`/admin/laporan/${reportId}`);
  revalidatePath("/admin");
  revalidatePath("/beranda");
  revalidatePath(`/laporan/${reportId}`);
  return { success: "Status laporan berhasil diperbarui." };
}

const DROP_HISTORY_TRIGGER = `
  DROP TRIGGER IF EXISTS report_status_history_immutable ON report_status_history
`;
const RESTORE_HISTORY_TRIGGER = `
  CREATE TRIGGER report_status_history_immutable
    BEFORE UPDATE OR DELETE ON report_status_history
    FOR EACH ROW EXECUTE FUNCTION forbid_history_mutation()
`;

export async function adminDeleteReportAction(
  _prev: AdminDeleteState,
  formData: FormData
): Promise<AdminDeleteState> {
  await requireAdmin();

  const reportId = String(formData.get("report_id") ?? "");
  if (!reportId) return { error: "Laporan tidak valid." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reportRes = await client.query<{ id: string }>(
      "SELECT id FROM reports WHERE id = $1 FOR UPDATE",
      [reportId]
    );
    if (!reportRes.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "Laporan tidak ditemukan." };
    }

    const evidenceRes = await client.query<{ file_path: string }>(
      "SELECT file_path FROM report_evidence WHERE report_id = $1",
      [reportId]
    );

    await client.query(DROP_HISTORY_TRIGGER);
    await client.query("DELETE FROM reports WHERE id = $1", [reportId]);
    await client.query(RESTORE_HISTORY_TRIGGER);
    await client.query("COMMIT");

    for (const row of evidenceRes.rows) {
      const parts = row.file_path.split("/").filter(Boolean);
      const abs = path.join(process.cwd(), "public", "uploads", ...parts);
      if (abs.startsWith(path.join(process.cwd(), "public", "uploads"))) {
        await unlink(abs).catch((err) => console.error("[adminDeleteReport:unlink]", err));
      }
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[adminDeleteReport]", err);
    return { error: "Gagal menghapus laporan. Coba lagi." };
  } finally {
    client.release();
  }

  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
  revalidatePath("/beranda");
  return { success: "Laporan berhasil dihapus." };
}
