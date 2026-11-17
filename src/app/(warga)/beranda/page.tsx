import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ClipboardList, FileCheck2, PlusCircle, Wrench } from "lucide-react";

type StatusRow = { status: string; count: number };

type RecentRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  category_name: string;
};

export default async function BerandaPage() {
  const user = await requireUser();

  const [statusRes, recentRes] = await Promise.all([
    pool.query<StatusRow>(
      `SELECT status, COUNT(*)::int AS count
       FROM reports WHERE user_id = $1 GROUP BY status`,
      [user.id]
    ),
    pool.query<RecentRow>(
      `SELECT r.id, r.title, r.status, r.created_at, c.name AS category_name
       FROM reports r
       JOIN report_categories c ON c.id = r.category_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [user.id]
    ),
  ]);

  const byStatus = new Map(statusRes.rows.map((r) => [r.status, r.count]));
  const total = statusRes.rows.reduce((sum, r) => sum + r.count, 0);
  const cards = [
    { label: "Total Laporan", value: total, icon: ClipboardList },
    {
      label: "Menunggu Verifikasi",
      value: byStatus.get("submitted") ?? 0,
      icon: FileCheck2,
    },
    {
      label: "Sedang Diproses",
      value:
        (byStatus.get("verified") ?? 0) + (byStatus.get("in_progress") ?? 0),
      icon: Wrench,
    },
    {
      label: "Selesai",
      value: byStatus.get("resolved") ?? 0,
      icon: FileCheck2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Halo, {user.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Pantau laporan masalah lingkungan Anda di sini.
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/laporan/baru">
            <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
            Buat Laporan
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold tabular-nums">{value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Laporan Terbaru</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/laporan">
              Lihat semua
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRes.rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <ClipboardList
                className="h-10 w-10 text-muted-foreground/50"
                aria-hidden
              />
              <div>
                <p className="font-medium">Belum ada laporan</p>
                <p className="text-sm text-muted-foreground">
                  Buat laporan pertama Anda untuk mulai melapor.
                </p>
              </div>
              <Button asChild>
                <Link href="/laporan/baru">Buat Laporan</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recentRes.rows.map((row) => (
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
    </div>
  );
}
