"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCartStore } from "@/store/useCartStore";
import { useSession, signOut } from "next-auth/react";
import { getDisplayName } from "@/lib/userProfile";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { SearchOverlay } from "@/components/SearchOverlay";
import { MiniCart } from "@/components/MiniCart";
import { HelpRequestPanel } from "@/components/HelpRequestPanel";

export function Header() {
  const [portalReady, setPortalReady] = useState(false);
  const [compactHeaderSearch, setCompactHeaderSearch] = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniCartOpen,   setMiniCartOpen]   = useState(false);
  const [helpOpen,       setHelpOpen]       = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const headerRef  = useRef<HTMLElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileNavPanelRef = useRef<HTMLDivElement>(null);
  const itemCount  = useCartStore(
    (s) => Object.values(s.items).reduce((acc, i) => acc + i.quantity, 0)
  );
  const { data: session } = useSession();
  const isLoggedIn  = !!session?.user;
  const userEmail   = session?.user?.email ?? null;
  const providerName = session?.user?.name ?? userEmail?.split("@")[0] ?? "Guest";
  // Prefer localStorage-persisted custom name over the SSO provider's name
  const displayName = userEmail
    ? getDisplayName(userEmail, providerName)
    : providerName;
  const initials    = displayName
    .split(/[\s._-]/).filter(Boolean)
    .slice(0, 2).map((w: string) => w[0].toUpperCase()).join("") || "??";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setVar = () => {
      document.documentElement.style.setProperty(
        "--mobile-drawer-top",
        `${el.offsetHeight}px`
      );
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener("resize", setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
      document.documentElement.style.removeProperty("--mobile-drawer-top");
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const closeIfDesktop = () => {
      if (!mq.matches) setMobileMenuOpen(false);
    };
    mq.addEventListener("change", closeIfDesktop);
    return () => mq.removeEventListener("change", closeIfDesktop);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnOutside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (mobileNavPanelRef.current?.contains(t)) return;
      if (mobileMenuBtnRef.current?.contains(t)) return;
      setMobileMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside, true);
    return () => document.removeEventListener("pointerdown", closeOnOutside, true);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const apply = () => setCompactHeaderSearch(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="header-root">
      <header ref={headerRef} className="topbar">

        {/* ── Utility bar ── */}
        <div className="topbar-utility">
          <div className="container topbar-utility-inner">
            <div className="utility-left">
              <span className="utility-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <a href="tel:2154551600">(215) 455-1600</a>
              </span>
              <span className="utility-dot" aria-hidden>·</span>
              <span className="utility-item">Mon–Fri 7am–5pm EST</span>
              <span className="utility-dot" aria-hidden>·</span>
              <span className="utility-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Philadelphia, PA
              </span>
            </div>
            <div className="utility-right">
              <span className="utility-item">Est. 1915</span>
              <span className="utility-dot" aria-hidden>·</span>
              <a href="mailto:orders@juliussilvert.com" className="utility-item utility-email">
                orders@juliussilvert.com
              </a>
            </div>
          </div>
        </div>

        {/* ── Main header row ── */}
        <div className="container topbar-inner">

          {/* Logo */}
          <Link href="/" className="brand-link" aria-label="Julius Silvert – Go to homepage">
            <span className="brand-julius">Julius</span>
            <span className="brand-silvert-wrap">
              <span className="brand-silvert">Silvert</span>
              <span className="brand-est">Est. 1915</span>
            </span>
          </Link>

          {/* Search */}
          <div className="topbar-search-wrap">
            <SearchOverlay compact={compactHeaderSearch} />
          </div>

          {/* Right actions */}
          <nav className="top-links" aria-label="Account actions">

            {/* Order Guide */}
            <Link href="/requisition-lists" className="hdr-action-btn hdr-action-btn--order">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
              <span className="hdr-action-label">Order Guide</span>
            </Link>

            <div className="hdr-divider" aria-hidden />

            {/* Help */}
            <button
              className={`hdr-action-btn${helpOpen ? " hdr-action-btn--active" : ""}`}
              aria-label="Submit a Request"
              title="Submit a Request"
              onClick={() => setHelpOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
              </svg>
              <span className="hdr-action-label">Help</span>
            </button>

            {/* Cart */}
            <button
              className={`hdr-action-btn mc-trigger${miniCartOpen ? " hdr-action-btn--active" : ""}`}
              aria-label="View Cart"
              title="View Cart"
              onClick={() => setMiniCartOpen((v) => !v)}
            >
              <span className="hdr-cart-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {itemCount > 0 && (
                  <span className="hdr-cart-badge">{itemCount > 99 ? "99+" : itemCount}</span>
                )}
              </span>
              <span className="hdr-action-label">Cart</span>
            </button>

            {/* Account */}
            <div className="profile-menu-wrap" ref={profileRef}
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button
                className={`hdr-action-btn hdr-action-btn--profile${profileOpen ? " hdr-action-btn--active" : ""}`}
                onClick={() => setProfileOpen((p) => !p)}
                aria-expanded={profileOpen}
                aria-label="My Account"
                title="My Account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span className="hdr-action-label">Account</span>
              </button>

              <div className={`profile-menu${profileOpen ? " open" : ""}`}>
                <div className="profile-menu-header">
                  <div className="profile-menu-avatar">{initials}</div>
                  <div className="profile-menu-header-text">
                    <p className="profile-menu-greeting">Signed in as</p>
                    <p className="profile-menu-account" title={userEmail ?? ""}>{userEmail ?? "Guest"}</p>
                  </div>
                </div>
                <Link href="/account/dashboard"    onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  Account Dashboard
                </Link>
                <Link href="/account/information"  onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Account Information
                </Link>
                <Link href="/account/address-book" onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Address Book
                </Link>
                <Link href="/account/orders"       onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                  My Orders
                </Link>
                <Link href="/requisition-lists"    onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Order Guide / Req. Lists
                </Link>
                <Link href="/account/wishlist"     onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  My Wishlist
                </Link>
                <div className="profile-menu-divider" />
                {isLoggedIn ? (
                  <button
                    className="profile-menu-signout profile-menu-signout-btn"
                    onClick={() => { signOut({ callbackUrl: "/login" }); setProfileOpen(false); }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                ) : (
                  <Link href="/login" className="profile-menu-signout" onClick={() => setProfileOpen(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
                    Sign In
                  </Link>
                )}
              </div>
            </div>

          </nav>

          <button
            ref={mobileMenuBtnRef}
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-expanded={mobileMenuOpen}
            aria-haspopup="true"
            aria-controls="mobile-nav-panel"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Category mega nav ── */}
        <div className="container category-nav mega-nav">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="mega-nav-item">
              <Link href={item.href} className="category-nav-item">{item.label}</Link>
              <div className="mega-panel">
                <div className="mega-panel-grid">
                  {item.subcategories.map((sub) => (
                    <Link key={sub.slug} href={`${item.href}?sub=${sub.slug}`} className="mega-sub-item">
                      {sub.label}
                    </Link>
                  ))}
                </div>
                <Link href={item.href} className="mega-view-all">
                  VIEW ALL {item.label}
                </Link>
              </div>
            </div>
          ))}
        </div>

      </header>

      {portalReady &&
        mobileMenuOpen &&
        compactHeaderSearch &&
        typeof document !== "undefined" &&
        createPortal(
            <div
              ref={mobileNavPanelRef}
              className="mobile-drawer mobile-drawer--overlay open"
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="false"
              aria-label="Site navigation"
            >
              <div className="mobile-drawer-inner">
                <details className="mobile-nav-group mobile-nav-group--accordion">
                  <summary>Quick actions</summary>
                  <div className="mobile-accordion-panel">
                    <Link href="/requisition-lists" onClick={() => setMobileMenuOpen(false)}>Order Guide</Link>
                    <button
                      type="button"
                      className="mobile-drawer-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMiniCartOpen(true);
                      }}
                    >
                      Cart{itemCount > 0 ? ` (${itemCount > 99 ? "99+" : itemCount})` : ""}
                    </button>
                    <button
                      type="button"
                      className="mobile-drawer-btn"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setHelpOpen(true);
                      }}
                    >
                      Help · Submit a request
                    </button>
                  </div>
                </details>

                <details className="mobile-nav-group mobile-nav-group--accordion">
                  <summary>My account</summary>
                  <div className="mobile-accordion-panel">
                    <Link href="/account/dashboard"    onClick={() => setMobileMenuOpen(false)}>Account Dashboard</Link>
                    <Link href="/account/information"  onClick={() => setMobileMenuOpen(false)}>Account Information</Link>
                    <Link href="/account/address-book" onClick={() => setMobileMenuOpen(false)}>Address Book</Link>
                    <Link href="/account/orders"       onClick={() => setMobileMenuOpen(false)}>My Orders</Link>
                    <Link href="/account/wishlist"     onClick={() => setMobileMenuOpen(false)}>My Wishlist</Link>
                    {isLoggedIn ? (
                      <button
                        type="button"
                        className="mobile-drawer-btn"
                        onClick={() => {
                          signOut({ callbackUrl: "/login" });
                          setMobileMenuOpen(false);
                        }}
                      >
                        Sign out
                      </button>
                    ) : (
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                    )}
                  </div>
                </details>

                <p className="mobile-drawer-heading mobile-drawer-heading--spaced">Shop categories</p>
                {NAV_ITEMS.map((item) => (
                  <details key={item.slug} className="mobile-nav-group">
                    <summary>{item.label}</summary>
                    <Link href={item.href} onClick={() => setMobileMenuOpen(false)} className="mobile-view-all">
                      View All {item.label}
                    </Link>
                    <div className="mobile-sub-links">
                      {item.subcategories.map((sub) => (
                        <Link key={sub.slug} href={`${item.href}?sub=${sub.slug}`} onClick={() => setMobileMenuOpen(false)}>
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>,
          document.body
        )}

      <MiniCart open={miniCartOpen} onClose={() => setMiniCartOpen(false)} />
      <HelpRequestPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
