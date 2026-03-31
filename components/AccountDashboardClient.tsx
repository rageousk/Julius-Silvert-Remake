"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useRequisitionStore } from "@/store/useRequisitionStore";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/AccountShell";
import { getDisplayName } from "@/lib/userProfile";

export function AccountDashboardClient() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cartItemsMap   = useCartStore((s) => s.items);
  const wishlistRaw    = useWishlistStore((s) => s.items);
  const wishlistItems  = wishlistRaw.filter((i) => i?.sku);
  const reqLists       = useRequisitionStore((s) => s.lists);

  const cartValues = mounted ? Object.values(cartItemsMap).filter((i) => i?.sku && Number.isFinite(i.price)) : [];
  const cartCount  = cartValues.reduce((a, i) => a + i.quantity, 0);
  const cartTotal  = cartValues.reduce((a, i) => a + i.quantity * i.price, 0);

  const email        = session?.user?.email ?? "";
  const providerName = session?.user?.name ?? email.split("@")[0] ?? "Customer";
  const displayName  = email ? getDisplayName(email, providerName) : providerName;
  const initials     = displayName.split(/[\s._-]/).filter(Boolean)
    .slice(0, 2).map((w: string) => w[0].toUpperCase()).join("") || "??";

  return (
    <AccountShell title="My Account">
      <div className="acct-dashboard">

        {/* Welcome card */}
        <div className="acct-welcome-card">
          <div className="acct-welcome-avatar">{initials}</div>
          <div>
            <h3 className="acct-welcome-name">Welcome back, {displayName}!</h3>
            <p className="acct-welcome-email">{email}</p>
          </div>
          <Link href="/account/information" className="acct-welcome-edit">Edit Profile →</Link>
        </div>

        {/* Stats row */}
        <div className="acct-stats-row">
          <div className="acct-stat-card">
            <span className="acct-stat-num">{cartCount}</span>
            <span className="acct-stat-label">Items in Cart</span>
            <Link href="/cart" className="acct-stat-link">View Cart</Link>
          </div>
          <div className="acct-stat-card">
            <span className="acct-stat-num">${mounted ? cartTotal.toFixed(2) : "0.00"}</span>
            <span className="acct-stat-label">Cart Total</span>
            <Link href="/cart" className="acct-stat-link">Checkout</Link>
          </div>
          <div className="acct-stat-card">
            <span className="acct-stat-num">{mounted ? wishlistItems.length : 0}</span>
            <span className="acct-stat-label">Wishlist Items</span>
            <Link href="/account/wishlist" className="acct-stat-link">View Wishlist</Link>
          </div>
          <div className="acct-stat-card">
            <span className="acct-stat-num">{mounted ? reqLists.length : 0}</span>
            <span className="acct-stat-label">Requisition Lists</span>
            <Link href="/requisition-lists" className="acct-stat-link">Manage Lists</Link>
          </div>
        </div>

        {/* Quick links */}
        <div className="acct-quicklinks">
          <h4 className="acct-section-heading">Quick Access</h4>
          <div className="acct-ql-grid">
            {[
              { href: "/account/information",  icon: "👤", label: "Account Information",       sub: "Update your name & contact" },
              { href: "/account/address-book", icon: "📍", label: "Address Book",              sub: "Manage delivery addresses" },
              { href: "/account/orders",       icon: "📋", label: "My Orders",                 sub: "View order history" },
              { href: "/requisition-lists",    icon: "🗂️", label: "Order Guide / Req. Lists",  sub: "Manage requisition lists" },
              { href: "/account/wishlist",     icon: "♡",  label: "My Wishlist",               sub: "Saved items for later" },
              { href: "/whats-new",            icon: "✨", label: "What's New",                sub: "Browse latest arrivals" },
            ].map((ql) => (
              <Link key={ql.href} href={ql.href} className="acct-ql-card">
                <span className="acct-ql-icon">{ql.icon}</span>
                <span className="acct-ql-label">{ql.label}</span>
                <span className="acct-ql-sub">{ql.sub}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </AccountShell>
  );
}
