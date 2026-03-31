import Link from "next/link";
import { AccountShell } from "@/components/AccountShell";
import { RequisitionListsClient } from "@/components/RequisitionListsClient";

export default function RequisitionListsPage() {
  return (
    <AccountShell title="My Account">
      <RequisitionListsClient />
      <div className="account-card">
        <p className="muted" style={{ marginBottom: 10 }}>
          Prefer adding items first?
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: "inline-block" }}>
          Browse Catalog
        </Link>
      </div>
    </AccountShell>
  );
}
