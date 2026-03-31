/**
 * Server-only credential + reset-token storage (local JSON file).
 * For production, replace with a real database.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR  = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "credentials.json");

type ResetEntry = { email: string; exp: number; browserKey: string };

type StoreShape = {
  passwords: Record<string, string>; // email lower → "salt:hash"
  resetTokens: Record<string, ResetEntry>;
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore(): StoreShape {
  try {
    if (!fs.existsSync(STORE_PATH)) return { passwords: {}, resetTokens: {} };
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const j = JSON.parse(raw) as StoreShape;
    return {
      passwords: j.passwords ?? {},
      resetTokens: j.resetTokens ?? {},
    };
  } catch {
    return { passwords: {}, resetTokens: {} };
  }
}

function writeStore(s: StoreShape) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2), "utf8");
}

function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(pw, salt, 100_000, 32, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPasswordHash(pw: string, stored: string): boolean {
  const i = stored.indexOf(":");
  if (i < 1) return false;
  const salt = stored.slice(0, i);
  const hash = stored.slice(i + 1);
  const h = crypto.pbkdf2Sync(pw, salt, 100_000, 32, "sha512").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(h, "hex"));
  } catch {
    return false;
  }
}

export function hasPasswordSet(email: string): boolean {
  const key = email.trim().toLowerCase();
  return !!readStore().passwords[key];
}

export function verifyCredentialLogin(email: string, password: string): boolean {
  const key = email.trim().toLowerCase();
  const stored = readStore().passwords[key];
  if (!stored) return false;
  return verifyPasswordHash(password, stored);
}

export function setPasswordForEmail(email: string, plainPassword: string) {
  const key = email.trim().toLowerCase();
  const s = readStore();
  s.passwords[key] = hashPassword(plainPassword);
  writeStore(s);
}

export function changePasswordForEmail(
  email: string,
  currentPassword: string,
  newPassword: string
): { ok: true } | { ok: false; error: string } {
  const key = email.trim().toLowerCase();
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  const s = readStore();
  const stored = s.passwords[key];
  if (!stored) {
    return {
      ok: false,
      error:
        "No password is on file for this account yet. Use Forgot password once to set a password, then try again.",
    };
  }
  if (!verifyPasswordHash(currentPassword, stored)) {
    return { ok: false, error: "Current password is incorrect." };
  }
  s.passwords[key] = hashPassword(newPassword);
  writeStore(s);
  return { ok: true };
}

export function createResetToken(email: string, browserKey: string): string {
  const key = email.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString("hex");
  const s = readStore();
  s.resetTokens[token] = {
    email: key,
    exp: Date.now() + 15 * 60 * 1000, // 15 min
    browserKey,
  };
  // prune expired
  for (const t of Object.keys(s.resetTokens)) {
    if (s.resetTokens[t].exp < Date.now()) delete s.resetTokens[t];
  }
  writeStore(s);
  return token;
}

export function consumeResetToken(token: string, browserKey: string): string | null {
  const s = readStore();
  const entry = s.resetTokens[token];
  if (!entry || entry.exp < Date.now()) return null;
  if (entry.browserKey !== browserKey) return null;
  delete s.resetTokens[token];
  writeStore(s);
  return entry.email;
}

export function peekResetToken(token: string, browserKey: string): boolean {
  const s = readStore();
  const entry = s.resetTokens[token];
  if (!entry || entry.exp < Date.now()) return false;
  return entry.browserKey === browserKey;
}
