import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, ChevronLeft, MapPin, User2 } from "lucide-react";

type ReportRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  category_name: string;
};

type EvidenceRow = { id: string; file_path: string };

type HistoryRow = {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
  changed_by_name: string;
};

export default async function DetailLaporanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;

  const reportRes = await pool.query<ReportRow>(
    `SELECT r.id, r.title, r.description, r.location, r.latitude, r.longitude,
            r.status, r.created_at, r.updated_at, c.name AS category_name
     FROM reports r
     JOIN report_categories c ON c.id = r.category_id
     WHERE r.id = $1 AND r.user_id = $2`,
    [id, user.id]
  );
  const report = reportRes.rows[0];
  if (!report) notFound();

  const [evidenceRes, historyRes] = await Promise.all([
    pool.query<EvidenceRow>(
      "SELECT id, file_path FROM report_evidence WHERE report_id = $1 ORDER BY created_at",
      [id]
    ),
    pool.query<HistoryRow>(
      `SELECT h.id, h.old_status, h.new_status, h.note, h.created_at, p.full_name AS changed_by_name
       FROM report_status_history h
       JOIN profiles p ON p.id = h.changed_by
       WHERE h.report_id = $1
       ORDER BY h.created_at DESC`,
      [id]
    ),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {sp.created === "1" && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>Laporan berhasil dikirim</AlertTitle>
          <AlertDescription>
            Laporan Anda masuk dengan status &quot;Menunggu verifikasi&quot;.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/laporan">
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Riwayat
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
          <p className="text-sm text-muted-foreground">
            {report.category_name} ·{" "}
            {new Date(report.created_at).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail Masalah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {report.description}
          </p>
          <div className="space-y-1 text-sm">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>{report.location}</span>
            </p>
            {report.latitude != null && report.longitude != null && (
              <p className="pl-6 text-xs text-muted-foreground">
                Koordinat: {report.latitude}, {report.longitude}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Foto Bukti</CardTitle>
          <CardDescription>
            {evidenceRes.rows.length > 0
              ? `${evidenceRes.rows.length} foto terlampir`
              : "Tidak ada foto pada laporan ini"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evidenceRes.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {evidenceRes.rows.map((ev) => (
                <a
                  key={ev.id}
                  href={`/uploads/${ev.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/uploads/${ev.file_path}`}
                    alt={`Foto bukti laporan ${report.title}`}
                    className="aspect-square w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riwayat Status</CardTitle>
          <CardDescription>
            Perubahan status tercatat permanen dan tidak dapat diubah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-0">
            {historyRes.rows.map((h, i) => (
              <li key={h.id} className="relative flex gap-3 pb-5 last:pb-0">
                {i < historyRes.rows.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[7px] top-5 h-full w-px bg-border"
                  />
                )}
                <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.new_status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <User2 className="h-3.5 w-3.5" aria-hidden />
                    {h.changed_by_name}
                  </p>
                  {h.note && (
                    <p className="mt-1 rounded-md bg-muted px-3 py-2 text-sm">
                      {h.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
