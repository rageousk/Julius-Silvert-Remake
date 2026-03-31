import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { peekResetToken } from "@/lib/credential-store.server";

const COOKIE = "julius_reset_browser";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
  const jar = await cookies();
  const browserKey = jar.get(COOKIE)?.value ?? "";
  const valid = peekResetToken(token, browserKey);
  return NextResponse.json({ valid });
}
