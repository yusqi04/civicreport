# CivicReport — Rencana Sprint Detail

**Versi:** 1.0
**Acuan:** `PRD_CivicReport.md`
**Jumlah sprint:** 16 sprint
**Estimasi total:** ±18–19 hari kerja (solo developer)

## Aturan Umum

1. **Semua sprint wajib berjalan di `localhost` dulu.** Setiap sprint harus bisa diverifikasi dengan `npm run dev` → `http://localhost:3000` sebelum pindah ke sprint berikutnya. Deployment hanya di Sprint 15.
2. **Satu sprint = satu hasil yang bisa dilihat/duji.** Sprint dianggap selesai hanya jika seluruh Definition of Done (DoD) terpenuhi.
3. **Tools 100% gratis:**

   | Kebutuhan | Tool | Paket |
   |---|---|---|
   | Framework | Next.js (App Router) | Open source |
   | Bahasa | TypeScript `strict: true` | Open source |
   | Styling / UI | Tailwind CSS + shadcn/ui | Open source |
   | Form / validasi | React Hook Form + Zod | Open source |
   | Database + Auth + Storage | Supabase | Free tier (500 MB DB, 1 GB storage, 50.000 user aktif/bulan) |
   | Hosting | Vercel | Hobby (gratis) |
   | Repo | GitHub | Free |
   | Ikon | Lucide React | Open source |
   | Package manager | npm | Open source |

4. **Tidak ada layanan berbayar** (peta berbayar, notifikasi berbayar, AI API berbayar, dsb).
5. **Secret key** (service role) hanya dipakai di script lokal/`server actions` — tidak pernah masuk `NEXT_PUBLIC_*` dan tidak di-commit.
6. Prinsip implementasi PRD §16 tetap berlaku: satu fitur dari DB ke UI, tidak ada data palsu yang mengaku fitur selesai, review kode AI sebelum menerima.

---

## Struktur Folder Target

```
civicreport/
├── .env.local                    # Supabase URL + anon key (tidak di-commit)
├── middleware.ts                 # Cek session + redirect role
├── supabase/
│   └── migrations/               # File SQL migration (di-commit)
│       ├── 001_profiles.sql
│       ├── 002_core_tables.sql
│       ├── 003_seed.sql
│       ├── 004_storage_bucket.sql
│       └── 005_status_rpc.sql
├── scripts/
│   └── seed-admin.ts             # Buat akun admin lokal
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (warga)/
    │   │   ├── layout.tsx         # Navbar atas + bottom nav
    │   │   ├── beranda/page.tsx
    │   │   ├── laporan/page.tsx   # Riwayat
    │   │   ├── laporan/baru/page.tsx
    │   │   ├── laporan/[id]/page.tsx
    │   │   └── profil/page.tsx
    │   ├── (admin)/
    │   │   ├── layout.tsx         # Sidebar + guard admin
    │   │   ├── admin/
    │   │   │   ├── page.tsx       # Dashboard statistik
    │   │   │   ├── laporan/page.tsx
    │   │   │   └── laporan/[id]/page.tsx
    │   └── auth/callback/route.ts
    ├── components/ui/             # Komponen shadcn/ui
    ├── components/                # Komponen aplikasi
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts
    │   │   ├── server.ts
    │   │   └── middleware.ts
    │   ├── validations/           # Skema Zod
    │   └── utils.ts
    └── types/                     # Tipe database hasil generate
```

---

## Sprint 0 — Setup Project Lokal
**Estimasi:** ½ hari
**Prasyarat:** Node.js LTS + npm terpasang.

### Langkah
- [ ] `npx create-next-app@latest civicreport` — pilih: TypeScript ✅, Tailwind ✅, App Router ✅, ESLint ✅, src directory ✅, path alias `@/*`.
- [ ] Pastikan `tsconfig.json` memiliki `"strict": true`.
- [ ] Inisialisasi shadcn/ui: `npx shadcn@latest init` — pilih style `new-york`, base color `slate`.
- [ ] Tambah komponen awal shadcn: `button`, `input`, `label`, `card`, `alert`, `skeleton`.
- [ ] Pasang dependency: `npm install @supabase/supabase-js @supabase/ssr lucide-react`.
- [ ] Pasang dependency form/validasi: `npm install react-hook-form zod @hookform/resolvers`.
- [ ] Setup design system di `src/app/globals.css` sesuai PRD §8.2:
  - [ ] Font **Inter** (via `next/font/google`).
  - [ ] Variabel warna: primary `#2563EB`, background `#F8FAFC`, text `#0F172A`, border slate-200.
  - [ ] Radius default 10px, spacing kelipatan 4/8.
