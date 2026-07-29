'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MediaCard, MediaCardSkeleton } from '@/components/ui';
import { IconHeart, IconBookmark, IconStar, IconLoader2, IconMovie, IconDeviceTv, IconSparkles } from '@tabler/icons-react';

interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  overview: string;
  genre_ids?: number[];
  rating?: number;
}

type ListType = 'watchlist' | 'favorites' | 'rated';
type MediaType = 'movies' | 'tv';

const tabs: { id: ListType; label: string; icon: typeof IconHeart; color: string; bgColor: string }[] = [
  { id: 'watchlist', label: 'Watchlist', icon: IconBookmark, color: 'text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/40' },
  { id: 'favorites', label: 'Favorites', icon: IconHeart, color: 'text-pink-400', bgColor: 'bg-pink-500/20 border-pink-500/40' },
  { id: 'rated', label: 'Rated', icon: IconStar, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/40' },
];

const mediaTypes: { id: MediaType; label: string; icon: typeof IconMovie }[] = [
  { id: 'movies', label: 'Movies', icon: IconMovie },
  { id: 'tv', label: 'TV Shows', icon: IconDeviceTv },
];

export default function MyListPage() {
  const { isAuthenticated, isLoading: authLoading, user, sessionId, getAvatar } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ListType>('watchlist');
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('movies');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch list data (initial load)
  useEffect(() => {
    const fetchList = async () => {
      if (!isAuthenticated || !user || !sessionId) return;

      setIsLoading(true);
      setPage(1);
      try {
        const response = await fetch(
          `/api/account/lists?accountId=${user.id}&sessionId=${sessionId}&listType=${activeTab}&mediaType=${activeMediaType}&page=1`
        );
        if (response.ok) {
          const data = await response.json();
          setItems(data.results || []);
          setTotalPages(data.total_pages || 1);
          setTotalResults(data.total_results || 0);
        }
      } catch (error) {
        console.error('Failed to fetch list:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, [isAuthenticated, user, sessionId, activeTab, activeMediaType]);

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || page >= totalPages || !user || !sessionId) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/account/lists?accountId=${user.id}&sessionId=${sessionId}&listType=${activeTab}&mediaType=${activeMediaType}&page=${nextPage}`
      );
      if (response.ok) {
        const data = await response.json();
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = (data.results || []).filter((item: MediaItem) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, page, totalPages, isLoadingMore, user, sessionId, activeTab, activeMediaType]);

  // Callback ref for infinite scroll - triggers when the loader element mounts/unmounts
  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    // Create new observer
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(node);
    observerRef.current = observer;

    // Also trigger immediately if already in view
    setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) {
        loadMore();
      }
    }, 100);
  }, [loadMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Fallback scroll listener for infinite scroll
  useEffect(() => {
    if (isLoading || isLoadingMore || page >= totalPages) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Load more when user is within 300px of bottom
      if (scrollTop + windowHeight >= documentHeight - 300) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check immediately in case already at bottom
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, isLoadingMore, page, totalPages, loadMore]);

  const getActiveTabInfo = () => tabs.find(t => t.id === activeTab)!;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-white/50">Loading your collection...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <div className="relative pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 md:px-12 lg:px-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              {user && getAvatar() && (
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 ring-primary/50 ring-offset-2 ring-offset-black flex-shrink-0">
                  <img src={getAvatar()!} alt={user.username} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <span className="truncate">My Collection</span>
                  <span className="px-2.5 py-1 bg-white/10 rounded-lg text-sm sm:text-base font-semibold text-white/70">{totalResults}</span>
                  <IconSparkles className="w-5 h-5 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
                </h1>
                <p className="text-white/50 text-sm sm:text-base mt-0.5 sm:mt-1 truncate">
                  {user?.username}&apos;s personal library
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* List Type Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-white/5 rounded-xl sm:rounded-2xl overflow-x-auto scrollbar-hide"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeListTab"
                        className={`absolute inset-0 rounded-lg sm:rounded-xl ${tab.bgColor} border`}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 ${isActive ? tab.color : ''}`} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </motion.div>

            {/* Media Type Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-white/5 rounded-xl sm:rounded-2xl self-start sm:self-auto"
            >
              {mediaTypes.map((type) => {
                const Icon = type.icon;
                const isActive = activeMediaType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveMediaType(type.id)}
                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6"
            >
              {[...Array(12)].map((_, i) => (
                <MediaCardSkeleton key={i} />
              ))}
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-16 sm:py-24 px-4"
            >
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl ${getActiveTabInfo().bgColor} border flex items-center justify-center mb-4 sm:mb-6`}>
                {activeTab === 'favorites' && <IconHeart className={`w-10 h-10 sm:w-12 sm:h-12 ${getActiveTabInfo().color}`} />}
                {activeTab === 'watchlist' && <IconBookmark className={`w-10 h-10 sm:w-12 sm:h-12 ${getActiveTabInfo().color}`} />}
                {activeTab === 'rated' && <IconStar className={`w-10 h-10 sm:w-12 sm:h-12 ${getActiveTabInfo().color}`} />}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">No {activeTab} yet</h3>
              <p className="text-white/50 text-sm sm:text-base text-center max-w-md mb-6 sm:mb-8">
                {activeTab === 'watchlist' && 'Save movies and TV shows you want to watch later by adding them to your watchlist.'}
                {activeTab === 'favorites' && 'Mark your all-time favorite movies and TV shows to access them quickly.'}
                {activeTab === 'rated' && 'Rate movies and TV shows to build your personal ranking and help others discover great content.'}
              </p>
              <Link
                href={activeMediaType === 'movies' ? '/' : '/tv'}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-primary hover:bg-primary-light rounded-xl sm:rounded-2xl text-white text-sm sm:text-base font-semibold transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                Discover {activeMediaType === 'movies' ? 'Movies' : 'TV Shows'}
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                {items.map((item, index) => {
                  const mediaTypeUrl = activeMediaType === 'movies' ? 'movie' : 'tv';

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="relative"
                    >
                      {/* User's Rating Badge for rated items */}
                      {activeTab === 'rated' && item.rating && (
                        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-20 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-yellow-500 rounded-md sm:rounded-lg shadow-lg">
                          <IconStar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current text-black" />
                          <span className="text-[10px] sm:text-xs font-bold text-black">{item.rating}/10</span>
                        </div>
                      )}
                      <MediaCard
                        item={{
                          ...item,
                          media_type: mediaTypeUrl,
                        }}
                        showHoverCard={true}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Infinite scroll loader */}
              <div ref={loaderRef} className="py-8">
                {isLoadingMore && (
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                    {[...Array(6)].map((_, i) => (
                      <MediaCardSkeleton key={i} />
                    ))}
                  </div>
                )}
                {!isLoadingMore && page >= totalPages && items.length > 0 && totalPages > 1 && (
                  <p className="text-center text-white/40 text-sm">You&apos;ve reached the end</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
