"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  title: string;
  viewAllHref: string;
  products: Product[];
};

export function HomeProductRail({ title, viewAllHref, products }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, products.length]);

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const firstItem = el.querySelector<HTMLElement>(".home-rail-item");
    const styles = window.getComputedStyle(el);
    const rawGap = styles.gap || styles.columnGap || "16px";
    const gap = parseFloat(rawGap) || 16;
    const step = (firstItem?.offsetWidth ?? 280) + gap;
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="home-rail-section">
      <div className="home-rail-head">
        <h3 className="home-rail-title">{title}</h3>
        <div className="home-rail-head-actions">
          <div className="home-rail-arrows">
            <button
              type="button"
              className="home-rail-arrow"
              onClick={() => scrollByDir(-1)}
              disabled={!canLeft}
              aria-label="Scroll products left"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="home-rail-arrow"
              onClick={() => scrollByDir(1)}
              disabled={!canRight}
              aria-label="Scroll products right"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <Link href={viewAllHref} className="home-rail-view-all">
            View all
          </Link>
        </div>
      </div>
      <div className="home-rail-scroller-wrap">
        <div ref={scrollerRef} className="home-rail-scroller">
          {products.map((product) => (
            <div key={product.sku} className="home-rail-item">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
