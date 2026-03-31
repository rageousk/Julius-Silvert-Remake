"use client";

import { KeyboardEvent, useMemo, useState } from "react";
import { useCartStore } from "@/store/useCartStore";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const MAX_QTY = 200;
const CONFIRM_THRESHOLD = 50;

type SortField = "sku" | "name" | "price" | "qty" | "total";
type SortDir = "asc" | "desc";

function sanitize(raw: string) { return raw.replace(/[^0-9]/g, ""); }
function clamp(n: number) { return Math.min(MAX_QTY, Math.max(1, Math.floor(n))); }

export function CartTable() {
  const items     = useCartStore((s) => s.items);
  const subtotal  = useCartStore((s) => s.subtotal);
  const grandTotal= useCartStore((s) => s.grandTotal);
  const setQty    = useCartStore((s) => s.setQuantity);
  const remove    = useCartStore((s) => s.remove);
  const clear     = useCartStore((s) => s.clear);

  const [draft, setDraft]         = useState<Record<string, string>>({});
  const [qtyErr, setQtyErr]       = useState<Record<string, boolean>>({});
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("sku");
  const [sortDir, setSortDir]     = useState<SortDir>("asc");
  const [showLimit, setShowLimit] = useState(false);
  const [confirm, setConfirm]     = useState<{sku: string; qty: number} | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const rawLines = useMemo(() => Object.values(items), [items]);

  const lines = useMemo(() => {
    const sorted = [...rawLines].sort((a, b) => {
      let cmp = 0;
      if (sortField === "sku")   cmp = a.sku.localeCompare(b.sku);
      if (sortField === "name")  cmp = a.name.localeCompare(b.name);
      if (sortField === "price") cmp = a.price - b.price;
      if (sortField === "qty")   cmp = a.quantity - b.quantity;
      if (sortField === "total") cmp = a.lineSubtotal - b.lineSubtotal;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rawLines, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return <span className="ct-sort-idle">⇅</span>;
    return <span className="ct-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function getDraft(sku: string) {
    return draft[sku] ?? String(items[sku]?.quantity ?? "1");
  }

  function handleQtyChange(sku: string, raw: string) {
    const cleaned = sanitize(raw);
    if (cleaned === "") {
      setDraft((p) => ({ ...p, [sku]: "" }));
      setQtyErr((p) => ({ ...p, [sku]: false }));
      return;
    }
    const n = Number(cleaned);
    if (n > MAX_QTY) {
      setDraft((p) => ({ ...p, [sku]: "" }));
      setQtyErr((p) => ({ ...p, [sku]: true }));
      setShowLimit(true);
      return;
    }
    setQtyErr((p) => ({ ...p, [sku]: false }));
    setDraft((p) => ({ ...p, [sku]: cleaned }));
  }

  function commitQty(sku: string) {
    const val = clamp(Number(getDraft(sku)));
    setDraft((p) => ({ ...p, [sku]: String(val) }));
    setQtyErr((p) => ({ ...p, [sku]: false }));
    if (val > CONFIRM_THRESHOLD && val !== items[sku]?.quantity) {
      setConfirm({ sku, qty: val });
    } else {
      setQty(sku, val);
    }
  }

  function stepQty(sku: string, delta: 1 | -1) {
    const cur = clamp(Number(getDraft(sku)));
    const next = cur + delta;
    if (next > MAX_QTY) { setShowLimit(true); return; }
    if (next < 1) return;
    setDraft((p) => ({ ...p, [sku]: String(next) }));
    setQtyErr((p) => ({ ...p, [sku]: false }));
    if (next > CONFIRM_THRESHOLD) {
      setConfirm({ sku, qty: next });
    } else {
      setQty(sku, next);
    }
  }

  // Checkboxes
  function toggleOne(sku: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  }
  const allChecked = lines.length > 0 && selected.size === lines.length;
  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(lines.map((l) => l.sku)));
  }
  function deleteSelected() {
    if (selected.size === 0) return;
    selected.forEach((sku) => remove(sku));
    setSelected(new Set());
  }

  if (!lines.length) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon">🛒</div>
        <h2>Your Cart is Empty</h2>
        <p>Add products from the catalog or use the Quick Add bar below.</p>
        <a href="/" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
          Browse Catalog
        </a>
      </div>
    );
  }

  return (
    <>
      {/* Limit dialog */}
      {showLimit && (
        <div className="limit-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowLimit(false)}>
          <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Max Limit Allowed: 200</h3>
            <p>
              To order more than 200 units per SKU, please contact us:<br />
              📧 <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a>
              &nbsp;·&nbsp; 📞 (215) 455-1600
            </p>
            <button className="btn-primary" onClick={() => { setShowLimit(false); }}>OK, Got It</button>
          </div>
        </div>
      )}

      {/* Qty > 50 confirmation */}
      {confirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <h3>Confirm Quantity</h3>
            <p>
              You&apos;re setting <strong>{items[confirm.sku]?.name}</strong> to{" "}
              <strong>{confirm.qty} units</strong>. Are you sure?
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn-no" onClick={() => {
                setDraft((p) => ({ ...p, [confirm.sku]: String(items[confirm.sku]?.quantity ?? 1) }));
                setConfirm(null);
              }}>Cancel</button>
              <button className="confirm-btn-yes" onClick={() => {
                setQty(confirm.sku, confirm.qty);
                setConfirm(null);
              }}>Yes, Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear cart confirmation */}
      {showClearConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <h3>Clear Entire Cart?</h3>
            <p>All {lines.length} item{lines.length !== 1 ? "s" : ""} will be removed. This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="confirm-btn-no" onClick={() => setShowClearConfirm(false)}>Cancel</button>
              <button className="confirm-btn-yes" style={{ background: "#b00020" }} onClick={() => { clear(); setShowClearConfirm(false); setSelected(new Set()); }}>
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single action bar — no duplicate checkbox */}
      <div className="ct-bulk-bar">
        {/* Left: Select All */}
        <label className="ct-select-all">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            aria-label="Select all items"
          />
          <span>Select All</span>
        </label>

        {/* Right: contextual actions pushed to far right */}
        <div className="ct-bulk-right">
          {selected.size > 0 && (
            <>
              <span className="ct-selected-count">{selected.size} selected</span>
              <button className="rl-delete-sel-btn" onClick={deleteSelected}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "middle", marginRight: 4 }}>
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                </svg>
                Remove ({selected.size})
              </button>
            </>
          )}
          <button className="ct-clear-btn" onClick={() => setShowClearConfirm(true)}>
            Clear Cart
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ct-wrap">
        <table className="ct-table">
          <thead>
            <tr>
              {/* NO checkbox in header — Select All lives only in the bar above */}
              <th className="ct-th-check" />
              <th className="ct-th-img" />
              <th className="ct-th ct-sortable" onClick={() => toggleSort("sku")}>
                SKU {sortIcon("sku")}
              </th>
              <th className="ct-th ct-sortable" onClick={() => toggleSort("name")}>
                Product {sortIcon("name")}
              </th>
              <th className="ct-th">Unit Size</th>
              <th className="ct-th ct-sortable" onClick={() => toggleSort("price")}>
                Price {sortIcon("price")}
              </th>
              <th className="ct-th ct-sortable" onClick={() => toggleSort("qty")}>
                Qty {sortIcon("qty")}
              </th>
              <th className="ct-th ct-sortable" onClick={() => toggleSort("total")}>
                Line Total {sortIcon("total")}
              </th>
              <th className="ct-th" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.sku} className={`ct-row${selected.has(line.sku) ? " ct-selected" : ""}`}>
                <td className="ct-td-check">
                  <input
                    type="checkbox"
                    checked={selected.has(line.sku)}
                    onChange={() => toggleOne(line.sku)}
                    aria-label={`Select ${line.name}`}
                  />
                </td>
                <td className="ct-td-img">
                  {line.imageUrl && (
                    <a href={`/product/${line.sku}`} className="ct-img-link" tabIndex={-1} aria-hidden>
                      <img src={line.imageUrl} alt={line.name} className="ct-item-img" />
                    </a>
                  )}
                </td>
                <td className="ct-td ct-sku">{line.sku}</td>
                <td className="ct-td ct-name">
                  <a href={`/product/${line.sku}`} className="ct-name-link">{line.name}</a>
                </td>
                <td className="ct-td ct-unit">{line.unitSize}</td>
                <td className="ct-td ct-price">{money.format(line.price)}</td>
                <td className="ct-td">
                  <div className="sr-stepper">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => stepQty(line.sku, -1)}
                      aria-label="Decrease"
                    >−</button>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`stepper-input${qtyErr[line.sku] ? " qty-error" : ""}`}
                      value={getDraft(line.sku)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => handleQtyChange(line.sku, e.target.value)}
                      onBlur={() => commitQty(line.sku)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault();
                        if (e.key === "Enter") { e.preventDefault(); commitQty(line.sku); }
                      }}
                      aria-label={`Qty for ${line.name}`}
                    />
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => stepQty(line.sku, 1)}
                      aria-label="Increase"
                    >+</button>
                  </div>
                </td>
                <td className="ct-td ct-total">{money.format(line.lineSubtotal)}</td>
                <td className="ct-td">
                  <button
                    className="ct-remove-btn"
                    onClick={() => remove(line.sku)}
                    title="Remove item"
                    aria-label={`Remove ${line.name}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="ct-totals">
        <div className="ct-totals-row">
          <span>Subtotal</span>
          <strong>{money.format(subtotal)}</strong>
        </div>
        <div className="ct-totals-row">
          <span>Grand Total</span>
          <strong className="ct-grand">{money.format(grandTotal)}</strong>
        </div>
        <button
          className="btn-primary"
          style={{ width: "100%", marginTop: 14, padding: "11px 0", fontSize: "0.95rem" }}
          onClick={() => alert("Checkout flow coming soon — contact your rep to finalise orders.")}
        >
          Proceed to Checkout
        </button>
      </div>
    </>
  );
}
