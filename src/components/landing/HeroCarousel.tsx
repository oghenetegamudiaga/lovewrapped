import React from 'react';
import { motion } from 'motion/react';

interface HeroCarouselProps {
  onNavigate?: (path: string) => void;
  isAuthenticated?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onNavigate }) => {
  const handleCtaClick = () => {
    const productsElement = document.getElementById('products');
    if (productsElement) {
      productsElement.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigate) {
      onNavigate('/#products');
    }
  };

  return (
    <section className="relative bg-[#FAF7F2] text-[#3A0D22] overflow-hidden py-16 sm:py-24 md:py-32 px-4 sm:px-6 select-none flex items-center justify-center min-h-[75vh] sm:min-h-[85vh]">
      {/* Centered Wrapper for Hero Content & Corner Stickers */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center text-center space-y-6 sm:space-y-8">
        
        {/* 1. Birthday Cake Sticker (Top-Left) */}
        <motion.div
          className="absolute -top-6 left-0 sm:top-0 sm:left-4 md:top-2 md:left-8 lg:top-4 lg:left-12 z-10 cursor-pointer"
          initial={{ rotate: -12 }}
          animate={{
            y: [0, -6, 0],
            rotate: -12,
          }}
          whileHover={{
            scale: 1.08,
            rotate: -18,
            transition: { duration: 0.2, ease: 'easeOut' },
          }}
          transition={{
            y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <img
            src="/stickers/cake.png"
            alt="Birthday Cake Sticker"
            className="w-12 sm:w-16 md:w-20 lg:w-24 h-auto drop-shadow-md select-none"
            loading="eager"
          />
        </motion.div>

        {/* 2. LOVE Badge Sticker (Top-Right) */}
        <motion.div
          className="absolute -top-6 right-0 sm:top-0 sm:right-4 md:top-2 md:right-8 lg:top-4 lg:right-12 z-10 cursor-pointer"
          initial={{ rotate: 14 }}
          animate={{
            y: [0, -7, 0],
            rotate: 14,
          }}
          whileHover={{
            scale: 1.08,
            rotate: 20,
            transition: { duration: 0.2, ease: 'easeOut' },
          }}
          transition={{
            y: { duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          }}
        >
          <img
            src="/stickers/love.png"
            alt="LOVE Stamp Sticker"
            className="w-14 sm:w-18 md:w-22 lg:w-28 h-auto drop-shadow-md select-none"
            loading="eager"
          />
        </motion.div>

        {/* 3. Heart with Arrow Sticker (Bottom-Left) */}
        <motion.div
          className="absolute -bottom-6 left-0 sm:-bottom-2 sm:left-4 md:bottom-0 md:left-8 lg:bottom-2 lg:left-12 z-10 cursor-pointer"
          initial={{ rotate: -10 }}
          animate={{
            y: [0, -6, 0],
            rotate: -10,
          }}
          whileHover={{
            scale: 1.08,
            rotate: -16,
            transition: { duration: 0.2, ease: 'easeOut' },
          }}
          transition={{
            y: { duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
          }}
        >
          <img
            src="/stickers/heart.png"
            alt="Heart Sticker"
            className="w-14 sm:w-18 md:w-22 lg:w-28 h-auto drop-shadow-md select-none"
            loading="eager"
          />
        </motion.div>

        {/* 4. Smiley Face Sticker (Bottom-Right) */}
        <motion.div
          className="absolute -bottom-6 right-0 sm:-bottom-2 sm:right-4 md:bottom-0 md:right-8 lg:bottom-2 lg:right-12 z-10 cursor-pointer"
          initial={{ rotate: 8 }}
          animate={{
            y: [0, -8, 0],
            rotate: 8,
          }}
          whileHover={{
            scale: 1.08,
            rotate: 14,
            transition: { duration: 0.2, ease: 'easeOut' },
          }}
          transition={{
            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 },
          }}
        >
          <img
            src="/stickers/smiley.png"
            alt="Smiley Face Sticker"
            className="w-10 sm:w-14 md:w-16 lg:w-20 h-auto drop-shadow-md select-none"
            loading="eager"
          />
        </motion.div>

        {/* Headline H1 matching reference design */}
        <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.15] max-w-3xl">
          <span className="text-[#3A0D22] block sm:inline">Make Every Moment </span>
          <br className="hidden sm:inline" />
          <span className="text-[#df6d73] block sm:inline">Memorable.</span>
        </h1>

        {/* Subtext */}
        <p className="text-base sm:text-lg md:text-xl text-[#55404A] max-w-2xl mx-auto font-normal leading-relaxed">
          Amorah creates interactive digital stories and scene based invitations for life's most meaningful occasions.
        </p>

        {/* CTA Button */}
        <div className="pt-2 sm:pt-4">
          <button
            type="button"
            id="hero-get-started-button"
            onClick={handleCtaClick}
            className="px-8 py-4 rounded-full bg-[#3A0D22] hover:bg-[#2B0818] text-[#FFFDF9] font-semibold text-base sm:text-lg shadow-md hover:scale-[1.03] active:scale-95 transition-all cursor-pointer border border-transparent"
          >
            <span>Get Started For Free</span>
          </button>
        </div>

      </div>
    </section>
  );
};

