import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isDomainAllowed } from "@/lib/auth-domains";
import { sanitizeEmailInput } from "@/lib/input-security";
import { createResetToken } from "@/lib/credential-store.server";
import { trySendPasswordResetEmail } from "@/lib/send-reset-email.server";

const COOKIE = "julius_reset_browser";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const browserKey = jar.get(COOKIE)?.value;
  if (!browserKey) {
    return NextResponse.json(
      { error: "Session not initialized. Please refresh the page and try again." },
      { status: 400 }
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = sanitizeEmailInput(body.email ?? "");
  if (!email || !isDomainAllowed(email)) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      message:
        "If an account exists for that email, password reset instructions have been prepared.",
    });
  }

  let token: string;
  try {
    token = createResetToken(email, browserKey);
  } catch (err) {
    console.error("[forgot-password] createResetToken failed:", err);
    return NextResponse.json(
      {
        error:
          "Password reset storage is unavailable on this deployment. Use Google or Microsoft sign-in, or contact support.",
      },
      { status: 503 }
    );
  }
  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const magicLink = `${origin}/reset-password?token=${token}`;

  const emailSent = await trySendPasswordResetEmail(email, magicLink);

  if (emailSent) {
    return NextResponse.json({
      ok: true,
      emailSent: true,
      message: "Check your inbox for a link to reset your password.",
    });
  }

  return NextResponse.json({
    ok: true,
    emailSent: false,
    message:
      "Reset link is ready. This server is not configured to send email, so use the link below (local testing only).",
    magicLink,
  });
}
