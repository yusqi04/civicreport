import { requireUser } from "@/lib/auth/guards";
import { pool, ensureDatabaseSchema } from "@/lib/db";
import { ReportForm } from "@/components/report-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BuatLaporanPage() {
  await requireUser();
  await ensureDatabaseSchema();

  const { rows } = await pool.query<{ id: string; name: string }>(
    `SELECT DISTINCT ON (LOWER(TRIM(name))) id, name
     FROM report_categories
     WHERE is_active = true
     ORDER BY LOWER(TRIM(name)), created_at ASC`
  );

  // Urutkan kategori secara alfabetis, dengan "Lainnya" ditaruh paling bawah
  const sortedCategories = [...rows].sort((a, b) => {
    const aIsOther = a.name.trim().toLowerCase() === "lainnya";
    const bIsOther = b.name.trim().toLowerCase() === "lainnya";
    if (aIsOther && !bIsOther) return 1;
    if (!aIsOther && bIsOther) return -1;
    return a.name.localeCompare(b.name, "id");
  });

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
          <ReportForm categories={sortedCategories} />
        </CardContent>
      </Card>
    </div>
  );
}
