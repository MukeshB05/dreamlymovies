'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MediaCard, MediaCardSkeleton } from './MediaCard';

interface MediaItem {
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
}

interface MoreLikeThisProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  initialItems: MediaItem[];
}

export function MoreLikeThis({ mediaId, mediaType, initialItems }: MoreLikeThisProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [source, setSource] = useState<'recommendations' | 'similar'>('recommendations');
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/more-like-this?id=${mediaId}&type=${mediaType}&page=${nextPage}&source=${source}`
      );
      const data = await response.json();

      if (data.results.length === 0) {
        // If recommendations are exhausted, switch to similar
        if (source === 'recommendations') {
          setSource('similar');
          setPage(1);
          // Fetch similar from page 1
          const similarResponse = await fetch(
            `/api/more-like-this?id=${mediaId}&type=${mediaType}&page=1&source=similar`
          );
          const similarData = await similarResponse.json();

          if (similarData.results.length === 0) {
            setHasMore(false);
          } else {
            setItems((prev) => {
              const existingIds = new Set(prev.map((item) => item.id));
              const newItems = similarData.results.filter(
                (item: MediaItem) => !existingIds.has(item.id)
              );
              return [...prev, ...newItems];
            });
          }
        } else {
          setHasMore(false);
        }
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = data.results.filter(
            (item: MediaItem) => !existingIds.has(item.id)
          );
          return [...prev, ...newItems];
        });
        setPage(nextPage);

        if (nextPage >= data.total_pages) {
          if (source === 'recommendations') {
            setSource('similar');
            setPage(1);
          } else {
            setHasMore(false);
          }
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, mediaId, mediaType, source]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) return null;

  return (
    <div className="mt-10 sm:mt-12 lg:mt-16">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full" />
        More Like This
      </h2>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
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
                media_type: mediaType,
              }}
              showHoverCard={true}
            />
          </motion.div>
        ))}
      </div>

      <div ref={loaderRef} className="py-8">
        {isLoading && (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!hasMore && items.length > 12 && (
          <p className="text-center text-white/40 text-sm">You&apos;ve seen all recommendations</p>
        )}
      </div>
    </div>
  );
}
