/**
 * Optional shared demo / reviewer login — credentials live only in env (e.g. Vercel
 * or .env.local), never in source or the UI.
 */
import crypto from "crypto";
import { normalizeAccountEmail } from "@/lib/account-email";

function timingSafeEqualUtf8(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** Returns true if email + password match DEMO_AUTH_EMAIL and DEMO_AUTH_PASSWORD. */
export function matchesDemoEnvLogin(email: string, password: string): boolean {
  const configuredEmail = process.env.DEMO_AUTH_EMAIL?.trim();
  const configuredPassword = process.env.DEMO_AUTH_PASSWORD ?? "";
  if (!configuredEmail || !configuredPassword) return false;
  const want = normalizeAccountEmail(configuredEmail);
  const got = normalizeAccountEmail(email);
  if (!want || got !== want) return false;
  return timingSafeEqualUtf8(password, configuredPassword);
}
