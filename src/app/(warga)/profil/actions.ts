"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/guards";
import { pool } from "@/lib/db";
import { z } from "zod";

export type ProfileFormState = { error?: string; success?: string } | null;

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, { message: "Nama minimal 2 karakter" })
    .max(100, { message: "Nama maksimal 100 karakter" }),
});

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };

  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  try {
    await pool.query("UPDATE profiles SET full_name = $1 WHERE id = $2", [
      parsed.data.full_name.trim(),
      user.id,
    ]);
  } catch (err) {
    console.error("[updateProfile]", err);
    return { error: "Gagal memperbarui profil. Coba lagi." };
  }

  revalidatePath("/profil");
  revalidatePath("/beranda");
  return { success: "Profil berhasil diperbarui." };
}
