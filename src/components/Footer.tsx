import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-cream-card text-mauve py-12 px-4 border-t border-cream-border mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="LoveWrapped"
              className="h-7 w-auto object-contain"
            />
          </div>
          <p className="text-xs text-mauve/80 max-w-xs font-normal">
            Turn your feelings into a story they’ll want to replay.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-6 text-xs font-medium text-mauve">
          <button
            id="footer-home-link"
            onClick={() => onNavigate('/')}
            className="hover:text-maroon transition-colors"
          >
            Home
          </button>
          <button
            id="footer-pricing-link"
            onClick={() => onNavigate('/pricing')}
            className="hover:text-maroon transition-colors"
          >
            Choose a tier
          </button>
          <button
            id="footer-example-link"
            onClick={() => onNavigate('/w/demo')}
            className="hover:text-maroon transition-colors"
          >
            Watch demo
          </button>
        </div>

        {/* Copyright */}
        <div className="flex flex-col items-center md:items-end gap-1 text-xs text-mauve/80">
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-coral fill-coral inline" /> for your favourite person
          </p>
          <p>© {new Date().getFullYear()} LoveWrapped. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
