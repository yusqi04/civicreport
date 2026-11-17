# CivicReport — Product Requirements Document (PRD)

**Versi:** 1.0  
**Status:** MVP / Draft siap implementasi  
**Jenis produk:** Mobile-first responsive web application  
**Tujuan:** Portofolio fullstack developer dan fondasi aplikasi pelaporan masalah lingkungan

---

## 1. Ringkasan Produk

CivicReport adalah aplikasi web yang membantu masyarakat melaporkan masalah di lingkungan sekitar dan membantu petugas mengelola serta memantau tindak lanjut laporan.

Aplikasi menyediakan dua area utama:

1. **Area warga:** registrasi/login, membuat laporan, mengunggah foto bukti, mengisi lokasi, dan memantau perkembangan laporan.
2. **Area admin/petugas:** melihat laporan masuk, memverifikasi laporan, memperbarui status, dan menambahkan catatan penanganan.

CivicReport harus mudah dipahami, sederhana, responsif di perangkat mobile, dan benar-benar berfungsi dari ujung ke ujung.

## 2. Latar Belakang Masalah

Pelaporan masalah lingkungan sering dilakukan melalui pesan pribadi, grup percakapan, atau secara langsung. Cara tersebut dapat menyebabkan:

- Laporan tertimbun dan sulit dilacak.
- Pelapor tidak mengetahui perkembangan laporan.
- Petugas kesulitan mengelola laporan yang masuk.
- Riwayat penanganan tidak terdokumentasi dengan baik.

CivicReport menyediakan satu tempat terpusat untuk membuat, mengelola, dan memantau laporan.

## 3. Tujuan Produk

### 3.1 Tujuan utama

- Memungkinkan warga mengirim laporan masalah lingkungan secara online.
- Memungkinkan admin/petugas mengelola laporan dalam satu dashboard.
- Menyediakan status dan riwayat tindak lanjut yang transparan.
- Menunjukkan implementasi fullstack yang nyata: TypeScript, PostgreSQL, autentikasi, otorisasi, penyimpanan file, dan deployment.

### 3.2 Indikator keberhasilan MVP

MVP dianggap berhasil apabila:

- Warga dapat membuat akun dan login.
- Warga dapat membuat laporan dengan kategori, deskripsi, dan foto.
- Laporan tersimpan di PostgreSQL.
- Warga hanya dapat melihat laporan miliknya.
- Admin dapat melihat dan memproses seluruh laporan.
- Setiap perubahan status tercatat dalam riwayat.
- Aplikasi dapat digunakan melalui browser desktop dan mobile.
- Aplikasi dapat diakses melalui URL deployment publik.

## 4. Target Pengguna dan Hak Akses

| Peran | Kebutuhan | Hak akses utama |
|---|---|---|
| Warga (`citizen`) | Melaporkan masalah dan memantau tindak lanjut | Membuat laporan, melihat laporan sendiri, melihat riwayat status |
| Admin (`admin`) | Mengelola laporan | Melihat seluruh laporan, mengubah status, menambahkan catatan |

**Keputusan MVP:** gunakan dua role saja, yaitu `citizen` dan `admin`. Role petugas terpisah, multi-instansi, dan manajemen organisasi belum termasuk MVP.

Role admin tidak boleh dapat dipilih atau diubah sendiri oleh pengguna melalui form registrasi. Pembuatan admin dilakukan melalui proses administratif yang aman.

## 5. Ruang Lingkup Fitur

### 5.1 Fitur warga

#### A. Autentikasi
- Registrasi menggunakan email dan password.
- Login dan logout.
- Menampilkan nama/profil pengguna.
- Session tetap terjaga sesuai mekanisme Supabase Auth.
- Halaman yang membutuhkan login tidak dapat diakses tanpa autentikasi.

#### B. Beranda warga
- Menampilkan sapaan atau identitas pengguna.
- Menampilkan ringkasan jumlah laporan milik pengguna.
- Menampilkan laporan terbaru.
- Menyediakan tombol utama **Buat Laporan**.

#### C. Membuat laporan
Form laporan memuat:
- Judul laporan.
- Kategori.
- Deskripsi masalah.
- Foto bukti (unggah file gambar).
- Lokasi dalam bentuk teks/alamat.
- Koordinat latitude dan longitude (opsional).

