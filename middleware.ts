import { NextRequest, NextResponse } from "next/server";

function isLocalHost(host: string | null) {
  if (!host) return false;
  const h = host.split(":")[0]; // remove :3000
  return h === "localhost" || h === "127.0.0.1";
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Only guard /admin routes
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const localOnly = (process.env.ADMIN_LOCAL_ONLY ?? "true").toLowerCase() === "true";

  if (localOnly) {
    const host = req.headers.get("host");
    if (!isLocalHost(host)) {
      return new NextResponse("Admin is local-only.", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

