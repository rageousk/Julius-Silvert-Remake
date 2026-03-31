import products from "@/mock-data/products.json";
import { Product } from "@/lib/types";
import { sanitizeCatalogSearchQuery } from "@/lib/input-security";

const MOCK_DELAY = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const typedProducts = products as Product[];

/** Sync catalog lookup — use for cart price integrity (client cannot override). */
export function getProductBySkuSync(sku: string): Product | null {
  const key = sku.trim();
  if (!key) return null;
  return typedProducts.find((p) => p.sku === key) ?? null;
}

export async function getProducts(): Promise<Product[]> {
  await sleep(MOCK_DELAY);
  return typedProducts;
}

export async function searchProducts(query: string): Promise<Product[]> {
  await sleep(MOCK_DELAY);
  const safe = sanitizeCatalogSearchQuery(query);
  const normalized = safe.toLowerCase();

  if (!normalized) {
    return typedProducts;
  }

  return typedProducts.filter((product) => {
    return (
      product.name.toLowerCase().includes(normalized) ||
      product.sku.toLowerCase().includes(normalized) ||
      product.category.toLowerCase().includes(normalized) ||
      product.subcategory.toLowerCase().includes(normalized)
    );
  });
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  await sleep(MOCK_DELAY);

  if (!category.trim()) {
    return typedProducts;
  }

  return typedProducts.filter((product) => product.category === category);
}

export async function getProductsByCategoryAndSubcategory(
  category: string,
  subcategory: string
): Promise<Product[]> {
  await sleep(MOCK_DELAY);
  return typedProducts.filter(
    (p) =>
      p.category === category &&
      p.subcategory.toLowerCase() === subcategory.toLowerCase()
  );
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  await sleep(MOCK_DELAY);
  return getProductBySkuSync(sku);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  await sleep(MOCK_DELAY);
  // Same subcategory first, fall back to same category, exclude self
  const sameSub = typedProducts.filter(
    (p) => p.sku !== product.sku && p.subcategory === product.subcategory
  );
  const sameCat = typedProducts.filter(
    (p) => p.sku !== product.sku && p.category === product.category && p.subcategory !== product.subcategory
  );
  return [...sameSub, ...sameCat].slice(0, limit);
}

export function getAllSkus(): string[] {
  return typedProducts.map((p) => p.sku);
}
