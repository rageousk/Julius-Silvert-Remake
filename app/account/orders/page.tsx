import { AccountShell } from "@/components/AccountShell";

export default function AccountOrdersPage() {
  return (
    <AccountShell title="My Account">
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>My Orders</h3>
        <div style={{
          border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff",
          padding: "2.5rem 2rem", textAlign: "center", color: "#888"
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ margin: "0 auto 12px", display: "block" }}>
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
          </svg>
          <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#555" }}>No orders yet</p>
          <p style={{ margin: 0, fontSize: "0.84rem" }}>Orders placed through the platform will appear here.</p>
        </div>
      </div>
    </AccountShell>
  );
}
