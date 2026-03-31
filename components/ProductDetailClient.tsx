"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Product } from "@/lib/types";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useRequisitionStore } from "@/store/useRequisitionStore";

const MAX_QTY = 200;
const CONFIRM_THRESHOLD = 50;

function clampQty(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(MAX_QTY, Math.floor(n));
}
function sanitize(raw: string) { return raw.replace(/[^0-9]/g, ""); }

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// Generates a realistic product description from available fields
function buildDescription(product: Product): { overview: string; features: string[] } {
  const categoryDescriptions: Record<string, string> = {
    "Meat & Poultry": "Sourced from trusted farms committed to quality and humane practices, this premium cut delivers exceptional flavor and consistency for professional kitchens.",
    "Dairy & Eggs":   "Fresh from local and regional dairies, this product maintains strict cold-chain integrity to deliver peak freshness and nutritional value.",
    "Cheese & Charcuterie": "Crafted using time-honored artisanal techniques, this selection brings authentic character and depth to cheese boards, charcuterie platters, and culinary creations.",
    "Seafood":        "Sustainably harvested and processed at peak freshness, this seafood product meets the highest standards for flavor, texture, and food safety.",
    "Produce":        "Carefully selected at the peak of ripeness, this item brings vibrant color, fresh aroma, and superior taste to any dish.",
    "Frozen":         "Flash-frozen to lock in peak flavor and nutrition, this product provides the convenience of extended shelf life without sacrificing quality.",
    "Pantry":         "A cornerstone ingredient for professional kitchens, this pantry staple delivers consistent quality and versatile application across a wide range of culinary uses.",
    "Baking & Pastry":"Formulated for professional pastry chefs and bakers, this ingredient ensures consistent results, reliable performance, and exceptional finished product quality.",
    "Oils & Vinegars":"Cold-pressed and carefully bottled to preserve its natural character, this product delivers exceptional depth of flavor to dressings, marinades, and finishing applications.",
    "Supplies":       "Designed for high-volume professional foodservice environments, this supply item provides reliability, durability, and cost-effectiveness.",
  };

  const overview = `${product.name} is a professional-grade ${product.subcategory.toLowerCase()} product available in ${product.unitSize}. ${
    categoryDescriptions[product.category] ?? "A staple of professional kitchens, this product is trusted by chefs for its consistent quality and flavor."
  }`;

  const features = [
    `SKU: ${product.sku} — easy reordering with Julius Silvert's B2B platform`,
    `Pack size: ${product.unitSize} — optimized for commercial kitchen workflow`,
    `Category: ${product.category} / ${product.subcategory}`,
    "Sourced from verified suppliers meeting Julius Silvert quality standards",
    "Suitable for high-volume foodservice, catering, and restaurant operations",
  ];

  return { overview, features };
}

interface Props { product: Product }

