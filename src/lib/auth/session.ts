import { cookies } from "next/headers";
import { SESSION_COOKIE, signSession, verifySession, type SessionPayload } from "./jwt";

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
