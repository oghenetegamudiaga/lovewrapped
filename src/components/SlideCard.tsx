import React from 'react';
import { Slide, PlanTier } from '../types';
import { Heart, Sparkles, Quote } from 'lucide-react';

interface SlideCardProps {
  slide: Slide;
  senderName?: string;
  receiverName?: string;
  occasion?: string;
  tier?: PlanTier;
  totalSlides?: number;
  currentSlideIndex?: number;
}

export const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  occasion,
}) => {
  if (slide.type === 'image' && slide.url) {
    return (
      <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
        {/* Background Blur Image */}
        <img
          src={slide.url}
          alt={slide.caption || 'Memory'}
          className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-105"
        />

        {/* Foreground Main Image */}
        <div className="relative z-10 w-full h-full max-h-[82%] p-4 flex items-center justify-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 max-w-full max-h-full">
            <img
              src={slide.url}
              alt={slide.caption || 'Memory'}
              className="w-full h-full object-contain max-h-[60vh] rounded-2xl"
            />
          </div>
        </div>

        {/* Caption Overlay */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center text-white">
          {slide.caption && (
            <p className="font-serif italic text-base sm:text-lg text-rose-100 tracking-wide drop-shadow-md max-w-sm mx-auto">
              "{slide.caption}"
            </p>
          )}
          {occasion && (
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] uppercase tracking-widest text-rose-300/80 font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-rose-300" />
              {occasion}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Text Slide
  const textContent = slide.content || '';
  // Determine font size based on text length for auto-resizing legibility
  const textLen = textContent.length;
  let fontSizeClass = 'text-xl sm:text-2xl leading-relaxed';
  if (textLen < 60) {
    fontSizeClass = 'text-2xl sm:text-3xl font-serif leading-snug';
  } else if (textLen > 150) {
    fontSizeClass = 'text-base sm:text-lg leading-relaxed';
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-rose-900 via-rose-950 to-slate-950 text-rose-50 p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header details */}
      <div className="relative z-10 flex items-center justify-between text-rose-300/80 text-xs font-medium uppercase tracking-widest">
        <span className="flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          {occasion || 'LoveWrapped'}
        </span>
        <Quote className="w-5 h-5 text-rose-400/40" />
      </div>

      {/* Main Text Content */}
      <div className="relative z-10 my-auto py-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-rose-400/50 to-transparent mb-6" />
        <p className={`font-serif text-rose-50 ${fontSizeClass} whitespace-pre-line drop-shadow-sm max-w-md mx-auto`}>
          {textContent}
        </p>
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-rose-400/50 to-transparent mt-6" />
      </div>

      {/* Footer Accent */}
      <div className="relative z-10 flex items-center justify-center text-rose-300/60 text-[11px] font-medium tracking-wider uppercase">
        <Sparkles className="w-3 h-3 text-rose-400 mr-1 animate-pulse" />
        Tap to continue
      </div>
    </div>
  );
};
