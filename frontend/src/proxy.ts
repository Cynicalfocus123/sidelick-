import { NextResponse, type NextRequest } from "next/server";

// Signed in at "/" -> /home. Signed out at /home -> "/" (F121, owner 2026-10-28).
// "Signed in" = the sl_session cookie AND the API accepts it (GET /api/auth/me), so an old cookie can not cause a redirect loop.
// If the API can not be reached, nobody is moved (the page itself still works or shows its own error).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const SESSION_COOKIE = "sl_session";

async function signedIn(request: NextRequest): Promise<boolean | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) return true;
    return res.status === 401 ? false : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const state = await signedIn(request);
  const path = request.nextUrl.pathname;
  if (path === "/" && state === true) return NextResponse.redirect(new URL("/home", request.url));
  if (path === "/home" && state === false) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home"],
};
