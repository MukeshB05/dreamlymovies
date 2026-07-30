'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import { getTitle, getDate, formatYear, truncateText, getMediaType } from '@/lib/utils';
import { CircularRating } from './CircularRating';

interface HeroItem {
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
}

interface HeroCarouselProps {
  items: HeroItem[];
  autoPlayInterval?: number;
}

export function HeroCarousel({ items, autoPlayInterval = 6000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [logos, setLogos] = useState<Record<number, string | null>>({});

  const displayItems = items.slice(0, 5);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayItems.length);
  }, [displayItems.length]);

  useEffect(() => {
    displayItems.forEach(async (item) => {
      const mediaType = getMediaType(item);
      try {
        const res = await fetch(`/api/images/${mediaType}/${item.id}`);
        const data = await res.json();
        if (data.logo) {
          setLogos((prev) => ({ ...prev, [item.id]: data.logo }));
        }
      } catch {
        // Silently fail
      }
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, goToNext, autoPlayInterval]);

  const currentItem = displayItems[currentIndex];
  if (!currentItem) return null;

  const title = getTitle(currentItem);
  const date = getDate(currentItem);
  const year = formatYear(date);
  const mediaType = getMediaType(currentItem);
  const currentLogo = logos[currentItem.id];

  // Build play URL with params
  const playParams = new URLSearchParams({
    id: currentItem.id.toString(),
    type: mediaType,
    title: title,
    poster: currentItem.poster_path || '',
    backdrop: currentItem.backdrop_path || '',
  });
  const playUrl = `/play?${playParams.toString()}`;

  return (
    <section
      className="relative h-[70vh] sm:h-[75vh] md:h-[80vh] lg:h-[85vh] w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <Image
            src={getBackdropUrl(currentItem.backdrop_path)}
            alt={title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between">
        {/* Main Content Area */}
        <div className="flex-1 flex items-center">
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 pt-16 sm:pt-20">
            <div className="max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="space-y-4 sm:space-y-5 md:space-y-6"
                >
                  {/* Logo or Title */}
                  {currentLogo ? (
                    <div className="relative h-14 sm:h-20 md:h-24 lg:h-28 w-full max-w-sm md:max-w-md">
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${currentLogo}`}
                        alt={title}
                        fill
                        className="object-contain object-left drop-shadow-2xl"
                        sizes="(max-width: 640px) 280px, 400px"
                      />
                    </div>
                  ) : (
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                      {title}
                    </h1>
                  )}

                  {/* Rating & Year */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <CircularRating rating={currentItem.vote_average} size="sm" />
                    <span className="text-white/80 text-sm font-medium">{year}</span>
                  </div>

                  {/* Overview - Hidden on very small screens */}
                  <p className="hidden sm:block text-sm md:text-base text-white/70 leading-relaxed line-clamp-2 md:line-clamp-3 max-w-xl">
                    {truncateText(currentItem.overview, 180)}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={playUrl}
                      className="inline-flex items-center gap-2 px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 bg-primary hover:bg-primary-light text-white text-sm sm:text-base font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/30"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      <span>Trailer</span>
                    </Link>
                    <Link
                      href={`/${mediaType}/${currentItem.id}`}
                      className="inline-flex items-center gap-2 px-5 sm:px-6 md:px-7 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-white text-sm sm:text-base font-semibold rounded-xl transition-all backdrop-blur-sm border border-white/10"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Info</span>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        <div className="pb-4 sm:pb-6 md:pb-8 px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex justify-center sm:justify-end">
            <div className="flex gap-1.5 sm:gap-2 items-end">
              {displayItems.map((item, index) => {
                const isActive = index === currentIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => goToSlide(index)}
                    className={`relative overflow-hidden rounded-md sm:rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'w-10 h-14 sm:w-12 sm:h-18 md:w-14 md:h-20 lg:w-16 lg:h-24 ring-2 ring-primary shadow-lg shadow-primary/20'
                        : 'w-7 h-10 sm:w-9 sm:h-13 md:w-10 md:h-14 lg:w-12 lg:h-18 opacity-50 hover:opacity-80 grayscale hover:grayscale-0'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  >
                    <Image
                      src={getImageUrl(item.poster_path, 'w185')}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
                        style={{ transformOrigin: 'left' }}
                        key={`progress-${currentIndex}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
