"use client";

import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  products: Product[];
  loading?: boolean;
};

export function ProductCatalog({ products, loading = false }: Props) {
  if (loading) {
    return (
      <div className="pc-grid">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="pc-card pc-skeleton" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="cat-empty">
        <div className="cat-empty-icon">📦</div>
        <h2>No products match your filters</h2>
        <p>Try adjusting your search or browse a category.</p>
      </div>
    );
  }

  return (
    <div className="pc-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
