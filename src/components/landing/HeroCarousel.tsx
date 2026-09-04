import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  onNavigate: (path: string) => void;
}

const HERO_SLIDES = [
  {
    id: 'weddings',
    line1: 'Make Your Wedding Day ',
    accentLine: 'Unforgettable.',
    subtext: 'Scene-based digital wedding invitations and interactive RSVP experiences that your guests will want to replay.',
    ctaText: 'Get Started For Free',
    ctaPath: '/weddings/create',
    bgImage: '/images/image_8.png',
    objectPosition: 'object-center',
  },
  {
    id: 'moments',
    line1: 'Make Every Moment ',
    accentLine: 'Memorable.',
    subtext: "Amorah creates interactive digital stories and scene-based invitations for life's most meaningful occasions.",
    ctaText: 'Get Started For Free',
    ctaPath: '/pricing',
    bgImage: '/images/hero-moments.jpg',
    objectPosition: 'object-[center_25%]',
  },
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative bg-[#3a0d22] text-white overflow-hidden min-h-[80vh] sm:min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-24 sm:py-32">
      {/* Full-Bleed Background Image with Visible Photo & Lighter Dark Plum Overlay Tint */}
      <div className="absolute inset-0 z-0">
        <img
          key={slide.id}
          src={slide.bgImage}
          alt={slide.line1}
          className={`w-full h-full object-cover ${slide.objectPosition} transition-all duration-1000 ease-out`}
          loading="eager"
        />
        {/* Lighter Overlay Tint so photos are clearly recognizable while keeping copy 100% legible */}
        <div className="absolute inset-0 bg-[#3a0d22]/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a0d22]/60 via-[#3a0d22]/35 to-[#3a0d22]/65" />
      </div>

      {/* Centered Content Block */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Serif Headline with Accent-Colored Second Line & Contrast Shadow */}
        <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.12] [text-shadow:_0_2px_12px_rgba(0,0,0,0.6)]">
          <span>{slide.line1}</span>
          <br className="hidden sm:inline" />
          <em className="italic font-normal text-[#df6d73] block sm:inline">
            {slide.accentLine}
          </em>
        </h1>

        {/* Subtext with High Contrast Drop Shadow */}
        <p className="text-base sm:text-lg md:text-xl text-white max-w-2xl mx-auto font-normal leading-relaxed [text-shadow:_0_1px_8px_rgba(0,0,0,0.6)]">
          {slide.subtext}
        </p>

        {/* Single Solid Coral/Rose Pill CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            id={`hero-carousel-cta-${slide.id}`}
            onClick={() => onNavigate(slide.ctaPath)}
            className="px-8 py-4 rounded-full bg-[#df6d73] hover:bg-[#c85b61] text-white font-semibold text-base shadow-xl hover:scale-[1.03] active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center border border-white/20"
          >
            <span>{slide.ctaText}</span>
          </button>
        </div>

        {/* Carousel Slide Indicators */}
        <div className="flex items-center gap-3 pt-8">
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-8 bg-[#df6d73]' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