- [ ] Buat skeleton struktur folder (target di atas) — folder kosong + `page.tsx` placeholder `Coming soon`.
- [ ] `git init` + commit pertama.

### Verifikasi localhost
- [ ] `npm run dev` → `http://localhost:3000` menampilkan halaman placeholder dengan Inter + warna primary `#2563EB`.
- [ ] `npm run build` tidak error.

**DoD:** project jalan di localhost, TypeScript strict bersih, shadcn/ui + design system siap dipakai, git repo ada.

---

## Sprint 1 — Koneksi Supabase + Tabel `profiles`
**Estimasi:** 1 hari
**Prasyarat:** Sprint 0.

### Langkah
- [ ] Daftar **Supabase (Gratis)** → buat project baru `civicreport` (region terdekat, DB password disimpan).
- [ ] Ambil `Project URL` + `anon public` key dari Settings → API.
- [ ] Buat `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=...
  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...   # hanya untuk script lokal, JANGAN pernah di-import di client
  ```
- [ ] Tambahkan `.env.local` ke `.gitignore`.
- [ ] Buat `src/lib/supabase/client.ts` (browser client), `src/lib/supabase/server.ts` (server client via cookies), `src/lib/supabase/middleware.ts` (session refresh).
- [ ] Migration SQL `supabase/migrations/001_profiles.sql`:
  - [ ] Tabel `profiles (id UUID PK REFERENCES auth.users.id, full_name TEXT, role TEXT CHECK (role IN ('citizen','admin')) DEFAULT 'citizen', created_at TIMESTAMPTZ DEFAULT now())`.
  - [ ] Trigger `handle_new_user()` → auto-insert `profiles` saat user baru daftar (ambil `full_name` dari `raw_user_meta_data`).
  - [ ] RLS `profiles`: user hanya bisa `SELECT` baris miliknya; update hanya kolom `full_name` (role tidak boleh diubah).
- [ ] Jalankan migration via Supabase SQL Editor (paste + Run) atau `supabase db push` — catat SQL aslinya di folder `supabase/migrations/`.
- [ ] Halaman debug sementara `/dev/db-check` (hanya di development): tampilkan apakah koneksi DB OK dan tabel `profiles` terbaca.

### Verifikasi localhost
- [ ] Register 1 akun warga lewat Supabase Dashboard → tabel `profiles` otomatis terisi 1 baris (trigger bekerja).
- [ ] `/dev/db-check` menampilkan koneksi sukses di `localhost:3000`.
- [ ] Cek RLS: query anon tanpa login tidak bisa baca `profiles` lain.

**DoD:** koneksi Supabase dari localhost OK, tabel `profiles` + trigger + RLS aktif, `.env.local` tidak masuk git.

---

## Sprint 2 — Halaman Register & Login
**Estimasi:** 1 hari
**Prasyarat:** Sprint 1.

### Langkah
- [ ] Route group `(auth)` dengan layout minimal (logo + judul).
- [ ] **Halaman `/register`** (`src/app/(auth)/register/page.tsx`):
  - [ ] Form React Hook Form + Zod: `full_name` (min 2), `email` (format email), `password` (min 8), `confirm_password` (match).
  - [ ] `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`.
  - [ ] Tampilkan pesan sukses "Cek email untuk konfirmasi" **dan** fallback instruksi bila email confirmation belum diaktifkan (untuk lokal: matikan "Confirm email" di Supabase Auth settings agar bisa langsung login).
  - [ ] Pesan error dari Supabase (email sudah terdaftar, password lemah) ditampilkan ramah.
  - [ ] Tombol disabled + spinner saat submit.
- [ ] **Halaman `/login`** (`src/app/(auth)/login/page.tsx`):
  - [ ] Form Zod: `email`, `password`.
  - [ ] `supabase.auth.signInWithPassword({ email, password })`.
  - [ ] Redirect sementara ke `/beranda` (guard role final disiapkan Sprint 3).
  - [ ] Link "Belum punya akun? Daftar" dan sebaliknya.
- [ ] Komponen shared: `FormInput`, pesan error per-field, toast sukses.
- [ ] **Halaman `/logout`** (Server Action): `supabase.auth.signOut()` + redirect `/login`.

### Verifikasi localhost
- [ ] `/register` → data valid masuk, akun bisa dipakai login.
- [ ] `/login` dengan password salah → muncul error, tidak crash.
- [ ] `/login` dengan akun valid → masuk, session cookie tersimpan.
- [ ] Logout → session hilang, akses halaman terproteksi memantul ke `/login`.

