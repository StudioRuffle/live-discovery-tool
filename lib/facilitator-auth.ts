import "server-only";
import { cookies } from "next/headers";

export const FACILITATOR_COOKIE = "facilitator_auth";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12h - long enough to cover a workshop day

// Signed-cookie session, not a real auth system: the PIN itself is the only
// secret, and the cookie is just an HMAC over it plus an expiry so we don't
// have to re-prompt for the PIN on every page load. Uses Web Crypto (not
// Node's `crypto` module) so this also works unmodified if middleware runs
// on the edge runtime.
function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

function requirePin(): string {
  const pin = process.env.FACILITATOR_PIN;
  if (!pin) throw new Error("FACILITATOR_PIN is not set");
  return pin;
}

export async function createFacilitatorSessionValue(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const mac = await hmac(requirePin(), String(expiresAt));
  return `${expiresAt}.${mac}`;
}

export async function verifyFacilitatorSessionValue(
  value: string | undefined
): Promise<boolean> {
  if (!value) return false;
  const [expiresAtStr, mac] = value.split(".");
  const expiresAt = Number(expiresAtStr);
  if (!expiresAtStr || !mac || Number.isNaN(expiresAt)) return false;
  if (Date.now() > expiresAt) return false;

  const expectedMac = await hmac(requirePin(), expiresAtStr);
  return constantTimeEqual(mac, expectedMac);
}

export function verifyPin(candidate: string): boolean {
  return constantTimeEqual(candidate, requirePin());
}

export async function isFacilitatorAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyFacilitatorSessionValue(cookieStore.get(FACILITATOR_COOKIE)?.value);
}

export const facilitatorCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
