import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovieDetails, getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import { formatDate, formatRuntime } from '@/lib/utils';
import { CastRow, CircularRating, MediaActions, MoreLikeThis } from '@/components/ui';

interface MoviePageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  try {
    const movie = await getMovieDetails(parseInt(params.id, 10));
    return {
      title: movie.title,
      description: movie.overview,
      openGraph: {
        title: movie.title,
        description: movie.overview,
        images: movie.poster_path
          ? [`https://image.tmdb.org/t/p/w500${movie.poster_path}`]
          : [],
      },
    };
  } catch {
    return { title: 'Movie Not Found' };
  }
}

function PlayButton({ movie }: { movie: { id: number; title: string; poster_path: string | null; backdrop_path: string | null } }) {
  const playParams = new URLSearchParams({
    id: movie.id.toString(),
    type: 'movie',
    title: movie.title,
    poster: movie.poster_path || '',
    backdrop: movie.backdrop_path || '',
  });

  return (
    <Link
      href={`/play?${playParams.toString()}`}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/30"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
      </svg>
      <span className="hidden sm:inline">Watch Trailer</span>
      <span className="sm:hidden">Trailer</span>
    </Link>
  );
}

export default async function MoviePage({ params }: MoviePageProps) {
  let movie;
  try {
    movie = await getMovieDetails(parseInt(params.id, 10));
  } catch {
    notFound();
  }

  const formatBudget = (amount: number) => {
    if (amount === 0) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden">
        <Image
          src={getBackdropUrl(movie.backdrop_path)}
          alt={movie.title}
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />

        {/* Mobile: Content inside hero */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:hidden">
          <div className="flex items-end gap-4">
            {/* Mobile Poster */}
            <div className="flex-shrink-0 w-24 sm:w-32">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <Image
                  src={getImageUrl(movie.poster_path, 'w342')}
                  alt={movie.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="128px"
                />
                {/* Rating on Poster */}
                <div className="absolute top-2 right-2">
                  <CircularRating rating={movie.vote_average} size="sm" />
                </div>
              </div>
            </div>
            {/* Mobile Title Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 bg-primary/90 rounded-full text-[10px] font-semibold text-white uppercase">
                  Movie
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white line-clamp-2">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span>{formatDate(movie.release_date)}</span>
                {movie.runtime > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Floating info overlay */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 p-8 lg:p-12 xl:p-16">
          <div className="max-w-7xl mx-auto flex gap-8 items-end">
            {/* Desktop Poster Card */}
            <div className="flex-shrink-0 w-48 lg:w-56 xl:w-64">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
                <Image
                  src={getImageUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="256px"
                />
                {/* Rating on Poster */}
                <div className="absolute top-3 right-3">
                  <CircularRating rating={movie.vote_average} size="md" />
                </div>
              </div>
            </div>

            {/* Desktop Title & Quick Info */}
            <div className="flex-1 space-y-4 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-primary/90 backdrop-blur-sm rounded-full text-xs font-semibold text-white uppercase tracking-wide">
                  Movie
                </span>
                {movie.status && (
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white/80">
                    {movie.status}
                  </span>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white tracking-tight">
                {movie.title}
              </h1>

              {movie.tagline && (
                <p className="text-base lg:text-lg text-white/60 italic font-light">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/70">
                <span>{formatDate(movie.release_date)}</span>
                {movie.runtime > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pb-16">
          {/* Content Grid */}
          <div className="pt-6 md:pt-8">
            {/* Details Section */}
            <div className="space-y-6 md:space-y-8">
              {/* Mobile Tagline */}
              {movie.tagline && (
                <p className="md:hidden text-sm text-white/60 italic">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              {/* Score & Actions Row */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-center gap-4">
                  <CircularRating rating={movie.vote_average} size="lg" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-white">{Math.round(movie.vote_average * 10)}%</div>
                    <div className="text-xs sm:text-sm text-white/50">User Score</div>
                  </div>
                </div>
                <div className="hidden sm:block h-10 w-px bg-white/10" />
                <div className="flex items-center gap-3 flex-wrap">
                  <PlayButton movie={movie} />
                  <MediaActions mediaType="movie" mediaId={movie.id} />
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/genre/${genre.id}`}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 rounded-full text-xs sm:text-sm text-white/80 hover:text-white transition-all duration-300"
                  >
                    {genre.name}
                  </Link>
                ))}
              </div>

              {/* Overview */}
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                  <span className="w-1 h-4 sm:h-5 bg-primary rounded-full" />
                  Overview
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed">
                  {movie.overview || 'No overview available.'}
                </p>
              </div>

              {/* Stats Grid */}
              {(formatBudget(movie.budget) || formatBudget(movie.revenue)) && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {formatBudget(movie.budget) && (
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-xs sm:text-sm text-white/50 mb-1">Budget</div>
                      <div className="text-sm sm:text-base lg:text-lg font-semibold text-white truncate">{formatBudget(movie.budget)}</div>
                    </div>
                  )}
                  {formatBudget(movie.revenue) && (
                    <div className="p-3 sm:p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="text-xs sm:text-sm text-white/50 mb-1">Revenue</div>
                      <div className="text-sm sm:text-base lg:text-lg font-semibold text-green-400 truncate">{formatBudget(movie.revenue)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Production Companies */}
              {movie.production_companies && movie.production_companies.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-medium text-white/50 uppercase tracking-wider">Production</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.production_companies.slice(0, 4).map((company) => (
                      <Link
                        key={company.id}
                        href={`/studio/${company.id}`}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs sm:text-sm text-white/70 hover:text-white transition-all border border-white/5 hover:border-white/10"
                      >
                        {company.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cast Section */}
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <div className="mt-10 sm:mt-12 lg:mt-16">
              <CastRow cast={movie.credits.cast} />
            </div>
          )}

          {/* More Like This - Infinite Scroll */}
          {((movie.recommendations?.results && movie.recommendations.results.length > 0) ||
            (movie.similar?.results && movie.similar.results.length > 0)) && (
            <MoreLikeThis
              mediaId={movie.id}
              mediaType="movie"
              initialItems={[
                ...(movie.recommendations?.results || []),
                ...(movie.similar?.results || []),
              ]
                .filter((item, index, self) =>
                  index === self.findIndex((t) => t.id === item.id)
                )
                .slice(0, 12)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
