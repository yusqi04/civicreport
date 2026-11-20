# CivicReport

## Tentang Proyek

CivicReport adalah aplikasi web untuk melaporkan dan memantau masalah di
lingkungan, seperti jalan rusak, sampah, atau fasilitas umum yang perlu
diperbaiki. Aplikasi ini menghubungkan warga yang menemukan masalah dengan
petugas yang meninjau dan memperbarui progres penanganannya.

Laporan yang tidak berstatus ditolak ditampilkan pada beranda publik dan
detailnya dapat dibuka tanpa membuat akun. Untuk mengirim laporan, pengguna
perlu masuk atau mendaftar. Petugas (admin) menggunakan aplikasi yang sama,
dengan tambahan dashboard dan fitur pengelolaan laporan.

### Peran Pengguna

- **Pengunjung:** melihat beranda, daftar laporan terbaru, dan detail laporan
  publik tanpa login.
- **Warga:** semua fitur pengunjung, mengirim laporan, melihat riwayat laporan
  pribadi, serta mengelola profil.
- **Admin/Petugas:** semua fitur warga, ditambah dashboard operasional, pencarian
  dan filter laporan, perubahan status, catatan penanganan, serta pengelolaan
  laporan.

### Fitur Utama

- Pelaporan dengan kategori, deskripsi, lokasi, koordinat, dan foto bukti.
- Pemilihan lokasi melalui pencarian alamat atau GPS; koordinat juga dapat dibaca
  dari metadata GPS foto.
- Pemantauan status laporan (menunggu verifikasi, terverifikasi, diproses,
  selesai, atau ditolak), termasuk riwayat perubahan dan catatan petugas.
- Dashboard admin dengan ringkasan jumlah laporan berdasarkan status.

> **Privasi:** laporan yang ditampilkan pada beranda publik beserta detail, foto
> bukti, dan informasi lokasinya dapat dilihat siapa saja. Hindari mengunggah
> informasi pribadi atau sensitif.

### Teknologi

- **Next.js 16 App Router**, React, dan TypeScript strict
- **PostgreSQL** melalui driver `pg`, dengan pilihan database lokal
  (`embedded-postgres`) atau database eksternal seperti Neon
- Autentikasi berbasis cookie dan JWT, dengan kata sandi yang di-hash
- Antarmuka Tailwind CSS dan komponen React

Pengaturan bawaan memakai database lokal; Neon dapat dipakai dengan mengganti
`DATABASE_URL`.

## Prasyarat

- Node.js 20+ dan npm
- Untuk database lokal, PostgreSQL dijalankan otomatis lewat `embedded-postgres` (port **5433**)
- Untuk Neon, siapkan connection string dari Neon Console

## Menjalankan (lokal)

```bash
npm install
npm run dev
```

Jika `DATABASE_URL` belum diubah dari URL lokal di `.env.local`, `npm run dev` akan:

1. Menjalankan PostgreSQL lokal (folder `.pgdata/`, port 5433) bila belum jalan
2. Migrasi otomatis dari folder `migrations/`
3. Menjalankan Next.js di **http://localhost:3000**

Untuk menggunakan Neon, ganti `DATABASE_URL` di `.env.local` dengan connection
string **lengkap** dari Neon Console (termasuk hostname, nama database, dan
parameter SSL), lalu jalankan `npm run dev`. Saat development, nilai
`DATABASE_URL` dan `SESSION_SECRET` dari `.env.local` diprioritaskan agar tidak
tertimpa variabel lama dari terminal. Skrip akan menerapkan migrasi ke database
yang dituju dan tidak menyalakan PostgreSQL lokal. Host yang benar akan tercetak
di log startup:

```
DATABASE_URL=postgresql://<user>:<password>@<host-neon>/<database>?sslmode=verify-full
SESSION_SECRET=<ganti dengan string acak>
```

Jika muncul `getaddrinfo ENOTFOUND base`, hostname `base` yang ada di URL tidak
bisa ditemukan. Salin ulang connection string lengkap dari Neon Console dan
pastikan hostname-nya adalah endpoint Neon (biasanya berakhiran
`.aws.neon.tech`), bukan kata `base`. Jangan membagikan connection string karena
di dalamnya terdapat password.

Koneksi database tetap menggunakan `pg` yang sudah dipakai seluruh aplikasi.
Contoh `neon()` di Server Action tidak diperlukan: itu akan menambah jalur
koneksi kedua, sedangkan aplikasi ini memakai query `Pool` di server.

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

1. Pengunjung membuka beranda dan dapat melihat laporan tanpa login.
2. Untuk mengirim laporan, warga **login atau daftar**; setelah autentikasi,
   warga langsung kembali ke formulir laporan (foto bukti wajib, maks. 2 MB).
3. Laporan masuk dengan status `submitted` (Menunggu verifikasi).
4. Admin dapat memakai fitur warga dan juga **dashboard → daftar laporan → ubah status**
   + catatan (tersimpan atomik di `report_status_history`).

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
