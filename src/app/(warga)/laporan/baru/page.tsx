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
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buat Laporan</h1>
        <p className="text-sm text-muted-foreground">
          Isi data berikut untuk melaporkan masalah di lingkungan Anda.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formulir Laporan</CardTitle>
          <CardDescription>
            Judul, kategori, dan deskripsi wajib diisi. Foto bersifat opsional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm categories={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
