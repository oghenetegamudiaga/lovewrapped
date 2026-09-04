import React from 'react';
import { Heart, Instagram, Mail, MessageSquare } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleFaqClick = () => {
    if (window.location.pathname === '/') {
      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('/');
      setTimeout(() => {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <footer className="bg-maroon text-cream py-14 sm:py-20 px-4 sm:px-6 border-t border-maroon-light mt-auto font-sans">
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
              className="h-8 sm:h-9 w-auto object-contain brightness-200"
            />
          </button>
          <p className="text-xs sm:text-sm text-cream/70 max-w-sm font-normal leading-relaxed">
            Amorah creates interactive digital stories and scene-based invitations for life's most cherished celebrations.
          </p>
        </div>

        {/* Column 2: Products */}
        <div className="md:col-span-3 flex flex-col items-center md:items-start text-center md:text-left gap-2.5 text-xs">
          <span className="font-semibold uppercase tracking-wider text-coral text-[11px] mb-1">Products</span>
          <button
            id="footer-weddings-link"
            onClick={() => onNavigate('/weddings')}
            className="text-cream/80 hover:text-cream transition-colors py-1 cursor-pointer"
          >
            Weddings by Amorah
          </button>
          <button
            id="footer-love-stories-link"
            onClick={() => onNavigate('/love-stories')}
            className="text-cream/80 hover:text-cream transition-colors py-1 cursor-pointer"
          >
            Moments
          </button>
          <button
            id="footer-faq-link"
            onClick={handleFaqClick}
            className="text-cream/80 hover:text-cream transition-colors py-1 cursor-pointer"
          >
            FAQ
          </button>
        </div>

        {/* Column 3: Connect Links */}
        <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left gap-2.5 text-xs">
          <span className="font-semibold uppercase tracking-wider text-coral text-[11px] mb-1">Connect</span>
          <a
            id="footer-connect-instagram"
            href="https://instagram.com/getamorah"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/80 hover:text-cream transition-colors py-1 inline-flex items-center gap-2"
          >
            <Instagram className="w-3.5 h-3.5 text-coral" />
            <span>Instagram</span>
          </a>
          <a
            id="footer-connect-email"
            href="mailto:hello@amorah.xyz"
            className="text-cream/80 hover:text-cream transition-colors py-1 inline-flex items-center gap-2"
          >
            <Mail className="w-3.5 h-3.5 text-coral" />
            <span>Email Us</span>
          </a>
          <a
            id="footer-connect-whatsapp"
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cream/80 hover:text-cream transition-colors py-1 inline-flex items-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Bottom Copyright & Guarantee */}
      <div className="max-w-6xl mx-auto pt-8 mt-10 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/60 text-center sm:text-left">
        <p className="flex items-center gap-1 justify-center">
          Made with <Heart className="w-3.5 h-3.5 text-coral fill-coral inline" /> for your favorite person
        </p>
        <p>© {new Date().getFullYear()} Amorah. All rights reserved.</p>
      </div>
    </footer>
  );
};
