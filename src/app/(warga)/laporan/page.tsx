import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

const VALID_STATUS = [
  "submitted",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
] as const;

const FILTERS = [
  { value: "", label: "Semua" },
  { value: "submitted", label: "Menunggu" },
  { value: "verified", label: "Terverifikasi" },
  { value: "in_progress", label: "Diproses" },
  { value: "resolved", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

const PER_PAGE = 10;

type Row = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  category_name: string;
};

export default async function RiwayatPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const status = VALID_STATUS.includes(sp.status as (typeof VALID_STATUS)[number])
    ? sp.status
    : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const conditions = ["r.user_id = $1"];
  const values: (string | number)[] = [user.id];
  if (status) {
    values.push(status);
    conditions.push(`r.status = $${values.length}`);
  }
  const where = conditions.join(" AND ");

  const countRes = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM reports r WHERE ${where}`,
    values
  );
  const total = countRes.rows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  values.push(PER_PAGE, (page - 1) * PER_PAGE);
  const listRes = await pool.query<Row>(
    `SELECT r.id, r.title, r.status, r.created_at, c.name AS category_name
     FROM reports r
     JOIN report_categories c ON c.id = r.category_id
     WHERE ${where}
     ORDER BY r.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const buildHref = (nextStatus?: string, nextPage?: number) => {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextPage && nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/laporan?${qs}` : "/laporan";
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Laporan yang pernah Anda buat ({total} laporan).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value}
              href={buildHref(f.value || undefined, 1)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Laporan</CardTitle>
          <CardDescription>Klik untuk melihat detail laporan.</CardDescription>
        </CardHeader>
        <CardContent>
          {listRes.rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/50" aria-hidden />
              <div>
                <p className="font-medium">
                  {status ? "Tidak ada laporan berstatus ini" : "Belum ada laporan"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status
                    ? "Coba pilih filter lain."
                    : "Mulai dengan membuat laporan pertama Anda."}
                </p>
              </div>
              <Button asChild>
                <Link href="/laporan/baru">Buat Laporan</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {listRes.rows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/laporan/${row.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.category_name} ·{" "}
                        {new Date(row.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <nav
          aria-label="Paginasi"
          className="flex items-center justify-between gap-2"
        >
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link href={buildHref(status, page - 1)}>Sebelumnya</Link>
            ) : (
              <span>Sebelumnya</span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            asChild={page < totalPages}
          >
            {page < totalPages ? (
              <Link href={buildHref(status, page + 1)}>Berikutnya</Link>
            ) : (
              <span>Berikutnya</span>
            )}
          </Button>
        </nav>
      )}
    </div>
  );
}
