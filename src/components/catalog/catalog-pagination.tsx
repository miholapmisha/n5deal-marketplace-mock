import { CatalogPageLink } from "@/components/catalog/catalog-link";
import { Pagination } from "@/components/filters/pagination";

interface CatalogPaginationProps {
  page: number;
  pageCount: number;
}

export function CatalogPagination({ page, pageCount }: CatalogPaginationProps) {
  return <Pagination page={page} pageCount={pageCount} PageLink={CatalogPageLink} />;
}
