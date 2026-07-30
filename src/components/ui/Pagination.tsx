'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const maxPages = Math.min(totalPages, 500);

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = maxPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= maxPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(maxPages);
      } else if (currentPage >= maxPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = maxPages - 4; i <= maxPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(maxPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Link
        href={createPageUrl(Math.max(1, currentPage - 1))}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentPage === 1
            ? 'text-white/30 pointer-events-none'
            : 'text-white/70 hover:text-white hover:bg-surface-light'
        )}
        aria-disabled={currentPage === 1}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {getVisiblePages().map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-white/50">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={createPageUrl(page as number)}
            className={cn(
              'min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
              currentPage === page
                ? 'bg-primary text-white'
                : 'text-white/70 hover:text-white hover:bg-surface-light'
            )}
          >
            {page}
          </Link>
        )
      )}

      <Link
        href={createPageUrl(Math.min(maxPages, currentPage + 1))}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentPage === maxPages
            ? 'text-white/30 pointer-events-none'
            : 'text-white/70 hover:text-white hover:bg-surface-light'
        )}
        aria-disabled={currentPage === maxPages}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
