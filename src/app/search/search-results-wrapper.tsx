'use client';

import { InfiniteScroll } from '@/components/ui';

interface SearchResultsWrapperProps {
  query: string;
  initialItems: Array<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path: string | null;
    backdrop_path?: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    media_type?: 'movie' | 'tv';
  }>;
  totalPages: number;
}

export function SearchResultsWrapper({
  query,
  initialItems,
}: SearchResultsWrapperProps) {
  const fetchMore = async (page: number) => {
    const res = await fetch(`/api/search/multi?q=${encodeURIComponent(query)}&page=${page}`);
    return res.json();
  };

  return (
    <InfiniteScroll
      initialItems={initialItems}
      fetchMore={fetchMore}
    />
  );
}
