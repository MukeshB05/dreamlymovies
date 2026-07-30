'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl, getBackdropUrl } from '@/lib/tmdb';
import { IconX, IconPlayerPlay, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { site_name } from '../../../config.js';

const CONTINUE_WATCHING_KEY = `${site_name}-continuewatching`;

interface WatchItem {
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

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: { x: number; y: number };
  opacity: number;
  rotation: number;
}

function ThanosParticles({ isActive, onComplete, rect }: { isActive: boolean; onComplete: () => void; rect: DOMRect | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive || !rect || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = rect.width + 100;
    canvas.height = rect.height + 100;
    canvas.style.left = `${rect.left - 50}px`;
    canvas.style.top = `${rect.top - 50}px`;

    const particleCount = 200;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        x: Math.random() * rect.width + 50,
        y: Math.random() * rect.height + 50,
        size: Math.random() * 3 + 1,
        color: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`,
        velocity: {
          x: (Math.random() - 0.3) * 10,
          y: (Math.random() - 0.5) * 5 - 2,
        },
        opacity: 1,
        rotation: Math.random() * 360,
      });
    }

    particlesRef.current = particles;

    let startTime = Date.now();
    const duration = 1200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        particle.x += particle.velocity.x * (1 - progress * 0.5);
        particle.y += particle.velocity.y;
        particle.velocity.y += 0.15;
        particle.opacity = 1 - progress;
        particle.rotation += particle.velocity.x * 2;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, rect, onComplete]);

  if (!isActive || !rect) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed pointer-events-none z-50"
      style={{ width: rect.width + 100, height: rect.height + 100 }}
    />
  );
}

export function ContinueWatching() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [deletingItem, setDeletingItem] = useState<number | null>(null);
  const [deletingRect, setDeletingRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    loadItems();

    const handleStorageChange = () => {
      loadItems();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const loadItems = () => {
    try {
      const stored = localStorage.getItem(CONTINUE_WATCHING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
        setIsVisible(parsed.length > 0);
      } else {
        setItems([]);
        setIsVisible(false);
      }
    } catch {
      setItems([]);
      setIsVisible(false);
    }
  };

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [items, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleDelete = useCallback((itemId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const ref = itemRefs.current.get(itemId);
    if (ref) {
      setDeletingRect(ref.getBoundingClientRect());
      setDeletingItem(itemId);
    }
  }, []);

  const completeDelete = useCallback(() => {
    if (deletingItem === null) return;

    const newItems = items.filter(item => item.id !== deletingItem);
    setItems(newItems);
    localStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(newItems));

    if (newItems.length === 0) {
      setTimeout(() => setIsVisible(false), 300);
    }

    setDeletingItem(null);
    setDeletingRect(null);
  }, [deletingItem, items]);

  const getPlayUrl = (item: WatchItem) => {
    const params = new URLSearchParams({
      id: item.id.toString(),
      type: item.type,
      title: item.title,
      poster: item.poster || '',
      backdrop: item.backdrop || '',
    });
    return `/play?${params.toString()}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || items.length === 0) return null;

  return (
    <>
      <ThanosParticles
        isActive={deletingItem !== null}
        onComplete={completeDelete}
        rect={deletingRect}
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="px-4 md:px-8 lg:px-12 py-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-white">Continue Watching</h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-all ${
                canScrollLeft
                  ? 'border-white/20 hover:border-white/40 text-white hover:bg-white/10'
                  : 'border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-all ${
                canScrollRight
                  ? 'border-white/20 hover:border-white/40 text-white hover:bg-white/10'
                  : 'border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <IconChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cards Container */}
        <div className="relative -mx-4 md:-mx-8 lg:-mx-12">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 lg:px-12 pb-4 scrollbar-hide scroll-smooth"
          >
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  ref={(el) => {
                    if (el) itemRefs.current.set(item.id, el);
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: deletingItem === item.id ? 0 : 1,
                    scale: deletingItem === item.id ? 0.5 : 1,
                    filter: deletingItem === item.id ? 'blur(10px)' : 'blur(0px)',
                  }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{
                    duration: deletingItem === item.id ? 0.4 : 0.3,
                    delay: deletingItem === item.id ? 0 : index * 0.05,
                  }}
                  className="relative flex-shrink-0 group"
                >
                  <Link href={getPlayUrl(item)} className="block">
                    {/* Card */}
                    <div className="relative w-64 sm:w-72 md:w-80 lg:w-96 aspect-video rounded-xl overflow-hidden bg-surface ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                      {/* Backdrop Image */}
                      {item.backdrop ? (
                        <Image
                          src={getBackdropUrl(item.backdrop)}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 256px, (max-width: 768px) 288px, (max-width: 1024px) 320px, 384px"
                        />
                      ) : item.poster ? (
                        <Image
                          src={getImageUrl(item.poster, 'w780')}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="384px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface">
                          <IconPlayerPlay className="w-12 h-12 text-white/20" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
                        >
                          <IconPlayerPlay className="w-7 h-7 md:w-8 md:h-8 text-white fill-white ml-1" />
                        </motion.div>
                      </div>

                      {/* Time remaining */}
                      {item.duration > 0 && item.progress < 95 && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white/80">
                          {formatDuration(item.duration - item.currentTime)} left
                        </div>
                      )}

                      {/* Title & Progress Bar - Inside card at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 pt-8">
                        <h3 className="text-white font-medium text-sm md:text-base line-clamp-1 mb-2 drop-shadow-lg">
                          {item.title}
                        </h3>
                        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress || 0}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Delete Button */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.2, backgroundColor: 'rgb(220, 38, 38)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleDelete(item.id, e)}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100"
                  >
                    <IconX className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>
    </>
  );
}
