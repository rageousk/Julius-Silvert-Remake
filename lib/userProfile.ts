/**
 * User profile data stored in localStorage, keyed by email.
 * This persists custom name/phone even when signing in via Google/Microsoft
 * (whose OAuth tokens always return the provider's own name, not a custom one).
 */

export type UserProfile = {
  displayName: string;
  phone: string;
  provider?: string; // "google" | "azure-ad" | "credentials"
};

const key = (email: string) => `julius-profile-${email.toLowerCase()}`;

export function getProfile(email: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(email));
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(email: string, profile: Partial<UserProfile>) {
  if (typeof window === "undefined") return;
  try {
    const existing = getProfile(email) ?? { displayName: "", phone: "" };
    localStorage.setItem(key(email), JSON.stringify({ ...existing, ...profile }));
  } catch {}
}

export function getDisplayName(email: string, fallback: string): string {
  const profile = getProfile(email);
  return profile?.displayName?.trim() || fallback;
}
