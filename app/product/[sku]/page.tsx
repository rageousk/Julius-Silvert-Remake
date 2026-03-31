import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getProductBySku,
  getRelatedProducts,
  getAllSkus,
} from "@/lib/api/mock";
import { findNavItemBySlug, NAV_ITEMS } from "@/lib/constants/navigation";
import ProductDetailClient from "@/components/ProductDetailClient";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";

interface Props {
  params: Promise<{ sku: string }>;
}

export async function generateStaticParams() {
  const skus = getAllSkus();
  return skus.map((sku) => ({ sku }));
}

function toCategorySlug(cat: string) {
  return cat.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function generateMetadata({ params }: Props) {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.name} | Julius Silvert B2B`,
    description: `${product.name} — ${product.unitSize}. SKU: ${product.sku}`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { sku } = await params;
  const product = await getProductBySku(sku);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);

  const catSlug   = toCategorySlug(product.category);
  const catNavItem = NAV_ITEMS.find((n) => n.category === product.category);

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "5rem" }}>

      {/* Breadcrumb */}
      <nav className="cat-breadcrumb" style={{ marginBottom: "1.25rem" }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/catalog/${catSlug}`}>{product.category}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      {/* Product detail */}
      <Suspense fallback={<div style={{ minHeight: 400 }} />}>
        <ProductDetailClient product={product} />
      </Suspense>

      {/* Related products */}
      {related.length > 0 && (
        <section className="pdp-related">
          <h2 className="pdp-related-title">Similar Products You May Like</h2>
          <div className="pc-grid">
            {related.map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
          {catNavItem && (
            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <Link href={`/catalog/${catSlug}`} className="pdp-view-all-link">
                View All {product.category} →
              </Link>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
