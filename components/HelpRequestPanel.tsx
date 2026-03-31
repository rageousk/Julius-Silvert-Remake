"use client";

import { useEffect, useRef, useState } from "react";
import { PhoneInput } from "@/components/PhoneInput";
import { isCompleteUSPhone } from "@/lib/phone";
import { sanitizePlainText } from "@/lib/input-security";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOPICS = [
  "General Question or Feedback",
  "Order Issue",
  "Product Inquiry",
  "Billing & Invoicing",
  "Delivery & Logistics",
  "Account Support",
  "Other",
];

const EMPTY = {
  topic: TOPICS[0],
  name: "",
  phone: "",
  business: "",
  subject: "",
  description: "",
  orderNumber: "",
};

export function HelpRequestPanel({ open, onClose }: Props) {
  const [form,      setForm]      = useState({ ...EMPTY });
  const [errors,    setErrors]    = useState<Partial<typeof EMPTY>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending,   setSending]   = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset form when reopened
  useEffect(() => {
    if (open) { setForm({ ...EMPTY }); setErrors({}); setSubmitted(false); }
  }, [open]);

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const e: Partial<typeof EMPTY> = {};
    if (!form.name.trim())        e.name        = "Name is required.";
    if (!isCompleteUSPhone(form.phone)) e.phone = "Enter a valid 10-digit US phone number.";
    if (!form.business.trim())    e.business    = "Business account name is required.";
    if (!form.subject.trim())     e.subject     = "Subject is required.";
    if (!form.description.trim()) e.description = "Please describe your issue.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const cleaned = {
      ...form,
      name:        sanitizePlainText(form.name, 120),
      business:    sanitizePlainText(form.business, 200),
      subject:     sanitizePlainText(form.subject, 200),
      description: sanitizePlainText(form.description, 4000),
      orderNumber: sanitizePlainText(form.orderNumber, 80),
    };
    setForm(cleaned);
    setSending(true);
    setTimeout(() => { setSending(false); setSubmitted(true); }, 1200);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`hr-backdrop${open ? " hr-backdrop-visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`hr-panel${open ? " hr-panel-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Submit a Request"
      >
        {/* Header */}
        <div className="hr-header">
          <div className="hr-header-left">
            <span className="hr-icon-circle" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <div>
              <h2 className="hr-title">Submit a Request</h2>
              <p className="hr-subtitle">We&apos;ll get back to you within 1 business day</p>
            </div>
          </div>
          <button className="hr-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6"  y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="hr-body">
          {submitted ? (
            <div className="hr-success">
              <div className="hr-success-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="hr-success-title">Request Sent!</h3>
              <p className="hr-success-msg">
                Thank you, <strong>{form.name}</strong>. Our team will follow up at your phone number
                or email shortly.
              </p>
              <div className="hr-success-contact">
                <p>📧 <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a></p>
                <p>📞 <a href="tel:2154551600">(215) 455-1600</a></p>
              </div>
              <button className="hr-submit-btn" onClick={onClose} style={{ marginTop: "1.5rem" }}>
                Close
              </button>
            </div>
          ) : (
            <form className="hr-form" onSubmit={handleSubmit} noValidate>

              {/* Topic */}
              <div className="hr-field">
                <label className="hr-label">Inquiry Topic <span className="hr-req">*</span></label>
                <select className="hr-select" value={form.topic}
                  onChange={(e) => set("topic", e.target.value)}>
                  {TOPICS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Name */}
              <div className="hr-field">
                <label className="hr-label">Your Name <span className="hr-req">*</span></label>
                <input className={`hr-input${errors.name ? " hr-input-err" : ""}`}
                  type="text" placeholder="Full name"
                  value={form.name} onChange={(e) => set("name", e.target.value)} />
                {errors.name && <span className="hr-err-msg">{errors.name}</span>}
              </div>

              {/* Phone */}
              <div className="hr-field">
                <label className="hr-label">Phone Number <span className="hr-req">*</span></label>
                <PhoneInput
                  className={`hr-input${errors.phone ? " hr-input-err" : ""}`}
                  placeholder="(215) 000-0000"
                  value={form.phone}
                  onChange={(d) => set("phone", d)}
                />
                {errors.phone && <span className="hr-err-msg">{errors.phone}</span>}
              </div>

              {/* Business */}
              <div className="hr-field">
                <label className="hr-label">Business Account Name <span className="hr-req">*</span></label>
                <input className={`hr-input${errors.business ? " hr-input-err" : ""}`}
                  type="text" placeholder="Your restaurant or business"
                  value={form.business} onChange={(e) => set("business", e.target.value)} />
                {errors.business && <span className="hr-err-msg">{errors.business}</span>}
              </div>

              {/* Subject */}
              <div className="hr-field">
                <label className="hr-label">Subject <span className="hr-req">*</span></label>
                <input className={`hr-input${errors.subject ? " hr-input-err" : ""}`}
                  type="text" placeholder="Brief summary of your request"
                  value={form.subject} onChange={(e) => set("subject", e.target.value)} />
                {errors.subject && <span className="hr-err-msg">{errors.subject}</span>}
              </div>

              {/* Description */}
              <div className="hr-field">
                <label className="hr-label">Description <span className="hr-req">*</span></label>
                <textarea className={`hr-textarea${errors.description ? " hr-input-err" : ""}`}
                  rows={4} placeholder="Please provide as much detail as possible…"
                  value={form.description} onChange={(e) => set("description", e.target.value)} />
                {errors.description && <span className="hr-err-msg">{errors.description}</span>}
              </div>

              {/* Order number (optional) */}
              <div className="hr-field">
                <label className="hr-label">Order Number <span className="hr-optional">(optional)</span></label>
                <input className="hr-input" type="text" placeholder="e.g. JS-20260101-001"
                  value={form.orderNumber} onChange={(e) => set("orderNumber", e.target.value)} />
              </div>

              {/* Contact info note */}
              <div className="hr-contact-note">
                <p className="hr-contact-note-heading">Need immediate help?</p>
                <div className="hr-contact-note-links">
                  <a href="tel:2154551600" className="hr-contact-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    (215) 455-1600
                  </a>
                  <span className="hr-contact-divider">or</span>
                  <a href="mailto:orders@juliussilvert.com" className="hr-contact-link">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    orders@juliussilvert.com
                  </a>
                </div>
              </div>

              <button className="hr-submit-btn" type="submit" disabled={sending}>
                {sending ? (
                  <span className="hr-spinner" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Submit Request
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
