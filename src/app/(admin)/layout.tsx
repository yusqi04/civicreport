import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Home,
  ListChecks,
  LogOut,
  Megaphone,
  PlusCircle,
  ShieldCheck,
  User,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/laporan", label: "Laporan", icon: ListChecks },
];

const wargaNavItems = [
  { href: "/beranda", label: "Beranda Warga", icon: Home },
  { href: "/laporan/baru", label: "Kirim Laporan", icon: PlusCircle },
  { href: "/laporan", label: "Riwayat Warga", icon: ListChecks },
  { href: "/profil", label: "Profil", icon: User },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <Link href="/admin" className="flex h-16 items-center gap-2 border-b px-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Megaphone className="h-4 w-4" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">CivicReport</p>
            <p className="text-[11px] text-muted-foreground">Panel Petugas</p>
          </div>
        </Link>
        <nav aria-label="Navigasi admin" className="flex-1 space-y-5 overflow-y-auto p-3">
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Operasional
            </p>
            {adminNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-primary"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Fitur warga
            </p>
            {wargaNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-primary"
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium">{admin.full_name}</p>
              <p className="text-[11px] text-muted-foreground">Admin</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-4">
            <Link href="/beranda" className="flex items-center gap-2 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Megaphone className="h-4 w-4" aria-hidden />
              </span>
              <span className="hidden text-sm sm:inline">Panel Admin</span>
            </Link>
            <nav aria-label="Navigasi admin mobile" className="flex items-center gap-1">
              {adminNavItems.map(({ href, label, icon: Icon }) => (
                <Button key={href} variant="ghost" size="icon" asChild>
                  <Link href={href} aria-label={label} title={label}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              ))}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/beranda" aria-label="Beranda warga" title="Beranda warga">
                  <Home className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="icon" title="Logout">
                  <LogOut className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Logout</span>
                </Button>
              </form>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
