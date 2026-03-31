/**
 * US phone: digits only in state, display as (XXX) XXX-XXXX.
 * User cannot type letters or symbols — only 0–9, max 10 digits.
 */

export function digitsOnly(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

/** Format 10 (or fewer) digits for display */
export function formatUSPhoneDisplay(digits: string): string {
  const d = digitsOnly(digits);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isCompleteUSPhone(digitsOrFormatted: string): boolean {
  return digitsOnly(digitsOrFormatted).length === 10;
}

/** For tel: links */
export function phoneToTelHref(digitsOrFormatted: string): string {
  const d = digitsOnly(digitsOrFormatted);
  return d.length === 10 ? `tel:+1${d}` : "#";
}
