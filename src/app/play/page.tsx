'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/tmdb';
import { IconX, IconLoader2, IconAlertCircle } from '@tabler/icons-react';
import { site_name } from '../../../config.js';

const CONTINUE_WATCHING_KEY = `${site_name}-continuewatching`;

interface MediaInfo {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: 'movie' | 'tv';
}

interface WatchProgress {
  id: number;
  type: string;
  title: string;
  poster: string | null;
  backdrop: string | null;
  timestamp: number;
  progress: number;
  currentTime: number;
  duration: number;
}

declare global {
  interface Window {
    Plyr: any;
  }
}

function PlayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const id = searchParams.get('id');
  const mediaType = searchParams.get('type') as 'movie' | 'tv';
  const title = searchParams.get('title');
  const poster = searchParams.get('poster');
  const backdrop = searchParams.get('backdrop');

  const saveProgress = useCallback((currentTime: number, duration: number) => {
    if (!id || !mediaType || duration === 0 || isNaN(duration)) return;

    try {
      const stored = localStorage.getItem(CONTINUE_WATCHING_KEY);
      let watchList: WatchProgress[] = stored ? JSON.parse(stored) : [];

      const progress = Math.round((currentTime / duration) * 100);

      const existingIndex = watchList.findIndex(
        item => item.id === parseInt(id) && item.type === mediaType
      );

      const watchItem: WatchProgress = {
        id: parseInt(id),
        type: mediaType,
        title: title || 'Unknown',
        poster: poster || null,
        backdrop: backdrop || null,
        timestamp: Date.now(),
        progress,
        currentTime,
        duration,
      };

      if (existingIndex >= 0) {
        watchList[existingIndex] = watchItem;
      } else {
        watchList.unshift(watchItem);
      }

      watchList = watchList.slice(0, 20);
      localStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(watchList));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [id, mediaType, title, poster, backdrop]);

  // Fetch trailer
  useEffect(() => {
    if (!id || !mediaType) {
      setError('Invalid media parameters');
      setIsLoading(false);
      return;
    }

    setMediaInfo({
      id: parseInt(id),
      title: title || 'Unknown',
      poster_path: poster || null,
      backdrop_path: backdrop || null,
      media_type: mediaType,
    });

    const fetchTrailer = async () => {
      try {
        const response = await fetch(`/api/trailer?mediaType=${mediaType}&id=${id}`);
        if (!response.ok) {
          throw new Error('No trailer available');
        }
        const data = await response.json();
        setVideoKey(data.key);
      } catch (err) {
        setError('No trailer available for this title');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrailer();
  }, [id, mediaType, title, poster, backdrop]);

  // Load Plyr and initialize when videoKey is available
  useEffect(() => {
    if (!videoKey || playerRef.current) return;

    // Load Plyr CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
    document.head.appendChild(cssLink);

    // Load Plyr JS
    const script = document.createElement('script');
    script.src = 'https://cdn.plyr.io/3.7.8/plyr.polyfilled.js';
    script.async = true;

    script.onload = () => {
      // Wait for DOM to be ready
      setTimeout(() => {
        if (window.Plyr && containerRef.current) {
          try {
            const player = new window.Plyr('#player', {
              controls: [
                'play-large',
                'rewind',
                'play',
                'fast-forward',
                'progress',
                'current-time',
                'duration',
                'mute',
                'volume',
                'settings',
                'pip',
                'fullscreen',
              ],
            });

            playerRef.current = player;

            player.on('ready', () => {
              console.log('Plyr ready');
              setIsPlayerReady(true);

              // Restore previous position
              if (id && mediaType) {
                try {
                  const stored = localStorage.getItem(CONTINUE_WATCHING_KEY);
                  if (stored) {
                    const watchList: WatchProgress[] = JSON.parse(stored);
                    const existing = watchList.find(
                      item => item.id === parseInt(id) && item.type === mediaType
                    );
                    if (existing && existing.currentTime > 0 && existing.progress < 95) {
                      setTimeout(() => {
                        if (playerRef.current) {
                          playerRef.current.currentTime = existing.currentTime;
                        }
                      }, 1000);
                    }
                  }
                } catch (e) {
                  console.error('Failed to restore position:', e);
                }
              }
            });

            player.on('timeupdate', () => {
              const current = player.currentTime;
              const duration = player.duration;
              if (!isNaN(duration) && duration > 0) {
                saveProgress(current, duration);
              }
            });

            player.on('pause', () => {
              const current = player.currentTime;
              const duration = player.duration;
              if (!isNaN(duration) && duration > 0) {
                saveProgress(current, duration);
              }
            });

            player.on('ended', () => {
              if (!isNaN(player.duration)) {
                saveProgress(player.duration, player.duration);
              }
            });

          } catch (err) {
            console.error('Failed to initialize player:', err);
          }
        }
      }, 200);
    };

    document.body.appendChild(script);

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
      }
      // Clean up script and CSS
      script.remove();
      cssLink.remove();
    };
  }, [videoKey, id, mediaType, saveProgress]);

  const handleClose = () => {
    if (playerRef.current) {
      try {
        const currentTime = playerRef.current.currentTime;
        const duration = playerRef.current.duration;
        if (!isNaN(duration) && duration > 0) {
          saveProgress(currentTime, duration);
        }
      } catch (e) {
        // Ignore errors
      }
    }
    router.back();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" ref={containerRef}>
        {/* Custom Plyr Red Theme Styles */}
        <style jsx global>{`
          .plyr {
            width: 100%;
            height: 100%;
          }
          .plyr__video-embed,
          .plyr__video-wrapper {
            height: 100%;
          }
          .plyr__video-embed iframe {
            width: 100%;
            height: 100%;
          }
          .plyr__control--overlaid {
            background: #dc2626 !important;
          }
          .plyr__control--overlaid:hover {
            background: #b91c1c !important;
          }
          .plyr--full-ui input[type=range] {
            color: #dc2626 !important;
          }
          .plyr__control:hover {
            background: #dc2626 !important;
          }
          .plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]::before {
            background: #dc2626 !important;
          }
          .plyr--video .plyr__control.plyr__tab-focus,
          .plyr--video .plyr__control:hover,
          .plyr--video .plyr__control[aria-expanded=true] {
            background: #dc2626 !important;
          }
          .plyr__progress__buffer {
            background: rgba(220, 38, 38, 0.3) !important;
          }
          .plyr__volume input[type=range] {
            color: #dc2626 !important;
          }
          .plyr__tooltip {
            background: #dc2626 !important;
          }
          .plyr__tooltip::before {
            border-top-color: #dc2626 !important;
          }
          .plyr--full-ui.plyr--video .plyr__control--overlaid {
            background: #dc2626 !important;
          }
        `}</style>

        {/* Close Button */}
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleClose}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[60] p-2 sm:p-3 rounded-full bg-black/50 hover:bg-red-600 text-white transition-all backdrop-blur-sm border border-white/10 hover:border-red-500"
        >
          <IconX className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>

        {/* Title Overlay */}
        {mediaInfo && isPlayerReady && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-4 sm:top-6 left-4 sm:left-6 z-[60]"
          >
            <Link
              href={`/${mediaInfo.media_type}/${mediaInfo.id}`}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 hover:border-red-500/50 transition-all group"
            >
              {mediaInfo.poster_path && (
                <div className="relative w-8 h-12 sm:w-10 sm:h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={getImageUrl(mediaInfo.poster_path, 'w92')}
                    alt={mediaInfo.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm sm:text-base font-medium group-hover:text-red-400 transition-colors line-clamp-1">
                  {mediaInfo.title}
                </p>
                <p className="text-white/50 text-[10px] sm:text-xs uppercase">
                  {mediaInfo.media_type === 'movie' ? 'Movie' : 'TV Series'} Trailer
                </p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-40">
            {backdrop && (
              <div className="absolute inset-0">
                <Image
                  src={getImageUrl(backdrop, 'w1280')}
                  alt=""
                  fill
                  className="object-cover opacity-20 blur-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black" />
              </div>
            )}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <IconLoader2 className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 animate-spin" />
              <p className="text-white/70 text-base sm:text-lg">Loading trailer...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-40">
            {backdrop && (
              <div className="absolute inset-0">
                <Image
                  src={getImageUrl(backdrop, 'w1280')}
                  alt=""
                  fill
                  className="object-cover opacity-10 blur-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black" />
              </div>
            )}
            <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 text-center px-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <IconAlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Trailer Not Available</h2>
                <p className="text-white/50 text-sm sm:text-base max-w-md">{error}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all border border-white/10"
                >
                  Go Back
                </button>
                {mediaInfo && (
                  <Link
                    href={`/${mediaInfo.media_type}/${mediaInfo.id}`}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-all text-center"
                  >
                    View Details
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Player - Using iframe approach */}
        {videoKey && !error && (
          <div className="w-full h-full">
            <div className="plyr__video-embed h-full" id="player">
              <iframe
                src={`https://www.youtube.com/embed/${videoKey}?iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`}
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Loading overlay while player initializes */}
        {videoKey && !isPlayerReady && !error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30 pointer-events-none">
            <IconLoader2 className="w-12 h-12 text-red-500 animate-spin" />
          </div>
        )}
      </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <IconLoader2 className="w-16 h-16 text-red-500 animate-spin" />
        </div>
      }
    >
      <PlayContent />
    </Suspense>
  );
}
