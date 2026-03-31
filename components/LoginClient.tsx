"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { PhoneInput } from "@/components/PhoneInput";
import { isCompleteUSPhone } from "@/lib/phone";
import {
  sanitizePlainText,
  sanitizeEmailInput,
  zipDigitsOnly,
  isValidUsZip5,
} from "@/lib/input-security";

type Mode = "signin" | "signup";

const BUSINESS_TYPES = [
  "Restaurant",
  "Hotel / Hospitality",
  "Catering Company",
  "University / Institution",
  "Healthcare / Hospital",
  "Corporate Dining",
  "Retail Food Store",
  "Other",
];

const HEAR_ABOUT = [
  "Sales Representative",
  "Word of Mouth",
  "Online Search",
  "Trade Show / Event",
  "Social Media",
  "Email Campaign",
  "Other",
];

export default function LoginClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [authError, setAuthError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Show a friendly message when NextAuth redirects back with ?error=AccessDenied
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      setAuthError("Access denied: No customer record found for this account. To request access, please submit a customer application.");
    }
    if (searchParams.get("reset") === "ok") {
      setSiError("");
      setAuthError("");
      setResetSuccess(true);
    }
  }, [searchParams]);

  /* ── Sign-in state ─────────────────────────── */
  const [siEmail,    setSiEmail]    = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [siShowPwd,  setSiShowPwd]  = useState(false);
  const [siLoading,  setSiLoading]  = useState(false);
  const [siError,    setSiError]    = useState("");

  /* ── Sign-up state ─────────────────────────── */
  const [su, setSu] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    business: "", jobTitle: "", businessType: BUSINESS_TYPES[0],
    address1: "", address2: "", city: "", state: "", zip: "",
    isExisting: "no", heardFrom: HEAR_ABOUT[0], comments: "",
  });
  const [suLoading, setSuLoading] = useState(false);
  const [suError,   setSuError]   = useState("");
  const [suSuccess, setSuSuccess] = useState(false);

  const [ssoToast] = useState(""); // kept for JSX reference, SSO now auto-redirects

  function setField(key: keyof typeof su, val: string) {
    setSu((p) => ({ ...p, [key]: val }));
    setSuError("");
  }

  async function handleSSOClick(provider: "google" | "azure-ad") {
    await signIn(provider, { callbackUrl: "/" });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSiError("");
    if (!siEmail.trim()) { setSiError("Email is required."); return; }
    if (!siPassword)     { setSiError("Password is required."); return; }
    setSiLoading(true);
    const result = await signIn("credentials", {
      email:    sanitizeEmailInput(siEmail),
      password: siPassword,
      redirect: false,
    });
    setSiLoading(false);
    if (result?.error) {
      setSiError("Invalid email or password. Please try again.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSuError("");
    if (!su.firstName.trim()) { setSuError("First name is required."); return; }
    if (!su.lastName.trim())  { setSuError("Last name is required."); return; }
    if (!su.email.trim())     { setSuError("Email is required."); return; }
    if (!isCompleteUSPhone(su.phone)) { setSuError("Enter a valid 10-digit US phone number."); return; }
    if (!su.business.trim())  { setSuError("Business name is required."); return; }
    if (!su.jobTitle.trim())  { setSuError("Job title is required."); return; }
    if (!su.address1.trim())  { setSuError("Business address is required."); return; }
    if (!su.city.trim())      { setSuError("City is required."); return; }
    if (!su.state.trim())     { setSuError("State is required."); return; }
    if (!isValidUsZip5(zipDigitsOnly(su.zip))) { setSuError("Enter a 5-digit ZIP code."); return; }
    if (!su.heardFrom)        { setSuError("Please tell us how you heard about us."); return; }
    const emailClean = sanitizeEmailInput(su.email);
    if (!emailClean.includes("@")) { setSuError("Enter a valid email address."); return; }
    setSu((prev) => ({
      ...prev,
      firstName:   sanitizePlainText(prev.firstName, 80),
      lastName:    sanitizePlainText(prev.lastName, 80),
      email:       emailClean,
      business:    sanitizePlainText(prev.business, 200),
      jobTitle:    sanitizePlainText(prev.jobTitle, 120),
      address1:    sanitizePlainText(prev.address1, 200),
      address2:    sanitizePlainText(prev.address2, 120),
      city:        sanitizePlainText(prev.city, 100),
      state:       sanitizePlainText(prev.state, 2).replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2),
      zip:         zipDigitsOnly(prev.zip),
      comments:    sanitizePlainText(prev.comments, 4000),
    }));
    setSuLoading(true);
    setTimeout(() => { setSuLoading(false); setSuSuccess(true); }, 1500);
  }

  return (
    <div className="login-page">
      <div className="login-split">

        {/* ── Left: brand panel ───────────────── */}
        <div className="login-brand-panel">
          <div className="login-brand-content">
            <Link href="/" className="login-logo">
              <span className="login-logo-julius">Julius</span>
              <span className="login-logo-silvert-wrap">
                <span className="login-logo-silvert">Silvert</span>
                <span className="login-logo-est">Est. 1915</span>
              </span>
            </Link>

            <p className="login-brand-tagline">
              Philadelphia&rsquo;s premier B2B food distribution partner &mdash; serving
              restaurants, hotels, and institutions since 1915.
            </p>

            <div className="login-brand-stats">
              <div className="login-stat">
                <span className="login-stat-value">100+</span>
                <span className="login-stat-label">Products</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">1915</span>
                <span className="login-stat-label">Est.</span>
              </div>
              <div className="login-stat">
                <span className="login-stat-value">24h</span>
                <span className="login-stat-label">Delivery</span>
              </div>
            </div>

            <div className="login-brand-features">
              {[
                { icon: "🏆", text: "Premium quality products from trusted suppliers" },
                { icon: "🚚", text: "Reliable next-day delivery across the region" },
                { icon: "💼", text: "Dedicated account managers for every client" },
              ].map(({ icon, text }) => (
                <div key={text} className="login-brand-feature">
                  <span>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: form panel ───────────────── */}
        <div className="login-form-panel">
          <div className="login-form-wrap">

            {/* Tabs */}
            <div className="login-tabs">
              <button
                className={`login-tab${mode === "signin" ? " login-tab--active" : ""}`}
                onClick={() => { setMode("signin"); setSiError(""); }}
              >Sign In</button>
              <button
                className={`login-tab${mode === "signup" ? " login-tab--active" : ""}`}
                onClick={() => { setMode("signup"); setSuError(""); setSuSuccess(false); }}
              >Become a Customer</button>
            </div>

            {/* ══ SIGN IN ══ */}
            {mode === "signin" && (
              <>
                <h2 className="login-form-title">Welcome back</h2>
                <p className="login-form-sub">Sign in to your Julius Silvert B2B account</p>

                {/* Access denied banner */}
                {authError && (
                  <div className="login-access-denied">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 2 }}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/>
                    </svg>
                    <span>
                      Access denied: No customer record found for this account.{" "}
                      <button
                        className="login-access-denied-link"
                        onClick={() => { setAuthError(""); setMode("signup"); }}
                      >
                        Submit a customer application
                      </button>{" "}
                      to request access.
                    </span>
                    <button onClick={() => setAuthError("")} aria-label="Dismiss" className="login-access-denied-close">×</button>
                  </div>
                )}

                {resetSuccess && (
                  <div className="login-reset-success" role="status">
                    Password updated. Sign in with your email and new password.
                    <button type="button" className="login-reset-success-dismiss" onClick={() => setResetSuccess(false)} aria-label="Dismiss">×</button>
                  </div>
                )}

                {/* SSO */}
                <div className="login-sso-row">
                  <button className="login-sso-btn" onClick={() => handleSSOClick("google")} type="button">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                  <button className="login-sso-btn" onClick={() => handleSSOClick("azure-ad")} type="button">
                    <svg width="18" height="18" viewBox="0 0 23 23">
                      <rect x="1"  y="1"  width="10" height="10" fill="#F25022"/>
                      <rect x="12" y="1"  width="10" height="10" fill="#7FBA00"/>
                      <rect x="1"  y="12" width="10" height="10" fill="#00A4EF"/>
                      <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                    </svg>
                    Continue with Microsoft
                  </button>
                </div>

                {ssoToast && (
                  <div className="login-sso-toast">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {ssoToast}
                  </div>
                )}

                <div className="login-divider"><span>or sign in with email</span></div>

                <form className="login-form" onSubmit={handleSignIn} noValidate>
                  <div className="login-field">
                    <label className="login-label">Email address</label>
                    <input className="login-input" type="email" placeholder="Enter your registered email address"
                      value={siEmail} onChange={(e) => { setSiEmail(e.target.value); setSiError(""); }}
                      autoComplete="username" />
                  </div>
                  <div className="login-field">
                    <div className="login-label-row">
                      <label className="login-label">Password</label>
                      <Link href="/forgot-password" className="login-forgot">Forgot password</Link>
                    </div>
                    <div className="login-pwd-wrap">
                      <input className="login-input" type={siShowPwd ? "text" : "password"}
                        placeholder="••••••••" value={siPassword}
                        onChange={(e) => { setSiPassword(e.target.value); setSiError(""); }}
                        autoComplete="current-password" />
                      <button type="button" className="login-pwd-toggle"
                        onClick={() => setSiShowPwd((v) => !v)} aria-label="Toggle password">
                        {siShowPwd
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {siError && <p className="login-err-msg">{siError}</p>}

                  <button className="login-cta-btn" type="submit" disabled={siLoading}>
                    {siLoading ? <span className="login-spinner" /> : "Sign in"}
                  </button>
                  <p className="login-cred-hint">
                    First time signing in with email? Use{" "}
                    <Link href="/forgot-password">Forgot password</Link> once to create your password.
                  </p>
                </form>

                <p className="login-switch-text">
                  Don&apos;t have an account?&nbsp;
                  <button className="login-switch-link" onClick={() => setMode("signup")}>
                    Become a Customer
                  </button>
                </p>
              </>
            )}

            {/* ══ ACCOUNT REQUEST ══ */}
            {mode === "signup" && (
              <>
                {suSuccess ? (
                  <div className="login-success">
                    <div className="login-success-icon">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <h3>Request Submitted!</h3>
                    <p>Thank you, <strong>{su.firstName}</strong>. Our sales team will review your account request and be in touch within 1–2 business days.</p>
                    <p style={{ fontSize: "0.82rem", color: "var(--ink-soft)" }}>
                      Questions? Call <a href="tel:2154551600">(215) 455-1600</a> or email{" "}
                      <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a>
                    </p>
                    <button className="login-cta-btn" onClick={() => { setSuSuccess(false); setMode("signin"); }}>
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="login-form-title">Account Request</h2>
                    <p className="login-form-sub">
                      We have been dedicated to providing chefs and restaurants with premium
                      products and dependable, quality service for over 100 years.
                    </p>

                    <form className="login-form" onSubmit={handleSignUp} noValidate>

                      <div className="login-field-row">
                        <div className="login-field">
                          <label className="login-label">First Name <span className="login-req">*</span></label>
                          <input className="login-input" type="text" placeholder="First Name"
                            value={su.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                        </div>
                        <div className="login-field">
                          <label className="login-label">Last Name <span className="login-req">*</span></label>
                          <input className="login-input" type="text" placeholder="Last Name"
                            value={su.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                        </div>
                      </div>

                      <div className="login-field">
                        <label className="login-label">Email <span className="login-req">*</span></label>
                        <input className="login-input" type="email" placeholder="Email"
                          value={su.email} onChange={(e) => setField("email", e.target.value)}
                          autoComplete="email" />
                      </div>

                      <div className="login-field">
                        <label className="login-label">Phone Number <span className="login-req">*</span></label>
                        <PhoneInput
                          className="login-input"
                          placeholder="(215) 555-1234"
                          value={su.phone}
                          onChange={(d) => setField("phone", d)}
                        />
                        <p className="login-form-hint" style={{ marginTop: 6, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
                          US numbers only — digits only; formatting is automatic.
                        </p>
                      </div>

                      <div className="login-field">
                        <label className="login-label">Business Name <span className="login-req">*</span></label>
                        <input className="login-input" type="text" placeholder="Business Name"
                          value={su.business} onChange={(e) => setField("business", e.target.value)} />
                      </div>

                      <div className="login-field">
                        <label className="login-label">Job Title <span className="login-req">*</span></label>
                        <input className="login-input" type="text" placeholder="Job Title"
                          value={su.jobTitle} onChange={(e) => setField("jobTitle", e.target.value)} />
                      </div>

                      <div className="login-field">
                        <label className="login-label">Please Choose Your Business Type <span className="login-req">*</span></label>
                        <select className="login-input login-select"
                          value={su.businessType} onChange={(e) => setField("businessType", e.target.value)}>
                          {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="login-field">
                        <label className="login-label">Business Address <span className="login-req">*</span></label>
                        <input className="login-input" type="text" placeholder="Business Address"
                          value={su.address1} onChange={(e) => setField("address1", e.target.value)} />
                      </div>

                      <div className="login-field">
                        <label className="login-label">Address Line 2</label>
                        <input className="login-input" type="text" placeholder="Address Line 2"
                          value={su.address2} onChange={(e) => setField("address2", e.target.value)} />
                      </div>

                      <div className="login-field-row">
                        <div className="login-field">
                          <label className="login-label">City <span className="login-req">*</span></label>
                          <input className="login-input" type="text" placeholder="City"
                            value={su.city} onChange={(e) => setField("city", e.target.value)} />
                        </div>
                        <div className="login-field login-field--sm">
                          <label className="login-label">State <span className="login-req">*</span></label>
                          <input className="login-input" type="text" placeholder="NJ" maxLength={2}
                            value={su.state} onChange={(e) => setField("state", e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2))} />
                        </div>
                        <div className="login-field login-field--sm">
                          <label className="login-label">Zip <span className="login-req">*</span></label>
                          <input className="login-input" type="text" inputMode="numeric" placeholder="08028" maxLength={5}
                            value={su.zip} onChange={(e) => setField("zip", zipDigitsOnly(e.target.value))} />
                        </div>
                      </div>

                      <div className="login-field">
                        <label className="login-label">Are you currently a Silvert customer? <span className="login-req">*</span></label>
                        <div className="login-radio-group">
                          <label className="login-radio-label">
                            <input type="radio" name="existing" value="yes"
                              checked={su.isExisting === "yes"}
                              onChange={() => setField("isExisting", "yes")} />
                            Yes
                          </label>
                          <label className="login-radio-label">
                            <input type="radio" name="existing" value="no"
                              checked={su.isExisting === "no"}
                              onChange={() => setField("isExisting", "no")} />
                            No
                          </label>
                        </div>
                      </div>

                      <div className="login-field">
                        <label className="login-label">How did you hear about us? <span className="login-req">*</span></label>
                        <select className="login-input login-select"
                          value={su.heardFrom} onChange={(e) => setField("heardFrom", e.target.value)}>
                          {HEAR_ABOUT.map((h) => <option key={h}>{h}</option>)}
                        </select>
                      </div>

                      <div className="login-field">
                        <label className="login-label">Comments</label>
                        <textarea className="login-input login-textarea" rows={3} placeholder="Comments"
                          value={su.comments} onChange={(e) => setField("comments", e.target.value)} />
                      </div>

                      {suError && <p className="login-err-msg">{suError}</p>}

                      <button className="login-cta-btn" type="submit" disabled={suLoading}>
                        {suLoading ? <span className="login-spinner" /> : "Submit application"}
                      </button>
                    </form>

                    <p className="login-switch-text">
                      Already have an account?&nbsp;
                      <button className="login-switch-link" onClick={() => setMode("signin")}>Sign In</button>
                    </p>
                  </>
                )}
              </>
            )}

            {/* Footer note */}
            <div className="login-footer-note">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Secured with TLS/SSL encryption
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
