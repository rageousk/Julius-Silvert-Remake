import { searchProducts } from "@/lib/api/mock";
import SearchResultsClient from "@/components/SearchResultsClient";
import { sanitizeCatalogSearchQuery } from "@/lib/input-security";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = sanitizeCatalogSearchQuery(q ?? "");
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>
      <SearchResultsClient query={query} initialResults={results} />
    </div>
  );
}
