import { AccountShell } from "@/components/AccountShell";
import { WishlistClient } from "@/components/WishlistClient";

export default function WishlistPage() {
  return (
    <AccountShell title="My Account">
      <WishlistClient />
    </AccountShell>
  );
}
