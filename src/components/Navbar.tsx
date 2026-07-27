import React, { useState } from 'react';
import { Heart, ArrowRight, Menu, X, PlayCircle, Layers } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-cream-border transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          id="nav-logo-button"
          onClick={() => handleMobileNav('/')}
          className="flex items-center group focus:outline-none text-left"
        >
          <img
            src="/logo.png"
            alt="LoveWrapped"
            className="h-8 sm:h-9 w-auto object-contain group-hover:opacity-90 transition-opacity"
          />
        </button>

        {/* Desktop Links & CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            id="nav-demo-button"
            onClick={() => onNavigate('/w/demo')}
            className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all ${
              currentPath === '/w/demo'
                ? 'bg-cream-card text-maroon border border-cream-border'
                : 'text-mauve hover:text-maroon hover:bg-cream-card'
            }`}
          >
            Watch demo
          </button>

          <button
            id="nav-tiers-button"
            onClick={() => onNavigate('/pricing')}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-full bg-maroon hover:bg-maroon-light text-cream font-medium text-xs sm:text-sm shadow-md transition-all active:scale-95 border border-maroon/20"
          >
            <span>Choose a tier</span>
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
            className="p-2 rounded-xl text-maroon hover:text-coral bg-cream-card border border-cream-border focus:outline-none"
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
            className="sm:hidden bg-cream border-b border-cream-border overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-3">
              <button
                type="button"
                id="mobile-nav-home"
                onClick={() => handleMobileNav('/')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-maroon font-medium text-sm flex items-center justify-between"
              >
                <span>Home</span>
                <Heart className="w-4 h-4 text-coral" />
              </button>

              <button
                type="button"
                id="mobile-nav-demo"
                onClick={() => handleMobileNav('/w/demo')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-cream-card border border-cream-border text-maroon font-medium text-sm flex items-center justify-between"
              >
                <span>Watch demo</span>
                <PlayCircle className="w-4 h-4 text-coral" />
              </button>

              <button
                type="button"
                id="mobile-nav-tiers"
                onClick={() => handleMobileNav('/pricing')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-maroon text-cream font-semibold text-sm flex items-center justify-between shadow-md"
              >
                <span>Choose a tier</span>
                <Layers className="w-4 h-4 text-coral" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
