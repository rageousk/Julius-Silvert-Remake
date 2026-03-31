import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeAccountEmail } from "@/lib/account-email";
import { changePasswordForEmail } from "@/lib/credential-store.server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { email?: string | null; provider?: string } | undefined;
  const email = normalizeAccountEmail(user?.email ?? "");
  const provider = user?.provider;

  if (!session || !email) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  if (provider === "google" || provider === "azure-ad") {
    return NextResponse.json(
      { error: "Password is managed by your sign-in provider (Google or Microsoft)." },
      { status: 400 }
    );
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }

  const result = changePasswordForEmail(email, currentPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
