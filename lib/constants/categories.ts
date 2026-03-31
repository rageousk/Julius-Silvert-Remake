import { CategoryName } from "@/lib/types";

export type CategoryCard = {
  name: CategoryName;
  imageSrc: string;
};

export const CATEGORY_CARDS: CategoryCard[] = [
  { name: "Meat & Poultry", imageSrc: "/categories/meat-poultry.png" },
  { name: "Dairy & Eggs", imageSrc: "/categories/dairy-eggs.png" },
  { name: "Cheese & Charcuterie", imageSrc: "/categories/cheese-charcuterie.png" },
  { name: "Supplies", imageSrc: "/categories/supplies.png" },
  { name: "Pantry", imageSrc: "/categories/pantry.png" },
  { name: "Seafood", imageSrc: "/categories/seafood.png" },
  { name: "Frozen", imageSrc: "/categories/frozen.png" },
  { name: "Produce", imageSrc: "/categories/produce.png" },
  { name: "Baking & Pastry", imageSrc: "/categories/baking-pastry.png" },
  { name: "Oils & Vinegars", imageSrc: "/categories/oils-vinegars.png" }
];
