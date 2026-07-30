import { Metadata } from 'next';
import { InfiniteScrollWrapper } from './infinite-scroll-wrapper';
import { getMoviesByCompany, MOVIE_STUDIOS } from '@/lib/tmdb';

interface StudioPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: StudioPageProps): Promise<Metadata> {
  const studioId = parseInt(params.id, 10);
  const studio = MOVIE_STUDIOS.find((s) => s.id === studioId);
  return {
    title: `${studio?.name || 'Studio'} Movies`,
  };
}

export default async function StudioPage({ params }: StudioPageProps) {
  const studioId = parseInt(params.id, 10);
  const studio = MOVIE_STUDIOS.find((s) => s.id === studioId);
  const studioName = studio?.name || 'Studio';
  const initialData = await getMoviesByCompany(studioId, 1);

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16">
      <div className="px-4 md:px-8 lg:px-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
          {studioName} Movies
        </h1>

        <InfiniteScrollWrapper
          initialItems={initialData.results.map((movie) => ({
            ...movie,
            media_type: 'movie' as const,
          }))}
          studioId={studioId}
        />
      </div>
    </div>
  );
}
