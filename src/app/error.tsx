"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Coba muat ulang halaman. Jika masalah berlanjut, ulangi lagi nanti.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Coba lagi
      </Button>
    </div>
  );
}
