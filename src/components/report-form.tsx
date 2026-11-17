"use client";

import { useEffect, useState, useActionState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";
import { createReportAction, type CreateReportState } from "@/app/(warga)/laporan/actions";
import {
  MAX_PHOTO_BYTES,
  reportFormSchema,
  type ReportFormInput,
} from "@/lib/validations/report";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Category = { id: string; name: string };

export function ReportForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState<
    CreateReportState,
    FormData
  >(createReportAction, null);
  const [showCoords, setShowCoords] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setErrorPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormInput>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: "",
      category_id: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;
  const categoryId = useWatch({ control: form.control, name: "category_id" });
  const photoRef = register("photo");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onSubmit = handleSubmit((data) => {
    const fileList = data.photo as FileList | undefined;
    const file = fileList && fileList.length > 0 ? fileList[0] : null;
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrorPhoto("Foto harus berupa gambar");
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setErrorPhoto("Ukuran foto maksimal 2 MB");
        return;
      }
    }
    setErrorPhoto(null);

    const fd = new FormData();
    fd.set("title", data.title);
    fd.set("category_id", data.category_id);
    fd.set("description", data.description);
    fd.set("location", data.location);
    fd.set("latitude", data.latitude ?? "");
    fd.set("longitude", data.longitude ?? "");
    if (file) fd.set("photo", file);
    formAction(fd);
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    photoRef.onChange(e);
    const file = e.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearFile = () => {
    if (fileRef.current) fileRef.current.value = "";
    photoRef.onChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Judul Laporan</Label>
        <Input
          id="title"
          placeholder="Contoh: Jalan berlubang di depan pasar"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Kategori</Label>
        <Select
          value={categoryId || undefined}
          onValueChange={(value) => setValue("category_id", value, { shouldValidate: true })}
        >
          <SelectTrigger id="category_id" className="w-full">
            <SelectValue placeholder="Pilih kategori masalah" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-sm text-destructive">{errors.category_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi Masalah</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="Jelaskan kondisi masalah secara rinci…"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi (alamat/teks)</Label>
        <Input
          id="location"
          placeholder="Contoh: Jl. Merdeka No. 10, Kel. Sukamaju"
          {...register("location")}
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="px-0 text-muted-foreground"
          onClick={() => setShowCoords((v) => !v)}
        >
          {showCoords ? "− Sembunyikan koordinat" : "+ Tambahkan koordinat (opsional)"}
        </Button>
        {showCoords && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                inputMode="decimal"
                placeholder="-6.2"
                {...register("latitude")}
              />
              {errors.latitude && (
                <p className="text-sm text-destructive">{errors.latitude.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                inputMode="decimal"
                placeholder="106.8"
                {...register("longitude")}
              />
              {errors.longitude && (
                <p className="text-sm text-destructive">{errors.longitude.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Foto Bukti (opsional, maks. 2 MB)</Label>
        <div className="flex items-center gap-3">
          <Input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            ref={(el) => {
              photoRef.ref(el);
              fileRef.current = el;
            }}
            onChange={handleFileChange}
            className="max-w-sm"
          />
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearFile}
              title="Hapus foto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {(photoError || errors.photo) && (
          <p className="text-sm text-destructive">
            {photoError ?? "Foto tidak valid"}
          </p>
        )}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Pratinjau foto"
            className="h-32 w-32 rounded-lg border object-cover"
          />
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-2 h-4 w-4" aria-hidden />
        )}
        {pending ? "Mengirim…" : "Kirim Laporan"}
      </Button>
    </form>
  );
}
