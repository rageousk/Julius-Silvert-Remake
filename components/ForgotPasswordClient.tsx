"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    fetch("/api/auth/reset-browser", { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email.trim()) {
      setErr("Enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const boot = await fetch("/api/auth/reset-browser", {
        method: "POST",
        credentials: "include",
      });
      if (!boot.ok) {
        setErr("Could not start reset session. Refresh the page and try again.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      setDone(true);
      setEmailSent(data.emailSent === true);
      if (data.magicLink) setMagicLink(data.magicLink);
      else setMagicLink("");
    } catch {
      setErr("Network error. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-split login-split--single" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="login-form-panel login-form-panel--solo" style={{ borderRadius: 12 }}>
          <div className="login-form-wrap">
            <Link href="/login" className="login-back-link">← Back to Sign In</Link>
            <h2 className="login-form-title">Reset password</h2>
            <p className="login-form-sub">
              Enter the email you use for manual sign-in. We&apos;ll send you a secure reset link.
              The link only works in <strong>this same browser</strong> where you requested the reset.
            </p>

            {!done ? (
              <form className="login-form" onSubmit={submit} noValidate>
                <div className="login-field">
                  <label className="login-label">Email address</label>
                  <input
                    className="login-input"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your registered email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {err && <p className="login-err-msg">{err}</p>}
                <button className="login-cta-btn" type="submit" disabled={loading}>
                  {loading ? <span className="login-spinner" /> : "Send reset link"}
                </button>
              </form>
            ) : (
              <div className="login-success login-success--reset">
                {emailSent ? (
                  <>
                    <p className="login-success-lead">
                      If that address is allowed for this site, check your inbox for a link to choose a new password.
                    </p>
                    <p className="login-form-sub login-success-follow">
                      The link expires in about 15 minutes and only works in <strong>this same browser</strong>.
                    </p>
                  </>
                ) : magicLink ? (
                  <>
                    <p className="login-success-lead">
                      Email is not configured on this server (add <code className="login-code-inline">RESEND_API_KEY</code> to send mail). For local testing, use the link below.
                    </p>
                    <div className="login-demo-reset-box">
                      <p className="login-demo-reset-label">Your reset link</p>
                      <a href={magicLink} className="login-demo-reset-link">{magicLink}</a>
                      <p className="login-demo-reset-hint">
                        Open it in this tab, set a password (8+ characters), then sign in at{" "}
                        <Link href="/login">Sign in</Link>.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="login-success-lead">
                    If that email is eligible for this site, reset instructions have been prepared. If nothing arrives, confirm the address or contact your administrator.
                  </p>
                )}
                <Link href="/login" className="login-cta-btn login-cta-btn--after-success">
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
