import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#250614] text-rose-200/80 py-12 px-4 border-t border-rose-950 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
            </div>
            <span className="font-serif font-bold text-xl text-white tracking-tight">
              Love<span className="text-rose-400">Wrapped</span>
            </span>
          </div>
          <p className="text-xs text-rose-300/60 max-w-xs font-normal">
            Turn your feelings into a story she’ll want to replay.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6 text-xs font-medium text-rose-200/80">
          <button
            id="footer-home-link"
            onClick={() => onNavigate('/')}
            className="hover:text-white transition-colors"
          >
            Home
          </button>
          <button
            id="footer-pricing-link"
            onClick={() => onNavigate('/pricing')}
            className="hover:text-white transition-colors"
          >
            Choose a tier
          </button>
          <button
            id="footer-example-link"
            onClick={() => onNavigate('/w/demo')}
            className="hover:text-white transition-colors"
          >
            Watch demo
          </button>
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center md:items-end gap-1 text-xs text-rose-400/60">
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-rose-400 fill-rose-400 inline" /> for your favourite person
          </p>
          <p>© {new Date().getFullYear()} LoveWrapped. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

