import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '../common/ScrollReveal';

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export const STEPS_DATA: StepItem[] = [
  {
    number: '01',
    title: 'Choose Your Theme & Plan',
    description: 'Select from curated romantic themes (Classic Burgundy, Modern Emerald, Boho Champagne) and choose between a Free Card or Premium Experience.',
  },
  {
    number: '02',
    title: 'Customize Your Details & Story',
    description: 'Enter your couple names, multi-event schedules (ceremonies, reception, venues, and times), love story text, and registry details.',
  },
  {
    number: '03',
    title: 'Upload Cover & Gallery Photos',
    description: 'Personalize your invitation with your favorite couple photos for the cover card background and photo gallery.',
  },
  {
    number: '04',
    title: 'Add Custom Background Music',
    description: 'Pick from ambient orchestral background tracks or link your favorite Spotify track, Apple Music song, or SoundCloud link.',
  },
  {
    number: '05',
    title: 'Preview & Share Your Link',
    description: 'Test your live interactive invitation, generate your unique wedding URL, and share it instantly with your guests via WhatsApp or email.',
  },
  {
    number: '06',
    title: 'Track RSVPs & Guest List',
    description: 'Monitor live guest responses, manage plus-ones, view dietary notes, and download your guest list anytime from your dashboard.',
  },
];

interface WeddingStepsProps {
  onActionClick?: () => void;
}

export const WeddingSteps: React.FC<WeddingStepsProps> = ({ onActionClick }) => {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <ScrollReveal delay={0} className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon tracking-tight mb-4">
          How It Works
        </h2>
        <p className="text-mauve text-base leading-relaxed">
          Creating your unforgettable digital wedding invitation is fast, intuitive, and stress-free.
        </p>
      </ScrollReveal>

      {/* 2-Column Container: Couple Photo Left, Steps Right */}
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left Column: Couple Photo */}
        <ScrollReveal delay={100} className="w-full lg:w-1/2 relative">
          <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden border-4 border-cream-card border-cream-border">
            <img
              src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=80"
              alt="Happy Bride and Groom Celebrating"
              loading="lazy"
              className="w-full h-[420px] sm:h-[540px] lg:h-[620px] object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-maroon/70 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-8 text-cream">
              <span className="font-serif italic text-lg sm:text-xl text-cream/90 mb-1">
                “Turn your feelings into a story they’ll want to replay.”
              </span>
              <p className="text-xs font-sans text-coral tracking-wider font-semibold uppercase">
                Weddings by Amorah
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Right Column: Steps List */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-6">
          {STEPS_DATA.map((step, idx) => (
            <ScrollReveal key={step.number} delay={120 + idx * 70}>
              <div
                className="flex items-start gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-white hover:bg-[#FFFEFE] border border-cream-border/60 transition-all group"
              >
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-maroon text-cream font-serif font-bold text-sm sm:text-base shrink-0 group-hover:bg-coral transition-colors">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-maroon mb-1">
                    {step.title}
                  </h3>
                  <p className="text-mauve text-xs sm:text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}

          {/* Quick CTA button */}
          {onActionClick && (
            <ScrollReveal delay={550} className="pt-4">
              <button
                type="button"
                onClick={onActionClick}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Building Yours Now</span>
                <ArrowRight className="w-4 h-4 text-coral" />
              </button>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
};
