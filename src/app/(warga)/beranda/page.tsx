export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { feedStatusMeta } from "@/lib/feed-status";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeleteReportButton } from "@/components/delete-report-button";
import { RelativeTime } from "@/components/relative-time";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  Image as ImageIcon,
  MapPin,
  PlusCircle,
  User2,
} from "lucide-react";

type FeedRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  category_name: string;
  photo_path: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  is_own: boolean;
};

const FEED_LIMIT = 20;

export default async function BerandaPage() {
  const user = await getCurrentUser();

  const feedRes = await pool.query<FeedRow>(
    `SELECT r.id, r.title, r.description, r.status, r.created_at,
            CASE
              WHEN LOWER(TRIM(c.name)) = 'lainnya' AND r.custom_category IS NOT NULL AND TRIM(r.custom_category) <> ''
              THEN 'Lainnya: ' || TRIM(r.custom_category)
              ELSE c.name
            END AS category_name,
            r.location, r.latitude, r.longitude,
            COALESCE(r.user_id = $1, false) AS is_own,
            COALESCE((
              SELECT file_path FROM report_evidence WHERE report_id = r.id LIMIT 1
            ), NULL) AS photo_path
     FROM reports r
     JOIN report_categories c ON c.id = r.category_id
     WHERE r.status <> 'rejected'
     ORDER BY r.created_at DESC
     LIMIT ${FEED_LIMIT}`,
    [user?.id ?? null]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
      <AutoRefresh intervalMs={12000} />
      <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-secondary/70 p-5 shadow-sm sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Informasi warga
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Beranda
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {user
                ? `Halo, ${user.full_name.split(" ")[0]} — lihat laporan terbaru dan pantau penanganannya.`
                : "Lihat masalah yang dilaporkan warga dan pantau penanganannya. Jelajahi laporan tanpa perlu login."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/laporan/baru">
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
                Kirim Laporan
              </Link>
            </Button>
            {!user && (
              <p className="text-center text-xs text-muted-foreground sm:text-right">
                Masuk atau daftar untuk mengirim laporan
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="latest-reports-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="latest-reports-heading"
              className="text-lg font-bold tracking-tight sm:text-xl"
            >
              Laporan terbaru
            </h2>
            <p className="text-sm text-muted-foreground">
              Masalah lingkungan yang sedang atau sudah ditangani.
            </p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {feedRes.rows.length} laporan ditampilkan
          </span>
        </div>

        {feedRes.rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center sm:py-16">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                <ClipboardList className="h-7 w-7" aria-hidden />
              </span>
              <div className="space-y-1">
                <p className="font-semibold">Belum ada laporan</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Jadilah warga pertama yang melaporkan masalah di lingkungan
                  Anda.
                </p>
              </div>
              <Button asChild className="mt-1">
                <Link href="/laporan/baru">Kirim Laporan Pertama</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2 lg:gap-5">
          {feedRes.rows.map((row) => {
            const meta = feedStatusMeta(row.status);
            const hasCoord =
              row.latitude != null && row.longitude != null;

            return (
              <li key={row.id}>
                <Card className="h-full overflow-hidden py-0 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                    >
                      <User2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {row.is_own ? "Anda" : "Warga"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <RelativeTime date={row.created_at} /> ·{" "}
                        {row.category_name}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      {row.is_own && (
                        <DeleteReportButton reportId={row.id} compact />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-3">
                    <div>
                      <h3 className="break-words text-base font-semibold leading-snug">
                        <Link
                          href={`/laporan/${row.id}`}
                          className="hover:underline"
                        >
                          {row.title}
                        </Link>
                      </h3>
                      <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                        {row.description}
                      </p>
                    </div>

                    {row.photo_path ? (
                      <Link
                        href={`/laporan/${row.id}`}
                        className="block overflow-hidden rounded-lg border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/uploads/${row.photo_path}`}
                          alt={row.title}
                          loading="lazy"
                          decoding="async"
                          className="aspect-video w-full object-cover"
                        />
                      </Link>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                        <ImageIcon className="h-8 w-8" aria-hidden />
                      </div>
                    )}

                    <div className="flex flex-wrap items-start gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-start gap-1.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                          {row.location}
                          {hasCoord && (
                            <span className="block text-xs opacity-80">
                              {Number(row.latitude).toFixed(5)},{" "}
                              {Number(row.longitude).toFixed(5)}
                            </span>
                          )}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-2">
                      <RelativeTime
                        date={row.created_at}
                        className="text-xs text-muted-foreground"
                      />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/laporan/${row.id}`}>Lihat detail</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
          </ul>
        )}
      </section>
    </div>
  );
}