**DoD:** register/login/logout berjalan penuh di localhost, validasi Zod + loading/error state ada.

---

## Sprint 3 — Middleware Session + Guard Role
**Estimasi:** 1 hari
**Prasyarat:** Sprint 2.

### Langkah
- [ ] `src/middleware.ts` pakai `@supabase/ssr` (update session, jalankan di semua route).
- [ ] Logika redirect:
  - [ ] Belum login + akses `/(warga)/*` atau `/(admin)/*` → `/login`.
  - [ ] Sudah login + akses `/login` atau `/register` → redirect sesuai role (`citizen` → `/beranda`, `admin` → `/admin`).
  - [ ] `citizen` mencoba `/admin/*` → redirect `/beranda` + pesan "Akses ditolak".
  - [ ] `admin` mencoba `/(warga)/*` → redirect `/admin`.
- [ ] Helper `getUserProfile(serverClient)` → menggabungkan `auth.getUser()` + `profiles` (role diambil dari DB, **bukan** dari localStorage/form).
- [ ] Server layout warga (`(warga)/layout.tsx`) dan admin (`(admin)/layout.tsx`) tetap melakukan pengecekan role di server sebagai lapisan kedua (jangan hanya andalkan middleware).
- [ ] Halaman sederhana `/akses-ditolak` untuk pesan 403.

### Verifikasi localhost
- [ ] Tanpa login: buka `/beranda` → dipindah ke `/login`.
- [ ] Login sebagai `citizen`: buka `/admin` → dipindah ke `/beranda`.
- [ ] Login sebagai `admin` (buat sementara lewat SQL update `role='admin'`): buka `/admin` → diizinkan.
- [ ] Tanpa session: `curl` route terproteksi tetap redirect (guard server-side, bukan hanya client).

**DoD:** role `citizen`/`admin` ditegakkan di server, semua halaman terproteksi sesuai role, redirect dua arah bekerja.

---

## Sprint 4 — Layout Area Warga (Navbar + Bottom Nav)
**Estimasi:** 1 hari
**Prasyarat:** Sprint 3.

### Langkah
- [ ] `src/app/(warga)/layout.tsx`:
  - [ ] **Navbar atas** (mobile & desktop): logo "CivicReport", nama pengguna dari `profiles`, tombol logout.
  - [ ] **Bottom nav mobile** (fixed, `md:hidden`): Beranda 🏠, Buat Laporan ➕, Riwayat 📋, Profil 👤 (ikon Lucide).
  - [ ] Nav desktop: horizontal di navbar (sembunyikan bottom nav).
- [ ] Highlight menu aktif berdasarkan `usePathname()`.
- [ ] **Skeleton loading** saat cek session/role (server component tetap pakai `loading.tsx`).
- [ ] Halaman placeholder per menu (isi nyata menyusul di sprint berikutnya).
- [ ] Global states primitives: `EmptyState`, `ErrorState`, `LoadingSkeleton`, komponen toast (sonner).

### Verifikasi localhost
- [ ] Dengan layar 375px: bottom nav tampil, target sentuh nyaman (≥44px), tidak tertutup konten (padding-bottom konten).
- [ ] Dengan layar desktop: navbar atas, bottom nav hilang.
- [ ] Semua menu bisa diklik dan menampilkan halaman placeholder.
- [ ] Buka tanpa login → tetap terhalang middleware.

**DoD:** layout warga lengkap (navbar + bottom nav + logout + nama), guard tetap bekerja, loading state ada.

---

## Sprint 5 — Migrasi 4 Tabel Inti + Seed Kategori + Akun Admin
**Estimasi:** 1 hari
**Prasyarat:** Sprint 1 (bisa dikerjakan paralel dengan Sprint 2–4).

### Langkah
- [ ] Migration `supabase/migrations/002_core_tables.sql`:
  - [ ] `report_categories (id, name, description, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ)`.
  - [ ] `reports (id, user_id FK→profiles, category_id FK→report_categories, title, description, location, latitude DOUBLE PRECISION NULL, longitude DOUBLE PRECISION NULL, status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted','verified','in_progress','resolved','rejected')), created_at, updated_at)` + trigger `updated_at` otomatis.
  - [ ] `report_evidence (id, report_id FK→reports ON DELETE CASCADE, file_path TEXT, created_at)`.
  - [ ] `report_status_history (id, report_id FK→reports, changed_by FK→profiles, old_status TEXT, new_status TEXT, note TEXT NULL, created_at)`.
  - [ ] Semua kolom waktu `TIMESTAMPTZ`.
