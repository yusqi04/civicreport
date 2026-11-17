import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";

const WARGA_PATHS = ["/beranda", "/laporan"];
const ADMIN_PATHS = ["/admin"];
const AUTH_PATHS = ["/login", "/register"];

function isSamePath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(base + "/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value
  );

  const isWarga = WARGA_PATHS.some((p) => isSamePath(pathname, p));
  const isAdmin = ADMIN_PATHS.some((p) => isSamePath(pathname, p));
  const isAuth = AUTH_PATHS.some((p) => isSamePath(pathname, p));
  const isProtected = isWarga || isAdmin || pathname === "/profil";

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (isProtected && !session) {
    return redirect("/login");
  }

  if (session && isAuth) {
    return redirect(session.role === "admin" ? "/admin" : "/beranda");
  }

  if (session && isAdmin && session.role !== "admin") {
    return redirect("/beranda");
  }

  // Area warga = ruang kerja warga; admin diarahkan ke panel admin
  // (kecuali /profil yang boleh dibuka kedua role).
  if (session && session.role === "admin" && isWarga) {
    return redirect("/admin");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
