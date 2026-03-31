import { Suspense } from "react";
import { notFound } from "next/navigation";
import { findNavItemBySlug, NAV_ITEMS } from "@/lib/constants/navigation";
import { getProductsByCategory } from "@/lib/api/mock";
import CategoryPageClient from "@/components/CategoryPageClient";

interface Props {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ sub?: string }>;
}

export function generateStaticParams() {
  return NAV_ITEMS.filter((item) => item.category).map((item) => ({
    categorySlug: item.slug,
  }));
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params;
  const { sub } = await searchParams;

  const navItem = findNavItemBySlug(categorySlug);
  if (!navItem || !navItem.category) notFound();

  const products = await getProductsByCategory(navItem.category);

  // Resolve ?sub= slug → subcategory label
  let initialSubcategory = "";
  if (sub) {
    const match = navItem.subcategories.find((s) => s.slug === sub);
    if (match) initialSubcategory = match.label;
  }

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>}>
        <CategoryPageClient
          navItem={navItem}
          products={products}
          initialSubcategory={initialSubcategory}
        />
      </Suspense>
    </div>
  );
}