- [ ] **RLS semua tabel:**
  - [ ] `report_categories`: `SELECT` publik untuk user login.
  - [ ] `reports`: `SELECT/INSERT` hanya `user_id = auth.uid()`; `SELECT` seluruh data + `UPDATE status` hanya role `admin`; warga **tidak** punya `UPDATE/DELETE`.
  - [ ] `report_evidence`: mengikuti akses laporan induknya.
  - [ ] `report_status_history`: `SELECT` (pelapor atas laporannya + admin); **tanpa** `UPDATE/DELETE` untuk siapa pun (riwayat immutable).
- [ ] Helper cek admin: function `is_admin()` SECURITY DEFINER → `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`.
- [ ] Migration `003_seed.sql`: seed **6 kategori** (jalan rusak, sampah, drainase, lampu jalan, fasilitas umum, lainnya).
- [ ] **Seed akun admin** (`scripts/seed-admin.ts` atau SQL): buat user via Supabase Admin API/service role → set `role='admin'`. Catat kredensial sebagai **data demo berlabel demo** (mis. `demo-admin@ civicreport.dev`).
  - [ ] `npm run seed:admin` ditambahkan ke `package.json`.

### Verifikasi localhost
- [ ] Tabel `report_categories`, `reports`, `report_evidence`, `report_status_history` ada → total 5 tabel (PRD §12).
- [ ] Kategori muncul di query dari `/dev/db-check`.
- [ ] Insert `reports` sebagai warga (SQL test) → baris tercipta; update `status` sebagai warga → **ditolak RLS**.
- [ ] Akun admin bisa login (uji awal).

**DoD:** 5 tabel + FK + RLS aktif, 6 kategori ter-seed, akun admin demo tersedia, semua bukti uji dari localhost.

---

## Sprint 6 — Beranda / Dashboard Warga
**Estimasi:** 1 hari
**Prasyarat:** Sprint 4 + Sprint 5.

### Langkah
- [ ] `src/app/(warga)/beranda/page.tsx` (Server Component):
  - [ ] Sapaan: "Halo, {full_name}".
  - [ ] Kartu ringkasan **laporan milik sendiri** per status (query DB scoped `user_id = auth.uid()`, bukan angka hardcoded): total, menunggu verifikasi, diproses, selesai.
  - [ ] Daftar **3–5 laporan terbaru** (judul, kategori, tanggal, badge status).
  - [ ] Tombol utama **Buat Laporan** → `/laporan/baru` (CTA menonjol di mobile).
- [ ] States: `loading.tsx` (skeleton kartu), empty state ("Belum ada laporan — Buat laporan pertama Anda"), error state (gagal query → pesan + tombol coba lagi).
- [ ] Query pakai `select('*', { count: 'exact' })` ringan, jangan ambil seluruh tabel.

### Verifikasi localhost
- [ ] Akun baru tanpa laporan → empty state tampil.
- [ ] Setelah nanti ada laporan (Sprint 7) → angka ringkasan ikut berubah (bisa diuji dulu dengan insert manual di SQL Editor, beri label data demo).
- [ ] Logout/login lintas akun → ringkasan masing-masing akun berbeda (bukan data akun lain).

**DoD:** beranda warga tampil dengan sapaan, ringkasan dari DB, daftar terbaru, CTA aktif, semua state ada.

---

## Sprint 7 — Form Buat Laporan + Upload Foto
**Estimasi:** 2 hari
**Prasyarat:** Sprint 5 + Sprint 6.

### Langkah
- [ ] Migration `004_storage_bucket.sql`:
  - [ ] Bucket `report-evidence` (private → dipakai signed URL; atau public-read bila ingin simpel — rekomendasi MVP: **private + signed URL 1 jam**).
  - [ ] Policy storage: user login hanya bisa `INSERT` di folder `{auth.uid()}/...`; `SELECT` hanya pemilik folder atau admin.
- [ ] `src/lib/validations/report.ts` — skema Zod `createReportSchema`:
  - [ ] `title` (min 5, max 120), `category_id` (uuid, wajib), `description` (min 10), `location` (min 3), `latitude`/`longitude` (**opsional**, number), `photo` (opsional: `image/*`, maks 2 MB — rekomendasi MVP PRD §5.1C).
