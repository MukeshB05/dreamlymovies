import { Metadata } from 'next';
import { InfiniteScrollWrapper } from './infinite-scroll-wrapper';
import { getTVByGenre } from '@/lib/tmdb';

interface GenrePageProps {
  params: { id: string };
}

const TV_GENRE_NAMES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery',
  10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
};

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const genreId = parseInt(params.id, 10);
  const genreName = TV_GENRE_NAMES[genreId] || 'Genre';
  return {
    title: `${genreName} TV Shows`,
  };
}

export default async function TVGenrePage({ params }: GenrePageProps) {
  const genreId = parseInt(params.id, 10);
  const genreName = TV_GENRE_NAMES[genreId] || 'Genre';
  const initialData = await getTVByGenre(genreId, 1);

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16">
      <div className="px-4 md:px-8 lg:px-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
          {genreName} TV Shows
        </h1>

        <InfiniteScrollWrapper
          initialItems={initialData.results.map((show) => ({
            ...show,
            media_type: 'tv' as const,
          }))}
          genreId={genreId}
          mediaType="tv"
        />
      </div>
    </div>
  );
}
