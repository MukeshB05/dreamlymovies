'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { site_name } from '../../../config';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.sessionId, data.user);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-red-500/10 via-transparent to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-primary/50 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt={site_name}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/50">Sign in with your TMDB account</p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <motion.label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focusedField === 'username' || username
                    ? '-top-2.5 text-xs bg-[#0a0a0a] px-2 text-primary'
                    : 'top-3.5 text-white/40'
                }`}
              >
                TMDB Username
              </motion.label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                className={`w-full h-14 px-4 bg-white/5 rounded-xl text-white focus:outline-none transition-all border ${
                  focusedField === 'username'
                    ? 'border-primary shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
                required
              />
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <motion.label
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  focusedField === 'password' || password
                    ? '-top-2.5 text-xs bg-[#0a0a0a] px-2 text-primary'
                    : 'top-3.5 text-white/40'
                }`}
              >
                Password
              </motion.label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={`w-full h-14 px-4 pr-12 bg-white/5 rounded-xl text-white focus:outline-none transition-all border ${
                  focusedField === 'password'
                    ? 'border-primary shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <IconEyeOff className="w-5 h-5" />
                ) : (
                  <IconEye className="w-5 h-5" />
                )}
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full h-14 rounded-xl font-semibold text-white transition-all relative overflow-hidden ${
                  isLoading
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-red-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]'
                }`}
              >
                <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                  Sign In
                </span>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IconLoader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-4 my-8"
          >
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </motion.div>

          {/* Register Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link
              href="https://www.themoviedb.org/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-14 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              Create 
              <img
                    src='/tmdb.svg'
                    alt="The Movie Database"
                    className="h-2 md:h-2 w-auto"
                    draggable={false}
                />
               Account
            </Link>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center text-white/30 text-xs mt-6"
          >
            By signing in, you agree to TMDB&apos;s Terms of Service
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
