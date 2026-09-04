import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (path: string) => {
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  const handleGetStarted = () => {
    setMobileMenuOpen(false);
    if (currentPath === '/') {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('/');
      setTimeout(() => {
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
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
    <header className="sticky top-0 z-50 bg-[#FCF2E9] text-maroon border-b border-cream-border/80 transition-all shadow-xs">
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
                ? 'text-coral font-semibold'
                : 'text-maroon/80 hover:text-maroon'
            }`}
          >
            Weddings
          </button>

          <button
            id="nav-love-stories-button"
            onClick={() => onNavigate('/love-stories')}
            className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentPath === '/love-stories'
                ? 'text-coral font-semibold'
                : 'text-maroon/80 hover:text-maroon'
            }`}
          >
            Moments
          </button>

          <button
            id="nav-blog-button"
            onClick={() => onNavigate('/blog')}
            className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              currentPath.startsWith('/blog')
                ? 'text-coral font-semibold'
                : 'text-maroon/80 hover:text-maroon'
            }`}
          >
            Blog
          </button>

          {/* Outline Pill Button matching AMORAH_NEW_HERO.png */}
          <button
            id="nav-get-started-button"
            onClick={handleGetStarted}
            className="px-5 py-2 rounded-full border border-coral text-coral hover:bg-coral hover:text-white font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <span>Get Started</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-maroon hover:text-coral bg-maroon/5 border border-maroon/10 focus:outline-none cursor-pointer"
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
            className="sm:hidden bg-[#FCF2E9] border-b border-cream-border text-maroon overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-3">
              <button
                type="button"
                id="mobile-nav-weddings"
                onClick={() => handleMobileNav('/weddings')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white/60 border border-cream-border text-maroon font-medium text-sm"
              >
                <span>Weddings</span>
              </button>

              <button
                type="button"
                id="mobile-nav-love-stories"
                onClick={() => handleMobileNav('/love-stories')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white/60 border border-cream-border text-maroon font-medium text-sm"
              >
                <span>Moments</span>
              </button>

              <button
                type="button"
                id="mobile-nav-blog"
                onClick={() => handleMobileNav('/blog')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white/60 border border-cream-border text-maroon font-medium text-sm"
              >
                <span>Blog</span>
              </button>

              <button
                type="button"
                id="mobile-nav-get-started"
                onClick={handleGetStarted}
                className="w-full text-center px-4 py-3 rounded-2xl border border-coral text-coral hover:bg-coral hover:text-white font-semibold text-sm cursor-pointer transition-colors"
              >
                <span>Get Started</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
