import "server-only";
import { headers } from "next/headers";

// Derives the site's own origin from the incoming request instead of a
// hardcoded env var, so join links are correct in local dev, Netlify deploy
// previews, and production without separate configuration for each.
export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
