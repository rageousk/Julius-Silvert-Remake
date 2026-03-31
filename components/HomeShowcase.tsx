"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { HomeHeroCarousel } from "@/components/HomeHeroCarousel";
import { HomeProductRail } from "@/components/HomeProductRail";

type Props = {
  products: Product[];
};

const BRAND_PARTNERS = [
  "Boiron", "Bridor", "Leidy's", "Calabro", "Kikkoman", "Red Hill",
  "Smoking Goose", "Jasper Hill Farm", "North Country", "MiFood",
  "Charbonneaux-Brabant", "Le Bus", "Monin", "Fermin", "Saratoga",
  "David's Cookies", "Cabot Creamery", "Beyond Meat", "Marukan", "Barry Callebaut",
];

function sortCenterPlateFirst(meat: Product[]) {
  return [...meat].sort((a, b) => {
    const score = (p: Product) =>
      p.subcategory === "Beef" || p.subcategory === "Burgers & Grinds" ? 0 : 1;
    return score(a) - score(b);
  });
}

export function HomeShowcase({ products }: Props) {
  const meat = products.filter((p) => p.category === "Meat & Poultry");
  const centerPlate = sortCenterPlateFirst(meat).slice(0, 12);
  const featuredSeafood = products.filter((p) => p.category === "Seafood").slice(0, 10);

  return (
    <section className="home-showcase home-showcase--premium">
      <HomeHeroCarousel />

      {/* Promo tiles with photography */}
      <div className="home-promo-grid">
        <Link href="/catalog/meat-poultry" className="home-promo-card home-promo-card--exclusives">
          <Image
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80"
            alt=""
            fill
            className="home-promo-card-bg"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="home-promo-card-scrim" />
          <div className="home-promo-card-body">
            <span className="home-promo-card-label">Silvert</span>
            <span className="home-promo-card-sublabel">Exclusives</span>
            <span className="home-promo-card-detail">Items only available here</span>
          </div>
        </Link>
        <Link href="/requisition-lists" className="home-promo-card home-promo-card--guide">
          <Image
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80"
            alt=""
            fill
            className="home-promo-card-bg"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="home-promo-card-scrim home-promo-card-scrim--strong" />
          <div className="home-promo-card-body">
            <span className="home-promo-card-label">My order</span>
            <span className="home-promo-card-sublabel">Guide</span>
            <span className="home-promo-card-detail">Reorder favorites in one pass</span>
          </div>
        </Link>
        <Link href="/catalog/produce" className="home-promo-card home-promo-card--family">
          <Image
            src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80"
            alt=""
            fill
            className="home-promo-card-bg"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="home-promo-card-scrim" />
          <div className="home-promo-card-body">
            <span className="home-promo-card-label">Family meal</span>
            <span className="home-promo-card-sublabel">Specials</span>
            <span className="home-promo-card-detail">Produce &amp; staples for volume</span>
          </div>
        </Link>
      </div>

      <div className="home-proteins-block">
        <HomeProductRail
          title="Center of the Plate Proteins"
          viewAllHref="/catalog/meat-poultry"
          products={centerPlate}
        />
      </div>

      {/* Carved — follows protein rail; links to full brand story */}
      <Link href="/brands/carved-meat-co" className="home-carved-spotlight home-carved-spotlight--after-proteins">
        <div className="home-carved-spotlight-media">
          <Image
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85"
            alt=""
            fill
            className="home-carved-spotlight-img"
            sizes="(max-width: 900px) 100vw, 45vw"
          />
        </div>
        <div className="home-carved-spotlight-panel">
          <p className="home-carved-spotlight-eyebrow">Partner program</p>
          <h2 className="home-carved-spotlight-title">Carved Meat Co.</h2>
          <p className="home-carved-spotlight-lede">
            High-choice beef, portioned to spec — the premium program behind many of the cuts above.
          </p>
          <span className="home-carved-spotlight-cta">Explore the program →</span>
        </div>
      </Link>

      <section className="home-cat-section">
        <h3 className="home-cat-section-title">Shop by category</h3>
        <div className="cat-shortcut-grid">
          {[
            { label: "Seafood", href: "/catalog/seafood", emoji: "🦞" },
            { label: "Produce", href: "/catalog/produce", emoji: "🥦" },
            { label: "Dairy & Eggs", href: "/catalog/dairy-eggs", emoji: "🥛" },
            { label: "Cheese & Charcuterie", href: "/catalog/cheese-charcuterie", emoji: "🧀" },
            { label: "Frozen", href: "/catalog/frozen", emoji: "❄️" },
            { label: "Baking & Pastry", href: "/catalog/baking-pastry", emoji: "🥐" },
            { label: "Pantry", href: "/catalog/pantry", emoji: "🫙" },
            { label: "Oils & Vinegars", href: "/catalog/oils-vinegars", emoji: "🫒" },
            { label: "Supplies", href: "/catalog/supplies", emoji: "📦" },
            { label: "Meat & Poultry", href: "/catalog/meat-poultry", emoji: "🥩" },
          ].map((cat) => (
            <Link key={cat.href} href={cat.href} className="cat-shortcut-card cat-shortcut-card--premium">
              <span className="cat-shortcut-emoji">{cat.emoji}</span>
              <span className="cat-shortcut-label">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="showcase-section-alt home-seafood-wrap">
        <HomeProductRail
          title="Fresh from the sea"
          viewAllHref="/catalog/seafood"
          products={featuredSeafood}
        />
      </div>

      <section className="partner-band partner-band--premium">
        <div className="partner-band-inner">
          <p className="partner-band-eyebrow">Trusted suppliers</p>
          <h3 className="partner-band-title">Our brand partners</h3>
          <p className="partner-band-dek">
            Like you, they&apos;re close to our heart — and they bring exceptional products to your kitchen.
          </p>
          <div className="partner-marquee">
            <div className="partner-marquee-track">
              {[...BRAND_PARTNERS, ...BRAND_PARTNERS].map((name, i) => (
                <span key={`${name}-${i}`} className="partner-chip">
                  {name}
                </span>
              ))}
            </div>
          </div>
          <Link href="/brand-partners" className="partner-cta-btn">
            View all partners
          </Link>
        </div>
      </section>
    </section>
  );
}
