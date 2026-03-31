"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AccountShell } from "@/components/AccountShell";
import { getProfile, saveProfile } from "@/lib/userProfile";
import { PhoneInput } from "@/components/PhoneInput";
import { digitsOnly, formatUSPhoneDisplay, isCompleteUSPhone } from "@/lib/phone";
import { sanitizePlainText } from "@/lib/input-security";

function AcctPwdEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function AccountInformationClient() {
  const { data: session, status } = useSession();

  const email       = session?.user?.email ?? "";
  // @ts-expect-error — provider added in jwt callback
  const provider    = session?.user?.provider as string | undefined;
  const isSSOUser   = provider === "google" || provider === "azure-ad";

  const [editingContact, setEditingContact] = useState(false);
  const [editingPwd,     setEditingPwd]     = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  const [curPwd,  setCurPwd]  = useState("");
  const [newPwd,  setNewPwd]  = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [pwdMsg,  setPwdMsg]  = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showCurPwd, setShowCurPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);

  // Load saved profile from localStorage once session is ready
  useEffect(() => {
    if (status !== "authenticated" || !email) return;
    const stored = getProfile(email);
    if (stored?.displayName) {
      const parts = stored.displayName.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
    } else {
      // Fall back to provider name (e.g. from Google)
      const providerName = session?.user?.name ?? email.split("@")[0];
      const parts = providerName.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
    }
    if (stored?.phone) setPhone(digitsOnly(stored.phone));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, email]);

  function saveContact() {
    setError("");
    if (!firstName.trim()) { setError("First name is required."); return; }
    const fn = sanitizePlainText(firstName, 80);
    const ln = sanitizePlainText(lastName, 80);
    if (phone && !isCompleteUSPhone(phone)) {
      setError("Enter a complete 10-digit US phone number, or leave it blank.");
      return;
    }
    const fullName = [fn, ln].filter(Boolean).join(" ");
    const phoneOut = phone ? formatUSPhoneDisplay(phone) : "";
    saveProfile(email, { displayName: fullName, phone: phoneOut });
    setEditingContact(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function savePassword() {
    setPwdMsg("");
    if (!curPwd) {
      setPwdMsg("Please enter your current password.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg("New password must be at least 8 characters.");
      return;
    }
    if (newPwd !== confPwd) {
      setPwdMsg("Passwords do not match.");
      return;
    }
    setPwdSaving(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        setPwdMsg(data.error ?? "Could not update password. Check your current password and try again.");
        return;
      }
      setPwdMsg("✓ Password updated successfully.");
      setEditingPwd(false);
      setCurPwd("");
      setNewPwd("");
      setConfPwd("");
      setShowCurPwd(false);
      setShowNewPwd(false);
      setShowConfPwd(false);
      setTimeout(() => setPwdMsg(""), 4000);
    } catch {
      setPwdMsg("Network error. Try again.");
    } finally {
      setPwdSaving(false);
    }
  }

  // Derive initials from stored display name
  const storedProfile  = email ? getProfile(email) : null;
  const displayName    = storedProfile?.displayName || session?.user?.name || email.split("@")[0] || "";
  const initials       = displayName.split(/[\s._-]/).filter(Boolean)
    .slice(0, 2).map((w: string) => w[0].toUpperCase()).join("") || "??";

  return (
    <AccountShell title="My Account">
      <div className="acct-info-page">
        <h3 className="acct-section-heading">Account Information</h3>

        {saved && <div className="acct-success-banner">✓ Your information has been saved.</div>}

        {/* Contact Information card */}
        <div className="acct-info-card">
          <div className="acct-info-card-header">
            <div className="acct-info-avatar">{initials}</div>
            <div>
              <p className="acct-info-card-title">Contact Information</p>
              <p className="acct-info-card-sub">{email}</p>
            </div>
            <button
              className="acct-edit-btn"
              onClick={() => { setEditingContact((v) => !v); setError(""); }}
            >
              {editingContact ? "Cancel" : "Edit"}
            </button>
          </div>

          {!editingContact ? (
            <div className="acct-info-display">
              <div className="acct-info-row">
                <span className="acct-info-label">Full Name</span>
                <span className="acct-info-value">{displayName || "—"}</span>
              </div>
              <div className="acct-info-row">
                <span className="acct-info-label">Email</span>
                <span className="acct-info-value">{email}</span>
              </div>
              <div className="acct-info-row">
                <span className="acct-info-label">Phone</span>
                <span className="acct-info-value">{storedProfile?.phone || "—"}</span>
              </div>
              <div className="acct-info-row">
                <span className="acct-info-label">Sign-in</span>
                <span className="acct-info-value acct-provider-badge">
                  {provider === "google"    && "Google SSO"}
                  {provider === "azure-ad"  && "Microsoft SSO"}
                  {provider === "credentials" && "Email & Password"}
                  {!provider                && "—"}
                </span>
              </div>
            </div>
          ) : (
            <div className="acct-form">
              {error && <p className="acct-form-error">{error}</p>}
              <div className="acct-form-row">
                <div className="acct-form-field">
                  <label className="acct-form-label">First Name <span className="req">*</span></label>
                  <input className="acct-form-input" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div className="acct-form-field">
                  <label className="acct-form-label">Last Name</label>
                  <input className="acct-form-input" value={lastName}
                    onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                </div>
              </div>
              <div className="acct-form-field">
                <label className="acct-form-label">Email</label>
                <input className="acct-form-input" value={email} disabled />
                <p className="acct-form-hint">Email is managed by your sign-in provider and cannot be changed here.</p>
              </div>
              <div className="acct-form-field">
                <label className="acct-form-label">Phone Number</label>
                <PhoneInput className="acct-form-input" value={phone} onChange={setPhone} />
                <p className="acct-form-hint">US numbers only — type digits; formatting is added automatically.</p>
              </div>
              <div className="acct-form-actions">
                <button className="acct-save-btn" onClick={saveContact}>Save Changes</button>
                <button className="acct-cancel-btn" onClick={() => { setEditingContact(false); setError(""); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Password card */}
        <div className="acct-info-card" style={{ marginTop: "1.5rem" }}>
          <div className="acct-info-card-header">
            <div className="acct-info-icon-circle">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="acct-info-card-title">Password</p>
              <p className="acct-info-card-sub">
                {isSSOUser
                  ? `Managed by ${provider === "google" ? "Google" : "Microsoft"} — use SSO to sign in`
                  : "Change your email & password sign-in"}
              </p>
            </div>
            {!isSSOUser && (
              <button className="acct-edit-btn"
                onClick={() => {
                  setEditingPwd((v) => !v);
                  setPwdMsg("");
                  setCurPwd("");
                  setNewPwd("");
                  setConfPwd("");
                  setShowCurPwd(false);
                  setShowNewPwd(false);
                  setShowConfPwd(false);
                }}>
                {editingPwd ? "Cancel" : "Change Password"}
              </button>
            )}
          </div>

          {isSSOUser && (
            <div style={{ padding: "10px 20px 14px" }}>
              <p className="acct-sso-note">
                Your account is linked to{" "}
                <strong>{provider === "google" ? "Google" : "Microsoft"}</strong>. Password management
                is handled by your SSO provider. To change your password, visit your{" "}
                {provider === "google"
                  ? <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">Google Account security settings</a>
                  : <a href="https://mysignins.microsoft.com/security-info" target="_blank" rel="noreferrer">Microsoft account security settings</a>
                }.
              </p>
            </div>
          )}

          {pwdMsg && (
            <p className={`acct-pwd-msg ${pwdMsg.startsWith("✓") ? "success" : "error"}`}>{pwdMsg}</p>
          )}

          {!isSSOUser && editingPwd && (
            <div className="acct-form">
              <div className="acct-form-field">
                <label className="acct-form-label">Current Password</label>
                <div className="acct-pwd-wrap">
                  <input
                    className="acct-form-input"
                    type={showCurPwd ? "text" : "password"}
                    value={curPwd}
                    onChange={(e) => setCurPwd(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="acct-pwd-toggle"
                    onClick={() => setShowCurPwd((v) => !v)}
                    aria-label={showCurPwd ? "Hide current password" : "Show current password"}
                  >
                    <AcctPwdEye open={showCurPwd} />
                  </button>
                </div>
              </div>
              <div className="acct-form-row">
                <div className="acct-form-field">
                  <label className="acct-form-label">New Password</label>
                  <div className="acct-pwd-wrap">
                    <input
                      className="acct-form-input"
                      type={showNewPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="acct-pwd-toggle"
                      onClick={() => setShowNewPwd((v) => !v)}
                      aria-label={showNewPwd ? "Hide new password" : "Show new password"}
                    >
                      <AcctPwdEye open={showNewPwd} />
                    </button>
                  </div>
                </div>
                <div className="acct-form-field">
                  <label className="acct-form-label">Confirm New Password</label>
                  <div className="acct-pwd-wrap">
                    <input
                      className="acct-form-input"
                      type={showConfPwd ? "text" : "password"}
                      value={confPwd}
                      onChange={(e) => setConfPwd(e.target.value)}
                      placeholder="Repeat password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="acct-pwd-toggle"
                      onClick={() => setShowConfPwd((v) => !v)}
                      aria-label={showConfPwd ? "Hide confirm password" : "Show confirm password"}
                    >
                      <AcctPwdEye open={showConfPwd} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="acct-form-actions">
                <button className="acct-save-btn" type="button" onClick={savePassword} disabled={pwdSaving}>
                  {pwdSaving ? "Saving…" : "Update Password"}
                </button>
                <button
                  className="acct-cancel-btn"
                  type="button"
                  onClick={() => {
                    setEditingPwd(false);
                    setPwdMsg("");
                    setCurPwd("");
                    setNewPwd("");
                    setConfPwd("");
                    setShowCurPwd(false);
                    setShowNewPwd(false);
                    setShowConfPwd(false);
                  }}
                  disabled={pwdSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AccountShell>
  );
}
