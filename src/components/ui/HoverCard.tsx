'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { formatRating, getTitle, getDate, formatYear, truncateText, getMediaType } from '@/lib/utils';

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

interface HoverCardProps {
  item: MediaItem;
  children: React.ReactNode;
}

const GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

export function HoverCard({ item, children }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<'left' | 'right' | 'center'>('center');
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        if (rect.left < 200) {
          setPosition('left');
        } else if (screenWidth - rect.right < 200) {
          setPosition('right');
        } else {
          setPosition('center');
        }
      }
      setIsHovered(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(false);
  };

  const title = getTitle(item);
  const date = getDate(item);
  const year = formatYear(date);
  const mediaType = getMediaType(item);
  const genres = item.genre_ids?.slice(0, 3).map((id) => GENRES[id]).filter(Boolean) || [];

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 z-50 w-80 ${positionClasses[position]}`}
            style={{ pointerEvents: 'auto' }}
          >
            <Link href={`/${mediaType}/${item.id}`}>
              <div className="bg-surface-light rounded-xl overflow-hidden shadow-2xl border border-white/5">
                {item.backdrop_path && (
                  <div className="relative h-36 w-full">
                    <Image
                      src={getBackdropUrl(item.backdrop_path)}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-light to-transparent" />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white line-clamp-1">{title}</h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 rounded-full flex-shrink-0">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-medium text-white">
                        {formatRating(item.vote_average)}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="uppercase">{mediaType}</span>
                    <span>·</span>
                    <span>{year}</span>
                  </div>

                  {genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-0.5 bg-surface rounded text-xs text-white/70"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.overview && (
                    <p className="text-sm text-white/60 line-clamp-3">
                      {truncateText(item.overview, 150)}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-2 text-primary text-sm font-medium">
                    <span>View Details</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
