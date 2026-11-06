import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/jwt";

/* Solo mejora la experiencia (redirección limpia). La autorización real está en
   cada Route Handler y en src/server/dal.ts, nunca aquí. */
export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/premios/:path*", "/agendar/:path*", "/perfil/:path*", "/admin/:path*"],
};
