import { z } from "zod";

const coordinate = (max: number, label: string) =>
  z
    .string()
    .optional()
    .refine(
      (v) =>
        !v ||
        (Number.isFinite(Number(v)) && Math.abs(Number(v)) <= max),
      { message: `${label} tidak valid (maksimal ${max})` }
    );

export const reportFormSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Judul minimal 5 karakter" })
    .max(120, { message: "Judul maksimal 120 karakter" }),
  category_id: z.uuid({ message: "Pilih kategori" }),
  description: z
    .string()
    .min(10, { message: "Deskripsi minimal 10 karakter" })
    .max(2000, { message: "Deskripsi maksimal 2000 karakter" }),
  location: z
    .string()
    .min(3, { message: "Lokasi minimal 3 karakter" })
    .max(300, { message: "Lokasi maksimal 300 karakter" }),
  latitude: coordinate(90, "Latitude"),
  longitude: coordinate(180, "Longitude"),
  photo: z.unknown().optional(),
});

export type ReportFormInput = z.infer<typeof reportFormSchema>;

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
