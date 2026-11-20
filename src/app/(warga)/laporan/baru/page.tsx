import { requireUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { ReportForm } from "@/components/report-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BuatLaporanPage() {
  await requireUser();

  const { rows } = await pool.query<{ id: string; name: string }>(
    "SELECT id, name FROM report_categories WHERE is_active = true ORDER BY name"
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">PARTISIPASI WARGA</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Buat Laporan
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Isi data berikut untuk melaporkan masalah di lingkungan Anda.
        </p>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Formulir Laporan</CardTitle>
          <CardDescription>
            Lengkapi informasi masalah dan lampirkan foto bukti agar petugas
            dapat menindaklanjutinya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm categories={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
