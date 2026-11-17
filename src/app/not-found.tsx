import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <p className="text-4xl font-bold">404</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman atau data tidak ditemukan.
        </p>
      </div>
      <Button asChild>
        <Link href="/beranda">Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}
