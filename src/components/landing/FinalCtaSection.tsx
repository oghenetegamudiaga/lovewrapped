import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getEntryPointPath } from '../../config/entryPointRouting.js';

interface FinalCtaSectionProps {
  onNavigate: (path: string) => void;
  isAuthenticated?: boolean;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onNavigate, isAuthenticated = false }) => {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFEFE]">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-3xl bg-maroon text-cream p-8 sm:p-16 overflow-hidden shadow-2xl text-center">
          {/* Background Overlay Image */}
          <div className="absolute inset-0 z-0 opacity-15">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80"
              alt="Background Overlay"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-maroon/90 via-maroon to-maroon/95" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-cream mb-4 tracking-tight leading-tight">
              Turn your love into an <em className="italic font-normal text-coral">experience.</em>
            </h2>

            <p className="text-base sm:text-lg text-cream/80 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
              A few memories. A few honest words. One beautiful story they'll want to replay.
            </p>

            <button
              type="button"
              id="final-cta-get-started-button"
              onClick={() => onNavigate(getEntryPointPath('FINAL_CTA', isAuthenticated))}
              className="px-9 py-4 rounded-full bg-coral hover:bg-coral-hover text-white font-semibold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center gap-2.5 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
