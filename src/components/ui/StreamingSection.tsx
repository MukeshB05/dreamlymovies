'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MediaActions } from './MediaActions';
import { CircularRating } from './CircularRating';
import tmdbData from '../../../tmdb.json';
import { site_name } from '../../../config.js';

interface Server {
  name: string;
  label: string;
  imdbSupported: boolean;
  tmdbSupported: boolean;
  moviePattern: string;
  tvPattern: string;
}

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
}

interface StreamingSectionProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  overview: string;
  voteAverage: number;
  genres: { id: number; name: string }[];
  posterPath: string | null;
  backdropPath: string | null;
  imdbId?: string | null;
  seasons?: Season[];
}

export function StreamingSection({
  mediaId,
  mediaType,
  title,
  overview,
  voteAverage,
  genres,
  posterPath,
  backdropPath,
  imdbId,
  seasons = [],
}: StreamingSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  
  // Filter servers based on media type support
  const servers = (tmdbData.servers as Server[]).filter((server) =>
    mediaType === 'movie' ? !!server.moviePattern : !!server.tvPattern
  );

  // Default to "Main 1" server, or fallback to the first available
  const defaultServer = servers.find(s => s.label === 'Main 1') || servers[0];

  const [activeServer, setActiveServer] = useState<Server>(defaultServer);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const savedServerName = localStorage.getItem(`${site_name}-preferred-server`);
      if (savedServerName) {
        const savedServer = servers.find(s => s.name === savedServerName);
        if (savedServer) {
          setActiveServer(savedServer);
        }
      }
    } catch (e) {
      console.error('Failed to load preferred server', e);
    }
  }, [servers]);

  const handleServerChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = servers.find((srv) => srv.name === e.target.value);
    if (s) {
      setActiveServer(s);
      try {
        localStorage.setItem(`${site_name}-preferred-server`, s.name);
      } catch (e) {
        console.error('Failed to save preferred server', e);
      }
    }
  }, [servers]);

  // Filter seasons to only include valid ones (season_number > 0)
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const currentSeasonDetails = validSeasons.find(
    (s) => s.season_number === selectedSeason
  ) || validSeasons[0];

  const playNextEpisode = useCallback(() => {
    if (mediaType !== 'tv') return;

    if (currentSeasonDetails && selectedEpisode < currentSeasonDetails.episode_count) {
      setSelectedEpisode((prev) => prev + 1);
    } else {
      // Find next season
      const currentSeasonIndex = validSeasons.findIndex(
        (s) => s.season_number === selectedSeason
      );
      if (currentSeasonIndex !== -1 && currentSeasonIndex < validSeasons.length - 1) {
        const nextSeason = validSeasons[currentSeasonIndex + 1];
        setSelectedSeason(nextSeason.season_number);
        setSelectedEpisode(1);
      }
    }
  }, [mediaType, selectedEpisode, selectedSeason, currentSeasonDetails, validSeasons]);

  // Save progress from external player messages (like vidsrc.su)
  const saveExternalProgress = useCallback((progressData: any) => {
    if (!mediaId || !mediaType) return;
    
    const id = progressData.id ? parseInt(progressData.id) : mediaId;
    const type = progressData.type || mediaType;
    const currentTime = progressData.currentTime || progressData.time || progressData.seconds || 0;
    const duration = progressData.duration || progressData.totalTime || progressData.total_time || 0;
    const progress = progressData.progress || (duration > 0 ? Math.round((currentTime / duration) * 100) : 0) || 0;

    try {
      const CONTINUE_WATCHING_KEY = `${site_name}-continuewatching`;
      const stored = localStorage.getItem(CONTINUE_WATCHING_KEY);
      let watchList: any[] = stored ? JSON.parse(stored) : [];

      const existingIndex = watchList.findIndex(
        (item) => item.id === id && item.type === type
      );

      const watchItem = {
        id,
        type,
        title: title || 'Unknown',
        poster: posterPath || null,
        backdrop: backdropPath || null,
        timestamp: Date.now(),
        progress,
        currentTime,
        duration,
      };

      if (existingIndex >= 0) {
        watchList[existingIndex] = {
          ...watchList[existingIndex],
          ...watchItem,
        };
      } else {
        watchList.unshift(watchItem);
      }

      watchList = watchList.slice(0, 20);
      localStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(watchList));
      console.log('External progress updated:', watchItem);
    } catch (e) {
      console.error('Failed to save external progress:', e);
    }
  }, [mediaId, mediaType, title, posterPath, backdropPath]);

  // Listen for message events from iframe players (e.g. VidLink postMessage ended)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let data;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch (e) {
        return; // Ignore invalid JSON or non-JSON data
      }

      if (!data) return;

      // Handle VidSrc.su MEDIA_DATA progress updates
      if (data.type === 'MEDIA_DATA' && data.data) {
        saveExternalProgress(data.data);
      }

      const isEnded =
        (data.type === 'PLAYER_EVENT' && data.data?.event === 'ended') ||
        (data.event === 'ended') ||
        (data.type === 'ended') ||
        (data.event === 'video_ended');

      if (isEnded && autoNext) {
        console.log('Playback ended message received. Loading next episode...');
        playNextEpisode();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [autoNext, playNextEpisode, saveExternalProgress]);

  // Construct play trailer URL params
  const playParams = new URLSearchParams({
    id: mediaId.toString(),
    type: mediaType,
    title: title,
    poster: posterPath || '',
    backdrop: backdropPath || '',
  });

  // Construct streaming embed URL
  const getEmbedUrl = () => {
    const pattern = mediaType === 'movie' ? activeServer.moviePattern : activeServer.tvPattern;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const logoUrl = origin ? `${origin}/logo.png` : '';
    const backUrl = origin ? `${origin}/${mediaType}/${mediaId}` : '';
    return pattern
      .replace('{tmdbId}', String(mediaId))
      .replace('{imdbId}', imdbId || '')
      .replace('{season}', String(selectedSeason))
      .replace('{episode}', String(selectedEpisode))
      .replace('{hex}', 'dc2626') // Red branding
      .replace('{logo}', encodeURIComponent(logoUrl))
      .replace('{backbutton}', encodeURIComponent(backUrl));
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Score & Actions Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-4">
          <CircularRating rating={voteAverage} size="lg" />
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {Math.round(voteAverage * 10)}%
            </div>
            <div className="text-xs sm:text-sm text-white/50">User Score</div>
          </div>
        </div>
        <div className="hidden sm:block h-10 w-px bg-white/10" />
        <div className="flex items-center gap-3 flex-wrap">
          {/* Play Button */}
          <button
            onClick={() => setIsPlaying(true)}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-all hover:scale-105 shadow-lg ${
              isPlaying ? 'ring-2 ring-primary shadow-primary/40' : 'shadow-primary/30'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            <span>Play</span>
          </button>

          {/* Watch Trailer Button (Secondary Style) */}
          <Link
            href={`/play?${playParams.toString()}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all hover:scale-105 border border-white/15"
          >
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Watch Trailer</span>
            <span className="sm:hidden">Trailer</span>
          </Link>

          <MediaActions mediaType={mediaType} mediaId={mediaId} />
        </div>
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            href={`/${mediaType}/genre/${genre.id}`}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 rounded-full text-xs sm:text-sm text-white/80 hover:text-white transition-all duration-300"
          >
            {genre.name}
          </Link>
        ))}
      </div>

      {/* Selection of Seasons & Episodes and Servers (renders only when playing) */}
      {isPlaying && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 bg-zinc-900/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            {/* Season Selector */}
            {mediaType === 'tv' && validSeasons.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-semibold">Season</span>
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => {
                      setSelectedSeason(Number(e.target.value));
                      setSelectedEpisode(1); // Reset to episode 1 on season change
                    }}
                    className="appearance-none bg-black/50 text-white px-4 py-2 pr-10 rounded-xl border border-white/10 focus:border-primary/50 focus:outline-none text-sm font-semibold cursor-pointer min-w-[130px]"
                  >
                    {validSeasons.map((s) => (
                      <option key={s.id} value={s.season_number} className="bg-zinc-900 text-white">
                        {s.name || `Season ${s.season_number}`}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Episode Selector */}
            {mediaType === 'tv' && currentSeasonDetails && (
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-semibold">Episode</span>
                <div className="relative">
                  <select
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                    className="appearance-none bg-black/50 text-white px-4 py-2 pr-10 rounded-xl border border-white/10 focus:border-primary/50 focus:outline-none text-sm font-semibold cursor-pointer min-w-[130px]"
                  >
                    {Array.from(
                      { length: currentSeasonDetails.episode_count },
                      (_, i) => i + 1
                    ).map((epNum) => (
                      <option key={epNum} value={epNum} className="bg-zinc-900 text-white">
                        Episode {epNum}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Auto Next Episode Toggle Switch */}
            {mediaType === 'tv' && (
              <div className="flex items-center gap-2 select-none">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoNext}
                      onChange={(e) => setAutoNext(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors duration-300 ${autoNext ? 'bg-primary' : 'bg-white/10 group-hover:bg-white/20'}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${autoNext ? 'transform translate-x-4' : ''}`} />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-white/60 group-hover:text-white transition-colors">
                    Auto Next
                  </span>
                </label>
              </div>
            )}

            {/* Server Selector */}
            <div className="flex items-center gap-3 sm:ml-auto">
              <span className="text-white/60 text-sm font-semibold">Server</span>
              <div className="relative">
                <select
                  value={activeServer.name}
                  onChange={handleServerChange}
                  className="appearance-none bg-black/50 text-white px-4 py-2 pr-10 rounded-xl border border-white/10 focus:border-primary/50 focus:outline-none text-sm font-semibold cursor-pointer min-w-[170px]"
                >
                  {servers.map((srv) => (
                    <option key={srv.name} value={srv.name} className="bg-zinc-900 text-white">
                      {srv.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950">
            <iframe
              src={embedUrl}
              className="w-full h-full border-none"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            />
          </div>
        </div>
      )}

      {/* Overview */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-4 sm:h-5 bg-primary rounded-full" />
          Overview
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-white/70 leading-relaxed">
          {overview || 'No overview available.'}
        </p>
      </div>
    </div>
  );
}
