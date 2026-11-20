"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  PlusCircle,
  ClipboardList,
  User,
  ShieldCheck,
  LogIn,
} from "lucide-react";

export function WargaBottomNav({
  role,
}: {
  role: "citizen" | "admin" | null;
}) {
  const pathname = usePathname();
  const items = [
    { href: "/beranda", label: "Beranda", icon: Home },
    { href: "/laporan/baru", label: "Kirim", icon: PlusCircle },
    ...(role
      ? [
          { href: "/laporan", label: "Riwayat", icon: ClipboardList },
          { href: "/profil", label: "Profil", icon: User },
        ]
      : [{ href: "/login", label: "Masuk", icon: LogIn }]),
    ...(role === "admin"
      ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/beranda" || href === "/laporan"
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
