import { CategoryName } from "@/lib/types";

export type NavItem = {
  label: string;
  slug: string;
  href: string;
  category?: CategoryName;
  subcategories: { label: string; slug: string }[];
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const mapSubcategories = (labels: string[]) => labels.map((label) => ({ label, slug: toSlug(label) }));

export const NAV_ITEMS: NavItem[] = [
  {
    label: "WHAT'S NEW",
    slug: "whats-new",
    href: "/whats-new",
    subcategories: []
  },
  {
    label: "Meat & Poultry",
    slug: "meat-poultry",
    href: "/catalog/meat-poultry",
    category: "Meat & Poultry",
    subcategories: mapSubcategories(["Beef", "Wagyu", "Burgers & Grinds", "Chicken", "Lamb", "Pork", "Charcuterie & Salumi"])
  },
  {
    label: "Dairy & Eggs",
    slug: "dairy-eggs",
    href: "/catalog/dairy-eggs",
    category: "Dairy & Eggs",
    subcategories: mapSubcategories(["Butter", "Eggs", "Milk & Cream", "Dairy Alternatives", "Yogurt & Sour Cream"])
  },
  {
    label: "Cheese & Charcuterie",
    slug: "cheese-charcuterie",
    href: "/catalog/cheese-charcuterie",
    category: "Cheese & Charcuterie",
    subcategories: mapSubcategories([
      "Cheddars & Jacks",
      "Goat",
      "Italian Style",
      "Smoked & Flavored",
      "Swiss & Alpine",
      "Deli Style"
    ])
  },
  {
    label: "Oils & Vinegars",
    slug: "oils-vinegars",
    href: "/catalog/oils-vinegars",
    category: "Oils & Vinegars",
    subcategories: mapSubcategories(["Extra Virgin Olive Oils", "Frying Oils", "Balsamic", "Rice Vinegar", "Wine Vinegars"])
  },
  {
    label: "Baking & Pastry",
    slug: "baking-pastry",
    href: "/catalog/baking-pastry",
    category: "Baking & Pastry",
    subcategories: mapSubcategories(["Baking Fats", "Bread", "Chocolate", "Dough, Shells & Pastry", "Leaveners", "Nuts & Seeds"])
  },
  {
    label: "Produce",
    slug: "produce",
    href: "/catalog/produce",
    category: "Produce",
    subcategories: mapSubcategories(["Potatoes", "Onions, Shallots & Leeks", "Leafy Greens", "Mushrooms", "Berries", "Citrus"])
  },
  {
    label: "Frozen",
    slug: "frozen",
    href: "/catalog/frozen",
    category: "Frozen",
    subcategories: mapSubcategories(["Frozen Vegetables", "French Fries", "Frozen Fruit", "Frozen Desserts", "Frozen Pasta", "Frozen Meat"])
  },
  {
    label: "Seafood",
    slug: "seafood",
    href: "/catalog/seafood",
    category: "Seafood",
    subcategories: mapSubcategories(["Shellfish", "Shrimp", "Tin Fish", "Fish", "Crab", "Octopus & Calamari"])
  },
  {
    label: "Pantry",
    slug: "pantry",
    href: "/catalog/pantry",
    category: "Pantry",
    subcategories: mapSubcategories(["Beans & Legumes", "Condiments", "Dried Fruit", "Spices & Seasonings", "Stocks & Broth", "Truffles"])
  },
  {
    label: "Supplies",
    slug: "supplies",
    href: "/catalog/supplies",
    category: "Supplies",
    subcategories: mapSubcategories(["Disposables", "Kitchen Supplies", "Gloves", "Cleaning Products", "Containers & Bags", "Napkins & Towels"])
  }
];

export const CATEGORY_NAV_ITEMS = NAV_ITEMS.filter((item) => Boolean(item.category));

export const findNavItemBySlug = (slug: string) => NAV_ITEMS.find((item) => item.slug === slug);
