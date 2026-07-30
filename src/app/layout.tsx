import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
import { site_name } from '../../config.js';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: `${site_name} - Discover Movies & TV Shows`,
    template: `%s | ${site_name}`,
  },
  description: `Discover and explore movies and TV shows with ${site_name} - a minimal, cinematic browsing experience.`,
  keywords: ['movies', 'tv shows', 'streaming', 'discover', 'trending'],
  authors: [{ name: site_name }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: site_name,
    description: 'Discover and explore movies and TV shows',
    type: 'website',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased bg-background min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
