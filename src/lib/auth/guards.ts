import "server-only";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getSession } from "./session";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: "citizen" | "admin";
  created_at: string;
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session) return null;

  const { rows } = await pool.query<UserProfile>(
    "SELECT id, email, full_name, role, created_at FROM profiles WHERE id = $1",
    [session.sub]
  );
  return rows[0] ?? null;
}

export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/beranda");
  return user;
}
