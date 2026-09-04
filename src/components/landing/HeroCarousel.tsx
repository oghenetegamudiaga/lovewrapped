import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroCarouselProps {
  onNavigate: (path: string) => void;
}

const HERO_SLIDES = [
  {
    id: 'weddings',
    eyebrow: 'WEDDINGS BY AMORAH',
    titlePrefix: 'Make Every Moment ',
    titleHighlight: 'Memorable.',
    subtitle: 'Scene-based digital wedding invitations and interactive RSVP experiences that your guests will want to replay.',
    primaryCtaText: 'Get Started For Free',
    primaryCtaPath: '/weddings/create',
    secondaryCtaText: 'Explore Weddings',
    secondaryCtaPath: '/weddings',
    bgOverlayImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'moments',
    eyebrow: 'AMORAH MOMENTS',
    titlePrefix: 'Turn Special Moments Into ',
    titleHighlight: 'Unforgettable Stories.',
    subtitle: 'Personalized interactive digital cards for anniversaries, birthdays, proposals, and romantic surprises.',
    primaryCtaText: 'Get Started For Free',
    primaryCtaPath: '/pricing',
    secondaryCtaText: 'Explore Moments',
    secondaryCtaPath: '/love-stories',
    bgOverlayImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=2000&q=80',
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
    <section className="relative bg-maroon text-cream overflow-hidden py-20 sm:py-28 md:py-36 px-4 sm:px-6">
      {/* Background Image with Dark Plum Vignette */}
      <div className="absolute inset-0 z-0 opacity-20 transition-opacity duration-1000">
        <img
          key={slide.id}
          src={slide.bgOverlayImage}
          alt={slide.titlePrefix}
          className="w-full h-full object-cover object-center scale-105 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-maroon/90 via-maroon/85 to-maroon" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Eyebrow */}
        <span className="inline-block text-xs font-semibold text-coral uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full bg-coral/10 border border-coral/20">
          {slide.eyebrow}
        </span>

        {/* Serif Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-cream leading-[1.12] mb-6 max-w-4xl">
          {slide.titlePrefix}
          <em className="italic font-normal text-coral block sm:inline">
            {slide.titleHighlight}
          </em>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-cream/80 max-w-2xl mb-10 font-normal leading-relaxed">
          {slide.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            id={`hero-primary-cta-${slide.id}`}
            onClick={() => onNavigate(slide.primaryCtaPath)}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-coral hover:bg-coral-hover text-white font-semibold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{slide.primaryCtaText}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            id={`hero-secondary-cta-${slide.id}`}
            onClick={() => onNavigate(slide.secondaryCtaPath)}
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-maroon-light/60 hover:bg-maroon-light text-cream font-medium text-base border border-cream/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{slide.secondaryCtaText}</span>
          </button>
        </div>

        {/* Carousel Slide Indicators & Manual Arrows */}
        <div className="flex items-center gap-4 mt-12">
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
            className="p-2 rounded-full bg-cream/10 hover:bg-cream/20 text-cream transition-colors cursor-pointer"
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
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-8 bg-coral' : 'w-2 bg-cream/40 hover:bg-cream/70'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="p-2 rounded-full bg-cream/10 hover:bg-cream/20 text-cream transition-colors cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
