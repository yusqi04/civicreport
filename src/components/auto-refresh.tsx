"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refresh data server secara berkala agar status/riwayat tampak realtime. */
export function AutoRefresh({ intervalMs = 12000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
