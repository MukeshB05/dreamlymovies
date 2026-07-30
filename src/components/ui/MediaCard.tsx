'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { getTitle, getDate, formatYear, getMediaType, truncateText } from '@/lib/utils';
import { CircularRating } from './CircularRating';
import { createPortal } from 'react-dom';

interface MediaCardProps {
  item: {
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
  };
  variant?: 'poster' | 'backdrop';
  priority?: boolean;
  showHoverCard?: boolean;
}

const GENRES: Record<number, { name: string; moviePath: string; tvPath: string }> = {
  28: { name: 'Action', moviePath: '/genre/28', tvPath: '/tv/genre/10759' },
  12: { name: 'Adventure', moviePath: '/genre/12', tvPath: '/tv/genre/10759' },
  16: { name: 'Animation', moviePath: '/genre/16', tvPath: '/tv/genre/16' },
  35: { name: 'Comedy', moviePath: '/genre/35', tvPath: '/tv/genre/35' },
  80: { name: 'Crime', moviePath: '/genre/80', tvPath: '/tv/genre/80' },
  99: { name: 'Documentary', moviePath: '/genre/99', tvPath: '/tv/genre/99' },
  18: { name: 'Drama', moviePath: '/genre/18', tvPath: '/tv/genre/18' },
  10751: { name: 'Family', moviePath: '/genre/10751', tvPath: '/tv/genre/10751' },
  14: { name: 'Fantasy', moviePath: '/genre/14', tvPath: '/tv/genre/10765' },
  36: { name: 'History', moviePath: '/genre/36', tvPath: '/tv/genre/36' },
  27: { name: 'Horror', moviePath: '/genre/27', tvPath: '/tv/genre/27' },
  10402: { name: 'Music', moviePath: '/genre/10402', tvPath: '/tv/genre/10402' },
  9648: { name: 'Mystery', moviePath: '/genre/9648', tvPath: '/tv/genre/9648' },
  10749: { name: 'Romance', moviePath: '/genre/10749', tvPath: '/tv/genre/10749' },
  878: { name: 'Sci-Fi', moviePath: '/genre/878', tvPath: '/tv/genre/10765' },
  10770: { name: 'TV Movie', moviePath: '/genre/10770', tvPath: '/tv/genre/10770' },
  53: { name: 'Thriller', moviePath: '/genre/53', tvPath: '/tv/genre/53' },
  10752: { name: 'War', moviePath: '/genre/10752', tvPath: '/tv/genre/10768' },
  37: { name: 'Western', moviePath: '/genre/37', tvPath: '/tv/genre/37' },
  10759: { name: 'Action & Adventure', moviePath: '/genre/28', tvPath: '/tv/genre/10759' },
  10762: { name: 'Kids', moviePath: '/genre/10751', tvPath: '/tv/genre/10762' },
  10763: { name: 'News', moviePath: '/genre/99', tvPath: '/tv/genre/10763' },
  10764: { name: 'Reality', moviePath: '/genre/99', tvPath: '/tv/genre/10764' },
  10765: { name: 'Sci-Fi & Fantasy', moviePath: '/genre/878', tvPath: '/tv/genre/10765' },
  10766: { name: 'Soap', moviePath: '/genre/18', tvPath: '/tv/genre/10766' },
  10767: { name: 'Talk', moviePath: '/genre/99', tvPath: '/tv/genre/10767' },
  10768: { name: 'War & Politics', moviePath: '/genre/10752', tvPath: '/tv/genre/10768' },
};

