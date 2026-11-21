"use client";

import { useEffect, useState, useActionState, useRef, startTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { createReportAction, type CreateReportState } from "@/app/(warga)/laporan/actions";
import { extractGpsFromFile, reverseGeocode } from "@/lib/exif";
import {
  ALLOWED_IMAGE_TYPES,
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
import { LocationPicker, type PickedLocation } from "@/components/location-picker";

type Category = { id: string; name: string };

export function ReportForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState<
    CreateReportState,
    FormData
  >(createReportAction, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setErrorPhoto] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportFormInput>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: "",
      category_id: "",
      custom_category: "",
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
    getValues,
    formState: { errors },
  } = form;
  const categoryId = useWatch({ control: form.control, name: "category_id" });
  const locationValue = useWatch({ control: form.control, name: "location" });
  const latitudeValue = useWatch({ control: form.control, name: "latitude" });
  const longitudeValue = useWatch({ control: form.control, name: "longitude" });
  const photoRef = register("photo");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isOtherCategory = selectedCategory?.name?.trim().toLowerCase() === "lainnya";

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onSubmit = handleSubmit((data) => {
    const fileList = data.photo as FileList | undefined;
    const file = fileList && fileList.length > 0 ? fileList[0] : null;
    if (!file) {
      setErrorPhoto("Foto bukti wajib diunggah");
      return;
    }
    if (!file.type.startsWith("image/") || !ALLOWED_IMAGE_TYPES[file.type]) {
      setErrorPhoto("Foto harus berformat JPG, PNG, WebP, atau GIF");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrorPhoto("Ukuran foto maksimal 2 MB");
      return;
    }
    setErrorPhoto(null);

    if (isOtherCategory && (!data.custom_category || data.custom_category.trim().length < 2)) {
      form.setError("custom_category", {
        type: "manual",
        message: "Sebutkan kategori masalah untuk pilihan Lainnya",
      });
      return;
    }

    const fd = new FormData();
    fd.set("title", data.title);
    fd.set("category_id", data.category_id);
    if (isOtherCategory && data.custom_category) {
      fd.set("custom_category", data.custom_category.trim());
    }
    fd.set("description", data.description);
    fd.set("location", data.location ?? "");
    fd.set("latitude", data.latitude ?? "");
    fd.set("longitude", data.longitude ?? "");
    if (file) fd.set("photo", file);

    startTransition(() => {
      formAction(fd);
    });
  });

  const handleLocationChange = (loc: PickedLocation) => {
    setValue("location", loc.location, { shouldValidate: true });
    setValue("latitude", String(loc.latitude), { shouldValidate: true });
    setValue("longitude", String(loc.longitude), { shouldValidate: true });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    photoRef.onChange(e);
    const file = e.target.files?.[0];
    setErrorPhoto(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    setGpsStatus(null);

    if (!file) return;

    setGpsLoading(true);
    try {
      const gps = await extractGpsFromFile(file);
      if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
        setValue("latitude", String(gps.latitude), { shouldValidate: true });
        setValue("longitude", String(gps.longitude), { shouldValidate: true });
        setGpsStatus(
          `GPS terdeteksi dari foto: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`
        );

        const currentLocation = getValues("location")?.trim();
        if (!currentLocation) {
          try {
            const address = await reverseGeocode(gps.latitude, gps.longitude);
            if (address) {
              setValue("location", address, { shouldValidate: true });
              setGpsStatus((s) => (s ? `${s} → ${address}` : address));
            }
          } catch {
            // Abaikan error geocode
          }
        }
      } else {
        // Foto tidak punya GPS - tidak apa-apa, GPS tidak wajib
        setGpsStatus(null);
      }
    } catch {
      // Abaikan error pembacaan EXIF
      setGpsStatus(null);
    } finally {
      setGpsLoading(false);
    }
  };

  const clearFile = () => {
    if (fileRef.current) fileRef.current.value = "";
    photoRef.onChange({
      target: { name: photoRef.name, value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setGpsStatus(null);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 md:grid-cols-2">
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
            onValueChange={(value) => {
              setValue("category_id", value, { shouldValidate: true });
            }}
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
      </div>

      {isOtherCategory && (
        <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in-50">
          <Label htmlFor="custom_category" className="font-semibold text-primary">
            Sebutkan Kategori Masalah <span className="text-destructive">*</span>
          </Label>
          <Input
            id="custom_category"
            placeholder="Contoh: Pohon tumbang, Hewan liar, Sarang tawon, Polusi suara..."
            {...register("custom_category")}
            autoFocus
          />
          {errors.custom_category && (
            <p className="text-sm text-destructive">{errors.custom_category.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Ketik jenis atau kategori masalah yang Anda temui.
          </p>
        </div>
      )}

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
        <div className="flex items-center justify-between">
          <Label htmlFor="location">Lokasi Masalah</Label>
          <span className="text-xs text-muted-foreground font-normal">GPS opsional (tidak wajib)</span>
        </div>
        <LocationPicker
          value={locationValue ?? ""}
          latitude={latitudeValue ?? ""}
          longitude={longitudeValue ?? ""}
          onChange={handleLocationChange}
          disabled={pending}
        />
        {gpsStatus && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>{gpsStatus}</span>
          </p>
        )}
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Foto Bukti (wajib, maks. 2 MB)</Label>
        <div className="flex items-center gap-3">
          <Input
            id="photo"
            name={photoRef.name}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            aria-required="true"
            ref={(el) => {
              photoRef.ref(el);
              fileRef.current = el;
            }}
            onChange={handleFileChange}
            className="max-w-full sm:max-w-md"
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
        {gpsLoading && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Membaca data foto…
          </p>
        )}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Pratinjau foto"
            className="aspect-square h-36 w-36 rounded-xl border object-cover sm:h-44 sm:w-44"
          />
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-2 h-4 w-4" aria-hidden />
        )}
        {pending ? "Mengirim Laporan…" : "Kirim Laporan"}
      </Button>
    </form>
  );
}
