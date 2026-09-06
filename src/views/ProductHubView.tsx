import React from 'react';
import { Heart, Sparkles, ArrowRight, UserCheck } from 'lucide-react';
import { CoupleAccount } from '../types.js';

interface ProductHubViewProps {
  currentCouple: CoupleAccount | null;
  onNavigate: (path: string) => void;
}

export const ProductHubView: React.FC<ProductHubViewProps> = ({ currentCouple, onNavigate }) => {
  return (
    <div className="min-h-[85vh] bg-[#FFFEFE] text-maroon font-sans py-16 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto w-full text-center space-y-10">
        {/* Header Badge & Title */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 text-coral text-xs sm:text-sm font-medium">
            <UserCheck className="w-4 h-4 text-coral" />
            <span>Welcome, {currentCouple?.full_name || currentCouple?.email || 'Amorah Creator'}</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#3A0D22] tracking-tight">
            What would you like to create?
          </h1>

          <p className="text-mauve text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Select a product line below to start crafting your interactive digital experience.
          </p>
        </div>

        {/* Product Cards Choice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto text-left">
          {/* Card 1: Moments */}
          <div className="bg-white border border-[#EFE5EB] p-8 sm:p-10 rounded-3xl transition-all duration-300 flex flex-col justify-between group border-t-4 border-t-coral">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 fill-coral" />
              </div>

              <h2 className="font-serif text-2xl font-bold text-maroon">
                Moments
              </h2>

              <p className="text-mauve text-sm leading-relaxed font-normal">
                Personalized interactive digital cards for anniversaries, birthdays, proposals, and romantic surprises.
              </p>
            </div>

            <div className="pt-8">
              <button
                type="button"
                id="hub-create-moments-button"
                onClick={() => onNavigate('/pricing')}
                className="w-full py-3.5 px-6 rounded-2xl bg-coral hover:bg-[#c85b61] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Create Moments Card</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Weddings by Amorah */}
          <div className="bg-white border border-[#EFE5EB] p-8 sm:p-10 rounded-3xl transition-all duration-300 flex flex-col justify-between group border-t-4 border-t-[#3A0D22]">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#3A0D22]/10 text-[#3A0D22] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-[#3A0D22]" />
              </div>

              <h2 className="font-serif text-2xl font-bold text-maroon">
                Weddings by Amorah
              </h2>

              <p className="text-mauve text-sm leading-relaxed font-normal">
                Cinematic digital wedding invitations, multi-event schedules, and real-time guest RSVP management.
              </p>
            </div>

            <div className="pt-8">
              <button
                type="button"
                id="hub-create-weddings-button"
                onClick={() => onNavigate('/weddings/create')}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3A0D22] hover:bg-[#2a0918] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Create Wedding Invitation</span>
                <ArrowRight className="w-4 h-4 text-coral" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Link to Portfolio */}
        <div className="pt-4">
          <button
            type="button"
            id="hub-view-portfolio-link"
            onClick={() => onNavigate('/weddings/mine')}
            className="text-xs sm:text-sm text-mauve hover:text-maroon underline font-medium transition-colors cursor-pointer"
          >
            View My Portfolio & Existing Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
