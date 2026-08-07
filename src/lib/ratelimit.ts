import { requireAdminClient } from "./supabase/admin";

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  hits: number;
  remaining: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const admin = requireAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error || !data) {
      return { allowed: true, hits: 0, remaining: limit };
    }
    return {
      allowed: data.allowed ?? true,
      hits: data.hits ?? 0,
      remaining: data.remaining ?? 0,
    };
  } catch {
    // Fail open: never block a request because the limiter is misconfigured.
    return { allowed: true, hits: 0, remaining: limit };
  }
}
