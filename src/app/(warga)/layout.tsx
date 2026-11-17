import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { logoutAction } from "@/app/(auth)/actions";
import { WargaBottomNav } from "@/components/warga-bottom-nav";
import { Button } from "@/components/ui/button";
import { Megaphone, LogOut } from "lucide-react";

export default async function WargaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
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
              <Link href="/laporan/baru">Buat Laporan</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/laporan">Riwayat</Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <span className="max-w-32 truncate text-sm font-medium text-muted-foreground">
              {user.full_name}
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" title="Logout">
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="sr-only">Logout</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>

      <WargaBottomNav />
    </div>
  );
}
