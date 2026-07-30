'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
} from '@/components/ui/resizable-navbar';
import { IconSearch, IconX, IconUser, IconLogout, IconList, IconMovie, IconDeviceTv } from '@tabler/icons-react';
import { getImageUrl } from '@/lib/tmdb';
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
} from '@/lib/search-history';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { name: 'Movies', link: '/' },
  { name: 'TV Shows', link: '/tv' },
  { name: 'My List', link: '/my-list'}
];

interface SearchSuggestion {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  release_date?: string;
  first_air_date?: string;
}

export function Header() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileUserRef = useRef<HTMLDivElement>(null);
  const mobileUserDropdownRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, user, logout, getAvatar, isLoading: authLoading } = useAuth();

  // Handle click outside for user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is inside any of the user dropdown containers
      const isInsideDesktop = userDropdownRef.current?.contains(target);
      const isInsideMobileButton = mobileUserRef.current?.contains(target);
      const isInsideMobileDropdown = mobileUserDropdownRef.current?.contains(target);

      // Only close if click is outside all user dropdown areas
      if (!isInsideDesktop && !isInsideMobileButton && !isInsideMobileDropdown) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowUserDropdown(false);
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/movie') || pathname.startsWith('/genre') || pathname.startsWith('/studio');
    }
    if (href === '/tv') {
      return pathname === '/tv' || pathname.startsWith('/tv/') || pathname.startsWith('/network');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Load history on mount
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
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

  // Debounced search
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
      setIsSearchOpen(false);
      setShowDropdown(false);
      setQuery('');
    }
  };

  const handleHistoryClick = (item: string) => {
    setQuery(item);
    addToSearchHistory(item);
    setHistory(getSearchHistory());
    router.push(`/search?q=${encodeURIComponent(item)}`);
    setIsSearchOpen(false);
    setShowDropdown(false);
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
    setIsSearchOpen(false);
    setShowDropdown(false);
    setQuery('');
  };

  const shouldShowDropdown = showDropdown && (query.length > 0 || history.length > 0);

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />

        {/* Animated Nav Items */}
        <div
          className="flex flex-1 flex-row items-center justify-center gap-2"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {navItems.map((item, idx) => {
            const active = isActive(item.link);
            const isHovered = hoveredIndex === idx;
            return (
              <Link
                key={`nav-link-${idx}`}
                href={item.link}
                onMouseEnter={() => setHoveredIndex(idx)}
                className="relative px-5 py-2 text-sm font-medium"
              >
                {/* Hover background */}
                <AnimatePresence>
                  {isHovered && !active && (
                    <motion.div
                      layoutId="hoverBg"
                      className="absolute inset-0 h-full w-full rounded-full bg-white/10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    />
                  )}
                </AnimatePresence>

                {/* Active background */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 h-full w-full rounded-full bg-gradient-to-r from-primary/20 to-red-500/20 border border-primary/40"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <span className={`relative z-20 transition-colors ${active ? 'font-semibold text-primary' : 'text-white/70 hover:text-white'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Search & User Section */}
        <div className="flex items-center gap-3">
        {/* Search Section */}
        <div ref={searchContainerRef} className="relative flex items-center">
          <AnimatePresence mode="wait">
            {isSearchOpen ? (
              <motion.div
                key="search-input"
                initial={{ width: 40, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="relative"
              >
                <form onSubmit={handleSubmit} className="relative">
                  <motion.input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search movies & TV shows..."
                    className="w-full h-10 pl-10 pr-10 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setQuery('');
                      setShowDropdown(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </form>

                {/* Search Dropdown */}
                <AnimatePresence>
                  {shouldShowDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
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
                              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
                            >
                              <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0">
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
                                      {' · '}
                                      {new Date(
                                        suggestion.release_date || suggestion.first_air_date || ''
                                      ).getFullYear()}
                                    </span>
                                  )}
                                </p>
                              </div>
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
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
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
                                <IconX className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {!isLoading && query && suggestions.length === 0 && (
                        <div className="p-4 text-center text-white/50 text-sm">
                          No results found for &quot;{query}&quot;
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.button
                key="search-button"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconSearch className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* User Section */}
        {!authLoading && (
          <div ref={userDropdownRef} className="relative">
            {isAuthenticated && user ? (
              <>
                <motion.button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-primary/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={getAvatar()}
                    alt={user.username}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </motion.button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image
                              src={getAvatar()}
                              alt={user.username}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{user.name || user.username}</p>
                            <p className="text-white/50 text-sm truncate">@{user.username}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <IconLogout className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link href="/login">
                <motion.div
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconUser className="w-5 h-5 text-primary" />
                </motion.div>
              </Link>
            )}
          </div>
        )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <div className="flex items-center gap-1">
            {/* Inline Nav Icons */}
            <Link
              href="/"
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                isActive('/') ? 'bg-primary/20 text-primary' : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
              }`}
            >
              <IconMovie className="w-5 h-5" />
            </Link>
            <Link
              href="/tv"
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                isActive('/tv') ? 'bg-primary/20 text-primary' : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
              }`}
            >
              <IconDeviceTv className="w-5 h-5" />
            </Link>
            <Link
              href="/my-list"
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                isActive('/my-list') ? 'bg-primary/20 text-primary' : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
              }`}
            >
              <IconList className="w-5 h-5" />
            </Link>
            {/* Search Button */}
            <motion.button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {isSearchOpen ? (
                <IconX className="w-5 h-5 text-white" />
              ) : (
                <IconSearch className="w-5 h-5 text-white" />
              )}
            </motion.button>
            {/* User Button */}
            {!authLoading && (
              isAuthenticated && user ? (
                <div ref={mobileUserRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white/20 hover:border-primary/50 transition-colors"
                  >
                    <Image
                      src={getAvatar()}
                      alt={user.username}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/20 hover:bg-primary/30 border border-primary/30 transition-colors"
                >
                  <IconUser className="w-5 h-5 text-primary" />
                </Link>
              )
            )}
          </div>
        </MobileNavHeader>

        {/* Mobile User Dropdown */}
        <AnimatePresence>
          {showUserDropdown && isAuthenticated && user && (
            <motion.div
              ref={mobileUserDropdownRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-2 pb-3"
            >
              <div className="bg-surface-light rounded-xl border border-white/10 overflow-hidden">
                <div className="p-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={getAvatar()}
                        alt={user.username}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm">{user.name || user.username}</p>
                      <p className="text-white/50 text-xs truncate">@{user.username}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <IconLogout className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Search */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-2 pb-3"
            >
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search movies & TV shows..."
                  className="w-full h-10 pl-10 pr-4 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-white/10"
                />
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </MobileNav>
    </Navbar>
  );
}
