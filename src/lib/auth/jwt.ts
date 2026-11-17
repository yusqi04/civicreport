import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  sub: string;
  role: "citizen" | "admin";
  name: string;
};

const SESSION_COOKIE = "civic_session";
const SESSION_DURATION = "7d";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET belum diisi di .env.local");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    const role = payload.role;
    if (role !== "citizen" && role !== "admin") return null;
    return {
      sub: payload.sub,
      role,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
