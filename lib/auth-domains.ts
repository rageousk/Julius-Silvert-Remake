/** Domains allowed for SSO and email/password sign-in */
export const ALLOWED_EMAIL_DOMAINS = [
  "rowan.edu",
  "students.rowan.edu",
  "juliussilvert.com",
];

export function isDomainAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
}
