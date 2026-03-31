import { ContactPageClient } from "@/components/ContactPageClient";

export default function ContactPage() {
  return (
    <div className="container" style={{ paddingTop: "1.75rem", paddingBottom: "4rem" }}>
      <h1 className="cat-page-heading" style={{ marginBottom: "0.35rem" }}>
        Contact &amp; support
      </h1>
      <p className="contact-page-subtitle">
        Reach our team by phone or email, or send a support request and we&apos;ll get back to you.
      </p>
      <ContactPageClient />
    </div>
  );
}
