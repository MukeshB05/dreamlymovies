'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Genre } from '@/types/tmdb';

interface GenreFilterProps {
  genres: Genre[];
}

export function GenreFilter({ genres }: GenreFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedGenre = searchParams.get('genre');

  const handleGenreClick = (genreId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (genreId === null) {
      params.delete('genre');
    } else {
      params.set('genre', genreId.toString());
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-2"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <button
        onClick={() => handleGenreClick(null)}
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
          !selectedGenre
            ? 'bg-primary text-white'
            : 'bg-surface-light text-white/70 hover:text-white'
        )}
      >
        All
      </button>
      {genres.map((genre) => (
        <button
          key={genre.id}
          onClick={() => handleGenreClick(genre.id)}
          className={cn(
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            selectedGenre === genre.id.toString()
              ? 'bg-primary text-white'
              : 'bg-surface-light text-white/70 hover:text-white'
          )}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
}
