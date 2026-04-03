/**
 * Single canonical identity for “same mailbox” across Google, Microsoft, and
 * email/password — avoids false cart wipes when providers differ only by case.
 */
export function normalizeAccountEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

type OAuthProfile = Record<string, unknown> | null | undefined;

type OAuthUserLike = {
  email?: string | null;
  preferred_username?: string | null;
  upn?: string | null;
};

/**
 * Google usually fills user.email. Azure AD often sends preferred_username / upn
 * on the user or ID token — if we only read user.email, allowed-domain checks fail.
 */
export function resolveOAuthSignInEmail(
  user: OAuthUserLike,
  profile?: OAuthProfile
): string {
  const fromUser =
    normalizeAccountEmail(user?.email ?? "") ||
    normalizeAccountEmail(user?.preferred_username ?? "") ||
    normalizeAccountEmail(user?.upn ?? "");
  if (fromUser) return fromUser;

  const p = profile && typeof profile === "object" ? profile : null;
  const pick = (k: string) => {
    const v = p?.[k];
    return typeof v === "string" ? normalizeAccountEmail(v) : "";
  };
  return (
    pick("email") ||
    pick("preferred_username") ||
    pick("upn") ||
    pick("unique_name") ||
    pick("mail") ||
    ""
  );
}
