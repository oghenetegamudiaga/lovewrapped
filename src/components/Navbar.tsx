import React, { useState } from 'react';
import { Heart, ArrowRight, Menu, X, BookOpen, Layers } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-[#FFFEFE]/90 backdrop-blur-md border-b border-cream-border transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
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

        {/* Desktop Links & CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            id="nav-weddings-button"
            onClick={() => onNavigate('/weddings')}
            className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              currentPath.startsWith('/weddings')
                ? 'bg-cream-card text-maroon border border-cream-border font-semibold'
                : 'text-mauve hover:text-maroon hover:bg-cream-card'
            }`}
          >
            Weddings
          </button>

          <button
            id="nav-love-stories-button"
            onClick={() => onNavigate('/love-stories')}
            className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              currentPath === '/love-stories'
                ? 'bg-cream-card text-maroon border border-cream-border font-semibold'
                : 'text-mauve hover:text-maroon hover:bg-cream-card'
            }`}
          >
            Moments
          </button>

          <button
            id="nav-community-button"
            onClick={handleCommunityClick}
            className="text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer text-mauve hover:text-maroon hover:bg-cream-card"
          >
            Our Community
          </button>

          <button
            id="nav-get-started-button"
            onClick={handleGetStarted}
            className="group flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-maroon hover:bg-maroon-light text-cream font-medium text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-maroon/20 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-coral" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-maroon hover:text-coral bg-cream-card border border-cream-border focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Framer Motion Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="sm:hidden bg-[#FFFEFE] border-b border-cream-border overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-3">
              <button
                type="button"
                id="mobile-nav-weddings"
                onClick={() => handleMobileNav('/weddings')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-maroon font-medium text-sm flex items-center justify-between"
              >
                <span>Weddings</span>
              </button>

              <button
                type="button"
                id="mobile-nav-love-stories"
                onClick={() => handleMobileNav('/love-stories')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-maroon font-medium text-sm flex items-center justify-between"
              >
                <span>Moments</span>
                <Heart className="w-4 h-4 text-coral fill-coral" />
              </button>

              <button
                type="button"
                id="mobile-nav-community"
                onClick={handleCommunityClick}
                className="w-full text-left px-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-maroon font-medium text-sm flex items-center justify-between"
              >
                <span>Our Community</span>
              </button>

              <button
                type="button"
                id="mobile-nav-get-started"
                onClick={handleGetStarted}
                className="w-full text-left px-4 py-3 rounded-2xl bg-maroon text-cream font-semibold text-sm flex items-center justify-between shadow-md cursor-pointer"
              >
                <span>Get Started</span>
                <Layers className="w-4 h-4 text-coral" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

