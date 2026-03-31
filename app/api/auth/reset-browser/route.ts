import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE = "julius_reset_browser";

/** Ensures an HttpOnly browser key exists for password-reset binding */
export async function POST() {
  const jar = await cookies();
  let v = jar.get(COOKIE)?.value;
  const res = NextResponse.json({ ok: true });
  if (!v) {
    v = randomUUID();
    res.cookies.set(COOKIE, v, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return res;
}
