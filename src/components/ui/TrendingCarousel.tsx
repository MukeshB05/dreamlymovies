'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import '@/styles/TrendingCarousel.css';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const MOVIE_API_URL = `/api/trending/movie/day`;
const TV_API_URL = `/api/trending/tv/day`;

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

function LoadingSkeleton() {
  return (
    <div className="tmdb-carousel-wrapper">
      <div className="tmdb-carousel-container">
        <div className="tmdb-carousel-header-skeleton">
          <div className="tmdb-carousel-skeleton-title"></div>
          <div className="tmdb-carousel-skeleton-subtitle"></div>
        </div>
        <div className="tmdb-carousel-skeleton-grid">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="tmdb-carousel-skeleton-item">
              <div className="tmdb-carousel-skeleton-number"></div>
              <div className="tmdb-carousel-skeleton-poster"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TrendingCardProps {
  item: TrendingItem;
  idx: number;
  linkPrefix: string;
  isMovie: boolean;
  bgImgRef: React.RefObject<HTMLDivElement>;
}

const TrendingCard = memo(function TrendingCard({
  item,
  idx,
  linkPrefix,
  isMovie,
  bgImgRef
}: TrendingCardProps) {
  const handleMouseEnter = useCallback(() => {
    if (bgImgRef.current) {
      const newBgImg = `url(${IMAGE_BASE_URL}${item.backdrop_path || item.poster_path})`;
      bgImgRef.current.style.backgroundImage = newBgImg;
    }
  }, [item, bgImgRef]);

  const title = isMovie ? item.title : item.name;
  const slug = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const ratingColor = item.vote_average >= 7
    ? '#22c55e'
    : item.vote_average >= 5
      ? '#eab308'
      : '#ef4444';

  const circumference = 2 * Math.PI * 12;
  const strokeDashoffset = circumference - (item.vote_average / 10) * circumference;

  return (
    <Link
      href={`/${linkPrefix}/${item.id}`}
      onMouseEnter={handleMouseEnter}
      prefetch={false}
      className="block relative"
    >
      <h3 className="sr-only">
        {title}
      </h3>
      <div className="tmdb-carousel-card group">
        {/* Large Number */}
        <p className="tmdb-carousel-number tmdb-carousel-top10">
          {idx + 1 < 10 ? (
            <span className="tmdb-carousel-number-hollow text-transparent transition-all duration-300">
              {idx + 1}
            </span>
          ) : (
            <>
              <span className="tmdb-carousel-number-hollow text-transparent transition-all duration-300">
                {String(idx + 1).split('')[0]}
              </span>
              <span className="tmdb-carousel-double-digit tmdb-carousel-number-hollow text-transparent transition-all duration-300">
                {String(idx + 1).split('')[1]}
              </span>
            </>
          )}
        </p>

        {/* Movie/TV Show Poster */}
        <div className="relative">
          <Image
            width={230}
            height={345}
            alt={title || 'Poster'}
            src={
              item.poster_path
                ? `${IMAGE_BASE_URL}${item.poster_path}`
                : '/logo.png'
            }
            loading="lazy"
            className="tmdb-carousel-poster"
            unoptimized
          />
          {item.vote_average > 0 && (
            <div className="tmdb-carousel-rating">
              <div className="tmdb-carousel-rating-circle">
                <svg viewBox="0 0 32 32">
                  <circle className="bg" cx="16" cy="16" r="12" />
                  <circle
                    className="progress"
                    cx="16"
                    cy="16"
                    r="12"
                    stroke={ratingColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <span className="tmdb-carousel-rating-text">
                  {formatRating(item.vote_average)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});

interface CarouselProps {
  apiUrl: string;
  linkPrefix: string;
  isMovie: boolean;
}

function Carousel({ apiUrl, linkPrefix, isMovie }: CarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const bgImgRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);

  useEffect(() => {
    const fetchTrendingItems = async () => {
      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch ${isMovie ? 'movies' : 'TV shows'}`);
        }

        const data = await response.json();
        const topItems = data.results.slice(0, 10);
        setItems(topItems);
        setLoading(false);

        if (topItems.length > 0 && bgImgRef.current) {
          const initialBg = `${IMAGE_BASE_URL}${topItems[0].backdrop_path || topItems[0].poster_path}`;
          bgImgRef.current.style.backgroundImage = `url(${initialBg})`;
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchTrendingItems();
  }, [apiUrl, isMovie]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (items.length === 0 && !loading) {
    return <div className="tmdb-carousel-error"></div>;
  }

  return (
    <div className="tmdb-carousel-wrapper">
      {/* Background Image */}
      <div
        ref={bgImgRef}
        className="tmdb-carousel-bg-image"
      />

      <div className="tmdb-carousel-container">
        {/* Header */}
        <div className="tmdb-carousel-homewrapper">
          <div className="flex items-center gap-3">
            <h3 className="font-bold tmdb-carousel-text-outline text-8xl sm:text-8xl lg:text-9xl lg:ml-2.5 tmdb-carousel-top10 -ml-2 sm:ml-0">
              <span className="ml-0 md:-ml-2 tmdb-carousel-letter-shadow-r lg:-ml-3">T</span>
              <span className="-ml-2 tmdb-carousel-letter-shadow-r lg:-ml-3">O</span>
              <span className="mr-1 -ml-2 tmdb-carousel-letter-shadow-r lg:-ml-3">P</span>
              <span className="-ml-2 tmdb-carousel-letter-shadow-r lg:ml-3">1</span>
              <span className="tmdb-carousel-letter-shadow-r -ml-2 md:-ml-2.5 lg:-ml-5">0</span>
            </h3>

            <div className="flex flex-col">
              <h3 className="tmdb-carousel-subtitle text-sm md:text-xl">
                {isMovie ? 'MOVIES' : 'SHOWS'}
              </h3>
              <h3 className="tmdb-carousel-subtitle text-sm md:text-xl">
                TODAY
              </h3>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="tmdb-carousel-navigation-top">
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            className={`tmdb-carousel-nav-button ${isBeginning ? 'tmdb-carousel-nav-disabled' : ''}`}
            disabled={isBeginning}
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => swiperRef.current?.slideNext()}
            className={`tmdb-carousel-nav-button ${isEnd ? 'tmdb-carousel-nav-disabled' : ''}`}
            disabled={isEnd}
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Swiper Carousel */}
        <Swiper
          className="tmdb-carousel-swiper h-auto pt-8"
          slidesPerView="auto"
          spaceBetween={12}
          speed={800}
          modules={[Navigation, FreeMode, Mousewheel]}
          mousewheel={{ forceToAxis: true }}
          freeMode={true}
          style={{ overflow: 'hidden' }}
          onBeforeInit={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          onInit={(swiper) => {
            setIsBeginning(swiper.isBeginning);
            setIsEnd(swiper.isEnd);
          }}
          breakpoints={{
            640: {
              slidesPerGroup: 3,
            },
            768: {
              slidesPerGroup: 4,
            },
            1024: {
              slidesPerGroup: 5,
            },
            1280: {
              slidesPerGroup: 6,
            },
            1536: {
              slidesPerGroup: 7,
            },
          }}
        >
          {items.map((item, idx) => (
            <SwiperSlide key={item.id} className="!w-auto pt-8">
              <TrendingCard
                item={item}
                idx={idx}
                linkPrefix={linkPrefix}
                isMovie={isMovie}
                bgImgRef={bgImgRef}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

// Export the two specific carousel components
export function MovieTop10Carousel() {
  return <Carousel apiUrl={MOVIE_API_URL} linkPrefix="movie" isMovie={true} />;
}

export function TVTop10Carousel() {
  return <Carousel apiUrl={TV_API_URL} linkPrefix="tv" isMovie={false} />;
}

// Skeleton export
export function Top10Skeleton() {
  return <LoadingSkeleton />;
}
