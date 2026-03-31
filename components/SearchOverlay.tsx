"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { getProducts } from "@/lib/api/mock";
import { sanitizeCatalogSearchInput, sanitizeCatalogSearchQuery } from "@/lib/input-security";

function categorySlug(cat: string) {
  return cat.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function SearchOverlay() {
  const router = useRouter();

  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getProducts().then(setCatalog); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, catalog]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = sanitizeCatalogSearchQuery(query);
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function goToProduct(product: Product) {
    setOpen(false);
    setQuery("");
    router.push(`/product/${product.sku}`);
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <form className="top-search" onSubmit={handleSubmit}>
        <span className="search-icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            const v = sanitizeCatalogSearchInput(e.target.value);
            setQuery(v);
            setOpen(v.trim().length > 0);
          }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
          }}
          placeholder="What can we help you find today?"
          aria-label="Search products"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            aria-label="Clear search"
          >×</button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="search-dropdown" role="listbox">
          <p className="search-dd-header">
            {suggestions.length} result{suggestions.length !== 1 ? "s" : ""} for &ldquo;{query.trim()}&rdquo;
          </p>

          <ul className="search-results-list">
            {suggestions.map((product) => (
              <li key={product.sku}>
                <button
                  type="button"
                  className="sr-row"
                  onClick={() => goToProduct(product)}
                >
                  {/* Thumbnail */}
                  <div className="sr-thumb">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      width={44}
                      height={44}
                    />
                  </div>

                  {/* Name + meta */}
                  <div className="sr-info">
                    <span className="sr-name">{product.name}</span>
                    <span className="sr-meta">{product.sku} &middot; {product.unitSize}</span>
                    <span className="sr-sub">{product.subcategory}</span>
                  </div>

                  {/* Price — pushed to right */}
                  <span className="sr-price">${product.price.toFixed(2)}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="search-dropdown-footer">
            <a
              href={`/search?q=${encodeURIComponent(query)}`}
              className="search-see-all"
              onClick={() => { setOpen(false); setQuery(""); }}
            >
              See all results for &ldquo;{query.trim()}&rdquo; →
            </a>
          </div>
        </div>
      )}

      {/* No results */}
      {open && query.trim().length > 0 && suggestions.length === 0 && (
        <div className="search-dropdown search-no-results">
          <p>No products found for &ldquo;{query}&rdquo;</p>
          <p className="sr-hint">Try a product name, SKU, or category</p>
        </div>
      )}
    </div>
  );
}
