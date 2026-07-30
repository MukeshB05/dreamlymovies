import { Suspense } from 'react';
import { Metadata } from 'next';
import { SearchInput, MediaGridSkeleton } from '@/components/ui';
import { searchMulti } from '@/lib/tmdb';
import { SearchResultsWrapper } from './search-results-wrapper';

export const metadata: Metadata = {
  title: 'Search',
};

interface SearchPageProps {
  searchParams: { q?: string };
}

async function SearchResults({ query }: { query: string }) {
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          className="w-16 h-16 text-white/20 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h2 className="text-xl font-medium text-white/60 mb-2">Search for movies and TV shows</h2>
        <p className="text-white/40">Enter a title to get started</p>
      </div>
    );
  }

  const results = await searchMulti(query, 1);
  const filteredResults = results.results.filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv'
  );

  if (!filteredResults.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <svg
          className="w-16 h-16 text-white/20 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-medium text-white/60 mb-2">No results found</h2>
        <p className="text-white/40">Try searching for something else</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-white/60 mb-6">
        Found {results.total_results.toLocaleString()} results for &quot;{query}&quot;
      </p>
      <SearchResultsWrapper
        query={query}
        initialItems={filteredResults.map((item) => ({
          id: item.id,
          title: item.title,
          name: item.name,
          overview: item.overview,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          release_date: item.release_date,
          first_air_date: item.first_air_date,
          media_type: item.media_type as 'movie' | 'tv',
        }))}
        totalPages={results.total_pages}
      />
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || '';

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16">
      <div className="px-4 md:px-8 lg:px-12">
        <Suspense key={query} fallback={<MediaGridSkeleton />}>
          <SearchResults query={query} />
        </Suspense>
      </div>
    </div>
  );
}
