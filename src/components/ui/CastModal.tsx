'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { formatDate, getTitle } from '@/lib/utils';
import type { PersonDetails } from '@/lib/tmdb';
import { IconMovie, IconDeviceTv } from '@tabler/icons-react';

interface CastModalProps {
  personId: number | null;
  onClose: () => void;
}

type MediaFilter = 'movie' | 'tv';

export function CastModal({ personId, onClose }: CastModalProps) {
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('movie');

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      return;
    }

    setIsLoading(true);
    fetch(`/api/person/${personId}`)
      .then((res) => res.json())
      .then((data) => {
        setPerson(data);
        setSelectedImage(0);
        // Set initial filter based on available content
        const credits = data?.combined_credits?.cast || [];
        const hasMovies = credits.some((c: { media_type: string }) => c.media_type === 'movie');
        const hasTv = credits.some((c: { media_type: string }) => c.media_type === 'tv');
        if (hasMovies) {
          setMediaFilter('movie');
        } else if (hasTv) {
          setMediaFilter('tv');
        }
      })
      .catch(() => setPerson(null))
      .finally(() => setIsLoading(false));
  }, [personId]);

  useEffect(() => {
    if (personId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [personId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const images = person?.images?.profiles || [];
  const allCredits = person?.combined_credits?.cast
    ?.filter((c) => c.poster_path)
    .sort((a, b) => b.vote_average - a.vote_average) || [];

  const movieCredits = allCredits.filter(c => c.media_type === 'movie');
  const tvCredits = allCredits.filter(c => c.media_type === 'tv');
  const credits = mediaFilter === 'movie' ? movieCredits : tvCredits;

  return (
    <AnimatePresence>
      {personId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-8"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-4xl max-h-[80vh] bg-surface-light rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors"
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

            <div className="overflow-y-auto max-h-[90vh]">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="w-10 h-10 border-4 border-surface border-t-primary rounded-full animate-spin" />
                </div>
              ) : person ? (
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    <div className="flex-shrink-0 space-y-4">
                      <div className="relative w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden bg-surface mx-auto md:mx-0">
                        <Image
                          src={getImageUrl(
                            images[selectedImage]?.file_path || person.profile_path,
                            'w500'
                          )}
                          alt={person.name}
                          fill
                          className="object-cover"
                          sizes="224px"
                        />
                      </div>

                      {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 justify-center md:justify-start">
                          {images.slice(0, 5).map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImage(idx)}
                              className={`relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                                selectedImage === idx
                                  ? 'ring-2 ring-primary'
                                  : 'opacity-60 hover:opacity-100'
                              }`}
                            >
                              <Image
                                src={getImageUrl(img.file_path, 'w92')}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        {person.name}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/60 mb-4">
                        <span className="px-3 py-1 bg-surface rounded-full">
                          {person.known_for_department}
                        </span>
                        {person.birthday && (
                          <span>{formatDate(person.birthday)}</span>
                        )}
                        {person.place_of_birth && (
                          <span className="truncate max-w-[200px]">
                            {person.place_of_birth}
                          </span>
                        )}
                      </div>

                      {person.biography && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Biography</h3>
                          <p className="text-white/70 text-sm leading-relaxed line-clamp-6">
                            {person.biography}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {allCredits.length > 0 && (
                    <div className="mt-6">
                      {/* Movies/TV Toggle */}
                      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl w-fit mb-4">
                        <button
                          onClick={() => setMediaFilter('movie')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            mediaFilter === 'movie'
                              ? 'bg-primary text-white'
                              : 'text-white/50 hover:text-white/70'
                          }`}
                        >
                          <IconMovie className="w-4 h-4" />
                          <span>Movies</span>
                          <span className={`text-xs ${mediaFilter === 'movie' ? 'text-white/70' : 'text-white/40'}`}>
                            ({movieCredits.length})
                          </span>
                        </button>
                        <button
                          onClick={() => setMediaFilter('tv')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            mediaFilter === 'tv'
                              ? 'bg-primary text-white'
                              : 'text-white/50 hover:text-white/70'
                          }`}
                        >
                          <IconDeviceTv className="w-4 h-4" />
                          <span>TV Shows</span>
                          <span className={`text-xs ${mediaFilter === 'tv' ? 'text-white/70' : 'text-white/40'}`}>
                            ({tvCredits.length})
                          </span>
                        </button>
                      </div>

                      {/* Credits Grid with Scroll */}
                      <div
                        className="max-h-[40vh] overflow-y-auto pr-2"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
                      >
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {credits.map((credit) => (
                            <Link
                              key={`${credit.media_type}-${credit.id}`}
                              href={`/${credit.media_type}/${credit.id}`}
                              onClick={onClose}
                              className="group"
                            >
                              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface mb-2">
                                <Image
                                  src={getImageUrl(credit.poster_path, 'w185')}
                                  alt={getTitle(credit)}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                  sizes="(max-width: 640px) 100px, 120px"
                                />
                              </div>
                              <p className="text-white text-xs font-medium truncate group-hover:text-primary transition-colors">
                                {getTitle(credit)}
                              </p>
                              <p className="text-white/50 text-[10px] truncate">{credit.character}</p>
                            </Link>
                          ))}
                        </div>
                        {credits.length === 0 && (
                          <p className="text-white/40 text-sm text-center py-8">
                            No {mediaFilter === 'movie' ? 'movies' : 'TV shows'} found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-white/50">
                  Failed to load person details
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
