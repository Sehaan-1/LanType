import { networkInterfaces } from "os";

/** Best-effort LAN IP discovery for QR / share URL. */
export function getLanIp(): string {
  const nets = networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(nets)) {
    const list = nets[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family !== "IPv4" || net.internal) continue;
      // Prefer common private ranges
      if (
        net.address.startsWith("192.168.") ||
        net.address.startsWith("10.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(net.address)
      ) {
        candidates.push(net.address);
      }
    }
  }

  if (candidates.length > 0) return candidates[0];

  // Fallback: any non-internal IPv4
  for (const name of Object.keys(nets)) {
    const list = nets[name];
    if (!list) continue;
    for (const net of list) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "127.0.0.1";
}

export function getPublicBaseUrl(request?: Request): string {
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto =
      request.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");
    if (host) return `${proto}://${host}`;
  }

  const port = process.env.PORT || "3000";
  const ip = getLanIp();
  return `http://${ip}:${port}`;
}
