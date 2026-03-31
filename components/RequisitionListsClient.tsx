"use client";

import React, { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRequisitionStore, RequisitionList } from "@/store/useRequisitionStore";
import { useCartStore } from "@/store/useCartStore";

const MAX_QTY = 200;
function clamp(n: number) { return Math.min(MAX_QTY, Math.max(1, Math.floor(n))); }
function sanitize(s: string) { return s.replace(/[^0-9]/g, ""); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function RequisitionListsClient() {
  const { lists, error, clearError, createList, deleteList, renameList, removeItemFromList, setItemQuantity } =
    useRequisitionStore();
  const addToCart = useCartStore((s) => s.addProduct);
  const cartItems = useCartStore((s) => s.items); // Record<sku, CartLine>

  const [view, setView] = useState<"table" | "detail">("table");
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  // Detail view state
  const [detailSearch, setDetailSearch] = useState("");
  const [detailFilter, setDetailFilter] = useState("");
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [renameDesc, setRenameDesc] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [addedSku, setAddedSku] = useState<string | null>(null);
  const [bulkAdded, setBulkAdded] = useState(false);

  // Sortable columns for detail view
  type SortField = "product" | "price" | "qty" | "total";
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }
  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="rl-sort-idle">⇅</span>;
    return <span className="rl-sort-active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // Inline table-row rename (no navigation required)
  const [tableEditId, setTableEditId] = useState<string | null>(null);
  const [tableEditName, setTableEditName] = useState("");
  const [tableEditDesc, setTableEditDesc] = useState("");
  const [tableEditErr, setTableEditErr] = useState("");
  const tableNameInputRef = useRef<HTMLInputElement>(null);

  function startTableRename(list: RequisitionList) {
    setOpenMenuId(null);
    setTableEditId(list.id);
    setTableEditName(list.name);
    setTableEditDesc(list.description ?? "");
    setTableEditErr("");
    // focus after React has rendered the input
    setTimeout(() => { tableNameInputRef.current?.focus(); tableNameInputRef.current?.select(); }, 60);
  }

  function commitTableRename() {
    if (!tableEditId) return;
    const ok = renameList(tableEditId, tableEditName, tableEditDesc);
    if (!ok) { setTableEditErr(error ?? "Name already exists."); return; }
    setTableEditId(null);
  }

  function cancelTableRename() {
    setTableEditId(null);
    setTableEditErr("");
    clearError();
  }

  // Action menu (three-dot) — fixed position to escape table overflow
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const dotBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Close action menu on outside click or scroll
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [openMenuId]);

  function toggleMenu(listId: string) {
    if (openMenuId === listId) { setOpenMenuId(null); return; }
    const btn = dotBtnRefs.current[listId];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
    setOpenMenuId(listId);
  }

  const activeList = lists.find((l) => l.id === activeListId) ?? null;

  // ── Create list ──────────────────────────────────────────
  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const ok = createList(newName, newDesc);
    if (ok) { setNewName(""); setNewDesc(""); setShowCreate(false); }
  }

  // ── Open list ────────────────────────────────────────────
  function openList(list: RequisitionList) {
    setActiveListId(list.id);
    setView("detail");
    setDetailSearch("");
    setDetailFilter("");
    setQtyDraft({});
    setChecked(new Set());
    setRenaming(false);
  }

  // ── Rename ───────────────────────────────────────────────
  function startRename() {
    if (!activeList) return;
    setRenameVal(activeList.name);
    setRenameDesc(activeList.description);
    setRenaming(true);
  }
  function commitRename(e: FormEvent) {
    e.preventDefault();
    if (!activeListId) return;
    renameList(activeListId, renameVal, renameDesc);
    setRenaming(false);
  }

  // ── Delete list ──────────────────────────────────────────
  function handleDeleteList(id: string) {
    if (!confirm("Delete this list? This cannot be undone.")) return;
    deleteList(id);
    if (activeListId === id) { setView("table"); setActiveListId(null); }
  }

  // ── Detail qty ───────────────────────────────────────────
  function getDraft(sku: string, fallback: number) {
    return qtyDraft[sku] ?? String(fallback);
  }
  function handleDraftChange(sku: string, raw: string) {
    const cleaned = sanitize(raw);
    if (cleaned === "") { setQtyDraft((p) => ({ ...p, [sku]: "" })); return; }
    const n = Number(cleaned);
    if (n > MAX_QTY) { setShowLimitDialog(true); setQtyDraft((p) => ({ ...p, [sku]: "" })); return; }
    setQtyDraft((p) => ({ ...p, [sku]: cleaned }));
  }
  function commitDraft(sku: string, fallback: number) {
    if (!activeListId) return;
    const n = Number(getDraft(sku, fallback));
    const qty = clamp(Number.isFinite(n) && n > 0 ? n : 1);
    setQtyDraft((p) => ({ ...p, [sku]: String(qty) }));
    setItemQuantity(activeListId, sku, qty);
  }

  // ── Add item to cart ─────────────────────────────────────
  function handleAddToCart(item: ReturnType<typeof useRequisitionStore.getState>["lists"][0]["items"][0]) {
    const qty        = clamp(Number(getDraft(item.sku, item.quantity)));
    const currentQty = cartItems[item.sku]?.quantity ?? 0;
    if (currentQty + qty > MAX_QTY) {
      setShowLimitDialog(true);
      return;
    }
    addToCart({ sku: item.sku, name: item.name, price: item.price, imageUrl: item.imageUrl, unitSize: item.unitSize }, qty);
    setAddedSku(item.sku);
    setTimeout(() => setAddedSku(null), 1400);
  }

  // ── Checkbox ─────────────────────────────────────────────
  function toggleCheck(sku: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(sku) ? next.delete(sku) : next.add(sku);
      return next;
    });
  }
  function toggleAll(items: { sku: string }[]) {
    if (checked.size === items.length) setChecked(new Set());
    else setChecked(new Set(items.map((i) => i.sku)));
  }
  function deleteSelected() {
    if (!activeListId || checked.size === 0) return;
    if (!confirm(`Delete ${checked.size} selected item(s)?`)) return;
    checked.forEach((sku) => removeItemFromList(activeListId, sku));
    setChecked(new Set());
  }

  function addSelectedToCart() {
    if (checked.size === 0) return;
    let anyBlocked = false;
    detailItems
      .filter((item) => checked.has(item.sku))
      .forEach((item) => {
        const qty        = clamp(Number(getDraft(item.sku, item.quantity)));
        const currentQty = cartItems[item.sku]?.quantity ?? 0;
        if (currentQty + qty > MAX_QTY) {
          anyBlocked = true;
          return; // skip this item
        }
        addToCart({ sku: item.sku, name: item.name, price: item.price, imageUrl: item.imageUrl, unitSize: item.unitSize }, qty);
      });
    if (anyBlocked) setShowLimitDialog(true);
    setBulkAdded(true);
    setTimeout(() => setBulkAdded(false), 2000);
    setChecked(new Set());
  }

  // ── Detail items (filtered + searched + sorted) ──────────
  const CATEGORY_FILTERS = ["Fresh Produce", "Dry Goods", "Freezer", "Refrigerated", "Proteins"];
  const detailItems = (() => {
    let list = (activeList?.items ?? []).filter((item) => {
      const q = detailSearch.toLowerCase();
      const matchQ = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchF = !detailFilter;
      return matchQ && matchF;
    });
    if (sortField) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortField === "product") cmp = a.name.localeCompare(b.name);
        if (sortField === "price")   cmp = a.price - b.price;
        if (sortField === "qty")     cmp = (Number(qtyDraft[a.sku] ?? a.quantity)) - (Number(qtyDraft[b.sku] ?? b.quantity));
        if (sortField === "total")   cmp = (a.price * clamp(Number(qtyDraft[a.sku] ?? a.quantity))) - (b.price * clamp(Number(qtyDraft[b.sku] ?? b.quantity)));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  })();

  // ─────────────────────────────────────────────────────────
  // TABLE VIEW
  // ─────────────────────────────────────────────────────────
  if (view === "table") {
    return (
      <>
        {showLimitDialog && (
          <div className="limit-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowLimitDialog(false)}>
            <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Max Limit Allowed: 200</h3>
              <p>To order more than 200 units per SKU, please contact us:<br />
                📧 <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a>
                &nbsp;·&nbsp;📞 (215) 455-1600</p>
              <button className="btn-primary" onClick={() => setShowLimitDialog(false)}>OK, Got It</button>
            </div>
          </div>
        )}

        <div className="rl-header">
          <div />
          <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
            + Create New Requisition List
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form className="rl-create-form" onSubmit={handleCreate}>
            <h3>New List</h3>
            <div className="rl-create-fields">
              <input
                className="rl-input"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); if (error) clearError(); }}
                placeholder="List name (required)"
                autoFocus
              />
              <input
                className="rl-input"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="rl-create-actions">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-outline" onClick={() => { setShowCreate(false); clearError(); }}>Cancel</button>
            </div>
          </form>
        )}

        {lists.length === 0 ? (
          <div className="cat-empty rl-empty-state" style={{ marginTop: "1.5rem" }}>
            <div className="cat-empty-icon">📋</div>
            <h2>No requisition lists yet</h2>
            <p>
              Create a list to save recurring orders, then add products from the catalog or product pages using the list
              icon on each item.
            </p>
            <div className="rl-empty-actions">
              <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
                Create your first list
              </button>
              <Link href="/" className="rl-empty-secondary-link">
                Browse catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="rl-table-wrap">
            <table className="rl-table">
              <thead>
                <tr>
                  <th>Name &amp; Description</th>
                  <th>Items</th>
                  <th>Latest Activity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id} className={`rl-row${tableEditId === list.id ? " rl-row-editing" : ""}`}>
                    <td>
                      {tableEditId === list.id ? (
                        /* ── Inline rename form ── */
                        <div className="rl-table-edit">
                          <input
                            ref={tableNameInputRef}
                            className={`rl-table-edit-name${tableEditErr ? " field-error" : ""}`}
                            value={tableEditName}
                            onChange={(e) => { setTableEditName(e.target.value); setTableEditErr(""); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); commitTableRename(); }
                              if (e.key === "Escape") cancelTableRename();
                            }}
                            placeholder="List name"
                          />
                          <input
                            className="rl-table-edit-desc"
                            value={tableEditDesc}
                            onChange={(e) => setTableEditDesc(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); commitTableRename(); }
                              if (e.key === "Escape") cancelTableRename();
                            }}
                            placeholder="Description (optional)"
                          />
                          {tableEditErr && <p className="form-error" style={{ margin: "3px 0 0", fontSize: "0.75rem" }}>{tableEditErr}</p>}
                          <div className="rl-table-edit-actions">
                            <button className="rl-inline-save" onClick={commitTableRename}>✓ Save</button>
                            <button className="rl-inline-cancel" onClick={cancelTableRename}>✕ Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button className="rl-name-btn" onClick={() => openList(list)}>
                            {list.name}
                          </button>
                          {list.description && <p className="rl-desc">{list.description}</p>}
                        </>
                      )}
                    </td>
                    <td className="rl-center">{list.items.length}</td>
                    <td className="rl-center">{fmtDate(list.updatedAt)}</td>
                    <td className="rl-center">
                      <div className="rl-action-wrap">
                        <button
                          ref={(el) => { dotBtnRefs.current[list.id] = el; }}
                          className={`rl-dot-btn${openMenuId === list.id ? " active" : ""}`}
                          title="Options"
                          onMouseDown={(e) => { e.stopPropagation(); toggleMenu(list.id); }}
                          aria-haspopup="true"
                          aria-expanded={openMenuId === list.id}
                        >⋮</button>
                      </div>

                      {/* Portal menu — rendered at document.body, never clipped */}
                      {openMenuId === list.id && typeof document !== "undefined" && createPortal(
                        <div
                          className="rl-action-menu"
                          style={{ top: menuPos.top, right: menuPos.right }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <button onClick={() => { setOpenMenuId(null); openList(list); }}>
                            Open
                          </button>
                          <button onClick={() => startTableRename(list)}>
                            Rename
                          </button>
                          <button className="rl-delete-action" onClick={() => { setOpenMenuId(null); handleDeleteList(list.id); }}>
                            Delete
                          </button>
                        </div>,
                        document.body
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────
  if (!activeList) return null;

  return (
    <>
      {showLimitDialog && (
        <div className="limit-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowLimitDialog(false)}>
          <div className="limit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Max Limit Allowed: 200</h3>
            <p>To order more than 200 units per SKU, please contact us:<br />
              📧 <a href="mailto:orders@juliussilvert.com">orders@juliussilvert.com</a>
              &nbsp;·&nbsp;📞 (215) 455-1600</p>
            <button className="btn-primary" onClick={() => setShowLimitDialog(false)}>OK, Got It</button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="cat-breadcrumb" style={{ marginBottom: "1rem" }}>
        <button className="rl-back-btn" onClick={() => { setView("table"); setActiveListId(null); }}>
          ← Order Guide
        </button>
        <span>/</span>
        <span>{activeList.name}</span>
      </nav>

      {/* List heading */}
      {/* Inline title edit — pencil icon next to name, no separate form/page */}
      <div className="rl-detail-header">
        {renaming ? (
          <div className="rl-inline-edit">
            <input
              className="rl-inline-name-input"
              value={renameVal}
              onChange={(e) => { setRenameVal(e.target.value); if (error) clearError(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitRename(e as unknown as React.FormEvent); }
                if (e.key === "Escape") { setRenaming(false); clearError(); }
              }}
              autoFocus
              placeholder="List name"
            />
            <input
              className="rl-inline-desc-input"
              value={renameDesc}
              onChange={(e) => setRenameDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitRename(e as unknown as React.FormEvent); }
                if (e.key === "Escape") { setRenaming(false); clearError(); }
              }}
              placeholder="Description (optional)"
            />
            {error && <p className="form-error" style={{ margin: "4px 0 0", gridColumn: "1/-1" }}>{error}</p>}
            <div className="rl-inline-edit-actions">
              <button className="rl-inline-save" onClick={(e) => commitRename(e as unknown as React.FormEvent)}>
                ✓ Save
              </button>
              <button className="rl-inline-cancel" onClick={() => { setRenaming(false); clearError(); }}>
                ✕ Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rl-title-row">
            <h2 className="rl-detail-title">{activeList.name}</h2>
            <button
              className="rl-pencil-btn"
              onClick={startRename}
              title="Rename this list"
              aria-label="Rename list"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        )}
        <button className="rl-delete-btn" onClick={() => handleDeleteList(activeList.id)}>Delete List</button>
      </div>
      {!renaming && activeList.description && <p className="rl-detail-desc">{activeList.description}</p>}

      {/* Search within list */}
      <div className="rl-search-wrap">
        <input
          className="cat-search-input"
          placeholder="Search Your Order Guide"
          value={detailSearch}
          onChange={(e) => setDetailSearch(e.target.value)}
        />
      </div>

      {/* Category filter pills */}
      <div className="rl-filter-pills">
        <span className="rl-filter-label">Select By:</span>
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            className={`rl-pill${detailFilter === f ? " active" : ""}`}
            onClick={() => setDetailFilter(detailFilter === f ? "" : f)}
          >
            {f}
          </button>
        ))}
        {detailFilter && (
          <button className="rl-pill rl-clear-pill" onClick={() => setDetailFilter("")}>
            Clear ×
          </button>
        )}
      </div>

      {/* Summary bar — item count + total cost */}
      {(() => {
        const totalCost = (activeList.items).reduce((sum, item) => {
          const qty = clamp(Number(qtyDraft[item.sku] ?? item.quantity));
          return sum + item.price * qty;
        }, 0);
        const totalQty = (activeList.items).reduce((sum, item) => {
          return sum + clamp(Number(qtyDraft[item.sku] ?? item.quantity));
        }, 0);
        return (
          <div className="rl-summary-bar">
            <span className="rl-summary-count">
              {activeList.items.length} item{activeList.items.length !== 1 ? "s" : ""} · {totalQty} unit{totalQty !== 1 ? "s" : ""}
            </span>
            <span className="rl-summary-total">
              List Total: <strong>{money.format(totalCost)}</strong>
            </span>
          </div>
        );
      })()}

      <p className="cat-count" style={{ marginBottom: "0.5rem" }}>
        {detailItems.length === activeList.items.length
          ? `${detailItems.length} item${detailItems.length !== 1 ? "s" : ""}`
          : `${detailItems.length} of ${activeList.items.length} items`}
      </p>

      {detailItems.length === 0 ? (
        <div className="cat-empty" style={{ marginTop: "1rem" }}>
          <div className="cat-empty-icon">📋</div>
          <h2>{activeList.items.length === 0 ? "This list is empty" : "No matching items"}</h2>
          <p>{activeList.items.length === 0 ? "Browse the catalog to add items to this list." : "Try a different search or clear the filter."}</p>
          {activeList.items.length === 0 && (
            <Link href="/" className="btn-primary">Browse Catalog</Link>
          )}
        </div>
      ) : (
        <>
          {/* Controls bar */}
          <div className="rl-controls-bar">
            <label className="rl-check-all">
              <input
                type="checkbox"
                checked={checked.size === detailItems.length && detailItems.length > 0}
                onChange={() => toggleAll(detailItems)}
              />
              <span>Select All</span>
            </label>

            {checked.size > 0 && (
              <div className="rl-bulk-actions">
                <span className="rl-selected-count">{checked.size} selected</span>
                <button className="rl-bulk-cart-btn" onClick={addSelectedToCart}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "middle", marginRight: 4 }}>
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  Add to Cart ({checked.size})
                </button>
                <button className="rl-delete-sel-btn" onClick={deleteSelected}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ verticalAlign: "middle", marginRight: 4 }}>
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Delete ({checked.size})
                </button>
              </div>
            )}

            {bulkAdded && <span className="rl-bulk-toast">✓ Items added to cart</span>}
          </div>

          {/* Items table */}
          <div className="rl-items-wrap">
            <table className="rl-items-table">
              <thead>
                <tr>
                  <th className="rl-th-check"></th>
                  <th className="rl-th-num">#</th>
                  <th className="rl-th-sortable" onClick={() => toggleSort("product")}>
                    Product <SortIcon field="product" />
                  </th>
                  <th className="rl-th-sortable" onClick={() => toggleSort("price")}>
                    Price <SortIcon field="price" />
                  </th>
                  <th className="rl-th-sortable" onClick={() => toggleSort("qty")}>
                    Qty <SortIcon field="qty" />
                  </th>
                  <th></th>
                  <th className="rl-th-sortable" onClick={() => toggleSort("total")}>
                    Total <SortIcon field="total" />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detailItems.map((item, idx) => {
                  const cartQty = cartItems[item.sku]?.quantity ?? 0;
                  return (
                    <tr key={item.sku} className={`rl-item-row${checked.has(item.sku) ? " selected" : ""}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={checked.has(item.sku)}
                          onChange={() => toggleCheck(item.sku)}
                          aria-label={`Select ${item.name}`}
                        />
                      </td>
                      <td className="rl-item-num">{idx + 1}</td>
                      <td>
                        <div className="rl-product-cell">
                          <a href={`/product/${item.sku}`} className="rl-img-col-link">
                            <div className="rl-img-col">
                              <div className="rl-img-wrap">
                                <img src={item.imageUrl} alt={item.name} className="rl-item-img" />
                              </div>
                              {cartQty > 0 && (
                                <span className="rl-in-cart-badge">
                                  In Cart: {cartQty}
                                </span>
                              )}
                            </div>
                          </a>
                          <div>
                            <a href={`/product/${item.sku}`} className="rl-item-name-link">
                              <p className="rl-item-name">{item.name}</p>
                            </a>
                            <p className="rl-item-meta">{item.sku} · {item.unitSize}</p>
                            {addedSku === item.sku && (
                              <span className="rl-added-flash">✓ Added to Cart</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="rl-item-price">{money.format(item.price)}</td>
                      <td>
                        <div className="sr-stepper">
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => {
                              const cur = clamp(Number(getDraft(item.sku, item.quantity)));
                              if (cur - 1 < 1) return;
                              setQtyDraft((p) => ({ ...p, [item.sku]: String(cur - 1) }));
                              if (activeListId) setItemQuantity(activeListId, item.sku, cur - 1);
                            }}
                          >−</button>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="stepper-input"
                            value={getDraft(item.sku, item.quantity)}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => handleDraftChange(item.sku, e.target.value)}
                            onBlur={() => commitDraft(item.sku, item.quantity)}
                            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                              if (["e","E","+","-",".",","].includes(e.key)) e.preventDefault();
                              if (e.key === "Enter") { e.preventDefault(); commitDraft(item.sku, item.quantity); }
                            }}
                            aria-label={`Qty for ${item.name}`}
                          />
                          <button
                            type="button"
                            className="stepper-btn"
                            onClick={() => {
                              const cur = clamp(Number(getDraft(item.sku, item.quantity)));
                              if (cur + 1 > MAX_QTY) { setShowLimitDialog(true); return; }
                              setQtyDraft((p) => ({ ...p, [item.sku]: String(cur + 1) }));
                              if (activeListId) setItemQuantity(activeListId, item.sku, cur + 1);
                            }}
                          >+</button>
                        </div>
                      </td>
                      <td>
                        <button
                          className={`rl-add-cart-btn${addedSku === item.sku ? " added" : ""}`}
                          onClick={() => handleAddToCart(item)}
                        >
                          {addedSku === item.sku ? "✓ Added" : "Add to Cart"}
                        </button>
                      </td>
                      <td className="rl-item-total">
                        {money.format(item.price * clamp(Number(getDraft(item.sku, item.quantity))))}
                      </td>
                      <td>
                        <button
                          className="rl-row-delete"
                          onClick={() => { if (activeListId) removeItemFromList(activeListId, item.sku); }}
                          title="Remove item"
                          aria-label={`Remove ${item.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
