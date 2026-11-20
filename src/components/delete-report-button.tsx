"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import {
  deleteReportAction,
  type DeleteReportState,
} from "@/app/(warga)/laporan/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function DeleteReportButton({
  reportId,
  className,
  compact = false,
}: {
  reportId: string;
  className?: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    DeleteReportState,
    FormData
  >(deleteReportAction, null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const success = state?.success;

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        className={cn("text-destructive hover:text-destructive", className)}
        onClick={() => setOpen(true)}
        title="Hapus laporan"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {!compact && <span className="ml-1">Hapus</span>}
        <span className="sr-only">Hapus laporan</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus laporan ini?</DialogTitle>
            <DialogDescription>
              Laporan beserta foto dan riwayat status akan dihapus permanen.
              Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <form ref={formRef} action={formAction}>
            <input type="hidden" name="report_id" value={reportId} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                )}
                {pending ? "Menghapus…" : "Ya, Hapus"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
