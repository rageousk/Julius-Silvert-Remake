/**
 * Single canonical identity for “same mailbox” across Google, Microsoft, and
 * email/password — avoids false cart wipes when providers differ only by case.
 */
export function normalizeAccountEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}
