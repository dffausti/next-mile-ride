import { NextRequest } from "next/server";

function isLocalHost(host: string | null) {
  if (!host) return false;
  // host may include port: localhost:3000
  const h = host.split(":")[0];
  return h === "localhost" || h === "127.0.0.1";
}

/**
 * Admin policy:
 * - If ADMIN_LOCAL_ONLY=true (default), only allow localhost/127.0.0.1.
 * - If not local-only, require ADMIN_API_KEY via header "x-admin-key".
 */
export function assertAdminAccess(req: NextRequest) {
  const localOnly = (process.env.ADMIN_LOCAL_ONLY ?? "true").toLowerCase() === "true";

  const host = req.headers.get("host");
  if (localOnly) {
    if (!isLocalHost(host)) {
      return { ok: false as const, status: 403, error: "Admin is local-only." };
    }
    return { ok: true as const };
  }

  const expected = process.env.ADMIN_API_KEY?.trim();
  const provided = req.headers.get("x-admin-key")?.trim();

  if (!expected) {
    return { ok: false as const, status: 500, error: "ADMIN_API_KEY is not set." };
  }
  if (!provided || provided !== expected) {
    return { ok: false as const, status: 401, error: "Unauthorized." };
  }
  return { ok: true as const };
}

