'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';

interface Studio {
  id: number;
  name: string;
  logo: string;
  preserveColor?: boolean;
}

interface StudioRowProps {
  title: string;
  studios: Studio[];
  type: 'movie' | 'tv';
}

export function StudioRow({ title, studios, type }: StudioRowProps) {
  const baseUrl = type === 'movie' ? '/studio' : '/network';

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-white px-4 md:px-8 lg:px-12">
        {title}
      </h2>
      <div
        className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 lg:px-12 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {studios.map((studio, index) => (
          <motion.div
            key={studio.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link
              href={`${baseUrl}/${studio.id}`}
              className="flex-shrink-0 group block"
            >
              <div className="w-28 h-16 md:w-36 md:h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-3 transition-all group-hover:bg-white/10 group-hover:border-primary/30 group-hover:scale-105">
                <div className="relative w-full h-full">
                  <Image
                    src={getImageUrl(studio.logo, 'w185')}
                    alt={studio.name}
                    fill
                    className={`object-contain transition-opacity ${
                      studio.preserveColor
                        ? 'opacity-80 group-hover:opacity-100'
                        : 'filter brightness-0 invert opacity-60 group-hover:opacity-100'
                    }`}
                    sizes="144px"
                  />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
