"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { getDisplayName } from "@/lib/userProfile";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

const NAV_LINKS = [
  { label: "Account Dashboard",          href: "/account/dashboard",    key: "dashboard" },
  { label: "Account Information",         href: "/account/information",  key: "information" },
  { label: "Address Book",               href: "/account/address-book", key: "address-book" },
  { label: "My Orders",                  href: "/account/orders",       key: "orders" },
  { label: "Order Guide / Req. Lists",   href: "/requisition-lists",    key: "requisition" },
  { label: "My Wishlist",               href: "/account/wishlist",     key: "wishlist" },
];

export function AccountShell({ title, children }: Props) {
  const pathname       = usePathname();
  const wishlistRaw    = useWishlistStore((s) => s.items);
  const wishlistItems  = wishlistRaw.filter((i) => i?.sku);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function navActive(href: string): boolean {
    if (href === "/requisition-lists") return pathname.startsWith("/requisition-lists");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <section className="container acct-page">
      <h2 className="acct-page-title">{title}</h2>
      <div className="acct-layout">

        {/* ── Sidebar ── */}
        <aside className="acct-sidebar">
          <nav className="acct-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`acct-nav-link${navActive(link.href) ? " active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="acct-nav-divider" />
            <button
              className="acct-nav-signout"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign Out
            </button>
          </nav>

          {/* Mini wishlist preview */}
          {mounted && wishlistItems.length > 0 && (
            <div className="acct-sidebar-wishlist">
              <p className="acct-sidebar-wl-title">
                My Wish List <span>({wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"})</span>
              </p>
              <div className="acct-sidebar-wl-list">
                {wishlistItems.slice(0, 3).map((item) => (
                  <Link key={item.sku} href={`/product/${item.sku}`} className="acct-wl-row">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="acct-wl-img"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/48x48?text=IMG"; }}
                    />
                    <div className="acct-wl-info">
                      <span className="acct-wl-name">{item.name}</span>
                      <span className="acct-wl-price">
                        ${item.price.toFixed(2)} {item.unitSize}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              {wishlistItems.length > 3 && (
                <Link href="/account/wishlist" className="acct-wl-more">
                  View all {wishlistItems.length} items →
                </Link>
              )}
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <div className="acct-main">{children}</div>
      </div>
    </section>
  );
}