- [ ] Halaman `src/app/(warga)/laporan/baru/page.tsx`:
  - [ ] Form RHF: field judul, `<Select>` kategori (ambil dari DB), textarea deskripsi, input lokasi teks, bagian koordinat opsional (toggle "Tambahkan koordinat" — tanpa peta berbayar).
  - [ ] Input file gambar + preview thumbnail sebelum submit.
  - [ ] Submit: validasi Zod client → **Server Action**:
    1. Validasi ulang dengan Zod **di server**.
    2. Upload file ke `{auth.uid()}/{reportId}/{filename}` di bucket.
    3. `INSERT reports` (status `submitted`) → dapat `reportId`.
    4. `INSERT report_evidence` dengan `file_path`.
    5. (Opsional) `INSERT report_status_history` awal: `old_status: null → submitted`.
  - [ ] Tombol disabled + label "Mengirim…" saat proses.
- [ ] Halaman sukses (`/laporan?created=1` atau `/laporan/[id]/sukses`): konfirmasi + tombol "Lihat laporan" & "Kembali ke beranda".

### Verifikasi localhost
- [ ] Kirim laporan lengkap + foto → muncul di tabel `reports` + `report_evidence`, file ada di Storage.
- [ ] Foto terlalu besar (>2 MB) atau tipe non-gambar → ditolak dengan pesan jelas.
- [ ] Submit dengan koordinat kosong → tetap berhasil (koordinat opsional).
- [ ] Submit tanpa judul/kategori/deskripsi → error validasi per-field.
- [ ] Uji **2 akun warga berbeda**: laporan akun A tidak muncul di akun B.

**DoD:** warga bisa kirim laporan dengan foto dari localhost; data tersimpan di PostgreSQL + Storage; status `submitted`; RLS lintas akun terbukti.

---

## Sprint 8 — Riwayat Laporan Warga
**Estimasi:** 1 hari
**Prasyarat:** Sprint 7.

### Langkah
- [ ] Halaman `src/app/(warga)/laporan/page.tsx`:
  - [ ] Daftar laporan milik sendiri: judul, kategori, tanggal dibuat, **badge status berwarna konsisten** (submitted=abu, verified=biru, in_progress=kuning/oranye, resolved=hijau, rejected=merah).
  - [ ] **Filter status** (chips/tabs: Semua, Menunggu, Diproses, Selesai, Ditolak) → param `?status=`.
  - [ ] **Pagination sederhana** (10/halaman, tombol Sebelumnya/Berikutnya, param `?page=`) — pakai `range()` + `count: 'exact'`.
  - [ ] Klik baris → `/laporan/[id]`.
- [ ] States: skeleton saat loading, empty state per filter ("Tidak ada laporan berstatus ini"), error state.
- [ ] Query wajib scoped `user_id = auth.uid()` **dan** tetap mengandalkan RLS (dua lapis).

### Verifikasi localhost
- [ ] Daftar hanya menampilkan laporan akun yang login.
- [ ] Filter tiap status menampilkan data benar; filter tanpa hasil → empty state.
- [ ] Pagination: halaman 1/2 berpindah benar, total jumlah sesuai.
- [ ] Cek query di Network tab: tidak ada `select *` tanpa batas.

**DoD:** riwayat + filter + pagination bekerja, badge status seragam, states lengkap.

---

## Sprint 9 — Detail Laporan Warga (Baca Saja)
**Estimasi:** 1 hari
**Prasyarat:** Sprint 8.

### Langkah
- [ ] Halaman `src/app/(warga)/laporan/[id]/page.tsx`:
  - [ ] Header: judul, badge status terkini, tanggal dibuat.
  - [ ] Info: kategori, deskripsi, lokasi teks, koordinat (tampil hanya jika ada — format angka saja, tanpa peta).
  - [ ] **Foto bukti**: tampil via signed URL (Storage) — fallback placeholder bila tidak ada foto.
  - [ ] **Timeline riwayat** (`report_status_history`, urut terbaru): perubahan status, catatan admin, waktu, pelaku (`changed_by` → `profiles.full_name`).
  - [ ] Timeline **read-only** — warga tidak punya tombol aksi apa pun.
  - [ ] 404/403 state bila laporan tidak ada atau bukan miliknya (RLS otomatis mengembalikan kosong → tampilkan "Laporan tidak ditemukan").
- [ ] `loading.tsx` skeleton detail.

### Verifikasi localhost
- [ ] Buka detail laporan sendiri → info + foto + timeline tampil.
- [ ] Buka `id` laporan orang lain (ganti URL manual) → ditolak/tidak ditemukan.
- [ ] Belum ada riwayat selain `submitted` → tampil riwayat pembuatan dengan rapi.

**DoD:** detail lengkap (info, foto, koordinat opsional, status, timeline), baca-only untuk warga.

---

## Sprint 10 — Layout Area Admin (Sidebar + Guard)
**Estimasi:** 1 hari
**Prasyarat:** Sprint 3 + Sprint 5.

