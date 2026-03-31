import Link from "next/link";

const BRANDS = [
  { name: "Les Vergers Boiron", category: "Frozen Fruits & Vegetables" },
  { name: "Bridor", category: "Frozen Breads & Viennoiseries" },
  { name: "Leidy's", category: "Pork Products" },
  { name: "Calabro Cheese", category: "Italian-Style Cheese" },
  { name: "Kikkoman", category: "Soy Sauce & Asian Condiments" },
  { name: "Red Hill", category: "Specialty Meats" },
  { name: "Smoking Goose", category: "Artisan Charcuterie" },
  { name: "Jasper Hill Farm", category: "Artisan American Cheese" },
  { name: "North Country Smokehouse", category: "Smoked Meats & Poultry" },
  { name: "MiFood", category: "Specialty Food Products" },
  { name: "Charbonneaux-Brabant", category: "Vinegars & Condiments" },
  { name: "Le Bus Bakery", category: "Artisan Breads" },
  { name: "Monin", category: "Syrups & Sauces" },
  { name: "Fermín", category: "Spanish Ibérico Charcuterie" },
  { name: "Saratoga", category: "Sparkling Water" },
  { name: "David's Cookies", category: "Frozen Baked Goods" },
  { name: "Cabot Creamery", category: "Vermont Dairy & Cheese" },
  { name: "Beyond Meat", category: "Plant-Based Proteins" },
  { name: "Marukan", category: "Rice Vinegars" },
  { name: "Barry Callebaut", category: "Premium Chocolate" },
  { name: "El Principe", category: "Spanish Seafood" },
  { name: "Compart Family Farms", category: "Duroc Pork" },
];

export default function BrandPartnersPage() {
  return (
    <div className="brand-partners-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="cat-breadcrumb" aria-label="breadcrumb" style={{ marginBottom: "1.5rem" }}>
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Brand Partners</span>
        </nav>

        <div className="bp-header">
          <h1 className="bp-title">Our Brand Partners</h1>
          <p className="bp-subtitle">
            Like you, they&rsquo;re close to our heart. Julius Silvert is proud to partner with
            the finest artisan producers, farms, and specialty food companies in the world.
          </p>
        </div>

        <div className="bp-grid">
          {BRANDS.map((brand) => (
            <div key={brand.name} className="bp-card">
              <div className="bp-card-logo">
                <span className="bp-brand-initial">{brand.name.charAt(0)}</span>
              </div>
              <div className="bp-card-info">
                <h3 className="bp-brand-name">{brand.name}</h3>
                <p className="bp-brand-category">{brand.category}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bp-contact-cta">
          <h2>Interested in Becoming a Brand Partner?</h2>
          <p>
            We are always looking to expand our portfolio with quality producers.
            Contact our purchasing team to discuss opportunities.
          </p>
          <a href="mailto:purchasing@juliussilvert.com" className="btn-primary">
            Contact Our Team
          </a>
        </div>
      </div>
    </div>
  );
}