Aturan:
- Judul, kategori, dan deskripsi wajib diisi.
- Foto wajib atau opsional dapat diputuskan saat implementasi; rekomendasi MVP: minimal satu foto opsional agar warga tetap dapat melapor ketika tidak memiliki foto.
- Tipe dan ukuran file harus divalidasi.
- Koordinat tidak boleh diwajibkan.
- Setelah berhasil dikirim, status awal adalah `submitted`.

#### D. Riwayat laporan
- Menampilkan laporan yang dibuat oleh pengguna yang sedang login.
- Menampilkan judul, kategori, tanggal, dan status.
- Mendukung filter status sederhana.
- Menyediakan halaman detail laporan.

#### E. Detail laporan
- Menampilkan informasi laporan.
- Menampilkan foto bukti.
- Menampilkan lokasi jika tersedia.
- Menampilkan status terkini.
- Menampilkan riwayat perubahan status dan catatan admin.

### 5.2 Fitur admin

#### A. Dashboard admin
Menampilkan ringkasan:
- Total laporan.
- Laporan menunggu verifikasi.
- Laporan sedang diproses.
- Laporan selesai.
- Laporan terbaru.

Angka statistik harus berasal dari query database, bukan angka hardcoded.

#### B. Daftar laporan
- Melihat seluruh laporan.
- Melihat nama pelapor, kategori, tanggal, dan status.
- Filter berdasarkan status dan kategori.
- Pencarian sederhana berdasarkan judul atau kata kunci jika memungkinkan.

#### C. Detail dan penanganan laporan
- Melihat deskripsi, foto, dan lokasi laporan.
- Mengubah status laporan.
- Menambahkan catatan penanganan.
- Melihat riwayat perubahan status.

### 5.3 Di luar ruang lingkup MVP

Jangan implementasikan fitur berikut pada versi pertama:

- Chat real-time antara warga dan petugas.
- Notifikasi WhatsApp/SMS.
- Peta interaktif berbasis layanan peta berbayar.
- Klasifikasi laporan menggunakan AI.
- Mode offline penuh.
- Aplikasi native Android/iOS.
- Export PDF/Excel.
- Multi-instansi atau multi-tenant.
- Analitik lanjutan.
- Sistem penugasan petugas yang kompleks.

## 6. Alur Penggunaan Utama

### 6.1 Alur warga

1. Warga membuka CivicReport.
2. Warga registrasi atau login.
3. Warga memilih **Buat Laporan**.
4. Warga mengisi judul, kategori, deskripsi, dan lokasi.
5. Warga menambahkan foto jika tersedia.
6. Warga mengirim laporan.
7. Server memvalidasi input dan menyimpan data.
8. Laporan muncul di riwayat warga dengan status `submitted`.
9. Warga membuka detail laporan untuk memantau status dan riwayat.

### 6.2 Alur admin

1. Admin login.
2. Admin membuka dashboard.
3. Admin memilih laporan masuk.
4. Admin memeriksa detail dan bukti.
5. Admin memperbarui status menjadi `verified`, `in_progress`, `resolved`, atau `rejected` sesuai kondisi.
6. Admin menambahkan catatan jika diperlukan.
7. Sistem menyimpan perubahan status dan riwayatnya.
8. Warga dapat melihat status terbaru saat membuka detail laporan.

## 7. Status dan Aturan Transisi

| Nilai database | Label UI | Makna |
|---|---|---|
| `submitted` | Menunggu verifikasi | Laporan baru dikirim |
| `verified` | Terverifikasi | Laporan telah diperiksa |
| `in_progress` | Sedang diproses | Tindak lanjut sedang dilakukan |
| `resolved` | Selesai | Masalah dinyatakan selesai |
| `rejected` | Ditolak | Laporan tidak dapat ditindaklanjuti |

Aturan:
- Status awal setiap laporan adalah `submitted`.
- Hanya admin yang dapat mengubah status.
- Setiap perubahan status harus menghasilkan satu catatan riwayat.
- Riwayat tidak boleh dapat diedit atau dihapus oleh warga.
- Status dan riwayat harus diperbarui secara konsisten. Gunakan transaksi atau PostgreSQL function/RPC yang aman jika diperlukan agar tidak terjadi perubahan status tanpa riwayat.

## 8. Persyaratan UI/UX

### 8.1 Prinsip desain

Gunakan gaya **Modern Minimalist Civic SaaS**:
- Sederhana, bersih, dan mudah dipahami.
- Mobile-first dan responsif.
- Fokus pada keterbacaan dan tindakan utama.
- Tidak menggunakan dekorasi berlebihan, animasi berat, gradient berlebihan, atau glassmorphism yang tidak diperlukan.

