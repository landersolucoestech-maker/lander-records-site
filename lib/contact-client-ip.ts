type HeaderReader = { get(name: string): string | null };

/**
 * Resolves the client address used for contact rate limiting.
 *
 * The first X-Forwarded-For entry is supplied by the caller and cannot be trusted:
 * the reference nginx config appends ($proxy_add_x_forwarded_for), so a client can
 * prepend arbitrary values and rotate its rate-limit identity. Prefer X-Real-IP (set
 * by the trusted proxy from $remote_addr), then the last X-Forwarded-For hop, which
 * is the one written by the nearest proxy.
 */
export function resolveContactClientIp(headers: HeaderReader) {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const hops = (headers.get("x-forwarded-for") || "").split(",").map((hop) => hop.trim()).filter(Boolean);
  return hops.at(-1) || "unknown";
}
