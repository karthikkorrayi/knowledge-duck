'use client';
// THE key fix: every page link is built from the current URL params
// with ONLY the `page` value swapped. Category, state, search, sort
// etc. are all preserved exactly as-is.

import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Props {
  currentPage: number;
  totalPages:  number;
}

export default function JobsPagination({ currentPage, totalPages }: Props) {
  const searchParams = useSearchParams();
  const pathname     = usePathname();

  if (totalPages <= 1) return null;

  // Build a URL that keeps all current params but swaps `page`
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page'); // clean URL for page 1
    } else {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  // Build the page numbers to show (max 5 visible, with current in middle)
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2)           pages.push('...');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="bg-white rounded-2xl shadow px-5 py-4 flex items-center justify-center gap-1.5 flex-wrap">

      {/* Prev */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
        >
          ‹
        </Link>
      ) : (
        <span className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-100 text-gray-300 text-sm cursor-not-allowed">
          ‹
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildPageUrl(p as number)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
              p === currentPage
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-sm font-medium"
        >
          ›
        </Link>
      ) : (
        <span className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-100 text-gray-300 text-sm cursor-not-allowed">
          ›
        </span>
      )}

      {/* Page info */}
      <span className="ml-2 text-xs text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
}