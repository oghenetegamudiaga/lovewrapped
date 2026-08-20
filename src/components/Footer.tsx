import React from 'react';
import { Heart, Instagram } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-cream-card text-mauve py-12 sm:py-16 px-4 sm:px-6 border-t border-cream-border mt-auto font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        {/* Column 1: Brand & Tagline */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center group focus:outline-none cursor-pointer"
          >
            <img
              src="/logo.png"
              alt="Amorah"
              className="h-8 w-auto object-contain"
            />
          </button>
          <p className="text-xs sm:text-sm text-mauve/80 max-w-sm font-normal leading-relaxed">
            Amorah creates interactive digital stories and scene-based invitations for life’s most cherished celebrations.
          </p>
          <div className="flex items-center gap-3 pt-2 text-mauve">
            <a
              href="https://www.instagram.com/getamorah"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Amorah on Instagram"
              className="p-2 rounded-full bg-cream border border-cream-border hover:text-maroon hover:border-coral transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Column 2: Products */}
        <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-maroon text-[11px] mb-1">Products</span>
          <button
            id="footer-love-stories-link"
            onClick={() => onNavigate('/love-stories')}
            className="hover:text-maroon transition-colors py-1 cursor-pointer"
          >
            Love Stories
          </button>
          <button
            id="footer-weddings-link"
            onClick={() => onNavigate('/weddings')}
            className="hover:text-maroon transition-colors py-1 cursor-pointer"
          >
            Weddings by Amorah
          </button>
          <button
            id="footer-pricing-link"
            onClick={() => onNavigate('/pricing')}
            className="hover:text-maroon transition-colors py-1 cursor-pointer"
          >
            Choose a Tier
          </button>
        </div>

        {/* Column 3: Company & Legal */}
        <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-maroon text-[11px] mb-1">Company & Resources</span>
          <button
            id="footer-blog-link"
            onClick={() => onNavigate('/blog')}
            className="hover:text-maroon transition-colors py-1 cursor-pointer"
          >
            The Amorah Journal (Blog)
          </button>
          <button
            id="footer-demo-link"
            onClick={() => onNavigate('/w/demo')}
            className="hover:text-maroon transition-colors py-1 cursor-pointer"
          >
            Watch Sample Demo
          </button>
          <a
            href="mailto:hello@amorah.app"
            className="hover:text-maroon transition-colors py-1"
          >
            Contact & Support
          </a>
        </div>
      </div>

      {/* Bottom Copyright & Guarantee */}
      <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-cream-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-mauve/80 text-center sm:text-left">
        <p className="flex items-center gap-1 justify-center">
          Made with <Heart className="w-3.5 h-3.5 text-coral fill-coral inline" /> for your favourite person
        </p>
        <p>© {new Date().getFullYear()} Amorah. All rights reserved.</p>
      </div>
    </footer>
  );
};

