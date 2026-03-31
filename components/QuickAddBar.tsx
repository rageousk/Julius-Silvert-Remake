"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { getProducts } from "@/lib/api/mock";
import { Product } from "@/lib/types";
import { useCartStore } from "@/store/useCartStore";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { sanitizeQuickAddLookup } from "@/lib/input-security";

const MAX_QTY = 200;
const CONFIRM_THRESHOLD = 50;

function sanitizeQty(raw: string) { return raw.replace(/[^0-9]/g, ""); }
function clampQty(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(MAX_QTY, Math.floor(n));
}

export function QuickAddBar() {
  const [open, setOpen]               = useState(false);
  const [lookup, setLookup]           = useState("");
  const [selectedProduct, setSelected]= useState<Product | null>(null);
  const [qty, setQty]                 = useState("1");
  const [qtyError, setQtyError]       = useState(false);
  const [catalog, setCatalog]         = useState<Product[]>([]);
  const [toast, setToast]             = useState<string | null>(null);
  const [toastErr, setToastErr]       = useState(false);
  const [showLimit, setShowLimit]     = useState(false);
  const [showSugg, setShowSugg]       = useState(false);
  // Dynamic bottom offset so the FAB lifts above the footer when it scrolls into view
  const [fabBottom, setFabBottom]     = useState(28);

  const inputRef   = useRef<HTMLInputElement>(null);
  const dropRef    = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  const addProduct = useCartStore((s) => s.addProduct);
  const cartItems  = useCartStore((s) => s.items);
  const { guard }  = useAuthGuard();

  useEffect(() => { getProducts().then(setCatalog); }, []);

  // Lift FAB above footer when footer enters the viewport
  useEffect(() => {
    const GAP = 16; // px gap between FAB and footer top edge
    function update() {
      const footer = document.querySelector<HTMLElement>(".site-footer");
      if (!footer) return;
      const { top } = footer.getBoundingClientRect();
      const vh = window.innerHeight;
      if (top < vh) {
        // Footer is (partially) visible — push FAB above its top edge
        setFabBottom(vh - top + GAP);
      } else {
        setFabBottom(28);
      }
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update(); // run once on mount
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Auto-focus search when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // Close panel on Escape
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    if (!showSugg) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!inputRef.current?.contains(t) && !dropRef.current?.contains(t)) {
        setShowSugg(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSugg]);

  // Dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const suggestions = useMemo(() => {
    const q = lookup.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 7);
  }, [lookup, catalog]);

  function handleLookupChange(val: string) {
    const v = sanitizeQuickAddLookup(val);
    setLookup(v);
    setSelected(null); // user is typing freely — clear any prior selection
    setShowSugg(v.trim().length > 0);
  }

  function handleQtyChange(raw: string) {
    const cleaned = sanitizeQty(raw);
    if (cleaned === "") { setQty(""); setQtyError(false); return; }
    const n = Number(cleaned);
    if (n > MAX_QTY) {
      setQtyError(true);
      setQty("");
      setShowLimit(true);
      return;
    }
    setQtyError(false);
    setQty(cleaned);
  }

  function handleQtyStep(delta: 1 | -1) {
    const cur = clampQty(Number(qty));
    const next = cur + delta;
    if (next > MAX_QTY) { setShowLimit(true); return; }
    if (next < 1) return;
    setQty(String(next));
    setQtyError(false);
  }

  function resolveAdd(match: Product, finalQty: number) {
    // Guard: adding would exceed per-SKU max
    const currentQty = cartItems[match.sku]?.quantity ?? 0;
    if (currentQty + finalQty > MAX_QTY) {
      setShowLimit(true);
      return;
    }
    addProduct(match, finalQty);
    setLookup("");
    setQty("1");
    setSelected(null);
    setShowSugg(false);
    setToastErr(false);
    setToast(`✓ ${finalQty} × ${match.name} added to cart`);
    inputRef.current?.focus();
  }

  const attemptAdd = guard((match: Product) => {
    // Quick Add intentionally skips the qty>50 confirmation — speed is the point
    resolveAdd(match, clampQty(Number(qty)));
  });

  function addFromQuery() {
    // If the user picked from suggestions, use that product directly
    if (selectedProduct) {
      attemptAdd(selectedProduct);
      return;
    }
    // Otherwise search by whatever is typed
    const raw = lookup.trim().toLowerCase();
    if (!raw) return;
    const match =
      catalog.find((p) => p.sku.toLowerCase() === raw || p.name.toLowerCase() === raw) ??
      catalog.find((p) => p.sku.toLowerCase().includes(raw) || p.name.toLowerCase().includes(raw));
    if (!match) {
      setToastErr(true);
      setToast("No matching product found. Try a SKU or name.");
      return;
    }
    attemptAdd(match);
  }

  return (
    <>
      {/* Dialogs rendered outside panel so they're always on top */}
      {showLimit && (
        <div className="limit-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowLimit(false)}>
          <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Max Limit Allowed: 200</h3>
            <p>
              To order more than 200 units per SKU, please contact us:<br />
              📧 <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a>
              &nbsp;·&nbsp;📞 (215) 455-1600
            </p>
            <button className="btn-primary" onClick={() => { setShowLimit(false); setQtyError(false); }}>OK, Got It</button>
          </div>
        </div>
      )}

      {/* Quick Add skips the qty confirmation — it's intentionally fast */}

      {/* Toast notification */}
      {toast && (
        <div
          className={`qa-fab-toast${toastErr ? " err" : ""}`}
          role="status"
          style={{ bottom: fabBottom + 68 }}
        >
          {toast}
        </div>
      )}

      {/* Slide-up panel — bottom tracks the FAB */}
      <div
        ref={panelRef}
        className={`qa-panel${open ? " open" : ""}`}
        role="dialog"
        aria-label="Quick Add to Cart"
        aria-hidden={!open}
        style={{ bottom: fabBottom + 60 }}
      >
        {/* Panel header */}
        <div className="qa-panel-header">
          <div className="qa-panel-title">
            <svg width="16" height="16" viewBox="0 0 24 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: "middle" }}>
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Quick Add to Cart
          </div>
          <span className="qa-panel-hint">Type a SKU or product name, set qty, hit Enter</span>
          <button className="qa-panel-close" onClick={() => setOpen(false)} aria-label="Close Quick Add">✕</button>
        </div>

        {/* Panel body */}
        <div className="qa-panel-body">
          {/* Search — with inline clear × when a product is selected */}
          <div className="qa-search-wrap" style={{ position: "relative", flex: 1 }}>
            <input
              ref={inputRef}
              value={lookup}
              onChange={(e) => handleLookupChange(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") { e.preventDefault(); addFromQuery(); }
                if (e.key === "Escape") { setShowSugg(false); }
              }}
              onFocus={() => { if (lookup.trim()) setShowSugg(true); }}
              placeholder="Type SKU or product name…"
              className={`qa-search-input${selectedProduct ? " qa-input-selected" : ""}`}
              style={{ paddingRight: lookup ? "32px" : undefined }}
              autoComplete="off"
            />

            {/* Inline × clear button inside the input */}
            {lookup && (
              <button
                className="qa-input-clear"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setLookup("");
                  setSelected(null);
                  setShowSugg(false);
                  inputRef.current?.focus();
                }}
                aria-label="Clear"
                tabIndex={-1}
              >✕</button>
            )}

            {/* Suggestions — clicking SELECTS into the input, does NOT add yet */}
            {showSugg && suggestions.length > 0 && (
              <div ref={dropRef} className="qa-suggestions qa-suggestions-up">
                {suggestions.map((p) => (
                  <button
                    key={p.sku}
                    className="qa-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLookup(p.name);
                      setSelected(p);
                      setShowSugg(false);
                      // Jump focus to qty so user can adjust before hitting Add
                      setTimeout(() => {
                        const qtyEl = document.querySelector<HTMLInputElement>(".qa-panel-body .stepper-input");
                        qtyEl?.focus();
                        qtyEl?.select();
                      }, 60);
                    }}
                  >
                    <img src={p.imageUrl} alt={p.name} className="qa-sug-img" />
                    <div className="qa-sug-info">
                      <span className="qa-sug-name">{p.name}</span>
                      <span className="qa-sug-sku">{p.sku} · {p.unitSize}</span>
                    </div>
                    <span className="qa-sug-price">${p.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Qty stepper */}
          <div className="qa-stepper">
            <button type="button" className="stepper-btn" onClick={() => handleQtyStep(-1)} aria-label="Decrease">−</button>
            <input
              type="text"
              inputMode="numeric"
              className={`stepper-input${qtyError ? " qty-error" : ""}`}
              value={qty}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => handleQtyChange(e.target.value)}
              onBlur={() => { setQty(String(clampQty(Number(qty)))); setQtyError(false); }}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault();
                if (e.key === "Enter") { e.preventDefault(); addFromQuery(); }
              }}
              style={{ width: 46 }}
              aria-label="Quantity"
            />
            <button type="button" className="stepper-btn" onClick={() => handleQtyStep(1)} aria-label="Increase">+</button>
          </div>

          <button className="qa-add-btn" onClick={addFromQuery}>
            Add to Cart
          </button>
        </div>
      </div>

      {/* Backdrop (mobile) */}
      {open && <div className="qa-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Floating Action Button */}
      <button
        className={`qa-fab${open ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Quick Add to Cart"
        title="Quick Add (type SKU or name)"
        style={{ bottom: fabBottom }}
      >
        <svg className="qa-fab-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {open ? (
            /* X icon when open */
            <>
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </>
          ) : (
            /* Lightning bolt / quick-add icon */
            <>
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              <line x1="12" y1="10" x2="12" y2="14"/><line x1="10" y1="12" x2="14" y2="12"/>
            </>
          )}
        </svg>
        <span className="qa-fab-label">{open ? "Close" : "Quick Add"}</span>
      </button>
    </>
  );
}
