"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  changeStatusAction,
  type ChangeStatusState,
} from "@/app/(admin)/admin/laporan/actions";
import { feedStatusMeta } from "@/lib/feed-status";
import { STATUS_LABELS } from "@/lib/status";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const TRANSITIONS: Record<string, string[]> = {
  submitted: ["verified", "rejected"],
  verified: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
};

export function StatusChangeForm({
  reportId,
  currentStatus,
}: {
  reportId: string;
  currentStatus: string;
}) {
  const [state, formAction, pending] = useActionState<
    ChangeStatusState,
    FormData
  >(changeStatusAction, null);
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const router = useRouter();

  const options = TRANSITIONS[currentStatus] ?? [];
  const currentMeta = feedStatusMeta(currentStatus);
  const currentLabel = STATUS_LABELS[currentStatus] ?? currentStatus;

  if (state?.success && open) {
    setOpen(false);
    setNewStatus("");
    setNote("");
  }

  const successMessage = state?.success ?? null;
  useEffect(() => {
    if (successMessage) router.refresh();
  }, [successMessage, router]);

  if (options.length === 0) {
    return (
      <div className="space-y-3">
        <div
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${currentMeta.className}`}
        >
          {currentLabel}
        </div>
        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          Status akhir — tidak ada tindakan lanjutan.
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!newStatus) return;
    const fd = new FormData();
    fd.set("report_id", reportId);
    fd.set("new_status", newStatus);
    fd.set("note", note);
    formAction(fd);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status saat ini:</span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${currentMeta.className}`}
        >
          {currentLabel}
        </span>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.success && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900">Berhasil</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new_status">Ubah Status Menjadi</Label>
          <Select value={newStatus || undefined} onValueChange={setNewStatus}>
            <SelectTrigger id="new_status" className="w-full">
              <SelectValue placeholder="Pilih status baru" />
            </SelectTrigger>
            <SelectContent>
              {options.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">Catatan Penanganan (opsional)</Label>
          <Textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Tim kebersihan dijadwalkan turun hari Rabu."
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            Wajib diisi jika memilih &quot;Ditolak&quot;.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" disabled={!newStatus}>
              Ubah Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Ubah Status</DialogTitle>
              <DialogDescription>
                Ubah status dari &quot;
                {currentLabel}
                &quot; menjadi &quot;
                {newStatus ? STATUS_LABELS[newStatus] ?? newStatus : ""}
                &quot;? Perubahan ini tercatat permanen di riwayat.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                )}
                {pending ? "Menyimpan…" : "Ya, Ubah Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </div>
  );
}
