import { chromium } from "playwright";
import bcrypt from "bcryptjs";
import { Client } from "pg";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = "admin@civicreport.test";
const ADMIN_PASSWORD = "admin12345";

let failed = 0;
async function shown(
  page: import("playwright").Page,
  target: string | import("playwright").Locator,
  timeout = 15000
): Promise<boolean> {
  const loc = typeof target === "string" ? page.getByText(target) : target;
  try {
    await loc.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}
function check(name: string, ok: boolean, extra = "") {
  if (ok) {
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

async function hasNoHorizontalOverflow(page: import("playwright").Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
  );
}

async function seedAdmin() {
  const client = new Client({
    connectionString:
      "postgres://postgres:password@127.0.0.1:5433/civicreport",
  });
  await client.connect();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await client.query(
    `INSERT INTO profiles (email, password_hash, full_name, role)
     VALUES ($1, $2, 'Admin Demo', 'admin')
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash, role = 'admin'`,
    [ADMIN_EMAIL, hash]
  );
  await client.end();
  console.log(`[e2e] admin demo siap: ${ADMIN_EMAIL}`);
}

async function main() {
  await seedAdmin();

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.route("**/api/locations?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        results: [
          {
            lat: -6.2,
            lon: 106.8,
            label: "Jl. Merdeka No. 10, Sukamaju",
            full: "Jl. Merdeka No. 10, Sukamaju",
          },
        ],
      }),
    })
  );

  const stamp = Date.now();
  const citizenEmail = `warga${stamp}@civicreport.test`;
  const citizenPassword = "wargasatu123";
  const citizenName = "Warga Uji Coba";
  let reportUrl = "";

  try {
    // ---- 1. Register warga ----
    console.log("\n[1] Register warga baru");
    await page.goto(`${BASE}/register`);
    await page.getByLabel("Nama Lengkap").fill(citizenName);
    await page.getByLabel("Email").fill(citizenEmail);
    await page.getByLabel("Password", { exact: true }).fill(citizenPassword);
    await page.getByLabel("Konfirmasi Password").fill(citizenPassword);
    await page.getByRole("button", { name: "Daftar" }).click();
    await page.waitForURL("**/beranda", { timeout: 15000 });
    check("register → redirect /beranda", page.url().endsWith("/beranda"));
    check("sapaan nama tampil", await shown(page, "Halo, Warga"));

    // ---- 2. Buat laporan ----
    console.log("\n[2] Buat laporan");
    await page.goto(`${BASE}/laporan/baru`);
    await page.getByLabel("Judul Laporan").fill("Jalan berlubang besar di depan pasar");
    await page.getByLabel("Kategori").click();
    await page.getByRole("option", { name: "Jalan rusak" }).click();
    await page
      .getByLabel("Deskripsi Masalah")
      .fill("Ada lubang berukuran besar yang berbahaya bagi pengendara motor.");
    await page.getByLabel("Lokasi laporan").click();
    await page.getByLabel("Cari lokasi").fill("Jl. Merdeka");
    await page
      .getByRole("button", { name: /Jl\. Merdeka No\. 10, Sukamaju/ })
      .click();
    await page.locator("#photo").setInputFiles({
      name: "e2e.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lO0AAAAASUVORK5CYII=",
        "base64"
      ),
    });
    await page.getByRole("button", { name: "Kirim Laporan" }).click();
    check("banner sukses tampil", await shown(page, "Laporan berhasil dikirim"));
    reportUrl = page.url();
    check(
      "laporan terkirim → halaman detail",
      /\/laporan\/[0-9a-f]{8}-[0-9a-f]{4}-/.test(reportUrl),
      `url=${reportUrl}`
    );
    check("status awal Menunggu verifikasi", await shown(page, "Menunggu verifikasi"));

    // ---- 3. Beranda publik tanpa login ----
    console.log("\n[3] Pengunjung melihat beranda tanpa login");
    const publicPage = await browser.newPage();
    await publicPage.goto(BASE);
    await publicPage.waitForURL("**/beranda", { timeout: 10000 });
    check("localhost langsung membuka beranda", await shown(publicPage, "Beranda"));
    for (const width of [320, 375, 768, 1024, 1440]) {
      await publicPage.setViewportSize({ width, height: 900 });
      check(
        `beranda responsif tanpa scroll horizontal (${width}px)`,
        await hasNoHorizontalOverflow(publicPage)
      );
    }
    await publicPage.setViewportSize({ width: 1280, height: 800 });
    check(
      "laporan warga terlihat oleh pengunjung",
      await shown(publicPage, "Jalan berlubang besar di depan pasar")
    );
    await publicPage
      .locator(`a[href="${new URL(reportUrl).pathname}"]`)
      .first()
      .click();
    await publicPage.waitForURL(/\/laporan\/[0-9a-f-]+/, { timeout: 10000 });
    check("detail masalah bisa dilihat tanpa login", await shown(publicPage, "Detail Masalah"));
    await publicPage.getByRole("link", { name: "Kirim Laporan" }).first().click();
    await publicPage.waitForURL(
      (url) => url.pathname === "/login",
      { timeout: 30000 }
    );
    check("pengunjung diarahkan ke login", new URL(publicPage.url()).pathname === "/login");
    check(
      "tautan daftar menyimpan tujuan formulir",
      (await publicPage.getByRole("link", { name: "Daftar di sini" }).getAttribute("href"))?.includes("next=%2Flaporan%2Fbaru") ?? false
    );
    await publicPage.getByLabel("Email").fill(citizenEmail);
    await publicPage.getByLabel("Password").fill(citizenPassword);
    await publicPage.getByRole("button", { name: "Masuk" }).click();
    await publicPage.waitForURL("**/laporan/baru", { timeout: 30000 });
    check("setelah login langsung ke formulir laporan", await shown(publicPage, "Buat Laporan"));
    for (const width of [320, 375, 768, 1024, 1440]) {
      await publicPage.setViewportSize({ width, height: 900 });
      check(
        `formulir responsif tanpa scroll horizontal (${width}px)`,
        await hasNoHorizontalOverflow(publicPage)
      );
    }
    await publicPage.close();

    // ---- 4. Warga diblokir dari area admin ----
    console.log("\n[4] Warga tidak bisa akses /admin");
    await page.goto(`${BASE}/admin`);
    await page.waitForURL("**/beranda", { timeout: 10000 });
    check("warga → redirect /beranda", page.url().endsWith("/beranda"));

    // ---- 5. Logout + login admin ----
    console.log("\n[5] Login admin");
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForURL("**/login", { timeout: 10000 });
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/admin", { timeout: 15000 });
    check("admin → redirect /admin", page.url().endsWith("/admin"));
    check("statistik dashboard tampil", await shown(page, "Total Laporan"));
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE}/admin`);
      check(
        `dashboard admin responsif tanpa scroll horizontal (${width}px)`,
        await hasNoHorizontalOverflow(page)
      );
    }
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/admin`);

    // ---- 6. Admin juga dapat memakai fitur warga ----
    console.log("\n[6] Admin mengakses beranda dan fitur warga");
    await page.goto(`${BASE}/beranda`);
    check("admin dapat melihat beranda publik", await shown(page, "Beranda"));
    check("tautan panel admin tersedia dari beranda", await shown(page, "Panel Admin"));
    await page.goto(`${BASE}/laporan/baru`);
    check("admin dapat membuka form laporan warga", await shown(page, "Buat Laporan"));

    // ---- 7. Admin memproses laporan ----
    console.log("\n[7] Admin ubah status laporan");
    await page.goto(`${BASE}/admin/laporan`);
    const reportLink = page.getByRole("link", {
      name: "Jalan berlubang besar di depan pasar",
    });
    check("laporan muncul di daftar admin", await shown(page, reportLink));
    await reportLink.first().click();
    await page.waitForURL(/\/admin\/laporan\/[0-9a-f-]+/, { timeout: 10000 });

    await page.locator("#new_status").click();
    await page.getByRole("option", { name: "Terverifikasi" }).click();
    await page
      .getByLabel("Catatan Penanganan (opsional)")
      .fill("Laporan valid, akan diteruskan ke petugas jalan.");
    await page.getByRole("button", { name: "Ubah Status", exact: true }).click();
    await page
      .getByRole("button", { name: "Ya, Ubah Status" })
      .click();
    await page
      .getByText("Status laporan berhasil diperbarui.")
      .waitFor({ timeout: 15000 });
    check("ubah status sukses", true);
    check("badge status ter-update", await shown(page, "Terverifikasi"));

    // ---- 8. Warga melihat pembaruan ----
    console.log("\n[8] Warga melihat status & riwayat terbaru");
    await page.goto(`${BASE}/login`);
    await page.getByRole("button", { name: "Logout" }).isVisible().catch(() => false);
    // masih login admin → logout dulu
    if (page.url().includes("/admin")) {
      await page.getByRole("button", { name: "Logout" }).click();
      await page.waitForURL("**/login", { timeout: 10000 });
    }
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email").fill(citizenEmail);
    await page.getByLabel("Password").fill(citizenPassword);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL("**/beranda", { timeout: 15000 });

    await page.goto(reportUrl);
    await page.waitForLoadState("load");
    const okStatus = await shown(page, "Terverifikasi");
    if (!okStatus) {
      console.log("  [debug] url:", page.url());
      console.log(
        "  [debug] body:",
        (await page.locator("body").innerText())
          .slice(0, 600)
          .replace(/\s+/g, " | ")
      );
    }
    check("warga lihat status Terverifikasi", okStatus);
    check(
      "catatan admin tampil di timeline",
      await shown(page, "Laporan valid, akan diteruskan ke petugas jalan.")
    );

    // ---- 9. Riwayat + filter ----
    console.log("\n[9] Riwayat & filter warga");
    await page.goto(`${BASE}/laporan?status=verified`);
    check(
      "filter verified menampilkan laporan",
      await shown(page, "Jalan berlubang besar di depan pasar")
    );
    await page.goto(`${BASE}/laporan?status=rejected`);
    check(
      "empty state filter rejected",
      await shown(page, "Tidak ada laporan berstatus ini")
    );

    // ---- 10. Profil ----
    console.log("\n[10] Update profil");
    await page.goto(`${BASE}/profil`);
    await page.getByLabel("Nama Lengkap").fill("Warga Uji Coba Baru");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await page
      .getByText("Profil berhasil diperbarui.")
      .waitFor({ timeout: 10000 });
    check("update profil sukses", true);
  } catch (err) {
    failed++;
    console.error("[e2e] ERROR:", err);
  } finally {
    await browser.close();
  }

  console.log(
    `\n[e2e] Selesai. ${failed === 0 ? "SEMUA LULUS ✓" : `${failed} GAGAL ✗`}`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
