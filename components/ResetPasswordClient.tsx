"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setReady(false);
      return;
    }
    fetch(`/api/auth/verify-reset?token=${encodeURIComponent(token)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setReady(!!d.valid);
        setChecking(false);
      })
      .catch(() => {
        setReady(false);
        setChecking(false);
      });
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (pwd.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    if (pwd !== pwd2) {
      setErr("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not reset password.");
        setLoading(false);
        return;
      }
      router.push("/login?reset=ok");
      router.refresh();
    } catch {
      setErr("Network error.");
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-split login-split--single" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="login-form-panel login-form-panel--solo" style={{ borderRadius: 12 }}>
          <div className="login-form-wrap">
            <Link href="/login" className="login-back-link">← Back to Sign In</Link>
            <h2 className="login-form-title">Choose a new password</h2>

            {checking && <p className="login-form-sub">Checking your link…</p>}

            {!checking && !token && (
              <p className="login-err-msg">Missing reset token. Use the link from your email or the reset page.</p>
            )}

            {!checking && token && !ready && (
              <p className="login-err-msg">
                This link is invalid, expired, or was opened in a different browser than the one where you
                requested the reset.{" "}
                <Link href="/forgot-password">Request a new link</Link> on the same device.
              </p>
            )}

            {!checking && ready && (
              <form className="login-form" onSubmit={submit} noValidate>
                <div className="login-field">
                  <label className="login-label">New password</label>
                  <div className="login-pwd-wrap">
                    <input
                      className="login-input"
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                    <button type="button" className="login-pwd-toggle" onClick={() => setShowPwd((v) => !v)} aria-label="Toggle password visibility">
                      {showPwd
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>
                <div className="login-field">
                  <label className="login-label">Confirm password</label>
                  <input
                    className="login-input"
                    type={showPwd ? "text" : "password"}
                    autoComplete="new-password"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
                {err && <p className="login-err-msg">{err}</p>}
                <button className="login-cta-btn" type="submit" disabled={loading}>
                  {loading ? <span className="login-spinner" /> : "Save password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
