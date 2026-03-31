"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

interface MiniCartProps {
  open: boolean;
  onClose: () => void;
}

export function MiniCart({ open, onClose }: MiniCartProps) {
  const items      = useCartStore((s) => s.items);
  const subtotal   = useCartStore((s) => s.subtotal);
  const remove     = useCartStore((s) => s.remove);
  const setQuantity = useCartStore((s) => s.setQuantity);

  const panelRef   = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const lines = mounted ? Object.values(items) : [];
  const totalUnits = lines.reduce((s, l) => s + l.quantity, 0);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    // slight delay so the open-click itself doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", handler); };
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`mc-backdrop${open ? " mc-backdrop-visible" : ""}`}
        aria-hidden
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        className={`mc-panel${open ? " mc-panel-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mini Cart"
      >
        {/* Header */}
        <div className="mc-header">
          <span className="mc-title">
            {totalUnits} item{totalUnits !== 1 ? "s" : ""} in cart
          </span>
          <button className="mc-close" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {/* Items */}
        <div className="mc-body">
          {lines.length === 0 ? (
            <div className="mc-empty">
              <p>Your cart is empty.</p>
              <Link href="/" className="mc-browse-btn" onClick={onClose}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <ul className="mc-list">
              {lines.map((line) => (
                <li key={line.sku} className="mc-item">
                  {/* Image */}
                  <Link href={`/product/${line.sku}`} onClick={onClose} className="mc-img-link" tabIndex={-1}>
                    <div className="mc-img-wrap">
                      <img src={line.imageUrl} alt={line.name} className="mc-img" />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="mc-info">
                    <Link href={`/product/${line.sku}`} onClick={onClose} className="mc-item-name">
                      {line.name}
                    </Link>
                    <p className="mc-item-meta">Item#: {line.sku}</p>
                    <div className="mc-item-tags">
                      <span className="mc-case-tag">CASE</span>
                      <span className="mc-unit-size">{line.unitSize}</span>
                    </div>
                    <p className="mc-item-price">{money.format(line.price)}</p>

                    {/* Qty + actions */}
                    <div className="mc-item-actions">
                      <div className="mc-qty-row">
                        <button
                          className="mc-step-btn"
                          onClick={() => {
                            if (line.quantity - 1 < 1) return;
                            setQuantity(line.sku, line.quantity - 1);
                          }}
                          aria-label="Decrease"
                        >−</button>
                        <span className="mc-qty-val">{line.quantity}</span>
                        <button
                          className="mc-step-btn"
                          onClick={() => {
                            if (line.quantity + 1 > 200) return;
                            setQuantity(line.sku, line.quantity + 1);
                          }}
                          aria-label="Increase"
                        >+</button>
                      </div>
                      <Link href={`/product/${line.sku}`} className="mc-edit-btn" onClick={onClose}>
                        Edit
                      </Link>
                      <button
                        className="mc-remove-btn"
                        onClick={() => remove(line.sku)}
                        aria-label={`Remove ${line.name}`}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="mc-footer">
            <div className="mc-subtotal-row">
              <span>Subtotal:</span>
              <span className="mc-subtotal-val">{money.format(subtotal)}</span>
            </div>
            <Link href="/cart" className="mc-checkout-btn" onClick={onClose}>
              Proceed to Checkout →
            </Link>
            <Link href="/cart" className="mc-view-cart" onClick={onClose}>
              View and Edit Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
