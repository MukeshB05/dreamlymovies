'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MediaCard, MediaCardSkeleton } from './MediaCard';

interface InfiniteScrollProps {
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
  fetchMore: (page: number) => Promise<{
    results: Array<{
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
    total_pages: number;
  }>;
  mediaType?: 'movie' | 'tv';
}

export function InfiniteScroll({ initialItems, fetchMore, mediaType }: InfiniteScrollProps) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const data = await fetchMore(nextPage);

      if (data.results.length === 0 || nextPage >= data.total_pages) {
        setHasMore(false);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = data.results.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {items.map((item, index) => (
          <motion.div
            key={`${item.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
          >
            <MediaCard
              item={{
                ...item,
                media_type: item.media_type || mediaType,
              }}
            />
          </motion.div>
        ))}
      </div>

      <div ref={loaderRef} className="py-8">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-white/40 text-sm">No more items to load</p>
        )}
      </div>
    </div>
  );
}
