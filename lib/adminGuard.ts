import { NextRequest } from "next/server";

function isLocalHost(host: string | null) {
  if (!host) return false;
  const h = host.split(":")[0];
  return h === "localhost" || h === "127.0.0.1";
}

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return null;
}

function parseAllowlist(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Admin policy:
 * - Default: ADMIN_LOCAL_ONLY=true → only allow localhost/127.0.0.1 (no key required)
 * - Remote mode (ADMIN_LOCAL_ONLY=false):
 *    - require ADMIN_REMOTE_ENABLED=true (explicit kill switch)
 *    - optionally require IP allowlist (ADMIN_IP_ALLOWLIST)
 *    - require ADMIN_API_KEY via header "x-admin-key"
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

  // Remote mode kill switch (prevents accidental exposure)
  const remoteEnabled = (process.env.ADMIN_REMOTE_ENABLED ?? "false").toLowerCase() === "true";
  if (!remoteEnabled) {
    return { ok: false as const, status: 403, error: "Remote admin is disabled." };
  }

  // Optional IP allowlist
  const allowlist = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST);
  if (allowlist.length > 0) {
    const ip = getClientIp(req);
    if (!ip || !allowlist.includes(ip)) {
      return { ok: false as const, status: 403, error: "IP not allowed." };
    }
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

