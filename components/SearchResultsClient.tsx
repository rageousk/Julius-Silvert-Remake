"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

interface Props {
  query: string;
  initialResults: Product[];
}

export default function SearchResultsClient({ query, initialResults }: Props) {
  const [sortBy, setSortBy] = useState("default");

  const sorted = [...initialResults].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <>
      <nav className="cat-breadcrumb" style={{ marginBottom: "1rem" }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span>Search</span>
        {query && (
          <>
            <span>/</span>
            <span>&ldquo;{query}&rdquo;</span>
          </>
        )}
      </nav>

      <div className="search-results-header">
        <div>
          <h1 className="cat-page-heading">
            {query ? `Results for "${query}"` : "All Products"}
          </h1>
          <p className="cat-count">
            {sorted.length} {sorted.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="cat-sort">
          <label htmlFor="sort-sr">Sort by:</label>
          <select
            id="sort-sr"
            className="cat-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Relevance</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name: A → Z</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="cat-empty">
          <div className="cat-empty-icon">🔍</div>
          <h2>No results found</h2>
          <p>
            Try a different keyword, SKU, or browse a category.
          </p>
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      ) : (
        <div className="pc-grid">
          {sorted.map((product) => (
            <ProductCard key={product.sku} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