### Langkah
- [ ] `src/app/(admin)/layout.tsx`:
  - [ ] **Sidebar desktop** (`hidden md:flex`): Dashboard, Laporan (semua), (placeholder menu berikutnya), Profil/Logout.
  - [ ] **Navigasi mobile**: hamburger / top bar + drawer sederhana.
  - [ ] Cek role admin **di server** (redirect `/akses-ditolak` bila bukan admin) — lapisan kedua setelah middleware.
  - [ ] Branding "CivicReport — Panel Petugas".
- [ ] Halaman placeholder `/admin` (dashboard) dan `/admin/laporan`.

### Verifikasi localhost
- [ ] Login admin → sidebar tampil di desktop; di 375px → navigasi via drawer, tidak overflow.
- [ ] Login citizen → langsung dialihkan, tidak pernah melihat layout admin.
- [ ] Buka `/admin` dalam keadaan logout → redirect `/login`.

**DoD:** layout admin + sidebar + mobile nav + guard admin ganda (middleware + layout) berfungsi.

---

## Sprint 11 — Dashboard Admin: Statistik + Daftar Laporan
**Estimasi:** 2 hari
**Prasyarat:** Sprint 10.

### Langkah
- [ ] **Kartu statistik** `/admin` (Server Component, angka dari query DB — bukan hardcoded):
  - [ ] Total laporan, Menunggu verifikasi (`submitted`), Sedang diproses (`in_progress`), Selesai (`resolved`), (opsional: `rejected`).
  - [ ] Query agregat ringan: `select('status', { count: 'exact' })` per status atau satu query `group by`.
  - [ ] Kartu **Laporan terbaru** (5 terakhir, semua role) di bawah statistik.
- [ ] **Halaman `/admin/laporan`** (tabel):
  - [ ] Kolom: judul, nama pelapor (`profiles.full_name` via join), kategori, tanggal, badge status.
  - [ ] **Filter status** + **filter kategori** (`?status=&category=`).
  - [ ] **Pencarian judul** (ILIKE) — debounce di client.
  - [ ] **Pagination** (15/halaman, `range` + count exact).
  - [ ] Klik baris → `/admin/laporan/[id]`.
- [ ] States: skeleton tabel, empty state ("Tidak ada laporan cocok dengan filter"), error state.
- [ ] Pastikan semua query jalan **dengan RLS aktif** (client anon key, bukan service role).

### Verifikasi localhost
- [ ] Angka statistik = jumlah sebenarnya di DB (cocokkan dengan SQL Editor).
- [ ] Filter status/kategori + search menampilkan hasil benar dan kombinasi filter bekerja.
- [ ] Pagination stok benar saat data > 1 halaman.
- [ ] Dengan 2 akun warga + beberapa laporan → admin melihat semuanya termasuk nama pelapor.
- [ ] Uji halaman tanpa data → empty state.

**DoD:** statistik dari DB, tabel lengkap dengan pelapor, filter + search + pagination aktif, hanya admin bisa akses.

---

## Sprint 12 — Penanganan Laporan Admin (Ubah Status Atomik)
**Estimasi:** 2 hari
**Prasyarat:** Sprint 11 + Sprint 9.

### Langkah
- [ ] Migration `005_status_rpc.sql` — function PostgreSQL **`change_report_status(p_report_id UUID, p_new_status TEXT, p_note TEXT DEFAULT NULL)`**:
  - [ ] Guard: `auth.uid()` harus `admin` (via `is_admin()`), selain itu `RAISE EXCEPTION`.
  - [ ] Validasi `p_new_status` termasuk salah satu dari 5 nilai + cek transisi wajar (mis. dari `rejected` tidak bisa ke `in_progress` — boleh disederhanakan, minimal tolak nilai tak dikenal).
  - [ ] Dalam **satu transaksi**: `UPDATE reports SET status, updated_at` **lalu** `INSERT report_status_history (old_status → new_status, note, changed_by=auth.uid())`.
  - [ ] `SECURITY INVOKER` + RLS admin tetap berlaku (atau `SECURITY DEFINER` dengan guard admin ketat).
  - [ ] Grant execute hanya ke `authenticated`.
- [ ] Halaman detail admin `src/app/(admin)/admin/laporan/[id]/page.tsx`:
  - [ ] Tampilan lengkap: deskripsi, **foto bukti** (signed URL), lokasi + koordinat, data pelapor, timeline riwayat + catatan.
  - [ ] Panel aksi: `<Select>` status baru + textarea catatan → tombol **Ubah Status**.
  - [ ] **Dialog konfirmasi** (shadcn `Dialog`): "Ubah status dari X menjadi Y?" — konfirmasi untuk semua transisi (terutama `rejected` & `resolved`).
  - [ ] Submit via Server Action → panggil RPC `change_report_status` (supabase.rpc) — status + riwayat atomik, tanpa service role.
  - [ ] Setelah sukses: toast + refresh timeline; tombol disabled saat proses.
