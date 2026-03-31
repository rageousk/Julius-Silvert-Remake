"use client";

/**
 * StoreUserSync — clears cart / wishlist / requisition when a *different*
 * person signs in (by normalized email). Same mailbox via Google, Microsoft,
 * or password should share one cart after normalization.
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useRequisitionStore } from "@/store/useRequisitionStore";
import { normalizeAccountEmail } from "@/lib/account-email";

const LAST_USER_KEY = "julius-last-user";

export function StoreUserSync() {
  const { data: session, status } = useSession();
  const clearCart = useCartStore((s) => s.clear);
  const clearWl   = useWishlistStore((s) => s.clear);
  const clearReq  = useRequisitionStore((s) => s.clear);
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) return;

    const current = normalizeAccountEmail(session.user.email);
    if (!current) return;

    const lastRaw = typeof window !== "undefined" ? localStorage.getItem(LAST_USER_KEY) : null;
    const last    = lastRaw ? normalizeAccountEmail(lastRaw) : "";

    // New browser / first visit: last is empty — do not clear
    if (last && last !== current) {
      clearCart();
      clearWl();
      clearReq();
    }

    localStorage.setItem(LAST_USER_KEY, current);
  }, [status, session?.user?.email, clearCart, clearWl, clearReq]);

  return null;
}
