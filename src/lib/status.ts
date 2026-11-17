export const STATUS_LABELS: Record<string, string> = {
  submitted: "Menunggu verifikasi",
  verified: "Terverifikasi",
  in_progress: "Sedang diproses",
  resolved: "Selesai",
  rejected: "Ditolak",
};

export const STATUS_STYLES: Record<string, string> = {
  submitted: "border-slate-200 bg-slate-100 text-slate-700",
  verified: "border-blue-200 bg-blue-100 text-blue-700",
  in_progress: "border-amber-200 bg-amber-100 text-amber-700",
  resolved: "border-emerald-200 bg-emerald-100 text-emerald-700",
  rejected: "border-red-200 bg-red-100 text-red-700",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
