"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryGrid } from "@/components/CategoryGrid";
import { HomeShowcase } from "@/components/HomeShowcase";
import { ProductCatalog } from "@/components/ProductCatalog";
import { getProducts, getProductsByCategory, searchProducts } from "@/lib/api/mock";
import { CategoryName, Product } from "@/lib/types";

export function CatalogExperience() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName | "All">("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    setSearch(q);
  }, []);

  useEffect(() => {
    getProducts().then((items) => {
      setAllProducts(items);
      setVisibleProducts(items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const run = async () => {
      let next = allProducts;

      if (selectedCategory !== "All") {
        next = await getProductsByCategory(selectedCategory);
      }

      if (search.trim()) {
        const searchMatches = await searchProducts(search);
        const allowed = new Set(next.map((product) => product.id));
        next = searchMatches.filter((product) => allowed.has(product.id));
      }

      if (active) {
        setVisibleProducts(next);
        setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [allProducts, selectedCategory, search]);

  const countLabel = useMemo(() => `${visibleProducts.length} products`, [visibleProducts.length]);

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "5rem" }}>
      <HomeShowcase products={allProducts} />
      <CategoryGrid selected={selectedCategory} onSelect={setSelectedCategory} />

      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">Catalog</h2>
        <p className="section-subtitle">
          {countLabel} {selectedCategory === "All" ? "across all categories" : `in ${selectedCategory}`}
        </p>
        <div className="catalog-toolbar">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, product name, or category"
          />
        </div>
        <ProductCatalog products={visibleProducts} loading={loading} />
      </section>
    </div>
  );
}
