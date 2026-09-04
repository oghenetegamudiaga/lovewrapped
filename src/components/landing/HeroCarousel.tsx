import React from 'react';
import { getEntryPointPath } from '../../config/entryPointRouting.js';

interface HeroCarouselProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onNavigate, isAuthenticated = false }) => {
  return (
    <section className="relative bg-[#3A0D22] text-white overflow-hidden min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 sm:py-28 select-none">
      {/* 1. Birthday Cake Sticker (Top-Left) */}
      <div className="absolute top-10 sm:top-14 left-4 sm:left-10 md:left-20 lg:left-32 z-10 animate-sticker-float-1 transition-transform duration-300 hover:scale-115 hover:-rotate-12 cursor-pointer">
        <img
          src="/stickers/cake.png"
          alt="Birthday Cake Sticker"
          className="w-12 sm:w-16 md:w-20 lg:w-24 h-auto drop-shadow-lg -rotate-12"
          loading="eager"
        />
      </div>

      {/* 2. LOVE Badge Sticker (Top-Right) */}
      <div className="absolute top-10 sm:top-14 right-4 sm:right-10 md:right-20 lg:right-32 z-10 animate-sticker-float-2 transition-transform duration-300 hover:scale-115 hover:rotate-12 cursor-pointer">
        <img
          src="/stickers/love.png"
          alt="LOVE Badge Sticker"
          className="w-14 sm:w-18 md:w-22 lg:w-28 h-auto drop-shadow-lg rotate-12"
          loading="eager"
        />
      </div>

      {/* 3. Heart with Arrow Sticker (Bottom-Left) */}
      <div className="absolute bottom-10 sm:bottom-14 left-4 sm:left-10 md:left-20 lg:left-32 z-10 animate-sticker-float-2 transition-transform duration-300 hover:scale-115 hover:-rotate-12 cursor-pointer">
        <img
          src="/stickers/heart.png"
          alt="Heart Sticker"
          className="w-14 sm:w-18 md:w-22 lg:w-28 h-auto drop-shadow-lg -rotate-12"
          loading="eager"
        />
      </div>

      {/* 4. Smiley Face Sticker (Bottom-Right) */}
      <div className="absolute bottom-10 sm:bottom-14 right-4 sm:right-10 md:right-20 lg:right-32 z-10 animate-sticker-float-1 transition-transform duration-300 hover:scale-115 hover:rotate-12 cursor-pointer">
        <img
          src="/stickers/smiley.png"
          alt="Smiley Face Sticker"
          className="w-10 sm:w-14 md:w-16 lg:w-20 h-auto drop-shadow-lg rotate-6"
          loading="eager"
        />
      </div>

      {/* Centered Content Block */}
      <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Headline H1 matching AMORAH_NEW_HERO.png */}
        <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12]">
          <span>Make Every Moment </span>
          <br className="hidden sm:inline" />
          <em className="italic font-normal text-[#df6d73] block sm:inline">
            Memorable.
          </em>
        </h1>

        {/* Subtext */}
        <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-normal leading-relaxed">
          Amorah creates interactive digital stories and scene based invitations for life's most meaningful occasions.
        </p>

        {/* Single Solid Coral Pill CTA Button */}
        <div className="pt-4">
          <button
            type="button"
            id="hero-get-started-button"
            onClick={() => onNavigate(getEntryPointPath('HERO_WEDDINGS', isAuthenticated))}
            className="px-8 py-4 rounded-full bg-[#df6d73] hover:bg-[#c85b61] text-white font-semibold text-base sm:text-lg shadow-xl hover:scale-[1.03] active:scale-95 transition-all cursor-pointer border border-white/10"
          >
            <span>Get Started For Free</span>
          </button>
        </div>
      </div>
    </section>
  );
};
