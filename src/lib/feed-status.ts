export const FEED_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  submitted: {
    label: "Menunggu",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  verified: {
    label: "Terverifikasi",
    className: "border-blue-200 bg-blue-100 text-blue-800",
  },
  in_progress: {
    label: "Diproses",
    className: "border-amber-200 bg-amber-100 text-amber-800",
  },
  resolved: {
    label: "Selesai",
    className: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },
  rejected: {
    label: "Ditolak",
    className: "border-red-200 bg-red-100 text-red-700",
  },
};

export function feedStatusMeta(status: string) {
  return (
    FEED_STATUS_META[status] ?? {
      label: status,
      className: "border-slate-200 bg-slate-100 text-slate-700",
    }
  );
}
