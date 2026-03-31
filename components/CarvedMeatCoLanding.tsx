import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

type Props = {
  products: Product[];
};

export function CarvedMeatCoLanding({ products }: Props) {
  return (
    <div className="carved-brand-page">
      <nav className="container carved-breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: "1rem" }}>
        <Link href="/">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/catalog/meat-poultry">Meat &amp; Poultry</Link>
        <span aria-hidden> / </span>
        <span>Carved Meat Co.</span>
      </nav>

      <header className="carved-brand-hero">
        <div className="carved-brand-hero-media">
          <Image
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2400&q=85"
            alt=""
            fill
            className="carved-brand-hero-img"
            sizes="100vw"
            priority
          />
          <div className="carved-brand-hero-scrim" />
        </div>
        <div className="container carved-brand-hero-copy">
          <p className="carved-brand-kicker">Partner program</p>
          <h1 className="carved-brand-logo-type">Carved</h1>
          <p className="carved-brand-logo-sub">Meat Company</p>
          <p className="carved-brand-tagline">
            A premium cut-to-order high choice beef program — built for consistency at the center of the plate.
          </p>
          <a href="#carved-shop" className="carved-brand-cta">
            Find your cut
          </a>
        </div>
      </header>

      <section className="container carved-brand-intro" style={{ paddingBottom: "2.5rem" }}>
        <h2 className="carved-intro-headline">A program built for you.</h2>
        <div className="carved-intro-columns">
          <p>
            Mindful sourcing, expert aging, and portioning to spec — so every service delivers the same
            performance your guests expect. Order the cuts you need through your Julius Silvert account.
          </p>
          <p>
            Explore our selection of steaks, roasts, grinds, and specialty cuts below. Case pricing and
            pack sizes are shown on each item; your rep can help with allocations and LTOs.
          </p>
        </div>
      </section>

      <section id="carved-shop" className="container carved-brand-grid-section" style={{ paddingBottom: "3rem" }}>
        <h2 className="carved-shop-heading">Shop Carved cuts</h2>
        <div className="carved-product-grid">
          {products.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="carved-empty">No beef items in the demo catalog yet. Check back soon.</p>
        )}
      </section>
    </div>
  );
}
