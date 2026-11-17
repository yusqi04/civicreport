import type { ReactNode } from "react";
import { Megaphone } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Megaphone className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight">CivicReport</p>
          <p className="text-sm text-muted-foreground">
            Laporkan, pantau, tindak lanjuti.
          </p>
        </div>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
