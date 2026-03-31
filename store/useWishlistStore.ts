"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getClientPersistStorage } from "@/lib/zustand-persist-storage";
import { Product } from "@/lib/types";
import { getProductBySkuSync } from "@/lib/api/mock";

export type WishlistItem = Product & { addedAt: string };

function reconcileWishlist(items: WishlistItem[]): WishlistItem[] {
  return items
    .map((item) => {
      const c = getProductBySkuSync(item.sku);
      if (!c) return null;
      return { ...c, addedAt: item.addedAt };
    })
    .filter((x): x is WishlistItem => x !== null);
}

type WishlistStore = {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (sku: string) => void;
  isInWishlist: (sku: string) => boolean;
  clear: () => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const canon = getProductBySkuSync(product.sku);
        if (!canon) return;
        if (get().isInWishlist(canon.sku)) return;
        set((s) => ({
          items: [
            ...s.items,
            { ...canon, addedAt: new Date().toISOString() },
          ],
        }));
      },
      removeItem: (sku) =>
        set((s) => ({ items: s.items.filter((i) => i.sku !== sku) })),
      isInWishlist: (sku) => get().items.some((i) => i.sku === sku),
      clear: () => set({ items: [] }),
    }),
    {
      name: "julius-wishlist-v1",
      storage: getClientPersistStorage(),
      merge: (persisted, current) => {
        const p = persisted as Partial<WishlistStore> | undefined;
        if (!p || typeof p !== "object") return current as WishlistStore;
        const merged = { ...(current as WishlistStore), ...p } as WishlistStore;
        if (Array.isArray(merged.items)) {
          merged.items = reconcileWishlist(merged.items);
        }
        return merged;
      },
    }
  )
);
