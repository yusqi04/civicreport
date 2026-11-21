import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Inbox } from "lucide-react";
import { AdminDeleteReportButton } from "@/components/admin-delete-report-button";
import { AutoRefresh } from "@/components/auto-refresh";

const VALID_STATUS = [
  "submitted",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
] as const;

const PER_PAGE = 15;

type Row = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  reporter: string;
  category_name: string;
};

export default async function AdminLaporanPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    q?: string;
    page?: string;
  }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  const status = VALID_STATUS.includes(sp.status as (typeof VALID_STATUS)[number])
    ? sp.status
    : undefined;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);

  const categoriesRes = await pool.query<{ id: string; name: string }>(
    `SELECT DISTINCT ON (LOWER(TRIM(name))) id, name
     FROM report_categories
     WHERE is_active = true
     ORDER BY LOWER(TRIM(name)), created_at ASC`
  );
  const categories = [...categoriesRes.rows].sort((a, b) => {
    const aIsOther = a.name.trim().toLowerCase() === "lainnya";
    const bIsOther = b.name.trim().toLowerCase() === "lainnya";
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return a.name.localeCompare(b.name, "id");
  });
  const category = categories.find((c) => c.id === sp.category)?.id;

  const conditions: string[] = ["1=1"];
  const values: (string | number)[] = [];
  if (status) {
    values.push(status);
    conditions.push(`r.status = $${values.length}`);
  }
  if (category) {
    values.push(category);
    conditions.push(`r.category_id = $${values.length}`);
  }
  if (q) {
    values.push(`%${q}%`);
    conditions.push(`r.title ILIKE $${values.length}`);
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
    `SELECT r.id, r.title, r.status, r.created_at,
            p.full_name AS reporter,
            CASE
              WHEN LOWER(TRIM(c.name)) = 'lainnya' AND r.custom_category IS NOT NULL AND TRIM(r.custom_category) <> ''
              THEN 'Lainnya: ' || TRIM(r.custom_category)
              ELSE c.name
            END AS category_name
     FROM reports r
     JOIN profiles p ON p.id = r.user_id
     JOIN report_categories c ON c.id = r.category_id
     WHERE ${where}
     ORDER BY r.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  const buildHref = (patch: Partial<Record<string, string>>) => {
    const params = new URLSearchParams();
    const next = { status, category, q: q || undefined, page: undefined, ...patch };
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/admin/laporan?${qs}` : "/admin/laporan";
  };

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={15000} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Seluruh Laporan</h1>
        <p className="text-sm text-muted-foreground">
          {total} laporan ditemukan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter & Pencarian</CardTitle>
          <CardDescription>
            Saring berdasarkan status, kategori, atau judul.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="GET"
            action="/admin/laporan"
            className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]"
          >
            <Select name="status" defaultValue={status ?? ""}>
              <SelectTrigger aria-label="Filter status">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua status</SelectItem>
                <SelectItem value="submitted">Menunggu verifikasi</SelectItem>
                <SelectItem value="verified">Terverifikasi</SelectItem>
                <SelectItem value="in_progress">Sedang diproses</SelectItem>
                <SelectItem value="resolved">Selesai</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Select name="category" defaultValue={category ?? ""}>
              <SelectTrigger aria-label="Filter kategori">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              name="q"
              defaultValue={q}
              placeholder="Cari judul laporan…"
              aria-label="Cari judul"
            />

            <Button type="submit">
              <Search className="mr-2 h-4 w-4" aria-hidden />
              Terapkan
            </Button>
          </form>
          {(status || category || q) && (
            <p className="mt-3">
              <Link
                href="/admin/laporan"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Reset filter
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          {listRes.rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground/50" aria-hidden />
              <p className="font-medium">Tidak ada laporan cocok</p>
              <p className="text-sm text-muted-foreground">
                Coba ubah atau reset filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Pelapor</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listRes.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          href={`/admin/laporan/${row.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {row.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.reporter}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.category_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <AdminDeleteReportButton reportId={row.id} compact />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <nav
          aria-label="Paginasi"
          className="flex items-center justify-between gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            asChild={page > 1}
          >
            {page > 1 ? (
              <Link href={buildHref({ page: String(page - 1) })}>
                Sebelumnya
              </Link>
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
              <Link href={buildHref({ page: String(page + 1) })}>
                Berikutnya
              </Link>
            ) : (
              <span>Berikutnya</span>
            )}
          </Button>
        </nav>
      )}
    </div>
  );
}