### 8.2 Design system

| Elemen | Ketentuan |
|---|---|
| Font | Inter |
| Warna utama | Biru `#2563EB` |
| Background | `#F8FAFC` |
| Teks utama | `#0F172A` |
| Border | Slate terang |
| Komponen | shadcn/ui |
| Styling | Tailwind CSS |
| Ikon | Lucide React |
| Radius | 8–12 px |
| Spacing | Skala konsisten 4/8 px |

### 8.3 Area warga

- Navigasi sederhana.
- Tombol **Buat Laporan** mudah ditemukan.
- Form dibagi menjadi bagian yang mudah dipahami.
- Status menggunakan label dan warna yang konsisten.
- Navigasi bawah dapat digunakan pada layar mobile.
- Ukuran target sentuh nyaman digunakan.

### 8.4 Area admin

- Sidebar pada desktop.
- Navigasi yang tetap nyaman di layar kecil.
- Kartu statistik di bagian atas.
- Tabel laporan dengan filter yang jelas.
- Detail laporan memprioritaskan informasi dan bukti.
- Aksi perubahan status harus jelas dan meminta konfirmasi bila berdampak penting.

### 8.5 Kondisi antarmuka wajib

Setiap halaman/data-driven component harus menangani:
- Loading state.
- Empty state.
- Error state.
- Success/confirmation state.
- Disabled state saat proses sedang berjalan.

## 9. Persyaratan Fungsional

| ID | Persyaratan | Prioritas |
|---|---|---|
| FR-01 | Pengguna dapat registrasi, login, dan logout | Must |
| FR-02 | Sistem membedakan role warga dan admin | Must |
| FR-03 | Warga dapat membuat laporan | Must |
| FR-04 | Warga dapat mengunggah foto bukti | Must |
| FR-05 | Warga dapat melihat daftar laporan miliknya | Must |
| FR-06 | Warga dapat melihat detail dan riwayat laporan | Must |
| FR-07 | Admin dapat melihat seluruh laporan | Must |
| FR-08 | Admin dapat mengubah status laporan | Must |
| FR-09 | Sistem mencatat setiap perubahan status | Must |
| FR-10 | Dashboard menampilkan statistik dari database | Should |
| FR-11 | Admin dapat memfilter laporan | Should |
| FR-12 | Pengguna dapat memperbarui informasi profil dasar | Could |

## 10. Persyaratan Non-Fungsional

### 10.1 Keamanan
- Semua tabel yang terekspos melalui Supabase Data API harus memiliki Row Level Security (RLS) aktif.
- Warga hanya dapat membaca laporan miliknya.
- Warga hanya dapat membuat laporan atas nama dirinya sendiri.
- Warga tidak dapat mengubah role atau status laporan.
- Admin hanya dapat melakukan tindakan administratif sesuai kebijakan.
- Validasi input dilakukan di server menggunakan Zod.
- Secret/service role key tidak boleh dikirim ke browser atau disimpan di repository.
- Storage bucket dan kebijakan akses file harus dikonfigurasi dengan benar.
- Jangan mempercayai role dari data form atau local storage; verifikasi identitas dan role di sisi server.

### 10.2 Kinerja dan penggunaan
- Halaman utama dan form harus ringan.
- Gambar dibatasi tipe dan ukuran file.
- Query daftar laporan menggunakan pagination bila jumlah data bertambah.
- Hindari mengambil seluruh data tanpa batas.

### 10.3 Kompatibilitas
- Mendukung browser modern.
- Responsif pada ponsel, tablet, dan desktop.
- Form dapat digunakan dengan keyboard dan label yang jelas.

### 10.4 Keandalan data
- Gunakan foreign key dan constraint yang sesuai.
- Kolom waktu menggunakan `TIMESTAMPTZ`.
- Simpan riwayat status sebagai data terpisah.
- Tampilkan pesan yang jelas jika penyimpanan gagal.

## 11. Teknologi dan Batasan Tools

Semua tools yang digunakan harus memiliki opsi gratis. Jangan menambahkan layanan berbayar ke arsitektur MVP.

| Kebutuhan | Teknologi |
|---|---|
| Framework fullstack | Next.js App Router |
| Bahasa | TypeScript (`strict: true`) |
| UI styling | Tailwind CSS |
| UI components | shadcn/ui |
| Form | React Hook Form |
| Validasi | Zod |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Hosting/deployment | Vercel Hobby |
| Repository/version control | GitHub Free |
| Icons | Lucide React |
| Package manager | npm |
| Editor | VS Code |

