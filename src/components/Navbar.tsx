import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CoupleAccount } from '../types.js';
import { getEntryPointPath } from '../config/entryPointRouting.js';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, currentCouple }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (path: string) => {
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  const handleGetStarted = () => {
    setMobileMenuOpen(false);
    const target = getEntryPointPath('NAV_GET_STARTED', !!currentCouple);
    onNavigate(target);
  };

  const handleCommunityClick = () => {
    setMobileMenuOpen(false);
    if (currentPath === '/') {
      document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('/');
      setTimeout(() => {
        document.getElementById('community')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDF9F6] text-[#3A0D22] border-b border-[#3A0D22]/10 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-logo-button"
          onClick={() => handleMobileNav('/')}
          className="flex items-center group focus:outline-none text-left cursor-pointer"
        >
          <img
            src="/logo.png"
            alt="Amorah"
            className="h-8 sm:h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
          />
        </button>

        {/* Desktop Links & Outline CTA */}
        <div className="hidden sm:flex items-center gap-6">
          <button
            id="nav-weddings-button"
            onClick={() => onNavigate('/weddings')}
            className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentPath.startsWith('/weddings')
                ? 'text-[#df6d73] font-semibold'
                : 'text-[#3A0D22]/80 hover:text-[#3A0D22]'
            }`}
          >
            Weddings
          </button>

          <button
            id="nav-love-stories-button"
            onClick={() => onNavigate('/love-stories')}
            className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentPath === '/love-stories'
                ? 'text-[#df6d73] font-semibold'
                : 'text-[#3A0D22]/80 hover:text-[#3A0D22]'
            }`}
          >
            Moments
          </button>

          <button
            id="nav-blog-button"
            onClick={() => onNavigate('/blog')}
            className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentPath.startsWith('/blog')
                ? 'text-[#df6d73] font-semibold'
                : 'text-[#3A0D22]/80 hover:text-[#3A0D22]'
            }`}
          >
            Blog
          </button>

          {/* Outline Pill Button matching reference image */}
          <button
            id="nav-get-started-button"
            onClick={handleGetStarted}
            className="px-5 py-2 rounded-full border border-[#3A0D22] text-[#3A0D22] hover:bg-[#3A0D22] hover:text-[#FDF9F6] font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>{currentCouple ? 'My Experiences' : 'Get Started'}</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-[#3A0D22] hover:text-[#df6d73] bg-[#3A0D22]/5 border border-[#3A0D22]/10 focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="sm:hidden bg-[#FDF9F6] border-b border-[#3A0D22]/10 text-[#3A0D22] overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-3">
              <button
                type="button"
                id="mobile-nav-weddings"
                onClick={() => handleMobileNav('/weddings')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white/60 border border-[#3A0D22]/10 text-[#3A0D22] font-medium text-sm hover:bg-white/80"
              >
                <span>Weddings</span>
              </button>

              <button
                type="button"
                id="mobile-nav-love-stories"
                onClick={() => handleMobileNav('/love-stories')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white/60 border border-[#3A0D22]/10 text-[#3A0D22] font-medium text-sm hover:bg-white/80"
              >
                <span>Moments</span>
              </button>

              <button
                type="button"
                id="mobile-nav-blog"
                onClick={() => handleMobileNav('/blog')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white/60 border border-[#3A0D22]/10 text-[#3A0D22] font-medium text-sm hover:bg-white/80"
              >
                <span>Blog</span>
              </button>

              <button
                type="button"
                id="mobile-nav-get-started"
                onClick={handleGetStarted}
                className="w-full text-center px-4 py-3 rounded-2xl border border-[#3A0D22] text-[#3A0D22] hover:bg-[#3A0D22] hover:text-[#FDF9F6] font-semibold text-sm cursor-pointer transition-colors"
              >
                <span>{currentCouple ? 'My Experiences' : 'Get Started'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
