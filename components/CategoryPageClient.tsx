"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Product } from "@/lib/types";
import { NavItem } from "@/lib/constants/navigation";
import { ProductCard } from "@/components/ProductCard";

interface CategoryPageClientProps {
  navItem: NavItem;
  products: Product[];
  initialSubcategory?: string;
}

export default function CategoryPageClient({
  navItem,
  products,
  initialSubcategory = "",
}: CategoryPageClientProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const activeSubcategory = initialSubcategory;

  // ── Pre-compute counts ────────────────────────────────────
  // Count products per subcategory (across full category, not filtered)
  const subCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const key = p.subcategory.toLowerCase();
      map[key] = (map[key] ?? 0) + 1;
    });
    return map;
  }, [products]);

  // Derive brands from first word of product name, compute counts
  const brandData = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const brand = p.name.split(" ")[0].toUpperCase();
      map[brand] = (map[brand] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 15);
  }, [products]);

  const [sortBy,      setSortBy]      = useState("default");
  const [brandFilter, setBrandFilter] = useState<Set<string>>(new Set());
  const [catOpen,   setCatOpen]   = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  // ── URL navigation ────────────────────────────────────────
  const activeSlug = navItem.subcategories.find(
    (s) => s.label.toLowerCase() === activeSubcategory.toLowerCase()
  )?.slug ?? null;

  function goToSub(subSlug: string | null) {
    const current = params.get("sub");
    if (!subSlug) {
      current ? router.push(pathname) : router.refresh();
      return;
    }
    current === subSlug ? router.refresh() : router.push(`${pathname}?sub=${subSlug}`);
  }

  function toggleBrand(brand: string) {
    setBrandFilter((prev) => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
      return next;
    });
  }

  // ── Filtered + sorted products ────────────────────────────
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeSubcategory) {
      result = result.filter(
        (p) => p.subcategory.toLowerCase() === activeSubcategory.toLowerCase()
      );
    }

    if (brandFilter.size > 0) {
      result = result.filter((p) =>
        brandFilter.has(p.name.split(" ")[0].toUpperCase())
      );
    }

    if (sortBy === "price-asc")  result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name-asc")   result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "sku-asc")    result.sort((a, b) => a.sku.localeCompare(b.sku));

    return result;
  }, [products, activeSubcategory, sortBy, brandFilter]);

  /** Brand-only: subcategory is page context (breadcrumb + title), not a second “filter” chip */
  const hasBrandFilters = brandFilter.size > 0;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="cat-page-layout">

      {/* ── SIDEBAR ── */}
      <aside className="cat-sidebar">

        <p className="cat-shop-by-label">SHOP BY</p>

        {/* Category accordion */}
        <div className="cat-sb-section">
          <button
            className="cat-sb-heading"
            onClick={() => setCatOpen((v) => !v)}
            aria-expanded={catOpen}
          >
            <span>Category</span>
            <span className="cat-sb-caret">{catOpen ? "∧" : "∨"}</span>
          </button>

          {catOpen && (
            <ul className="cat-cb-list">
              {navItem.subcategories.map((sub) => {
                const count = subCounts[sub.label.toLowerCase()] ?? 0;
                const checked = activeSlug === sub.slug;
                return (
                  <li key={sub.slug}>
                    <label className={`cat-cb-row${checked ? " checked" : ""}`}>
                      <input
                        type="checkbox"
                        className="cat-cb-input"
                        checked={checked}
                        onChange={() => goToSub(checked ? null : sub.slug)}
                      />
                      <span className="cat-cb-label">{sub.label}</span>
                      <span className="cat-cb-count">({count})</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Brand accordion */}
        <div className="cat-sb-section">
          <button
            className="cat-sb-heading"
            onClick={() => setBrandOpen((v) => !v)}
            aria-expanded={brandOpen}
          >
            <span>Brand</span>
            <span className="cat-sb-caret">{brandOpen ? "∧" : "∨"}</span>
          </button>

          {brandOpen && (
            <ul className="cat-cb-list">
              {brandData.map(([brand, count]) => {
                const checked = brandFilter.has(brand);
                return (
                  <li key={brand}>
                    <label className={`cat-cb-row${checked ? " checked" : ""}`}>
                      <input
                        type="checkbox"
                        className="cat-cb-input"
                        checked={checked}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span className="cat-cb-label">{brand}</span>
                      <span className="cat-cb-count">({count})</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

      </aside>

      {/* ── MAIN ── */}
      <main className="cat-main">

        {/* Breadcrumb */}
        <nav className="cat-breadcrumb" aria-label="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href={navItem.href}>{navItem.label}</a>
          {activeSubcategory && (
            <>
              <span>/</span>
              <span>{activeSubcategory}</span>
            </>
          )}
        </nav>

        <h1 className="cat-page-heading">
          {activeSubcategory || navItem.label}
        </h1>

        {/* Toolbar */}
        <div className="cat-toolbar">
          <div className="cat-filter-chips">
            {Array.from(brandFilter).map((b) => (
              <span key={b} className="cat-chip">
                {b}
                <button type="button" className="cat-chip-remove" onClick={() => toggleBrand(b)}>×</button>
              </span>
            ))}
            {hasBrandFilters && (
              <button
                type="button"
                className="cat-clear-all"
                onClick={() => setBrandFilter(new Set())}
              >
                Clear all
              </button>
            )}
          </div>

          <div className="cat-sort">
            <label htmlFor="cat-sort-select">Sort by:</label>
            <select
              id="cat-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="cat-sort-select"
            >
              <option value="default">Position</option>
              <option value="name-asc">Product Name</option>
              <option value="sku-asc">SKU</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
          </div>
        </div>

        <p className="cat-count">
          {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
        </p>

        {filteredProducts.length === 0 ? (
          <div className="cat-empty">
            <div className="cat-empty-icon">📦</div>
            <h2>No items found</h2>
            <p>No products match your current filters.</p>
            <button
              className="btn-primary"
              onClick={() => { goToSub(null); setBrandFilter(new Set()); }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="pc-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.sku} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
