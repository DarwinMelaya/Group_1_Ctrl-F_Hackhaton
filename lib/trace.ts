// Public QR trace helpers. Shared by the dashboard (to print QR codes) and the mobile app.

/** Tokens are 12 URL-safe characters (see new_qr_token() in SQL). Accept a little range for future formats. */
export function isValidTraceToken(token: string) {
  return /^[A-Za-z0-9_-]{8,32}$/.test(token);
}

/**
 * Public URL a QR code points to. Set NEXT_PUBLIC_SITE_URL to the deployed address (or your laptop's LAN
 * address during a demo, e.g. http://192.168.1.20:3001) so phones can open it; "localhost" only works on this computer.
 */
export function traceUrl(token: string, origin?: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin || "").replace(/\/$/, "");
  return `${base}/trace/${encodeURIComponent(token)}`;
}
