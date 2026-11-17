# CivicReport

Aplikasi web pelaporan masalah lingkungan untuk warga dan petugas (admin).
Dibangun dengan **Next.js (App Router) + TypeScript strict + PostgreSQL lokal**.

## Prasyarat

- Node.js 20+ dan npm
- Tidak perlu instal PostgreSQL — database dijalankan otomatis lewat `embedded-postgres` (port **5433**)

## Menjalankan (lokal)

```bash
npm install
npm run dev
```

`npm run dev` akan:

1. Menjalankan PostgreSQL lokal (folder `.pgdata/`, port 5433) bila belum jalan
2. Migrasi otomatis dari folder `migrations/`
3. Menjalankan Next.js di **http://localhost:3000**

Konfigurasi ada di `.env.local` (sudah terisi default lokal):

```
DATABASE_URL=postgres://postgres:password@127.0.0.1:5433/civicreport
SESSION_SECRET=<ganti dengan string acak>
```

## Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan aplikasi + database |
| `npm run build` | Build produksi |
| `npm run start` | Jalankan build produksi + database |
| `npm run db:start` | Jalankan database saja |
| `npm run seed:admin` | Buat/refresh akun admin demo |
| `npm run e2e` | Uji end-to-end (butuh dev server jalan + Edge) |
| `npm run lint` | ESLint |

## Akun demo (DATA DEMO — bukan data nyata)

Jalankan `npm run seed:admin` untuk memastikan akun admin ada:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@civicreport.test` | `admin12345` |

Warga dapat mendaftar sendiri melalui halaman `/register`.

## Alur utama

1. Warga **daftar → login → buat laporan** (foto opsional, maks. 2 MB)
2. Laporan masuk dengan status `submitted` (Menunggu verifikasi)
3. Admin **login → dashboard → daftar laporan → ubah status** + catatan (tersimpan atomik di `report_status_history`)
4. Warga melihat status & riwayat terbaru di detail laporan

## Struktur

- `migrations/` — SQL migrasi PostgreSQL (dijalankan otomatis)
- `scripts/` — menjalankan DB, seed admin, E2E test
- `src/app/(auth)` — login & register
- `src/app/(warga)` — area warga (beranda, buat laporan, riwayat, detail, profil)
- `src/app/(admin)` — panel admin (dashboard, daftar, detail + ubah status)
- `src/proxy.ts` — guard session & role (Next.js Proxy)

## Catatan menuju Supabase

Versi lokal ini memakai PostgreSQL + cookie JWT + upload file ke folder `uploads/`.
Untuk migrasi ke Supabase nanti: ganti `src/lib/db.ts` ke Supabase client, pindahkan
auth ke Supabase Auth, aktifkan RLS, dan pindahkan storage ke Supabase Storage
(atau tetap pertahankan pola skema tabel yang sama).
