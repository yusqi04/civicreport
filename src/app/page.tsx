import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Megaphone className="h-7 w-7" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          CivicReport
        </h1>
        <p className="max-w-md text-muted-foreground">
          Laporkan masalah lingkungan di sekitar Anda dan pantau penanganannya
          secara transparan.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/register">Daftar Sekarang</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </div>
  );
}
