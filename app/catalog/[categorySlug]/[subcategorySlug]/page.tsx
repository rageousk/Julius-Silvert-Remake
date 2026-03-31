import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { findNavItemBySlug } from "@/lib/constants/navigation";
import { getProductsByCategory } from "@/lib/api/mock";
import CategoryPageClient from "@/components/CategoryPageClient";

type Props = {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
};

export default async function SubcategoryPage({ params }: Props) {
  const { categorySlug, subcategorySlug } = await params;

  const navItem = findNavItemBySlug(categorySlug);
  if (!navItem?.category) notFound();

  const subcategory = navItem.subcategories.find((s) => s.slug === subcategorySlug);
  if (!subcategory) notFound();

  // Canonical URL is /catalog/[categorySlug]?sub=[subcategorySlug]
  // Redirect to it so URL stays consistent
  redirect(`/catalog/${categorySlug}?sub=${subcategorySlug}`);
}
