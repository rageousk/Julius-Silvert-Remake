"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getClientPersistStorage } from "@/lib/zustand-persist-storage";
import { CartLine } from "@/lib/types";
import { getProductBySkuSync } from "@/lib/api/mock";

const MAX_QTY_PER_SKU = 200;

/** Cart line input is ignored for price/name — catalog is authoritative */
type CartInput = {
  sku: string;
  name: string;
  price: number;
  imageUrl: string;
  unitSize: string;
};

const sanitizeQty = (quantity: number): number => {
  if (!Number.isFinite(quantity) || quantity <= 0) return 1;
  return Math.min(MAX_QTY_PER_SKU, Math.floor(quantity));
};

const lineSubtotal = (price: number, quantity: number): number => price * quantity;

type CartStore = {
  items: Record<string, CartLine>;
  subtotal: number;
  grandTotal: number;
  addProduct: (product: CartInput, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
  increment: (sku: string) => void;
  decrement: (sku: string) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

const recalc = (items: Record<string, CartLine>) => {
  const subtotal = Object.values(items).reduce((acc, item) => acc + item.lineSubtotal, 0);
  return { subtotal, grandTotal: subtotal };
};

function reconcileCartItems(items: Record<string, CartLine>): Record<string, CartLine> {
  const next: Record<string, CartLine> = {};
  for (const line of Object.values(items)) {
    const c = getProductBySkuSync(line.sku);
    if (!c) continue;
    const qty = sanitizeQty(line.quantity);
    next[c.sku] = {
      sku:          c.sku,
      name:         c.name,
      imageUrl:     c.imageUrl,
      unitSize:     c.unitSize,
      price:        c.price,
      quantity:     qty,
      lineSubtotal: lineSubtotal(c.price, qty),
    };
  }
  return next;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: {},
      subtotal: 0,
      grandTotal: 0,

      addProduct: (product, quantity = 1) => {
        const canon = getProductBySkuSync(product.sku);
        if (!canon) return;

        const qty      = sanitizeQty(quantity);
        const existing = get().items[canon.sku];
        const nextQty  = sanitizeQty((existing?.quantity ?? 0) + qty);
        const nextItems = {
          ...get().items,
          [canon.sku]: {
            sku:          canon.sku,
            name:         canon.name,
            imageUrl:     canon.imageUrl,
            unitSize:     canon.unitSize,
            price:        canon.price,
            quantity:     nextQty,
            lineSubtotal: lineSubtotal(canon.price, nextQty),
          },
        };
        set({ items: nextItems, ...recalc(nextItems) });
      },

      setQuantity: (sku, quantity) => {
        const existing = get().items[sku];
        if (!existing) return;
        const c = getProductBySkuSync(sku);
        if (!c) {
          get().remove(sku);
          return;
        }
        const qty = sanitizeQty(quantity);
        const nextItems = {
          ...get().items,
          [sku]: {
            sku:          c.sku,
            name:         c.name,
            imageUrl:     c.imageUrl,
            unitSize:     c.unitSize,
            price:        c.price,
            quantity:     qty,
            lineSubtotal: lineSubtotal(c.price, qty),
          },
        };
        set({ items: nextItems, ...recalc(nextItems) });
      },

      increment: (sku) => {
        const existing = get().items[sku];
        if (!existing) return;
        get().setQuantity(sku, existing.quantity + 1);
      },

      decrement: (sku) => {
        const existing = get().items[sku];
        if (!existing) return;
        get().setQuantity(sku, existing.quantity - 1);
      },

      remove: (sku) => {
        const nextItems = { ...get().items };
        delete nextItems[sku];
        set({ items: nextItems, ...recalc(nextItems) });
      },

      clear: () => set({ items: {}, subtotal: 0, grandTotal: 0 }),
    }),
    {
      name: "julius-cart",
      storage: getClientPersistStorage(),
      merge: (persisted, current) => {
        const p = persisted as Partial<CartStore> | undefined;
        if (!p || typeof p !== "object") return current as CartStore;
        const merged = { ...(current as CartStore), ...p } as CartStore;
        if (merged.items && typeof merged.items === "object") {
          merged.items = reconcileCartItems(merged.items);
          Object.assign(merged, recalc(merged.items));
        }
        return merged;
      },
    }
  )
);
