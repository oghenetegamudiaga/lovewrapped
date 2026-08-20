import React from 'react';
import { Heart, Sparkles, ArrowRight, ShieldCheck, Layers, Calendar, CheckCircle2, UserCheck, PlayCircle } from 'lucide-react';

interface CompanyHomeViewProps {
  onNavigate: (path: string) => void;
}

export const CompanyHomeView: React.FC<CompanyHomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-cream text-maroon font-sans selection:bg-coral selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-coral/10 border border-coral/20 text-coral text-xs font-semibold tracking-wide uppercase mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Digital Experience Platform</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-maroon leading-[1.12] mb-6 max-w-4xl">
          Turn Every Special Moment Into an<br />
          <em className="italic font-normal text-coral">Unforgettable Digital Experience.</em>
        </h1>

        <p className="text-lg sm:text-xl text-mauve max-w-2xl mb-10 font-normal leading-relaxed">
          Amorah creates interactive digital stories and scene-based invitations for life's most meaningful occasions — from anniversaries and romantic surprises to weddings.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 w-full sm:w-auto">
          <a
            href="#products"
            className="px-8 py-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-maroon/20 cursor-pointer"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-5 h-5 text-coral" />
          </a>

          <button
            id="company-hero-create-button"
            onClick={() => onNavigate('/pricing')}
            className="px-6 py-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon border border-cream-border font-medium text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Yours</span>
          </button>
        </div>

        <p className="text-xs text-mauve/80 font-medium tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-coral inline" />
          <span>No app installation required • Instant shareable links • Beautiful on all devices</span>
        </p>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 sm:py-20 px-4 sm:px-6 bg-cream-card/60 border-y border-cream-border/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-maroon mb-3">
              Crafted for Your Moments
            </h2>
            <p className="text-mauve text-base max-w-xl mx-auto">
              Choose the perfect Amorah product for your celebration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Card 1: Amorah Love Stories */}
            <div className="bg-cream border border-cream-border p-8 sm:p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Heart className="w-32 h-32 text-coral fill-coral" />
              </div>

              <div className="relative z-10 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mb-6">
                  <Heart className="w-6 h-6 fill-coral" />
                </div>
                <span className="text-xs font-semibold text-coral uppercase tracking-wider">Product line</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-maroon mt-1 mb-3">
                  Amorah Love Stories
                </h3>
                <p className="text-mauve text-sm sm:text-base leading-relaxed mb-6">
                  Personalized interactive digital cards for anniversaries, birthdays, proposals, and romantic surprises. A few memories, a few honest words, one beautiful story they’ll want to replay.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-maroon/90 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                    <span>Interactive multi-slide storytelling with photos & music</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                    <span>Voice message recordings & custom slide themes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                    <span>Instant shareable link with zero app downloads</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 pt-4 border-t border-cream-border/60 flex items-center justify-between">
                <button
                  id="home-explore-love-stories-button"
                  onClick={() => onNavigate('/love-stories')}
                  className="w-full py-3.5 px-6 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Love Stories</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>

            {/* Product Card 2: Weddings by Amorah */}
            <div className="bg-cream border border-cream-border p-8 sm:p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-32 h-32 text-coral" />
              </div>

              <div className="relative z-10 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-maroon/10 text-maroon flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-coral" />
                </div>
                <span className="text-xs font-semibold text-coral uppercase tracking-wider">Product line</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-maroon mt-1 mb-3">
                  Weddings by Amorah
                </h3>
                <p className="text-mauve text-sm sm:text-base leading-relaxed mb-6">
                  Cinematic digital wedding invitations, multi-event schedules, and real-time RSVP management. Designed to give your guests an unforgettable preview of your wedding day.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-maroon/90 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                    <span>Scene-based digital invitations with animated typography</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                    <span>Real-time guest RSVP tracking & dietary preferences</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                    <span>Traditional, White Wedding & Reception multi-event support</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 pt-4 border-t border-cream-border/60 flex items-center justify-between">
                <button
                  id="home-explore-weddings-button"
                  onClick={() => onNavigate('/weddings')}
                  className="w-full py-3.5 px-6 rounded-full bg-cream-card hover:bg-cream-border text-maroon border border-cream-border font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Explore Weddings</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Teaser & Trust Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-maroon text-cream shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-coral/20 text-coral mx-auto flex items-center justify-center mb-2">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-cream">
              See Amorah in Action
            </h2>
            <p className="text-cream/80 text-base max-w-lg mx-auto pb-4">
              Watch a sample story experience to see how easy it is to share meaningful memories.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                id="home-watch-demo-cta"
                onClick={() => onNavigate('/w/demo')}
                className="px-8 py-3.5 rounded-full bg-coral hover:bg-coral-dark text-white font-semibold text-sm shadow-md hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Watch Sample Demo</span>
                <PlayCircle className="w-4 h-4" />
              </button>
              <button
                id="home-create-story-cta"
                onClick={() => onNavigate('/pricing')}
                className="px-6 py-3.5 rounded-full bg-maroon-light hover:bg-maroon text-cream border border-cream/20 text-sm font-medium transition-all cursor-pointer"
              >
                <span>Create a Story Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
