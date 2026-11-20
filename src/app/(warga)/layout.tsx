import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { logoutAction } from "@/app/(auth)/actions";
import { WargaBottomNav } from "@/components/warga-bottom-nav";
import { Button } from "@/components/ui/button";
import { Megaphone, LogOut, ShieldCheck } from "lucide-react";

export default async function WargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/beranda" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Megaphone className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">CivicReport</span>
          </Link>

          <nav aria-label="Navigasi atas" className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/beranda">Beranda</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/laporan/baru">Kirim Laporan</Link>
            </Button>
            {user && (
              <Button variant="ghost" asChild>
                <Link href="/laporan">Riwayat</Link>
              </Button>
            )}
            {user && (
              <Button variant="ghost" asChild>
                <Link href="/profil">Profil</Link>
              </Button>
            )}
            {user?.role === "admin" && (
              <Button variant="ghost" asChild>
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" aria-hidden />
                  Panel Admin
                </Link>
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="max-w-32 truncate text-sm font-medium text-muted-foreground">
                  {user.full_name}
                </span>
                <form action={logoutAction}>
                  <Button type="submit" variant="ghost" size="icon" title="Logout">
                    <LogOut className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Logout</span>
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Daftar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 md:pb-10">
        {children}
      </main>

      <WargaBottomNav role={user?.role ?? null} />
    </div>
  );
}
