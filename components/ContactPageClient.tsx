"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpRequestPanel } from "@/components/HelpRequestPanel";

export function ContactPageClient() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div className="contact-page-card">
        <div className="contact-methods">
          <div className="contact-method">
            <h2 className="contact-method-title">Phone</h2>
            <p className="contact-method-body">
              <a href="tel:+12154551600" className="contact-method-link">
                (215) 455-1600
              </a>
            </p>
            <p className="contact-method-meta">Monday–Friday, 7am–5pm EST</p>
          </div>
          <div className="contact-method">
            <h2 className="contact-method-title">Email</h2>
            <p className="contact-method-body">
              <a href="mailto:orders@juliussilvert.com" className="contact-method-link">
                orders@juliussilvert.com
              </a>
            </p>
            <p className="contact-method-meta">For orders, billing, and general inquiries</p>
          </div>
        </div>

        <div className="contact-ticket-block">
          <h2 className="contact-method-title">Support request</h2>
          <p className="contact-ticket-copy">
            Submit a ticket with your question, order issue, or account need. Include as much detail as you can so we can
            resolve it quickly.
          </p>
          <button type="button" className="btn-primary contact-ticket-btn" onClick={() => setHelpOpen(true)}>
            Submit a support request
          </button>
        </div>

        <p className="contact-back">
          <Link href="/">← Back to home</Link>
        </p>
      </div>

      <HelpRequestPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