export function MediaCard({ item, variant = 'poster', priority = false, showHoverCard = true }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const title = getTitle(item);
  const date = getDate(item);
  const year = formatYear(date);
  const mediaType = getMediaType(item);
  const href = `/${mediaType}/${item.id}`;
  const genres = item.genre_ids?.slice(0, 2).map((id) => {
    const genre = GENRES[id];
    if (!genre) return null;
    return {
      id,
      name: genre.name,
      href: mediaType === 'movie' ? genre.moviePath : genre.tvPath,
    };
  }).filter(Boolean) as { id: number; name: string; href: string }[] || [];

  // Build play URL with params
  const playParams = new URLSearchParams({
    id: item.id.toString(),
    type: mediaType,
    title: title,
    poster: item.poster_path || '',
    backdrop: item.backdrop_path || '',
  });
  const playUrl = `/play?${playParams.toString()}`;

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Close hover card on scroll
  useEffect(() => {
    if (!isHovered) return;

    const handleScroll = () => {
      setIsHovered(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isHovered]);

  // Fetch logo when hover card is shown
  useEffect(() => {
    if (!isHovered || logo || logoLoading) return;

    const fetchLogo = async () => {
      setLogoLoading(true);
      try {
        const response = await fetch(`/api/images/${mediaType}/${item.id}`);
        if (response.ok) {
          const data = await response.json();
          setLogo(data.logo);
        }
      } catch {
        // Silently fail, we'll just show the title
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLogo();
  }, [isHovered, logo, logoLoading, mediaType, item.id]);

  const updateCardRect = useCallback(() => {
    if (containerRef.current) {
      setCardRect(containerRef.current.getBoundingClientRect());
    }
  }, []);

  const handleMouseEnter = () => {
    if (!showHoverCard || variant === 'backdrop') return;
    updateCardRect();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateCardRect();
      setIsHovered(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(false);
  };

  if (variant === 'backdrop') {
    return (
      <Link href={href} className="group block relative">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative aspect-video rounded-xl overflow-hidden bg-surface"
        >
          <Image
            src={getBackdropUrl(item.backdrop_path || item.poster_path)}
            alt={title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-lg line-clamp-1">{title}</h3>
            <div className="flex items-center gap-3 mt-2">
              <CircularRating rating={item.vote_average} size="sm" />
              <span className="text-white/70 text-sm">{year}</span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  const hoverCardWidth = 320;
  const hoverCardHeight = 380;

  let hoverCardStyle: React.CSSProperties = {};
  if (cardRect) {
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    let left = cardCenterX - hoverCardWidth / 2;
    let top = cardCenterY - hoverCardHeight / 2;

    // Keep within viewport bounds
    const padding = 20;
    if (left < padding) left = padding;
    if (left + hoverCardWidth > window.innerWidth - padding) {
      left = window.innerWidth - hoverCardWidth - padding;
    }
    if (top < padding) top = padding;
    if (top + hoverCardHeight > window.innerHeight - padding) {
      top = window.innerHeight - hoverCardHeight - padding;
    }

    hoverCardStyle = {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${hoverCardWidth}px`,
      zIndex: 99999,
    };
  }

  return (
    <div
      ref={containerRef}
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={href} className="block">
        <motion.div
          animate={isHovered ? { scale: 0.95, opacity: 0.3 } : { scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface">
            <Image
              src={getImageUrl(item.poster_path)}
              alt={title}
              fill
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 15vw"
            />
            <div className="absolute top-2 right-2">
              <CircularRating rating={item.vote_average} size="sm" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-white/50 text-xs">{year}</p>
          </div>
        </motion.div>
      </Link>

      {isMounted && isHovered && showHoverCard && cardRect && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.5,
              x: cardRect.left + cardRect.width / 2 - hoverCardWidth / 2 - parseFloat(hoverCardStyle.left as string || '0'),
              y: cardRect.top + cardRect.height / 2 - hoverCardHeight / 2 - parseFloat(hoverCardStyle.top as string || '0'),
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
            }}
            transition={{
              duration: 0.25,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={hoverCardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] border border-white/10">
              {/* Poster Section */}
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={getBackdropUrl(item.backdrop_path || item.poster_path)}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="320px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                {/* Rating Badge */}
                <div className="absolute top-3 right-3">
                  <CircularRating rating={item.vote_average} size="md" />
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 space-y-3">
                <div>
                  <Link href={href}>
                    {logo ? (
                      <div className="relative h-8 w-full mb-1">
                        <Image
                          src={getImageUrl(logo, 'w300')}
                          alt={title}
                          fill
                          className="object-contain object-left"
                          sizes="200px"
                        />
                      </div>
                    ) : (
                      <h3 className="font-bold text-white text-lg hover:text-primary transition-colors line-clamp-1">
                        {title}
                      </h3>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-primary text-sm font-medium">{year}</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-white/50 text-sm uppercase">{mediaType}</span>
                  </div>
                </div>

                {/* Genres */}
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map((genre) => (
                      <Link
                        key={genre.id}
                        href={genre.href}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 hover:bg-primary/20 hover:border-primary/40 hover:text-white transition-all"
                      >
                        {genre.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {item.overview && (
                  <p className="text-sm text-white/60 leading-relaxed line-clamp-2">
                    {truncateText(item.overview, 120)}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href={playUrl}
                    className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-primary hover:bg-primary-light rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Trailer
                  </Link>
                  <Link
                    href={href}
                    className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors border border-white/10"
                  >
                    Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export function MediaCardSkeleton({ variant = 'poster' }: { variant?: 'poster' | 'backdrop' }) {
  if (variant === 'backdrop') {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-surface animate-pulse">
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="h-5 w-3/4 bg-surface-lighter rounded" />
          <div className="h-4 w-1/2 bg-surface-lighter rounded" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[2/3] rounded-xl bg-surface animate-pulse" />
      <div className="mt-2 space-y-1.5">
        <div className="h-4 w-3/4 bg-surface rounded" />
        <div className="h-3 w-1/2 bg-surface rounded" />
      </div>
    </div>
  );
}