### 11.1 Batasan layanan gratis

- Gunakan paket gratis Vercel, Supabase, dan GitHub.
- Periksa kuota, batas ukuran, batas penggunaan, kebijakan tidur proyek, dan ketentuan paket masing-masing layanan sebelum deployment.
- Jangan mengasumsikan layanan gratis berarti unlimited.
- Jangan memasukkan API berbayar, layanan peta berbayar, atau layanan notifikasi berbayar.
- Jika suatu fitur membutuhkan layanan berbayar, fitur tersebut harus dihilangkan atau diganti dengan pendekatan gratis.

## 12. Rancangan Database Awal

MVP menggunakan lima tabel utama. Nama dan kolom dapat disesuaikan saat pembuatan migration, tetapi relasi dan aturan akses harus dipertahankan.

### 12.1 `profiles`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key, sama dengan `auth.users.id` |
| `full_name` | TEXT | Nama pengguna |
| `role` | TEXT | `citizen` atau `admin` |
| `created_at` | TIMESTAMPTZ | Waktu pembuatan |

Email dikelola oleh Supabase Auth; jangan menyimpan password sendiri.

### 12.2 `report_categories`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | TEXT | Nama kategori |
| `description` | TEXT | Deskripsi opsional |
| `is_active` | BOOLEAN | Kategori aktif/tidak |

Contoh kategori awal: jalan rusak, sampah, drainase, lampu jalan, fasilitas umum, dan lainnya. Kategori ini adalah data awal contoh dan dapat disesuaikan.

### 12.3 `reports`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK ke `profiles.id` |
| `category_id` | UUID | FK ke `report_categories.id` |
| `title` | TEXT | Judul laporan |
| `description` | TEXT | Deskripsi masalah |
| `location` | TEXT | Alamat/lokasi teks |
| `latitude` | DOUBLE PRECISION | Koordinat opsional |
| `longitude` | DOUBLE PRECISION | Koordinat opsional |
| `status` | TEXT | Status laporan |
| `created_at` | TIMESTAMPTZ | Waktu laporan dibuat |
| `updated_at` | TIMESTAMPTZ | Waktu perubahan terakhir |

### 12.4 `report_evidence`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `report_id` | UUID | FK ke `reports.id` |
| `file_path` | TEXT | Path objek di Supabase Storage |
| `created_at` | TIMESTAMPTZ | Waktu upload |

File gambar disimpan di Supabase Storage, bukan sebagai binary di tabel PostgreSQL.

### 12.5 `report_status_history`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `report_id` | UUID | FK ke `reports.id` |
| `changed_by` | UUID | FK ke `profiles.id` |
| `old_status` | TEXT | Status sebelumnya |
| `new_status` | TEXT | Status baru |
| `note` | TEXT | Catatan penanganan opsional |
| `created_at` | TIMESTAMPTZ | Waktu perubahan |

### 12.6 Relasi

- `profiles` 1—N `reports`
- `report_categories` 1—N `reports`
- `reports` 1—N `report_evidence`
- `reports` 1—N `report_status_history`
- `profiles` 1—N `report_status_history`

## 13. Acceptance Criteria MVP

MVP dinyatakan selesai apabila semua kondisi berikut terpenuhi:

### Autentikasi dan keamanan
- [ ] Pengguna dapat registrasi, login, dan logout.
- [ ] Session ditangani dengan benar.
- [ ] Role warga dan admin diterapkan.
- [ ] Warga tidak dapat membuka halaman admin.
- [ ] Warga tidak dapat membaca laporan pengguna lain.
- [ ] Warga tidak dapat mengubah status laporan.
- [ ] RLS diuji menggunakan lebih dari satu akun.
- [ ] Secret key tidak terekspos di frontend/repository.

### Pelaporan
- [ ] Warga dapat membuat laporan dengan data valid.
- [ ] Laporan tersimpan di PostgreSQL.
- [ ] Foto dapat diunggah dan ditautkan ke laporan.
- [ ] Lokasi teks dapat disimpan.
- [ ] Koordinat bersifat opsional.
- [ ] Warga dapat melihat daftar dan detail laporannya.

### Admin
- [ ] Admin dapat melihat seluruh laporan.
- [ ] Admin dapat melihat detail dan foto bukti.
- [ ] Admin dapat mengubah status.
- [ ] Perubahan status tercatat di riwayat.
- [ ] Warga dapat melihat status dan riwayat terbaru.

