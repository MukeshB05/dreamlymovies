import { Suspense } from 'react';
import {
  HeroCarousel,
  HeroSkeleton,
  MediaRow,
  MediaRowSkeleton,
  StudioRow,
  MovieTop10Carousel,
  Top10Skeleton,
  ContinueWatching,
} from '@/components/ui';
import { SplashProvider } from '@/components/layout/SplashProvider';
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  MOVIE_STUDIOS,
} from '@/lib/tmdb';

async function HeroSection() {
  const trending = await getTrending('movie', 'day');
  return (
    <HeroCarousel
      items={trending.results.slice(0, 5).map((item) => ({
        ...item,
        title: 'title' in item ? item.title : undefined,
        name: 'name' in item ? item.name : undefined,
        media_type: 'movie',
      }))}
    />
  );
}

async function NowPlayingSection() {
  const movies = await getNowPlayingMovies();
  return (
    <MediaRow
      title="Now Playing"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
    />
  );
}

async function PopularMoviesSection() {
  const movies = await getPopularMovies();
  return (
    <MediaRow
      title="Popular Movies"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
    />
  );
}

async function TopRatedSection() {
  const movies = await getTopRatedMovies();
  return (
    <MediaRow
      title="Top Rated Movies"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
    />
  );
}

async function UpcomingSection() {
  const movies = await getUpcomingMovies();
  return (
    <MediaRow
      title="Coming Soon"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
    />
  );
}

async function ActionMoviesSection() {
  const { discoverMovies } = await import('@/lib/tmdb');
  const movies = await discoverMovies({ with_genres: '28' });
  return (
    <MediaRow
      title="Action Movies"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
      href="/genre/28"
    />
  );
}

async function ComedyMoviesSection() {
  const { discoverMovies } = await import('@/lib/tmdb');
  const movies = await discoverMovies({ with_genres: '35' });
  return (
    <MediaRow
      title="Comedy Movies"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
      href="/genre/35"
    />
  );
}

async function HorrorMoviesSection() {
  const { discoverMovies } = await import('@/lib/tmdb');
  const movies = await discoverMovies({ with_genres: '27' });
  return (
    <MediaRow
      title="Horror Movies"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
      href="/genre/27"
    />
  );
}

async function SciFiMoviesSection() {
  const { discoverMovies } = await import('@/lib/tmdb');
  const movies = await discoverMovies({ with_genres: '878' });
  return (
    <MediaRow
      title="Sci-Fi Movies"
      items={movies.results.map((movie) => ({
        ...movie,
        media_type: 'movie' as const,
      }))}
      href="/genre/878"
    />
  );
}

export default function MoviesPage() {
  return (
    <SplashProvider>
      <div className="min-h-screen bg-black">
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection />
        </Suspense>

        {/* Continue Watching - appears if user has watched content */}
        <ContinueWatching />

        <div className="relative z-10 space-y-8 pt-8 pb-16">
          <Suspense fallback={<Top10Skeleton />}>
            <MovieTop10Carousel />
          </Suspense>

          <Suspense fallback={<MediaRowSkeleton />}>
            <NowPlayingSection />
          </Suspense>

          <StudioRow title="Studios" studios={MOVIE_STUDIOS} type="movie" />

          <Suspense fallback={<MediaRowSkeleton />}>
            <ActionMoviesSection />
          </Suspense>

          <Suspense fallback={<MediaRowSkeleton />}>
            <PopularMoviesSection />
          </Suspense>

          <Suspense fallback={<MediaRowSkeleton />}>
            <TopRatedSection />
          </Suspense>

          <Suspense fallback={<MediaRowSkeleton />}>
            <SciFiMoviesSection />
          </Suspense>

          <Suspense fallback={<MediaRowSkeleton />}>
            <ComedyMoviesSection />
          </Suspense>

          <Suspense fallback={<MediaRowSkeleton />}>
            <HorrorMoviesSection />
          </Suspense>

          <Suspense fallback={<MediaRowSkeleton />}>
            <UpcomingSection />
          </Suspense>
        </div>
      </div>
    </SplashProvider>
  );
}
