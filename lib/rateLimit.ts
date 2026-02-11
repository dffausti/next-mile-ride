import { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "unknown";
}

/**
 * Simple in-memory rate limiter (per IP + key).
 * - limit: max requests within windowMs
 * - windowMs: time window in milliseconds (e.g., 60_000 = 1 minute)
 */
export function rateLimit(
  req: NextRequest,
  key: string,
  limit = 60,
  windowMs = 60_000
) {
  const ip = getClientIp(req);
  const bucketKey = `${key}:${ip}`;

  const now = Date.now();
  const existing = buckets.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }

  existing.count += 1;

  if (existing.count > limit) {
    const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
    return { ok: false as const, status: 429 as const, retryAfterSec };
  }

  return { ok: true as const };
}

