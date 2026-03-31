/**
 * Legacy: this script used a small rotating Unsplash pool (duplicates + many dead CDN ids).
 * Use instead: node scripts/apply-curated-product-images.mjs
 */
console.error(
  "fix-product-image-urls.mjs is retired — run: node scripts/apply-curated-product-images.mjs"
);
process.exit(1);
