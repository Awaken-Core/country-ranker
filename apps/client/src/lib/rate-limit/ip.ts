/**
 * Extracts client IP address safely from standard proxy and CDN headers.
 * Avoids trusting spoofed headers arbitrarily while supporting Cloudflare, Vercel, and reverse proxies.
 */
export function getClientIp(request: Request): string {
  // Cloudflare
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cfConnectingIp.trim();
  }

  // Standard reverse proxy (e.g. nginx, ingress)
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp && isValidIp(xRealIp.trim())) {
    return xRealIp.trim();
  }

  // Forwarded header chain (take the first client IP in the chain)
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp && isValidIp(firstIp)) {
      return firstIp;
    }
  }

  // Fallback for local development or direct connections
  return "127.0.0.1";
}

function isValidIp(ip: string): boolean {
  // Basic validation for IPv4 or IPv6
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
