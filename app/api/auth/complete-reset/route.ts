import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeResetToken, setPasswordForEmail } from "@/lib/credential-store.server";

const COOKIE = "julius_reset_browser";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const browserKey = jar.get(COOKIE)?.value ?? "";
  if (!browserKey) {
    return NextResponse.json(
      { error: "Use the same browser where you requested the reset." },
      { status: 400 }
    );
  }

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token ?? "";
  const password = body.password ?? "";
  if (!token || password.length < 8) {
    return NextResponse.json(
      { error: "Invalid token or password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const email = consumeResetToken(token, browserKey);
  if (!email) {
    return NextResponse.json(
      {
        error:
          "This link is invalid or expired, or was opened in a different browser. Request a new reset from the same device.",
      },
      { status: 400 }
    );
  }

  setPasswordForEmail(email, password);
  return NextResponse.json({ ok: true });
}
