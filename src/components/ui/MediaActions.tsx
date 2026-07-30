'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { IconHeart, IconBookmark, IconStar, IconLoader2, IconX } from '@tabler/icons-react';
import Link from 'next/link';

interface MediaActionsProps {
  mediaType: 'movie' | 'tv';
  mediaId: number;
}

export function MediaActions({ mediaType, mediaId }: MediaActionsProps) {
  const { isAuthenticated, sessionId, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | false>(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch account states
  const fetchStates = useCallback(async () => {
    if (!isAuthenticated || !sessionId) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/account/states?mediaType=${mediaType}&mediaId=${mediaId}&sessionId=${sessionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.favorite);
        setIsWatchlist(data.watchlist);
        setUserRating(data.rated);
      }
    } catch (error) {
      console.error('Failed to fetch account states:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, sessionId, mediaType, mediaId]);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const handleFavorite = async () => {
    if (!isAuthenticated || !user) return;
    setActionLoading('favorite');
    try {
      const res = await fetch('/api/account/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: user.id,
          mediaType,
          mediaId,
          favorite: !isFavorite,
          sessionId,
        }),
      });
      if (res.ok) {
        setIsFavorite(!isFavorite);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleWatchlist = async () => {
    if (!isAuthenticated || !user) return;
    setActionLoading('watchlist');
    try {
      const res = await fetch('/api/account/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: user.id,
          mediaType,
          mediaId,
          watchlist: !isWatchlist,
          sessionId,
        }),
      });
      if (res.ok) {
        setIsWatchlist(!isWatchlist);
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRate = async (rating: number) => {
    if (!isAuthenticated) return;
    setActionLoading('rating');
    try {
      const res = await fetch('/api/account/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType,
          mediaId,
          rating,
          sessionId,
        }),
      });
      if (res.ok) {
        setUserRating(rating);
        setShowRatingModal(false);
      }
    } catch (error) {
      console.error('Failed to rate:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light rounded-xl text-white text-sm font-medium transition-all"
        >
          <IconStar className="w-4 h-4" />
          Sign in to Rate & Track
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 relative">
      {/* Favorite Button */}
      <motion.button
        onClick={handleFavorite}
        disabled={actionLoading === 'favorite'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isFavorite
            ? 'bg-pink-500 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
        }`}
        title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
      >
        {actionLoading === 'favorite' ? (
          <IconLoader2 className="w-5 h-5 animate-spin" />
        ) : (
          <IconHeart
            className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`}
          />
        )}
      </motion.button>

      {/* Watchlist Button */}
      <motion.button
        onClick={handleWatchlist}
        disabled={actionLoading === 'watchlist'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isWatchlist
            ? 'bg-blue-500 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
        }`}
        title={isWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      >
        {actionLoading === 'watchlist' ? (
          <IconLoader2 className="w-5 h-5 animate-spin" />
        ) : (
          <IconBookmark
            className={`w-5 h-5 ${isWatchlist ? 'fill-current' : ''}`}
          />
        )}
      </motion.button>

      {/* Rating Button */}
      <motion.button
        onClick={() => setShowRatingModal(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          userRating
            ? 'bg-yellow-500 text-white'
            : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
        }`}
        title={userRating ? `Your Rating: ${userRating}` : 'Rate this'}
      >
        <IconStar className={`w-5 h-5 ${userRating ? 'fill-current' : ''}`} />
        {userRating && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full text-xs flex items-center justify-center font-bold">
            {userRating}
          </span>
        )}
      </motion.button>

      {/* Rating Modal - Rendered via Portal */}
      {isMounted && showRatingModal && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRatingModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md mx-auto"
            >
              <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-3xl border border-white/10 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
                {/* Close Button */}
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <IconX className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <IconStar className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Rate this {mediaType === 'movie' ? 'Movie' : 'TV Show'}
                  </h3>
                  <p className="text-white/50 text-sm">Tap a star to rate</p>
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <motion.button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      whileHover={{ scale: 1.3, y: -5 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={actionLoading === 'rating'}
                      className="p-1"
                    >
                      <IconStar
                        className={`w-6 h-6 transition-all duration-200 ${
                          star <= (hoverRating || userRating || 0)
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                            : 'text-white/20'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Rating Display */}
                <div className="text-center mb-8">
                  <motion.span
                    key={hoverRating || userRating || 0}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-bold text-white inline-block"
                  >
                    {hoverRating || userRating || '?'}
                  </motion.span>
                  <span className="text-white/30 text-2xl ml-1">/10</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                  {userRating && (
                    <button
                      onClick={() => handleRate(0)}
                      disabled={actionLoading === 'rating'}
                      className="flex-1 py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-colors border border-red-500/20"
                    >
                      {actionLoading === 'rating' ? (
                        <IconLoader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        'Remove Rating'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
