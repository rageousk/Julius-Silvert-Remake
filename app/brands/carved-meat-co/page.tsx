import type { Metadata } from "next";
import { getProducts } from "@/lib/api/mock";
import { CarvedMeatCoLanding } from "@/components/CarvedMeatCoLanding";

export const metadata: Metadata = {
  title: "Carved Meat Co. | Julius Silvert B2B Catalog",
  description: "Premium beef program — center-of-the-plate cuts for professional kitchens.",
};

export default async function CarvedMeatCoPage() {
  const products = await getProducts();
  const carved = products.filter(
    (p) =>
      p.category === "Meat & Poultry" &&
      (p.subcategory === "Beef" || p.subcategory === "Burgers & Grinds")
  );
  return <CarvedMeatCoLanding products={carved} />;
}
