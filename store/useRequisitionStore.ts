"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getClientPersistStorage } from "@/lib/zustand-persist-storage";
import { Product } from "@/lib/types";
import { getProductBySkuSync } from "@/lib/api/mock";

export type RequisitionItem = {
  sku: string;
  name: string;
  quantity: number;
  unitSize: string;
  price: number;
  imageUrl: string;
};

export type RequisitionList = {
  id: string;
  name: string;
  description: string;
  items: RequisitionItem[];
  createdAt: string;
  updatedAt: string;
};

type RequisitionStore = {
  lists: RequisitionList[];
  error: string | null;
  clearError: () => void;
  clear: () => void;
  createList: (name: string, description?: string) => string | false; // returns new list id or false
  deleteList: (listId: string) => void;
  renameList: (listId: string, name: string, description?: string) => boolean;
  addItemToList: (listId: string, product: Product, quantity: number) => void;
  removeItemFromList: (listId: string, sku: string) => void;
  setItemQuantity: (listId: string, sku: string, quantity: number) => void;
};

const normalizeName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const sanitizeQty = (qty: number) => {
  if (!Number.isFinite(qty) || qty <= 0) return 1;
  return Math.min(200, Math.floor(qty));
};

const now = () => new Date().toISOString();

function reconcileReqLists(lists: RequisitionList[]): RequisitionList[] {
  return lists.map((list) => ({
    ...list,
    items: list.items
      .map((item) => {
        const c = getProductBySkuSync(item.sku);
        if (!c) return null;
        return {
          ...item,
          name:     c.name,
          price:    c.price,
          unitSize: c.unitSize,
          imageUrl: c.imageUrl,
          quantity: sanitizeQty(item.quantity),
        };
      })
      .filter((x): x is RequisitionItem => x !== null),
  }));
}

export const useRequisitionStore = create<RequisitionStore>()(
  persist(
    (set, get) => ({
      lists: [],
      error: null,

      clearError: () => set({ error: null }),
      clear: () => set({ lists: [], error: null }),

      createList: (name, description = "") => {
        const trimmed = name.trim();
        if (!trimmed) {
          set({ error: "List name is required." });
          return false;
        }
        const target = normalizeName(trimmed);
        const exists = get().lists.some(
          (l) => normalizeName(l.name) === target
        );
        if (exists) {
          set({ error: `A list named "${trimmed}" already exists. Please use a different name.` });
          return false;
        }
        const ts = now();
        const newId = `req-${Date.now()}`;
        set({
          lists: [
            {
              id: newId,
              name: trimmed,
              description: description.trim(),
              items: [],
              createdAt: ts,
              updatedAt: ts,
            },
            ...get().lists,
          ],
          error: null,
        });
        return newId;
      },

      deleteList: (listId) =>
        set({ lists: get().lists.filter((l) => l.id !== listId) }),

      renameList: (listId, name, description) => {
        const trimmed = name.trim();
        if (!trimmed) {
          set({ error: "List name is required." });
          return false;
        }
        const target = normalizeName(trimmed);
        const conflict = get().lists.some(
          (l) => l.id !== listId && normalizeName(l.name) === target
        );
        if (conflict) {
          set({ error: `A list named "${trimmed}" already exists.` });
          return false;
        }
        set({
          lists: get().lists.map((l) =>
            l.id !== listId
              ? l
              : {
                  ...l,
                  name: trimmed,
                  description:
                    description !== undefined ? description.trim() : l.description,
                  updatedAt: now(),
                }
          ),
          error: null,
        });
        return true;
      },

      addItemToList: (listId, product, quantity) => {
        const canon = getProductBySkuSync(product.sku);
        if (!canon) return;
        const qty = sanitizeQty(quantity);
        set({
          lists: get().lists.map((list) => {
            if (list.id !== listId) return list;
            const existing = list.items.find((i) => i.sku === canon.sku);
            const items = existing
              ? list.items.map((i) =>
                  i.sku === canon.sku
                    ? { ...i, quantity: sanitizeQty(i.quantity + qty), price: canon.price }
                    : i
                )
              : [
                  ...list.items,
                  {
                    sku: canon.sku,
                    name: canon.name,
                    quantity: qty,
                    unitSize: canon.unitSize,
                    price: canon.price,
                    imageUrl: canon.imageUrl,
                  },
                ];
            return { ...list, items, updatedAt: now() };
          }),
        });
      },

      removeItemFromList: (listId, sku) =>
        set({
          lists: get().lists.map((l) =>
            l.id !== listId
              ? l
              : {
                  ...l,
                  items: l.items.filter((i) => i.sku !== sku),
                  updatedAt: now(),
                }
          ),
        }),

      setItemQuantity: (listId, sku, quantity) => {
        const qty = sanitizeQty(quantity);
        const c = getProductBySkuSync(sku);
        set({
          lists: get().lists.map((l) =>
            l.id !== listId
              ? l
              : {
                  ...l,
                  items: l.items.map((i) => {
                    if (i.sku !== sku) return i;
                    if (!c) return i;
                    return { ...i, quantity: qty, price: c.price, name: c.name, unitSize: c.unitSize, imageUrl: c.imageUrl };
                  }),
                  updatedAt: now(),
                }
          ),
        });
      },
    }),
    {
      name: "js-requisition-lists-v2",
      storage: getClientPersistStorage(),
      merge: (persisted, current) => {
        const p = persisted as Partial<RequisitionStore> | undefined;
        if (!p || typeof p !== "object") return current as RequisitionStore;
        const merged = { ...(current as RequisitionStore), ...p } as RequisitionStore;
        if (Array.isArray(merged.lists)) {
          merged.lists = reconcileReqLists(merged.lists);
        }
        return merged;
      },
    }
  )
);
