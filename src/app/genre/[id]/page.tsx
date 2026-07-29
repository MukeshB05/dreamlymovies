import { Metadata } from 'next';
import { InfiniteScrollWrapper } from './infinite-scroll-wrapper';
import { getMoviesByGenre, getMovieGenres } from '@/lib/tmdb';

interface GenrePageProps {
  params: { id: string };
}

const GENRE_NAMES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const genreId = parseInt(params.id, 10);
  const genreName = GENRE_NAMES[genreId] || 'Genre';
  return {
    title: `${genreName} Movies`,
  };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const genreId = parseInt(params.id, 10);
  const genreName = GENRE_NAMES[genreId] || 'Genre';
  const initialData = await getMoviesByGenre(genreId, 1);

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16">
      <div className="px-4 md:px-8 lg:px-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
          {genreName} Movies
        </h1>

        <InfiniteScrollWrapper
          initialItems={initialData.results.map((movie) => ({
            ...movie,
            media_type: 'movie' as const,
          }))}
          genreId={genreId}
          mediaType="movie"
        />
      </div>
    </div>
  );
}
