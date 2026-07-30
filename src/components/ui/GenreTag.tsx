'use client';

import Link from 'next/link';
import { Genre } from '@/types/tmdb';

interface GenreTagProps {
  genre: Genre;
  mediaType: 'movie' | 'tv';
}

export function GenreTag({ genre, mediaType }: GenreTagProps) {
  return (
    <Link
      href={`/${mediaType === 'movie' ? '' : 'tv/'}genre/${genre.id}`}
      className="px-3 py-1 bg-surface-light hover:bg-primary/20 rounded-full text-sm text-white/80 hover:text-white transition-all"
    >
      {genre.name}
    </Link>
  );
}

interface GenreTagsProps {
  genres: Genre[];
  mediaType: 'movie' | 'tv';
}

export function GenreTags({ genres, mediaType }: GenreTagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <GenreTag key={genre.id} genre={genre} mediaType={mediaType} />
      ))}
    </div>
  );
}
