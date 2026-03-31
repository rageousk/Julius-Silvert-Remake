import Link from "next/link";
import { notFound } from "next/navigation";
import { findNavItemBySlug } from "@/lib/constants/navigation";
import { getProducts } from "@/lib/api/mock";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  params: Promise<{ subcategorySlug: string }>;
};

export default async function WhatsNewSubcategoryPage({ params }: Props) {
  const { subcategorySlug } = await params;

  const whatsNew = findNavItemBySlug("whats-new");
  if (!whatsNew) notFound();

  const subcategory = whatsNew.subcategories.find((sub) => sub.slug === subcategorySlug);
  if (!subcategory) notFound();

  const products = (await getProducts()).slice(0, 20);

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "5rem" }}>
      <nav className="cat-breadcrumb" aria-label="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/whats-new">What&apos;s New</Link>
        <span>/</span>
        <span>{subcategory.label}</span>
      </nav>

      <h1 className="cat-page-heading" style={{ marginBottom: "0.25rem" }}>
        {subcategory.label}
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Curated selections from What&apos;s New
      </p>

      <div className="pc-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
