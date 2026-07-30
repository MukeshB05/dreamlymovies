import Link from 'next/link';
import Image from 'next/image';
import { IconBrandGithub, IconHeart } from '@tabler/icons-react';
import { site_name } from '../../../config.js';

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 mt-16">
      <div className="px-4 md:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left - Logo and Description */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30">
                  <Image
                    src="/logo.png"
                    alt={site_name}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
                  {site_name}
                </span>
              </Link>
              <p className="text-white/40 text-sm text-center md:text-left max-w-xs">
                Your destination for discovering movies and TV shows.
              </p>
            </div>

            {/* Right - Credits and Links */}
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-1 text-sm text-white/50">
                <span>Made with</span>
                <IconHeart className="w-4 h-4 text-red-500 fill-red-500" />
                <span>by</span>
                <a
                  href="https://github.com/Mukeshb05"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-primary transition-colors font-medium"
                >
                  R
                </a>
              </div>
              <a
                href="https://github.com/Mukeshb05/dreamlymovies"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white text-sm transition-all border border-white/10 hover:border-white/20"
              >
                <IconBrandGithub className="w-4 h-4" />
                <span>YorWatch</span>
              </a>
            </div>
          </div>

          {/* Bottom - Powered by TMDB */}
          <div className="flex items-center justify-center mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 text-white/30 text-xs">
              <span>Powered by</span>
              <a
                href="https://www.themoviedb.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
              >
                <img
                    src='/tmdb.svg'
                    alt="The Movie Database"
                    className="h-3 md:h-4 w-auto"
                    draggable={false}
                  />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
