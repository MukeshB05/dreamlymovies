'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getBackdropUrl } from '@/lib/tmdb';
import { getTitle, getDate, formatYear, truncateText, getMediaType } from '@/lib/utils';
import { CircularRating } from './CircularRating';

interface HeroProps {
  item: {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    media_type?: 'movie' | 'tv';
  };
}

export function Hero({ item }: HeroProps) {
  const title = getTitle(item);
  const date = getDate(item);
  const year = formatYear(date);
  const mediaType = getMediaType(item);

  return (
    <section className="relative h-[85vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={getBackdropUrl(item.backdrop_path)}
          alt={title}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      </div>

      <div className="relative h-full flex items-center">
        <div className="px-4 md:px-8 lg:px-12 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary bg-primary/20 border border-primary/30 rounded-full mb-6">
              {mediaType === 'movie' ? 'Movie' : 'TV Series'}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {title}
            </h1>
            <div className="flex items-center gap-4 mb-5">
              <CircularRating rating={item.vote_average} size="md" />
              <span className="text-white/80">{year}</span>
            </div>
            <p className="text-base md:text-lg text-white/70 leading-relaxed mb-8 max-w-xl">
              {truncateText(item.overview, 200)}
            </p>
            <div className="flex items-center gap-4">
              <Link
                href={`/${mediaType}/${item.id}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-white/90 text-black font-semibold rounded-xl transition-all hover:scale-105"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Play
              </Link>
              <Link
                href={`/${mediaType}/${item.id}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all backdrop-blur-sm border border-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                More Info
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative h-[85vh] w-full overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="relative h-full flex items-center">
        <div className="px-4 md:px-8 lg:px-12 max-w-2xl space-y-6">
          <div className="h-6 w-24 bg-surface-lighter rounded-full animate-pulse" />
          <div className="h-14 md:h-16 w-80 max-w-full bg-surface-lighter rounded animate-pulse" />
          <div className="h-10 w-32 bg-surface-lighter rounded animate-pulse" />
          <div className="h-20 w-full max-w-xl bg-surface-lighter rounded animate-pulse" />
          <div className="flex gap-4 pt-2">
            <div className="h-12 w-28 bg-surface-lighter rounded-xl animate-pulse" />
            <div className="h-12 w-36 bg-surface-lighter rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
