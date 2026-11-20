"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type AuthFormState = { error?: string } | null;

type PgError = { code?: string };

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const { full_name, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  let userId = "";
  let role: "citizen" | "admin" = "citizen";

  try {
    const { rows } = await pool.query(
      `INSERT INTO profiles (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'citizen')
       RETURNING id, role`,
      [email.toLowerCase().trim(), passwordHash, full_name.trim()]
    );
    userId = rows[0].id;
    role = rows[0].role;
  } catch (err) {
    const pgErr = err as PgError;
    if (pgErr.code === "23505") {
      return { error: "Email sudah terdaftar. Gunakan email lain." };
    }
    console.error("[register]", err);
    return { error: "Pendaftaran gagal. Coba lagi nanti." };
  }

  await createSession({ sub: userId, role, name: full_name.trim() });
  redirect(getSafeNextPath(formData.get("next")) ?? "/beranda");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  let row: { id: string; password_hash: string; full_name: string; role: "citizen" | "admin" } | undefined;

  try {
    const { rows } = await pool.query(
      "SELECT id, password_hash, full_name, role FROM profiles WHERE email = $1",
      [email]
    );
    row = rows[0];
  } catch (err) {
    console.error("[login]", err);
    return { error: "Gagal terhubung ke server. Coba lagi nanti." };
  }

  if (!row || !(await verifyPassword(parsed.data.password, row.password_hash))) {
    return { error: "Email atau password salah." };
  }

  await createSession({ sub: row.id, role: row.role, name: row.full_name });
  redirect(
    getSafeNextPath(formData.get("next")) ??
      (row.role === "admin" ? "/admin" : "/beranda")
  );
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
