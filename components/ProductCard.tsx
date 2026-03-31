"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Product } from "@/lib/types";
import { useCartStore } from "@/store/useCartStore";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useRequisitionStore } from "@/store/useRequisitionStore";

const MAX_QTY = 200;
const CONFIRM_THRESHOLD = 50;

function clampQty(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(MAX_QTY, Math.floor(n));
}

function sanitize(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const addToCart  = useCartStore((s) => s.addProduct);
  const cartItems  = useCartStore((s) => s.items);
  const { guard }  = useAuthGuard();
  const { addItem: wishlistAdd, removeItem: wishlistRemove, isInWishlist } =
    useWishlistStore();
  const { lists, addItemToList, createList } = useRequisitionStore();

  // Delay reading persisted state until after hydration to avoid SSR mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cartQty   = mounted ? (cartItems[product.sku]?.quantity ?? 0) : 0;
  const inWishlist = mounted ? isInWishlist(product.sku) : false;

  const [qty, setQty] = useState("1");
  const [qtyError, setQtyError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // List menu
  const [showListMenu, setShowListMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [listToast, setListToast] = useState<string | null>(null);
  const listBtnRef = useRef<HTMLButtonElement>(null);

  // Create list modal
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [newListNameError, setNewListNameError] = useState("");

  // Qty confirmation (>50)
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingQty, setPendingQty] = useState(1);
  const [pendingAction, setPendingAction] = useState<"cart" | { listId: string; listName: string } | null>(null);

  // Close list menu on outside click
  useEffect(() => {
    if (!showListMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const menu = document.getElementById(`pc-list-menu-${product.sku}`);
      if (!menu?.contains(target) && !listBtnRef.current?.contains(target)) {
        setShowListMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showListMenu, product.sku]);

  // Close menu on scroll (since it's fixed)
  useEffect(() => {
    if (!showListMenu) return;
    const handler = () => setShowListMenu(false);
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [showListMenu]);

  function handleStep(delta: 1 | -1) {
    const current = clampQty(Number(qty));
    const next = current + delta;
    if (next > MAX_QTY) {
      setShowLimitDialog(true);
      return;
    }
    if (next < 1) return;
    setQty(String(next));
    setQtyError(false);
  }

  function handleQtyChange(raw: string) {
    const cleaned = sanitize(raw);
    if (cleaned === "") {
      setQty("");
      setQtyError(false);
      return;
    }
    const n = Number(cleaned);
    if (n > MAX_QTY) {
      setQtyError(true);
      setQty("");
      setShowLimitDialog(true);
      return;
    }
    setQtyError(false);
    setQty(cleaned);
  }

  function handleQtyBlur() {
    const n = clampQty(Number(qty));
    setQty(String(n));
    setQtyError(false);
  }

  // Resolve confirmed action
  function executeAction(q: number, action: "cart" | { listId: string; listName: string }) {
    if (action === "cart") {
      // Guard: adding q would exceed the per-SKU max
      const currentQty = cartItems[product.sku]?.quantity ?? 0;
      if (currentQty + q > MAX_QTY) {
        setShowLimitDialog(true);
        return;
      }
      addToCart(
        { sku: product.sku, name: product.name, price: product.price, imageUrl: product.imageUrl, unitSize: product.unitSize },
        q
      );
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1400);
    } else {
      addItemToList(action.listId, product, q);
      setListToast(action.listName);
      setTimeout(() => setListToast(null), 2200);
    }
  }

  const requestAction = guard((q: number, action: "cart" | { listId: string; listName: string }) => {
    // Check cart limit first before the qty>50 confirmation
    if (action === "cart") {
      const currentQty = cartItems[product.sku]?.quantity ?? 0;
      if (currentQty + q > MAX_QTY) {
        setShowLimitDialog(true);
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
  });

  function handleAdd() {
    const finalQty = clampQty(Number(qty));
    requestAction(finalQty, "cart");
  }

  function handleWishlist() {
    if (inWishlist) wishlistRemove(product.sku);
    else wishlistAdd(product);
  }

  function handleListBtnClick() {
    if (!listBtnRef.current) return;
    const rect = listBtnRef.current.getBoundingClientRect();
    // Position below button; if near bottom, position above
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedMenuHeight = Math.min(lists.length * 44 + 80, 320);
    const showAbove = spaceBelow < estimatedMenuHeight + 10;
    setMenuPos({
      top: showAbove ? rect.top - estimatedMenuHeight - 6 : rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 230),
    });
    setShowListMenu((v) => !v);
  }

  function handleAddToList(listId: string, listName: string) {
    const finalQty = clampQty(Number(qty));
    setShowListMenu(false);
    requestAction(finalQty, { listId, listName });
  }

  function handleOpenCreateListModal() {
    setShowListMenu(false);
    setNewListName("");
    setNewListDesc("");
    setNewListNameError("");
    setShowCreateListModal(true);
  }

  function handleCreateListSubmit() {
    const trimmed = newListName.trim();
    if (!trimmed) {
      setNewListNameError("List name is required.");
      return;
    }
    const duplicate = lists.some((l) => l.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setNewListNameError("A list with this name already exists.");
      return;
    }
    const newId = createList(trimmed, newListDesc.trim());
    setShowCreateListModal(false);
    if (newId) {
      const finalQty = clampQty(Number(qty));
      requestAction(finalQty, { listId: newId, listName: trimmed });
    }
  }

  return (
    <>
      {/* Limit Dialog */}
      {showLimitDialog && (
        <div className="limit-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowLimitDialog(false)}>
          <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Max Limit Allowed: 200</h3>
            <p>
              To order more than 200 units per SKU, please contact us:<br />
              📧 <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a>
              &nbsp;·&nbsp;📞 (215) 455-1600
            </p>
            <button className="btn-primary" onClick={() => { setShowLimitDialog(false); setQtyError(false); }}>OK, Got It</button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog (qty > 50) */}
      {showConfirm && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <h3>Confirm Quantity</h3>
            <p>
              You&apos;re about to add <strong>{pendingQty} × {product.name}</strong> ({product.unitSize}).
              <br />Are you sure you want to order this quantity?
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-btn-no"
                onClick={() => { setShowConfirm(false); setPendingAction(null); }}
              >
                Cancel
              </button>
              <button
                className="confirm-btn-yes"
                onClick={() => {
                  if (pendingAction) executeAction(pendingQty, pendingAction);
                  setShowConfirm(false);
                  setPendingAction(null);
                }}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create List Modal */}
      {showCreateListModal && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-box">
            <h3>Create New Requisition List</h3>
            <div className="create-list-field">
              <label htmlFor={`nl-name-${product.sku}`}>List Name *</label>
              <input
                id={`nl-name-${product.sku}`}
                type="text"
                placeholder="e.g. Weekly Produce Order"
                value={newListName}
                onChange={(e) => { setNewListName(e.target.value); setNewListNameError(""); }}
                className={newListNameError ? "field-error" : ""}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateListSubmit(); }}
                autoFocus
              />
              {newListNameError && (
                <span style={{ color: "#e53e3e", fontSize: "0.78rem", marginTop: 2 }}>{newListNameError}</span>
              )}
            </div>
            <div className="create-list-field">
              <label htmlFor={`nl-desc-${product.sku}`}>Description (optional)</label>
              <textarea
                id={`nl-desc-${product.sku}`}
                placeholder="What is this list for?"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div className="confirm-actions">
              <button className="confirm-btn-no" onClick={() => setShowCreateListModal(false)}>Cancel</button>
              <button className="confirm-btn-yes" onClick={handleCreateListSubmit}>Create &amp; Add Item</button>
            </div>
          </div>
        </div>
      )}

      {/* List Menu Portal (fixed position, won't be clipped) */}
      {showListMenu && typeof document !== "undefined" && createPortal(
        <div
          id={`pc-list-menu-${product.sku}`}
          className="pc-list-menu"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <p className="pc-list-menu-title">Add to Requisition List</p>
          {lists.length === 0 ? (
            <div style={{ padding: "10px 12px", fontSize: "0.83rem", color: "var(--ink-soft)" }}>
              No lists yet.
            </div>
          ) : (
            lists.map((list) => (
              <button
                key={list.id}
                className="pc-list-menu-item"
                onClick={() => handleAddToList(list.id, list.name)}
              >
                <span className="pc-list-name">{list.name}</span>
                <span className="pc-list-count">{list.items.length} items</span>
              </button>
            ))
          )}
          <button className="pc-list-menu-create" onClick={handleOpenCreateListModal}>
            + Create New List
          </button>
        </div>,
        document.body
      )}

      <article className="pc-card">
        {/* Image — links to product page */}
        <a href={`/product/${product.sku}`} className="pc-img-link" tabIndex={-1} aria-hidden>
          <div className="pc-img-wrap">
            <img src={product.imageUrl} alt={product.name} className="pc-img" loading="lazy" />
            {cartQty > 0 && !addedToCart && (
              <span className="pc-in-cart-badge">In Cart: {cartQty}</span>
            )}
            {addedToCart && <span className="pc-added-badge">Added to Cart ✓</span>}
          </div>
        </a>

        {/* Body */}
        <div className="pc-body">
          <a href={`/product/${product.sku}`} className="pc-name-link">
            <h3 className="pc-name" title={product.name}>{product.name}</h3>
          </a>
          <p className="pc-sku">Item#: {product.sku}</p>
          <div className="pc-tags">
            <span className="pc-case-tag">CASE</span>
            <span className="pc-unit">{product.unitSize}</span>
          </div>
          <p className="pc-price">${product.price.toFixed(2)}</p>

          {/* Actions row */}
          <div className="pc-actions">
            {/* Stepper */}
            <div className="pc-stepper">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleStep(-1)}
                aria-label="Decrease"
              >−</button>
              <input
                type="text"
                inputMode="numeric"
                className={`stepper-input${qtyError ? " qty-error" : ""}`}
                value={qty}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => handleQtyChange(e.target.value)}
                onBlur={handleQtyBlur}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault();
                  if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
                }}
                aria-label={`Qty for ${product.name}`}
              />
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleStep(1)}
                aria-label="Increase"
              >+</button>
            </div>

            {/* Add to Cart */}
            <button
              type="button"
              className={`pc-add-btn${addedToCart ? " added" : ""}`}
              onClick={handleAdd}
            >
              {addedToCart ? "✓" : "Add"}
            </button>

            {/* Add to Requisition List */}
            <div className="pc-icon-wrap">
              <button
                ref={listBtnRef}
                type="button"
                className={`pc-icon-btn${listToast ? " pc-icon-active" : ""}`}
                onClick={handleListBtnClick}
                title="Add to Order Guide / Requisition List"
                aria-label="Add to list"
              >
                <svg width="15" height="13" viewBox="0 0 15 13" fill="currentColor">
                  <rect y="0" width="15" height="2.2" rx="1.1"/>
                  <rect y="5.4" width="15" height="2.2" rx="1.1"/>
                  <rect y="10.8" width="15" height="2.2" rx="1.1"/>
                </svg>
              </button>
              {listToast && (
                <div className="pc-list-toast">Added to &ldquo;{listToast}&rdquo;</div>
              )}
            </div>

            {/* Wishlist Heart */}
            <button
              type="button"
              className={`pc-icon-btn pc-heart${inWishlist ? " wishlisted" : ""}`}
              onClick={handleWishlist}
              title={inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
              aria-label={inWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <svg width="15" height="14" viewBox="0 0 24 22" fill={inWishlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    </>
  );
}
