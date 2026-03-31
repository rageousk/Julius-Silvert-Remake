"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/api/mock";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

const ALL_CATEGORIES = [
  "Meat & Poultry",
  "Dairy & Eggs",
  "Cheese & Charcuterie",
  "Seafood",
  "Produce",
  "Frozen",
  "Pantry",
  "Baking & Pastry",
  "Oils & Vinegars",
  "Supplies",
];

export function WhatsNewCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sortBy,   setSortBy]   = useState("default");

  // sidebar state
  const [catFilter,   setCatFilter]   = useState<Set<string>>(new Set());
  const [brandFilter, setBrandFilter] = useState<Set<string>>(new Set());
  const [catOpen,     setCatOpen]     = useState(false);
  const [brandOpen,   setBrandOpen]   = useState(false);

  useEffect(() => {
    getProducts().then((items) => {
      setProducts(items.slice(0, 30)); // first 30 = "new arrivals"
      setLoading(false);
    });
  }, []);

  // Count per category (across full set)
  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] ?? 0) + 1;
    });
    return map;
  }, [products]);

  // Derive brands from first word of product name
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

  function toggleCat(cat: string) {
    setCatFilter((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function toggleBrand(brand: string) {
    setBrandFilter((prev) => {
      const next = new Set(prev);
      next.has(brand) ? next.delete(brand) : next.add(brand);
      return next;
    });
  }

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (catFilter.size > 0) {
      list = list.filter((p) => catFilter.has(p.category));
    }
    if (brandFilter.size > 0) {
      list = list.filter((p) => brandFilter.has(p.name.split(" ")[0].toUpperCase()));
    }

    if (sortBy === "price-asc")  list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sortBy === "name-asc")   list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "sku-asc")    list.sort((a, b) => a.sku.localeCompare(b.sku));

    return list;
  }, [products, sortBy, catFilter, brandFilter]);

  const hasFilters = catFilter.size > 0 || brandFilter.size > 0;

  function clearAll() {
    setCatFilter(new Set());
    setBrandFilter(new Set());
  }

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "5rem" }}>
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
                {ALL_CATEGORIES.map((cat) => {
                  const count   = catCounts[cat] ?? 0;
                  const checked = catFilter.has(cat);
                  return (
                    <li key={cat}>
                      <label className={`cat-cb-row${checked ? " checked" : ""}`}>
                        <input
                          type="checkbox"
                          className="cat-cb-input"
                          checked={checked}
                          onChange={() => toggleCat(cat)}
                        />
                        <span className="cat-cb-label">{cat}</span>
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
            <span>What&apos;s New</span>
          </nav>

          <h1 className="cat-page-heading">WHAT&apos;S NEW</h1>

          {/* Toolbar */}
          <div className="cat-toolbar">
            <div className="cat-filter-chips">
              {Array.from(catFilter).map((c) => (
                <span key={c} className="cat-chip">
                  {c}
                  <button className="cat-chip-remove" onClick={() => toggleCat(c)}>×</button>
                </span>
              ))}
              {Array.from(brandFilter).map((b) => (
                <span key={b} className="cat-chip">
                  {b}
                  <button className="cat-chip-remove" onClick={() => toggleBrand(b)}>×</button>
                </span>
              ))}
              {hasFilters && (
                <button className="cat-clear-all" onClick={clearAll}>Clear All</button>
              )}
            </div>

            <div className="cat-sort">
              <label htmlFor="wn-sort">Sort By:</label>
              <select
                id="wn-sort"
                className="cat-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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
            {loading
              ? "Loading…"
              : `${filteredProducts.length} item${filteredProducts.length !== 1 ? "s" : ""}`}
          </p>

          {/* Grid */}
          {loading ? (
            <div className="pc-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="pc-card pc-skeleton" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="cat-empty">
              <div className="cat-empty-icon">🔍</div>
              <h2>No results found</h2>
              <p>Try a different filter or clear your selection.</p>
              <button className="btn-primary" onClick={clearAll}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="pc-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
