'use client';

import { InfiniteScroll } from '@/components/ui';

interface InfiniteScrollWrapperProps {
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
    genre_ids?: number[];
  }>;
  studioId: number;
}

export function InfiniteScrollWrapper({
  initialItems,
  studioId,
}: InfiniteScrollWrapperProps) {
  const fetchMore = async (page: number) => {
    const res = await fetch(`/api/discover/movie?company=${studioId}&page=${page}`);
    return res.json();
  };

  return (
    <InfiniteScroll
      initialItems={initialItems}
      fetchMore={fetchMore}
      mediaType="movie"
    />
  );
}
