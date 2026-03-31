import { AccountShell } from "@/components/AccountShell";
import { RequisitionListsClient } from "@/components/RequisitionListsClient";

export default function RequisitionListsPage() {
  return (
    <AccountShell title="My Account">
      <RequisitionListsClient />
    </AccountShell>
  );
}
