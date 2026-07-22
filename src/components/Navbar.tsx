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
    <header className="sticky top-0 z-50 bg-[#2b0818]/90 backdrop-blur-md border-b border-rose-900/40 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          id="nav-logo-button"
          onClick={() => handleMobileNav('/')}
          className="flex items-center gap-2 group focus:outline-none text-left"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-950/50 group-hover:scale-105 transition-transform">
            <Heart className="w-4 h-4 fill-white" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-white group-hover:text-rose-200 transition-colors">
            Love<span className="text-rose-400">Wrapped</span>
          </span>
        </button>

        {/* Desktop Links & CTA */}
        <div className="hidden sm:flex items-center gap-4">
          <button
            id="nav-demo-button"
            onClick={() => onNavigate('/w/demo')}
            className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-full transition-all ${
              currentPath === '/w/demo'
                ? 'bg-rose-900/60 text-rose-200 border border-rose-700/50'
                : 'text-rose-200/80 hover:text-white hover:bg-rose-900/30'
            }`}
          >
            Watch demo
          </button>

          <button
            id="nav-tiers-button"
            onClick={() => onNavigate('/pricing')}
            className="group flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-rose-950/60 transition-all active:scale-95 border border-rose-400/20"
          >
            <span>Choose a tier</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="sm:hidden flex items-center">
          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl text-rose-200 hover:text-white bg-rose-950/80 border border-rose-800/60 focus:outline-none"
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
            className="sm:hidden bg-[#250614] border-b border-rose-900/60 overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-3">
              <button
                type="button"
                id="mobile-nav-home"
                onClick={() => handleMobileNav('/')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-[#3a0d22]/50 border border-rose-800/40 text-rose-100 font-medium text-sm flex items-center justify-between"
              >
                <span>Home</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </button>

              <button
                type="button"
                id="mobile-nav-demo"
                onClick={() => handleMobileNav('/w/demo')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-[#3a0d22]/50 border border-rose-800/40 text-rose-100 font-medium text-sm flex items-center justify-between"
              >
                <span>Watch demo</span>
                <PlayCircle className="w-4 h-4 text-rose-400" />
              </button>

              <button
                type="button"
                id="mobile-nav-tiers"
                onClick={() => handleMobileNav('/pricing')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 text-white font-semibold text-sm flex items-center justify-between shadow-lg"
              >
                <span>Choose a tier</span>
                <Layers className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};


