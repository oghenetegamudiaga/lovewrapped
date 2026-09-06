import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ScrollReveal } from '../common/ScrollReveal';
import { getEntryPointPath } from '../../config/entryPointRouting.js';

interface ProductCardsSectionProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
}

export const ProductCardsSection: React.FC<ProductCardsSectionProps> = ({ onNavigate, isAuthenticated = false }) => {
  return (
    <section id="products" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFEFE] border-b border-cream-border/60 scroll-mt-12">
      <div className="max-w-5xl mx-auto text-center">
        {/* Section Header */}
        <ScrollReveal delay={0} className="mb-12 sm:mb-16 flex flex-col items-center">
          <span className="text-sm sm:text-base font-medium text-[#df6d73] mb-2 tracking-normal">
            Our Products
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-[#3A0D22] tracking-tight">
            Explore Our Products
          </h2>
        </ScrollReveal>

        {/* Exactly 2 Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Product Card 1: Moments */}
          <ScrollReveal delay={100} className="h-full">
            <div className="bg-white border border-[#EFE5EB] p-8 sm:p-10 md:p-12 rounded-[28px] transition-all duration-300 flex flex-col justify-between text-left group h-full">
              <div>
                {/* Uploaded Envelope Icon */}
                <div className="mb-8">
                  <img
                    src="/icons/moments-card-icon.png"
                    alt="Moments Envelope Icon"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                <h3 className="font-sans text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4 tracking-tight">
                  Moments
                </h3>

                <p className="text-[#555555] text-sm sm:text-base leading-relaxed mb-8 font-normal">
                  Personalized interactive digital cards for anniversaries, birthdays, proposals, and romantic surprises. A few memories, a few honest words, one beautiful story they’ll want to replay.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  id="product-card-moments-cta"
                  onClick={() => onNavigate(getEntryPointPath('PRODUCT_CARD_MOMENTS', isAuthenticated))}
                  className="text-[#df6d73] hover:text-[#c85b61] font-semibold text-base sm:text-lg inline-flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer"
                >
                  <span>Create Now</span>
                  <ChevronRight className="w-5 h-5 text-[#df6d73]" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Product Card 2: Weddings RSVP */}
          <ScrollReveal delay={200} className="h-full">
            <div className="bg-white border border-[#EFE5EB] p-8 sm:p-10 md:p-12 rounded-[28px] transition-all duration-300 flex flex-col justify-between text-left group h-full">
              <div>
                {/* Uploaded Rings Icon */}
                <div className="mb-8">
                  <img
                    src="/icons/weddings-rsvp-icon.png"
                    alt="Weddings RSVP Rings Icon"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                <h3 className="font-sans text-2xl sm:text-3xl font-semibold text-[#1A1A1A] mb-4 tracking-tight">
                  Weddings RSVP
                </h3>

                <p className="text-[#555555] text-sm sm:text-base leading-relaxed mb-8 font-normal">
                  Cinematic digital wedding invitations, multi-event schedules, and real-time RSVP management. Designed to give your guests an unforgettable preview of your wedding day.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  id="product-card-weddings-cta"
                  onClick={() => onNavigate(getEntryPointPath('PRODUCT_CARD_WEDDINGS', isAuthenticated))}
                  className="text-[#df6d73] hover:text-[#c85b61] font-semibold text-base sm:text-lg inline-flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer"
                >
                  <span>Create Now</span>
                  <ChevronRight className="w-5 h-5 text-[#df6d73]" />
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
