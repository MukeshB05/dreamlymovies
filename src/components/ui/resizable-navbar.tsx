'use client';

import { cn } from '@/lib/utils';
import { IconMenu2, IconX } from '@tabler/icons-react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { site_name } from '../../../config.js';

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn('fixed inset-x-0 top-0 z-50 w-full', className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible })
          : child
      )}
    </motion.div>
  );
};

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? 'blur(20px)' : 'none',
        backgroundColor: visible ? 'rgba(10, 10, 10, 0.7)' : 'transparent',
        width: visible ? '80%' : '100%',
        y: visible ? 12 : 0,
        borderRadius: visible ? 9999 : 0,
        paddingLeft: visible ? 24 : 16,
        paddingRight: visible ? 24 : 16,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 40,
      }}
      style={{
        minWidth: 'fit-content',
      }}
      className={cn(
        'relative z-[60] mx-auto hidden w-full max-w-6xl flex-row items-center justify-between py-2.5 md:flex',
        visible && 'border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
  onItemClick?: () => void;
}

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  return (
    <motion.div
      className={cn('flex flex-1 flex-row items-center justify-center gap-8', className)}
    >
      {items.map((item, idx) => (
        <Link
          key={`nav-item-${idx}`}
          href={item.link}
          onClick={onItemClick}
          className="relative text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          <span>{item.name}</span>
        </Link>
      ))}
    </motion.div>
  );
};

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? 'blur(20px)' : 'none',
        backgroundColor: visible ? 'rgba(10, 10, 10, 0.7)' : 'transparent',
        width: visible ? '92%' : '100%',
        y: visible ? 10 : 0,
        borderRadius: visible ? 9999 : 0,
        paddingRight: visible ? 16 : 16,
        paddingLeft: visible ? 16 : 16,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 40,
      }}
      className={cn(
        'relative z-50 mx-auto flex w-full flex-col md:hidden',
        visible && 'border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNavHeader = ({ children, className }: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        'flex w-full flex-row items-center justify-between py-3',
        className
      )}
    >
      {children}
    </div>
  );
};

interface MobileNavToggleProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileNavToggle = ({
  isOpen,
  onClick,
  className,
}: MobileNavToggleProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-white focus:outline-none',
        className
      )}
      aria-label="Toggle menu"
    >
      {isOpen ? (
        <IconX className="h-6 w-6" />
      ) : (
        <IconMenu2 className="h-6 w-6" />
      )}
    </button>
  );
};

interface MobileNavMenuProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const MobileNavMenu = ({
  children,
  isOpen,
  className,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex w-full flex-col gap-4 bg-black/95 px-4 py-6 backdrop-blur-lg',
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface NavbarLogoProps {
  className?: string;
}

export const NavbarLogo = ({ className }: NavbarLogoProps) => {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary/50">
        <img
          src="/logo.png"
          alt={site_name}
          className="h-full w-full object-cover"
        />
      </div>
      <span className="text-x font-bold bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
        {site_name}
      </span>
    </Link>
  );
};

interface NavbarButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
  href?: string;
}

export const NavbarButton = ({
  children,
  variant = 'primary',
  className,
  onClick,
  href,
}: NavbarButtonProps) => {
  const baseStyles =
    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';
  const variants = {
    primary: 'bg-primary hover:bg-primary-light text-white',
    secondary: 'bg-white/10 hover:bg-white/20 text-white',
  };

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseStyles, variants[variant], className)}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(baseStyles, variants[variant], className)}
    >
      {children}
    </button>
  );
};
