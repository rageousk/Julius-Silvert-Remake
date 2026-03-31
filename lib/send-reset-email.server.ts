/**
 * Optional password-reset email via Resend (no extra npm package — REST API).
 * Set RESEND_API_KEY and RESEND_FROM in .env.local to deliver links to the inbox.
 */

export async function trySendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM ?? "Julius Silvert <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your Julius Silvert password",
        html: `
          <p>You requested a password reset for your Julius Silvert account.</p>
          <p><a href="${resetUrl}">Choose a new password</a></p>
          <p style="color:#666;font-size:14px">This link expires in about 15 minutes. For security it only works in the same browser where you requested the reset.</p>
        `.trim(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
