'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/tmdb';
import { Cast } from '@/types/tmdb';
import { CastModal } from './CastModal';

interface CastRowProps {
  cast: Cast[];
}

export function CastRow({ cast }: CastRowProps) {
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);

  if (!cast.length) return null;

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Cast</h2>
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cast.slice(0, 15).map((member, index) => (
            <motion.button
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setSelectedPerson(member.id)}
              className="flex-shrink-0 w-28 text-left group"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface mb-2 ring-0 group-hover:ring-2 ring-primary transition-all">
                <Image
                  src={getImageUrl(member.profile_path)}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="112px"
                />
              </div>
              <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {member.name}
              </p>
              <p className="text-white/50 text-xs line-clamp-1">{member.character}</p>
            </motion.button>
          ))}
        </div>
      </section>

      <CastModal personId={selectedPerson} onClose={() => setSelectedPerson(null)} />
    </>
  );
}
