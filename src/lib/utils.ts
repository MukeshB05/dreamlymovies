import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatYear(dateString: string): string {
  if (!dateString) return 'TBA';
  return new Date(dateString).getFullYear().toString();
}

export function formatRuntime(minutes: number): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function getTitle(item: { title?: string; name?: string }): string {
  return item.title || item.name || 'Untitled';
}

export function getDate(item: { release_date?: string; first_air_date?: string }): string {
  return item.release_date || item.first_air_date || '';
}

export function getMediaType(item: {
  media_type?: string;
  title?: string;
  name?: string;
}): 'movie' | 'tv' {
  if (item.media_type) return item.media_type as 'movie' | 'tv';
  return item.title ? 'movie' : 'tv';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
