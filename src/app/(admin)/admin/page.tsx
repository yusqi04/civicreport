import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Inbox,
  Wrench,
} from "lucide-react";

type StatusRow = { status: string; count: number };

type RecentRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  reporter: string;
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [statusRes, recentRes] = await Promise.all([
    pool.query<StatusRow>(
      "SELECT status, COUNT(*)::int AS count FROM reports GROUP BY status"
    ),
    pool.query<RecentRow>(
      `SELECT r.id, r.title, r.status, r.created_at, p.full_name AS reporter
       FROM reports r
       JOIN profiles p ON p.id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT 5`
    ),
  ]);

  const byStatus = new Map(statusRes.rows.map((r) => [r.status, r.count]));
  const total = statusRes.rows.reduce((sum, r) => sum + r.count, 0);

  const cards = [
    {
      label: "Total Laporan",
      value: total,
      icon: ClipboardList,
      hint: "Semua laporan masuk",
    },
    {
      label: "Menunggu Verifikasi",
      value: byStatus.get("submitted") ?? 0,
      icon: Inbox,
      hint: "Perlu diperiksa",
    },
    {
      label: "Sedang Diproses",
      value:
        (byStatus.get("verified") ?? 0) + (byStatus.get("in_progress") ?? 0),
      icon: Wrench,
      hint: "Terverifikasi + diproses",
    },
    {
      label: "Selesai",
      value: byStatus.get("resolved") ?? 0,
      icon: CheckCircle2,
      hint: "Selesai ditangani",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan laporan masuk dari seluruh warga.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold tabular-nums">{value}</span>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Laporan Terbaru</CardTitle>
            <CardDescription>5 laporan paling akhir masuk.</CardDescription>
          </div>
          <Link
            href="/admin/laporan"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Lihat semua
          </Link>
        </CardHeader>
        <CardContent>
          {recentRes.rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Clock3 className="h-9 w-9 text-muted-foreground/50" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Belum ada laporan masuk.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {recentRes.rows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/laporan/${row.id}`}
                    className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{row.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Pelapor: {row.reporter} ·{" "}
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