### Kualitas dan deployment
- [ ] Tampilan responsif di mobile dan desktop.
- [ ] Loading, empty, error, dan success state tersedia.
- [ ] Aplikasi berjalan di URL Vercel.
- [ ] Source code tersedia di GitHub.
- [ ] README berisi cara menjalankan proyek dan konfigurasi environment.
- [ ] Data demo diberi label sebagai data demo, bukan data nyata.

## 14. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| RLS salah konfigurasi | Uji dengan akun warga dan admin yang berbeda |
| Role admin dapat dimanipulasi | Batasi perubahan role ke proses administratif tepercaya |
| Upload file tidak aman | Validasi tipe, ukuran, dan hak akses file |
| Status berubah tanpa riwayat | Simpan perubahan status dan riwayat secara atomik |
| Free tier mencapai batas | Batasi ukuran file, optimalkan query, pantau penggunaan |
| Scope membesar | Tunda semua fitur di luar MVP |
| AI menghasilkan kode tidak konsisten | Implementasi satu fitur per tahap, review, dan test sebelum lanjut |

## 15. Rencana Sprint

Rencana sprint yang **detail per langkah, file, dan verifikasi localhost** terdapat di file terpisah: **[`SPRINT_CivicReport.md`](SPRINT_CivicReport.md)**. File tersebut menjadi acuan pelaksanaan implementasi dan memuat 16 sprint dengan aturan:

- Setiap sprint wajib berjalan dan terverifikasi di `localhost` terlebih dahulu sebelum pindah sprint berikutnya; deployment hanya di sprint akhir.
- Semua tools 100% gratis (Supabase Free, Vercel Hobby, GitHub Free, stack open source).
- Setiap sprint memiliki langkah konkret (file/rute/migrasi), cara uji di localhost, dan Definition of Done.

### Ringkasan sprint

| Sprint | Judul | Estimasi |
|---|---|---|
| 0 | Setup project lokal (Next.js + Tailwind + shadcn/ui + design system) | ½ hari |
| 1 | Koneksi Supabase + tabel `profiles` + trigger + RLS | 1 hari |
| 2 | Halaman `/register` & `/login` (RHF + Zod + Supabase Auth) | 1 hari |
| 3 | Middleware session + guard role + logout | 1 hari |
| 4 | Layout area warga (navbar + bottom nav mobile) | 1 hari |
| 5 | Migrasi 4 tabel inti + RLS + seed kategori + akun admin demo | 1 hari |
| 6 | Beranda/dashboard warga (ringkasan dari DB) | 1 hari |
| 7 | Form buat laporan + upload foto ke Supabase Storage | 2 hari |
| 8 | Riwayat laporan warga (filter + pagination) | 1 hari |
| 9 | Detail laporan warga (timeline baca saja) | 1 hari |
| 10 | Layout area admin (sidebar + guard admin) | 1 hari |
| 11 | Dashboard admin: statistik + daftar laporan + filter/search | 2 hari |
| 12 | Penanganan admin: ubah status atomik via PostgreSQL RPC | 2 hari |
| 13 | Halaman profil + polish 5 state wajib + responsif | 1 hari |
| 14 | PWA *(opsional/stretch)* | 1 hari |
| 15 | Deployment Vercel + GitHub + README | 1 hari |
| 16 | Testing end-to-end + checklist acceptance criteria | 1–2 hari |

**Total estimasi:** ±17–18 hari (tanpa PWA), ±18–19 hari (dengan PWA).

Definition of Done per sprint dan checklist verifikasi lengkapnya mengikuti file `SPRINT_CivicReport.md`.

## 16. Prinsip Implementasi

1. Bangun satu fitur dari database sampai UI sebelum berpindah ke fitur berikutnya.
2. Jangan membuat UI yang menggunakan data palsu untuk mengaku sebagai fitur selesai.
3. Jangan menaruh business logic dan otorisasi penting hanya di client.
4. Gunakan SQL migrations yang tersimpan di GitHub agar perubahan database dapat dilacak.
5. Review kode hasil AI dan pahami alur data sebelum menerima implementasi.
6. Jalankan test/manual verification setiap selesai satu fitur.
7. Prioritaskan keamanan, fungsi inti, dan kemudahan penggunaan daripada jumlah fitur.

---

**Dokumen ini menjadi acuan utama implementasi CivicReport MVP.** Perubahan ruang lingkup, database, dan fitur harus diperbarui di PRD agar implementasi tetap konsisten.
