"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  updateProfileAction,
  type ProfileFormState,
} from "@/app/(warga)/profil/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const schema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Nama minimal 2 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm({
  defaultName,
}: {
  defaultName: string;
}) {
  const [state, formAction, pending] = useActionState<
    ProfileFormState,
    FormData
  >(updateProfileAction, null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: defaultName },
  });

  const onSubmit = form.handleSubmit((data) => {
    const fd = new FormData();
    fd.set("full_name", data.full_name);
    formAction(fd);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

      <div className="space-y-2">
        <Label htmlFor="full_name">Nama Lengkap</Label>
        <Input id="full_name" {...form.register("full_name")} />
        {form.formState.errors.full_name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.full_name.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
        {pending ? "Menyimpan…" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
