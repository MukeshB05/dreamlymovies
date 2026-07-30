'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
} from '@/lib/search-history';
import { getImageUrl } from '@/lib/tmdb';

interface SearchSuggestion {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
}

interface SearchInputProps {
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({ className, autoFocus = false }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSuggestions(data.results?.slice(0, 6) || []);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addToSearchHistory(query.trim());
      setHistory(getSearchHistory());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  };

  const handleHistoryClick = (item: string) => {
    setQuery(item);
    addToSearchHistory(item);
    setHistory(getSearchHistory());
    router.push(`/search?q=${encodeURIComponent(item)}`);
    setIsFocused(false);
  };

  const handleRemoveHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    removeFromSearchHistory(item);
    setHistory(getSearchHistory());
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const title = suggestion.title || suggestion.name || '';
    addToSearchHistory(title);
    setHistory(getSearchHistory());
    setIsFocused(false);
  };

  const showDropdown = isFocused && (query.length > 0 || history.length > 0);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit}>
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search movies and TV shows..."
          autoFocus={autoFocus}
          className="w-full h-14 pl-12 pr-12 bg-surface-light rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-surface-light rounded-xl shadow-2xl border border-white/5 overflow-hidden z-50"
          >
            {isLoading && (
              <div className="p-4 flex items-center gap-3 text-white/50">
                <div className="w-4 h-4 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            )}

            {!isLoading && suggestions.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Suggestions
                </p>
                {suggestions.map((suggestion) => (
                  <Link
                    key={`${suggestion.media_type}-${suggestion.id}`}
                    href={`/${suggestion.media_type}/${suggestion.id}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="relative w-10 h-14 rounded overflow-hidden bg-surface flex-shrink-0">
                      <Image
                        src={getImageUrl(suggestion.poster_path, 'w92')}
                        alt={suggestion.title || suggestion.name || ''}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {suggestion.title || suggestion.name}
                      </p>
                      <p className="text-white/50 text-xs">
                        {suggestion.media_type === 'movie' ? 'Movie' : 'TV Show'}
                        {(suggestion.release_date || suggestion.first_air_date) && (
                          <span>
                            {' '}
                            ·{' '}
                            {new Date(
                              suggestion.release_date || suggestion.first_air_date || ''
                            ).getFullYear()}
                          </span>
                        )}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-white/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && !query && history.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                  Recent Searches
                </p>
                {history.map((item) => (
                  <div
                    key={item}
                    onClick={() => handleHistoryClick(item)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <svg
                      className="w-4 h-4 text-white/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="flex-1 text-white/70 text-sm">{item}</span>
                    <button
                      onClick={(e) => handleRemoveHistory(e, item)}
                      className="p-1 text-white/30 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && query && suggestions.length === 0 && (
              <div className="p-4 text-center text-white/50 text-sm">
                No suggestions found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
