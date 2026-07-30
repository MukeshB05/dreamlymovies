'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const SPLASH_DURATION = 6000;

let splashShownThisSession = false;

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle mount and determine if splash should show
  useEffect(() => {
    setMounted(true);

    if (pathname === '/' && !splashShownThisSession) {
      splashShownThisSession = true;
      setShowSplash(true);
    }
  }, []);

  // Handle splash timing
  useEffect(() => {
    if (!showSplash) return;

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, SPLASH_DURATION - 1000);

    const hideTimer = setTimeout(() => {
      setShowSplash(false);
      setIsFading(false);
    }, SPLASH_DURATION);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [showSplash]);

  // Don't render anything until mounted
  if (!mounted) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes splashFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .splash-fade-out {
          animation: splashFadeOut 1s ease-in-out forwards;
        }
      `}</style>

      {showSplash && (
        <div
          className={`fixed inset-0 w-screen h-screen bg-black z-[9999999] ${
            isFading ? 'splash-fade-out' : ''
          }`}
        >
          <iframe
            src="/intro/index.html"
            className="w-full h-full border-0"
            title="YorWatch Intro"
            allow="autoplay"
          />
        </div>
      )}

      {!showSplash && children}
    </>
  );
}
