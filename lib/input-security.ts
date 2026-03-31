/**
 * Client-safe input hardening: strip control chars, angle-bracket tags,
 * and restrict character sets per field type. Complements React’s default
 * text escaping (no dangerouslySetInnerHTML in app code).
 *
 * SQL injection: N/A for this JSON mock — queries are in-memory filters.
 * These helpers still normalize input so a future DB layer receives clean data.
 */

/** Remove NUL / C0 controls except tab/newline where needed */
const CTRL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Strip simple HTML-like fragments from typed text */
function stripTagLike(s: string): string {
  return s.replace(/<[^>]{0,500}?>/g, "");
}

const MAX_CATALOG_SEARCH = 128;
/** Letters, numbers, spaces, common punctuation in product / SKU text */
const CATALOG_SEARCH_ALLOWED = /[^a-zA-Z0-9\s\-'&.,/%()+]/g;

const MAX_QUICK_ADD = 80;
/** SKU / name lookup: alnum, space, hyphen (no shell/meta chars) */
const QUICK_ADD_ALLOWED = /[^a-zA-Z0-9\s\-]/g;

/**
 * Live typing in catalog search (header, etc.) — not trimmed so cursor behaves.
 */
export function sanitizeCatalogSearchInput(raw: string): string {
  let s = raw.replace(CTRL, "");
  s = stripTagLike(s);
  s = s.replace(CATALOG_SEARCH_ALLOWED, "");
  return s.slice(0, MAX_CATALOG_SEARCH);
}

/** Final query for API / URL (trimmed) */
export function sanitizeCatalogSearchQuery(raw: string): string {
  return sanitizeCatalogSearchInput(raw).trim().slice(0, MAX_CATALOG_SEARCH);
}

export function sanitizeQuickAddLookup(raw: string): string {
  let s = raw.replace(CTRL, "");
  s = stripTagLike(s);
  s = s.replace(QUICK_ADD_ALLOWED, "");
  return s.slice(0, MAX_QUICK_ADD);
}

/** US ZIP: digits only, max 5 */
export function zipDigitsOnly(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 5);
}

export function isValidUsZip5(digits: string): boolean {
  return /^\d{5}$/.test(digits);
}

/** Generic name / address line: no angle brackets, limit length */
export function sanitizePlainText(raw: string, maxLen: number): string {
  return stripTagLike(raw.replace(CTRL, "")).slice(0, maxLen).trim();
}

/** Email local validation (domain rules live in auth) */
export function sanitizeEmailInput(raw: string): string {
  return raw.replace(CTRL, "").replace(/[\s<>"']/g, "").slice(0, 254).trim().toLowerCase();
}
