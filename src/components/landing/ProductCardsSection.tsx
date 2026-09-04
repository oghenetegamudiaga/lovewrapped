import React from 'react';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import { ScrollReveal } from '../common/ScrollReveal';

interface ProductCardsSectionProps {
  onNavigate: (path: string) => void;
}

export const ProductCardsSection: React.FC<ProductCardsSectionProps> = ({ onNavigate }) => {
  return (
    <section id="products" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFEFE] border-b border-cream-border/60 scroll-mt-12">
      <div className="max-w-5xl mx-auto text-center">
        {/* Section Header */}
        <ScrollReveal delay={0} className="mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon tracking-tight">
            Explore Our Products
          </h2>
        </ScrollReveal>

        {/* Exactly 2 Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Product Card 1: Moments */}
          <ScrollReveal delay={100} className="h-full">
            <div className="bg-white border border-cream-border p-8 sm:p-10 rounded-3xl shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group border-t-4 border-t-coral/60 h-full">
              <div>
                {/* Icon Badge */}
                <div className="w-14 h-14 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 fill-coral/20" />
                </div>

                <h3 className="font-serif text-2xl font-bold text-maroon mb-3">
                  Moments
                </h3>

                <p className="text-mauve text-sm sm:text-base leading-relaxed mb-6 font-normal">
                  Personalized digital cards for anniversaries, birthdays, proposals, and romantic surprises. A few memories, a few honest words, one beautiful story they'll want to replay.
                </p>
              </div>

              <div className="pt-4 border-t border-cream-border/60">
                <button
                  type="button"
                  id="product-card-moments-cta"
                  onClick={() => onNavigate('/pricing')}
                  className="text-coral font-semibold text-sm sm:text-base inline-flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
                >
                  <span>Create Yours</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Product Card 2: Weddings by Amorah */}
          <ScrollReveal delay={200} className="h-full">
            <div className="bg-white border border-cream-border p-8 sm:p-10 rounded-3xl shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between text-left group border-t-4 border-t-maroon h-full">
              <div>
                {/* Icon Badge */}
                <div className="w-14 h-14 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7 text-maroon" />
                </div>

                <h3 className="font-serif text-2xl font-bold text-maroon mb-3">
                  Weddings by Amorah
                </h3>

                <p className="text-mauve text-sm sm:text-base leading-relaxed mb-6 font-normal">
                  Cinematic digital wedding invitations, multi-event schedules, and real-time RSVP management. Designed to give your guests an unforgettable preview of your wedding day.
                </p>
              </div>

              <div className="pt-4 border-t border-cream-border/60">
                <button
                  type="button"
                  id="product-card-weddings-cta"
                  onClick={() => onNavigate('/weddings/create')}
                  className="text-maroon font-semibold text-sm sm:text-base inline-flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer"
                >
                  <span>Create Yours</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
