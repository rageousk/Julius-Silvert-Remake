"use client";

import Link from "next/link";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useRequisitionStore } from "@/store/useRequisitionStore";
import { useCartStore } from "@/store/useCartStore";
import { ProductCard } from "@/components/ProductCard";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function WishlistClient() {
  const { items: wishlistItems, removeItem } = useWishlistStore();
  const { lists, addItemToList } = useRequisitionStore();
  const addToCart = useCartStore((s) => s.addProduct);

  if (wishlistItems.length === 0) {
    return (
      <div className="cat-empty">
        <div className="cat-empty-icon">🤍</div>
        <h2>Your Wishlist is Empty</h2>
        <p>Save items you love by clicking the ♡ icon on any product card.</p>
        <Link href="/" className="btn-primary">Browse Catalog</Link>
      </div>
    );
  }

  return (
    <div className="account-card">
      <div className="wl-header">
        <h3 style={{ margin: 0 }}>My Wish List</h3>
        <span className="cat-count">{wishlistItems.length} item{wishlistItems.length !== 1 ? "s" : ""}</span>
      </div>

      {lists.length > 0 && (
        <p className="wl-hint">
          Click the ≡ icon on any card to move an item directly into one of your requisition lists.
        </p>
      )}

      <div className="pc-grid" style={{ marginTop: "1.25rem" }}>
        {wishlistItems.map((item) => (
          <ProductCard key={item.sku} product={item} />
        ))}
      </div>
    </div>
  );
}