- [ ] Verifikasi konsistensi: coba ubah status **tanpa** catatan yang wajar → tetap dicatat riwayatnya; coba panggil update langsung dari client (tanpa RPC) → diblokir RLS (warga) / hanya history-insert via RPC.

### Verifikasi localhost
- [ ] Admin ubah status `submitted → verified → in_progress → resolved` → setiap langkah menghasilkan **tepat satu** baris di `report_status_history` dengan `old_status`/`new_status`/`note` benar.
- [ ] Buka halaman detail warga yang sama → timeline terbaru langsung terlihat (perubahan terasa dari sisi warga).
- [ ] Login sebagai warga → panggil RPC `change_report_status` → **ditolak** (bukan admin).
- [ ] Warga tetap tidak bisa `UPDATE reports` langsung (uji dari SQL Editor dengan anon key).
- [ ] Riwayat tidak bisa di-edit/dihapus oleh siapa pun (cek policy tanpa UPDATE/DELETE).

**DoD:** admin bisa ubah status + catatan secara atomik via RPC, riwayat tercatat lengkap, warga melihat update terbaru, uji keamanan lulus.

---

## Sprint 13 — Halaman Profil & Polish UI/UX
**Estimasi:** 1 hari
**Prasyarat:** Sprint 12 (fitur inti selesai).

### Langkah
- [ ] Halaman `src/app/(warga)/profil/page.tsx` (FR-12):
  - [ ] Tampilkan nama, email (read-only dari auth), role.
  - [ ] Form ubah `full_name` (RHF + Zod) → Server Action update `profiles` (kolom `full_name` saja — role tidak bisa diubah, dicek policy RLS).
  - [ ] Info akun demo (bila akun demo): label jelas **"Data demo"**.
  - [ ] Tombol logout.
- [ ] **Audit 5 kondisi wajib (PRD §8.5)** di semua halaman data-driven: loading (skeleton), empty, error, success (toast/inline), disabled saat submit.
- [ ] **Audit responsif**: 375px (HP), 768px (tablet), ≥1024px (desktop) untuk semua halaman warga + admin.
- [ ] Aksesibilitas: label `<label>` terhubung input, focus ring terlihat, kontras teks, target sentuh ≥44px, navigasi keyboard di form & dialog.
- [ ] Rapikan copywriting, spasi, dan konsistensi badge status.

### Verifikasi localhost
- [ ] Ubah nama → tampil di navbar warga setelah refresh (dan tetap setelah login ulang).
- [ ] Warga tidak bisa mengubah `role` (coba update via console → ditolak RLS).
- [ ] Checklist kondisi wajib per halaman ✓.

**DoD:** profil bisa di-update, 5 state konsisten di semua halaman, responsif & aksesibilitas lolos cek.

---

## Sprint 14 — PWA (Opsional / Stretch Goal)
**Estimasi:** 1 hari
**Prasyarat:** Sprint 13.
**Catatan:** Tidak wajib untuk Acceptance Criteria PRD §13. Kerjakan **hanya jika** sprint sebelumnya selesai tepat waktu; boleh dipotong tanpa mempengaruhi MVP.

### Langkah
- [ ] `public/manifest.json`: nama "CivicReport", warna `#2563EB`, `display: standalone`, shortcut "Buat Laporan".
- [ ] Icon 192×192, 512×512, dan 512×512 `maskable`.
- [ ] Service worker (minimal): cache **shell aplikasi saja** (HTML/JS/CSS) — **jangan cache** halaman auth/API response agar session tidak basi.
- [ ] Daftarkan SW di client + pastikan update otomatis (skipWaiting saat deploy).
- [ ] Uji "Add to Home Screen" di Chrome Android (via localhost dengan HTTPS tunnel atau setelah deploy) & Chrome desktop.

### Verifikasi
- [ ] Aplikasi bisa di-install, icon tampil, offline menampilkan shell (bukan blank).

**DoD:** installable PWA, icon + SW aktif, cache shell tidak mengganggu logout/role.

---

## Sprint 15 — Deployment Vercel + GitHub + README (Akhir)
**Estimasi:** 1 hari
**Prasyarat:** Sprint 13 (dan 14 jika dikerjakan).