export default function ProductDetailClient({ product }: Props) {
  const addToCart  = useCartStore((s) => s.addProduct);
  const cartItems  = useCartStore((s) => s.items);
  const { addItem: wishlistAdd, removeItem: wishlistRemove, isInWishlist } = useWishlistStore();
  const { lists, addItemToList, createList } = useRequisitionStore();

  // Delay persisted-store reads until after hydration to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cartQty    = mounted ? (cartItems[product.sku]?.quantity ?? 0) : 0;
  const inWishlist = mounted ? isInWishlist(product.sku) : false;

  const [qty,            setQty]            = useState("1");
  const [qtyError,       setQtyError]       = useState(false);
  const [addedToCart,    setAddedToCart]     = useState(false);
  const [showLimit,      setShowLimit]       = useState(false);
  const [showConfirm,    setShowConfirm]     = useState(false);
  const [pendingQty,     setPendingQty]      = useState(1);
  const [pendingAction,  setPendingAction]   = useState<"cart" | { listId: string; listName: string } | null>(null);

  // List menu
  const [showListMenu,   setShowListMenu]    = useState(false);
  const [menuPos,        setMenuPos]         = useState({ top: 0, left: 0 });
  const [listToast,      setListToast]       = useState<string | null>(null);
  const listBtnRef = useRef<HTMLButtonElement>(null);

  // Create list modal
  const [showCreateList, setShowCreateList]  = useState(false);
  const [newListName,    setNewListName]      = useState("");
  const [newListDesc,    setNewListDesc]      = useState("");
  const [newListErr,     setNewListErr]       = useState("");

  // Close list menu on outside click / scroll
  useEffect(() => {
    if (!showListMenu) return;
    const handler = (e: MouseEvent) => {
      const menu = document.getElementById("pdp-list-menu");
      if (!menu?.contains(e.target as Node) && !listBtnRef.current?.contains(e.target as Node))
        setShowListMenu(false);
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", () => setShowListMenu(false), { once: true });
    return () => document.removeEventListener("mousedown", handler);
  }, [showListMenu]);

  function handleStep(delta: 1 | -1) {
    const cur  = clampQty(Number(qty));
    const next = cur + delta;
    if (next > MAX_QTY) { setShowLimit(true); return; }
    if (next < 1) return;
    setQty(String(next));
    setQtyError(false);
  }

  function handleQtyChange(raw: string) {
    const cleaned = sanitize(raw);
    if (cleaned === "") { setQty(""); setQtyError(false); return; }
    const n = Number(cleaned);
    if (n > MAX_QTY) { setQtyError(true); setQty(""); setShowLimit(true); return; }
    setQtyError(false);
    setQty(cleaned);
  }

  function handleQtyBlur() {
    const n = clampQty(Number(qty));
    setQty(String(n));
    setQtyError(false);
  }

  function executeAction(q: number, action: "cart" | { listId: string; listName: string }) {
    if (action === "cart") {
      // Guard: adding q would exceed the per-SKU max
      const currentQty = cartItems[product.sku]?.quantity ?? 0;
      if (currentQty + q > MAX_QTY) {
        setShowLimit(true);
        return;
      }
      addToCart({ sku: product.sku, name: product.name, price: product.price, imageUrl: product.imageUrl, unitSize: product.unitSize }, q);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1800);
    } else {
      addItemToList(action.listId, product, q);
      setListToast(action.listName);
      setTimeout(() => setListToast(null), 2400);
    }
  }

  function requestAction(q: number, action: "cart" | { listId: string; listName: string }) {
    // Check cart limit first before the qty>50 confirmation
    if (action === "cart") {
      const currentQty = cartItems[product.sku]?.quantity ?? 0;
      if (currentQty + q > MAX_QTY) {
        setShowLimit(true);
        return;
      }
    }
    if (q > CONFIRM_THRESHOLD) {
      setPendingQty(q);
      setPendingAction(action);
      setShowConfirm(true);
    } else {
      executeAction(q, action);
    }
  }

  function handleAdd() {
    requestAction(clampQty(Number(qty)), "cart");
  }

  function openListMenu() {
    const rect = listBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const estHeight  = Math.min(lists.length * 44 + 80, 300);
    setMenuPos({
      top:  spaceBelow < estHeight ? rect.top - estHeight - 6 : rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 240),
    });
    setShowListMenu((v) => !v);
  }

  function handleAddToList(listId: string, listName: string) {
    setShowListMenu(false);
    requestAction(clampQty(Number(qty)), { listId, listName });
  }

  function handleCreateListSubmit() {
    const name = newListName.trim();
    if (!name) { setNewListErr("List name is required."); return; }
    if (lists.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      setNewListErr("A list with this name already exists."); return;
    }
    const newId = createList(name, newListDesc.trim());
    setShowCreateList(false);
    if (newId) requestAction(clampQty(Number(qty)), { listId: newId, listName: name });
  }

  const { overview, features } = buildDescription(product);

  return (
    <>
      {/* ── Modals ── */}
      {showLimit && (
        <div className="limit-modal-backdrop" onClick={() => setShowLimit(false)}>
          <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Max Limit Allowed: 200</h3>
            <p>To order more, contact us:<br />
              📧 <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a>
              &nbsp;·&nbsp;📞 (215) 455-1600</p>
            <button className="btn-primary" onClick={() => { setShowLimit(false); setQtyError(false); }}>OK, Got It</button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <h3>Confirm Quantity</h3>
            <p>You&apos;re about to add <strong>{pendingQty} × {product.name}</strong> ({product.unitSize}). Confirm?</p>
            <div className="confirm-actions">
              <button className="confirm-btn-no"  onClick={() => { setShowConfirm(false); setPendingAction(null); }}>Cancel</button>
              <button className="confirm-btn-yes" onClick={() => { if (pendingAction) executeAction(pendingQty, pendingAction); setShowConfirm(false); setPendingAction(null); }}>Yes, Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showCreateList && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <h3>Create New Requisition List</h3>
            <div className="create-list-field">
              <label>List Name *</label>
              <input type="text" placeholder="e.g. Weekly Order" value={newListName}
                autoFocus
                onChange={(e) => { setNewListName(e.target.value); setNewListErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateListSubmit(); }}
                className={newListErr ? "field-error" : ""}
              />
              {newListErr && <span style={{ color: "#e53e3e", fontSize: "0.78rem" }}>{newListErr}</span>}
            </div>
            <div className="create-list-field">
              <label>Description (optional)</label>
              <textarea rows={2} value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} placeholder="What is this list for?" />
            </div>
            <div className="confirm-actions">
              <button className="confirm-btn-no"  onClick={() => setShowCreateList(false)}>Cancel</button>
              <button className="confirm-btn-yes" onClick={handleCreateListSubmit}>Create &amp; Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* List menu portal */}
      {showListMenu && typeof document !== "undefined" && createPortal(
        <div id="pdp-list-menu" className="pc-list-menu" style={{ top: menuPos.top, left: menuPos.left }}>
          <p className="pc-list-menu-title">Add to Requisition List</p>
          {lists.length === 0
            ? <div style={{ padding: "10px 12px", fontSize: "0.83rem", color: "var(--ink-soft)" }}>No lists yet.</div>
            : lists.map((list) => (
              <button key={list.id} className="pc-list-menu-item" onClick={() => handleAddToList(list.id, list.name)}>
                <span className="pc-list-name">{list.name}</span>
                <span className="pc-list-count">{list.items.length} items</span>
              </button>
            ))
          }
          <button className="pc-list-menu-create" onClick={() => { setShowListMenu(false); setNewListName(""); setNewListDesc(""); setNewListErr(""); setShowCreateList(true); }}>
            + Create New List
          </button>
        </div>,
        document.body
      )}

      {/* ── Main product layout ── */}
      <div className="pdp-layout">

        {/* Left: image */}
        <div className="pdp-gallery">
          <div className="pdp-main-img-wrap">
            <img src={product.imageUrl} alt={product.name} className="pdp-main-img" />
            {cartQty > 0 && (
              <span className="pdp-cart-badge">In Cart: {cartQty}</span>
            )}
          </div>
          {/* Thumbnail strip — single product, just repeat */}
          <div className="pdp-thumb-strip">
            <button className="pdp-thumb pdp-thumb-active" aria-label="Main image">
              <img src={product.imageUrl} alt={product.name} />
            </button>
          </div>
        </div>

        {/* Right: details */}
        <div className="pdp-details">
          <p className="pdp-category-label">{product.category} &rsaquo; {product.subcategory}</p>
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp-meta-row">
            <span className="pdp-sku-label">Item#:</span>
            <span className="pdp-sku-val">{product.sku}</span>
          </div>

          <div className="pdp-unit-tags">
            <span className="pdp-unit-tag active">CASE</span>
            <span className="pdp-unit-sub">{product.unitSize}</span>
          </div>

          <p className="pdp-price">{money.format(product.price)}</p>
          <p className="pdp-lead-note">* Lead Times May Vary</p>

          <hr className="pdp-divider" />

          {/* Actions */}
          <div className="pdp-actions">
            {/* Stepper */}
            <div className="pdp-stepper">
              <button type="button" className="stepper-btn" onClick={() => handleStep(-1)} aria-label="Decrease">−</button>
              <input
                type="text"
                inputMode="numeric"
                className={`stepper-input${qtyError ? " qty-error" : ""}`}
                value={qty}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => handleQtyChange(e.target.value)}
                onBlur={handleQtyBlur}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault();
                  if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
                }}
                aria-label="Quantity"
              />
              <button type="button" className="stepper-btn" onClick={() => handleStep(1)} aria-label="Increase">+</button>
            </div>

            {/* Add to Cart */}
            <button
              type="button"
              className={`pdp-add-btn${addedToCart ? " added" : ""}`}
              onClick={handleAdd}
            >
              {addedToCart ? "✓ Added to Cart" : "Add to Cart"}
            </button>

            {/* Add to List */}
            <button
              ref={listBtnRef}
              type="button"
              className={`pdp-icon-btn${listToast ? " active" : ""}`}
              onClick={openListMenu}
              title="Add to Requisition List"
              aria-label="Add to Requisition List"
            >
              <svg width="18" height="16" viewBox="0 0 15 13" fill="currentColor">
                <rect y="0" width="15" height="2.2" rx="1.1"/>
                <rect y="5.4" width="15" height="2.2" rx="1.1"/>
                <rect y="10.8" width="15" height="2.2" rx="1.1"/>
              </svg>
            </button>

            {/* Wishlist */}
            <button
              type="button"
              className={`pdp-icon-btn pdp-heart${inWishlist ? " wishlisted" : ""}`}
              onClick={() => inWishlist ? wishlistRemove(product.sku) : wishlistAdd(product)}
              title={inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
              aria-label={inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <svg width="18" height="17" viewBox="0 0 24 22" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          {/* Toast */}
          {listToast && (
            <div className="pdp-list-toast">✓ Added to &ldquo;{listToast}&rdquo;</div>
          )}

          {/* Cart status */}
          {cartQty > 0 && (
            <div className="pdp-incart-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span>You have <strong>{cartQty}</strong> of this item in your cart</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Description ── */}
      <div className="pdp-desc-section">
        <h2 className="pdp-desc-heading">Product Description</h2>

        <div className="pdp-desc-body">
          <h3 className="pdp-desc-subhead">Product Overview</h3>
          <p>{overview}</p>

          <h3 className="pdp-desc-subhead" style={{ marginTop: "1.25rem" }}>Key Features</h3>
          <ul className="pdp-feature-list">
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
