import { getProducts } from "@/lib/api/mock";
import { HomeShowcase } from "@/components/HomeShowcase";

export default async function HomePage() {
  const products = await getProducts();
  return (
    <div className="container home-page-root">
      <HomeShowcase products={products} />
    </div>
  );
}
