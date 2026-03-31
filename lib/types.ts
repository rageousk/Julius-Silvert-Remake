export const CATEGORY_NAMES = [
  "Meat & Poultry",
  "Dairy & Eggs",
  "Cheese & Charcuterie",
  "Supplies",
  "Pantry",
  "Seafood",
  "Frozen",
  "Produce",
  "Baking & Pastry",
  "Oils & Vinegars"
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: CategoryName;
  subcategory: string;
  unitSize: string;
  imageUrl: string;
};

export type CartLine = {
  sku: string;
  name: string;
  price: number;
  imageUrl: string;
  unitSize: string;
  quantity: number;
  lineSubtotal: number;
};