### Langkah
- [ ] Push ke **GitHub** (repo baru, private boleh): pastikan `.env.local` TIDAK ikut, migration SQL ikut ter-commit.
- [ ] Buat **Vercel Hobby** → import repo GitHub.
- [ ] Isi environment variables di Vercel (sama dengan `.env.local`).
- [ ] Supabase → **Authentication → URL Configuration**: tambahkan domain Vercel ke Site URL & Redirect URLs.
- [ ] Untuk `seed-admin`/script butuh service role: jalankan lokal saja atau lewat GitHub secret — **jangan** masukkan `SUPABASE_SERVICE_ROLE_KEY` ke Vercel bila tidak dipakai kode produksi.
- [ ] `npm run build` lokal dulu untuk memastikan tidak ada error sebelum deploy.
- [ ] **README.md**:
  - [ ] Deskripsi + screenshot.
  - [ ] Cara install: `npm install`, salin `.env.example` → `.env.local`.
  - [ ] Cara menjalankan lokal (`npm run dev`) + cara menjalankan migration Supabase.
  - [ ] Cara seed admin + **daftar akun demo berlabel "data demo"** (warga demo + admin demo).
  - [ ] Link aplikasi ter-deploy.
- [ ] Buat `.env.example` (tanpa nilai asli).

### Verifikasi (publik)
- [ ] Buka URL Vercel: registrasi → login → buat laporan (foto) → login admin → verifikasi → warga lihat status terbaru — **alur penuh di URL publik**.
- [ ] Uji RLS publik: 2 akun warga berbeda di browser/incognito berbeda.
- [ ] Responsive di HP nyata/tiruan browser.

**DoD:** aplikasi jalan di URL Vercel, repo GitHub rapi tanpa secret, README lengkap, semua Acceptance Criteria PRD §13 terpenuhi.

---

## Sprint 16 — Testing End-to-End & Serah Terima
**Estimasi:** 1–2 hari
**Prasyarat:** Sprint 15.

### Langkah
- [ ] **Uji alur lengkap lokal** (`localhost`) dan di URL produksi:
  - [ ] Registrasi → login → buat laporan (dengan & tanpa foto) → riwayat → detail.
  - [ ] Admin: dashboard → filter/search → ubah status + catatan (semua transisi 5 status).
  - [ ] Warga melihat riwayat & catatan terbaru.
- [ ] **Uji keamanan RLS multi-akun** — checklist eksplisit:
  - [ ] Warga tidak bisa baca laporan warga lain.
  - [ ] Warga tidak bisa ubah status laporan.
  - [ ] Warga tidak bisa ubah role sendiri.
  - [ ] Warga tidak bisa buka halaman admin.
  - [ ] Riwayat tidak bisa diedit/dihapus.
  - [ ] Service role key tidak ada di source code / frontend (grep repository).
- [ ] **Uji 5 kondisi UI** di tiap halaman (loading/empty/error/success/disabled).
- [ ] **Uji PWA** (jika Sprint 14 dikerjakan).
- [ ] Perbaiki bug yang ditemukan; tandai checklist Acceptance Criteria PRD §13 satu per satu.

### Verifikasi
- [ ] Semua checklist PRD §13 tercentang.

**DoD:** seluruh alur uji lulus (lokal + produksi), acceptance criteria PRD lengkap, MVP siap diserahkan sebagai portofolio.

---

## Ringkasan Estimasi

| Sprint | Judul | Estimasi |
|---|---|---|
| 0 | Setup project lokal | ½ hari |
| 1 | Koneksi Supabase + tabel `profiles` | 1 hari |
| 2 | Halaman register & login | 1 hari |
| 3 | Middleware session + guard role | 1 hari |
| 4 | Layout area warga | 1 hari |
| 5 | 4 tabel inti + seed kategori + admin | 1 hari |
| 6 | Beranda/dashboard warga | 1 hari |
| 7 | Form buat laporan + upload foto | 2 hari |
| 8 | Riwayat laporan warga | 1 hari |
| 9 | Detail laporan warga | 1 hari |
| 10 | Layout area admin | 1 hari |
| 11 | Dashboard admin (statistik + daftar) | 2 hari |
| 12 | Penanganan status admin (RPC atomik) | 2 hari |
| 13 | Profil + polish UI/UX | 1 hari |
| 14 | PWA *(opsional)* | 1 hari |
| 15 | Deployment Vercel + GitHub + README | 1 hari |
| 16 | Testing E2E + serah terima | 1–2 hari |
| | **Total (tanpa PWA)** | **±17–18 hari** |
| | **Total (dengan PWA)** | **±18–19 hari** |
