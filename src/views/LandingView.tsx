import React from 'react';
import { Heart, ArrowUpRight, Check, Mail } from 'lucide-react';
import { PAID_PLAN_PRICE_FORMATTED } from '../constants.js';
import { useSiteContent } from '../lib/useSiteContent.js';

interface LandingViewProps {
  onNavigate: (path: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  const { getContent } = useSiteContent();

  return (
    <div className="flex flex-col min-h-screen bg-cream text-maroon font-sans selection:bg-coral selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Copy Column */}
        <div className="lg:col-span-7 flex flex-col items-center text-center z-10">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-maroon leading-[1.12] mb-6">
            {getContent('hero_title_prefix', 'Turn your love into')}<br />
            <em className="italic font-normal text-coral">
              {getContent('hero_title_highlight', 'an experience.')}
            </em>
          </h1>

          <p className="text-lg sm:text-xl text-mauve max-w-xl mb-8 font-normal leading-relaxed">
            {getContent('hero_subtitle', 'A few memories. A few honest words. One beautiful story they’ll want to replay.')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-6 w-full sm:w-auto">
            <button
              id="hero-create-yours-button"
              onClick={() => onNavigate('/pricing')}
              className="px-8 py-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-base shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-maroon/20"
            >
              <span>{getContent('hero_cta_create', 'Create yours')}</span>
              <ArrowUpRight className="w-5 h-5 text-coral" />
            </button>

            <button
              id="hero-watch-demo-button"
              onClick={() => onNavigate('/w/demo')}
              className="px-6 py-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon border border-cream-border font-medium text-base transition-all flex items-center justify-center gap-2"
            >
              <span>{getContent('hero_cta_view_demo', 'Watch the demo')}</span>
            </button>
          </div>

          <p className="text-xs text-mauve/80 font-medium tracking-wide">
            {getContent('hero_tagline', 'No app. No account. Just something unforgettable.')}
          </p>
        </div>

        {/* Right Phone Visual Column */}
        <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
          <div className="glow-one" />
          <div className="glow-two" />

          {/* Interactive Phone Card - Keeps dark maroon theme for story preview mockup */}
          <div
            onClick={() => onNavigate('/w/demo')}
            className="relative w-full max-w-[320px] aspect-[9/16] rounded-[38px] bg-gradient-to-b from-[#4a102b] via-[#3a0d22] to-[#250614] p-6 border border-coral/40 phone-card-shadow flex flex-col justify-between cursor-pointer group hover:border-coral transition-all transform hover:-translate-y-1"
          >
            {/* Top status bar dots */}
            <div className="flex items-center justify-center gap-1.5 opacity-60 mb-4">
              <i className="w-2 h-2 rounded-full bg-rose-200" />
              <i className="w-2 h-2 rounded-full bg-rose-200" />
              <i className="w-2 h-2 rounded-full bg-rose-200" />
              <i className="w-2 h-2 rounded-full bg-rose-200" />
              <i className="w-2 h-2 rounded-full bg-rose-200/30" />
              <i className="w-2 h-2 rounded-full bg-rose-200/30" />
              <i className="w-2 h-2 rounded-full bg-rose-200/30" />
            </div>

            {/* Inner Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
              <p className="text-xs uppercase font-medium tracking-widest text-rose-300/80 mb-2">
                a little something for
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                Amara <span className="text-rose-400 font-normal">♡</span>
              </h2>

              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 text-xl my-4 group-hover:scale-110 group-hover:bg-rose-500/30 transition-all">
                ✦
              </div>

              <p className="text-sm font-medium text-rose-200/90 max-w-[200px] leading-snug">
                Tap to open your story
              </p>
            </div>

            {/* Bottom Tap Prompt */}
            <div className="pt-4 border-t border-rose-900/40 flex items-center justify-between text-xs text-rose-300/70 font-medium">
              <span>tap anywhere</span>
              <b className="text-rose-300 group-hover:translate-x-1 transition-transform">→</b>
            </div>
          </div>

          {/* Floating Pills */}
          <div className="absolute top-12 -left-4 sm:-left-8 glass-card px-4 py-2 rounded-full text-xs font-semibold text-maroon shadow-md border border-cream-border flex items-center gap-1.5 animate-bounce-slow">
            <span>made with love</span>
            <Heart className="w-3.5 h-3.5 text-coral fill-coral" />
          </div>

          <div className="absolute bottom-16 -right-4 sm:-right-8 glass-card px-4 py-2 rounded-full text-xs font-semibold text-maroon shadow-md border border-cream-border">
            your story, your way
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-cream-card border-y border-cream-border" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon tracking-tight mb-4">
              Something meaningful,<br />
              <em className="italic font-normal text-coral">in three little steps.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 01 */}
            <article className="glass-card p-8 rounded-3xl glass-card-hover flex flex-col justify-between">
              <div>
                <b className="block text-2xl font-serif font-bold text-coral mb-4 opacity-90">01</b>
                <h3 className="font-serif font-bold text-xl text-maroon mb-3">Tell us about your special one</h3>
                <p className="text-sm text-mauve leading-relaxed font-normal">
                  Share a memory, your favourite things about them, and what you want to say.
                </p>
              </div>
            </article>

            {/* Step 02 */}
            <article className="glass-card p-8 rounded-3xl glass-card-hover flex flex-col justify-between">
              <div>
                <b className="block text-2xl font-serif font-bold text-coral mb-4 opacity-90">02</b>
                <h3 className="font-serif font-bold text-xl text-maroon mb-3">Make it yours</h3>
                <p className="text-sm text-mauve leading-relaxed font-normal">
                  We shape your words into a beautiful story, ready for your personal touch.
                </p>
              </div>
            </article>

            {/* Step 03 */}
            <article className="glass-card p-8 rounded-3xl glass-card-hover flex flex-col justify-between">
              <div>
                <b className="block text-2xl font-serif font-bold text-coral mb-4 opacity-90">03</b>
                <h3 className="font-serif font-bold text-xl text-maroon mb-3">Send the feeling</h3>
                <p className="text-sm text-mauve leading-relaxed font-normal">
                  Get a private link they can open anywhere, anytime. No downloads needed.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Available Plans Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon tracking-tight mb-4">
            Pick the right tier<br />
            <em className="italic font-normal text-coral">for your moment.</em>
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card p-8 rounded-3xl text-left flex flex-col justify-between relative border border-cream-border">
            <div>
              <b className="block text-xs font-semibold uppercase tracking-wider text-dustyRose mb-2">Free Plan</b>
              <strong className="block text-4xl font-serif font-bold text-maroon mb-3">₦0</strong>
              <span className="block text-lg font-medium text-maroon mb-2">Essential Digital Story</span>
              <ul className="text-xs text-mauve space-y-2 mb-8 font-normal">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Up to 5 animated text slides</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Romantic typography & theme</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Instant shareable web link</span>
                </li>
              </ul>
            </div>
            <button
              id="landing-free-plan-cta"
              onClick={() => onNavigate('/create?plan=free')}
              className="w-full py-3.5 px-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon font-semibold text-xs border border-cream-border transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowUpRight className="w-4 h-4 text-coral" />
            </button>
          </div>

          {/* Paid Premium Tier */}
          <div className="p-8 rounded-3xl bg-cream-card text-left flex flex-col justify-between relative border-2 border-coral shadow-md">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-coral text-cream text-[10px] font-bold uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Heart className="w-3 h-3 fill-cream text-cream" />
              <span>Most Loved</span>
            </div>

            <div>
              <b className="block text-xs font-semibold uppercase tracking-wider text-dustyRose mb-2 pt-1">Premium Story</b>
              <strong className="block text-4xl font-serif font-bold text-maroon mb-3">{PAID_PLAN_PRICE_FORMATTED}</strong>
              <span className="block text-lg font-medium text-maroon mb-2">Message + Photo Memories</span>
              <ul className="text-xs text-mauve space-y-2 mb-8 font-normal">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Up to 12 animated slides</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Upload up to 5 photo memories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Ambient romantic background music</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Voice message recording (up to 45s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>Interactive heart reactions & analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-coral shrink-0" />
                  <span>No Amorah watermark</span>
                </li>
              </ul>
            </div>
            <button
              id="landing-paid-plan-cta"
              onClick={() => onNavigate('/create?plan=paid')}
              className="w-full py-3.5 px-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Create Paid Story ({PAID_PLAN_PRICE_FORMATTED})</span>
              <ArrowUpRight className="w-4 h-4 text-coral" />
            </button>
          </div>

          {/* Custom Tier */}
          <div className="glass-card p-8 rounded-3xl text-left flex flex-col justify-between relative border border-cream-border">
            <div>
              <b className="block text-xs font-semibold uppercase tracking-wider text-dustyRose mb-2">Custom Request</b>
              <strong className="block text-3xl font-serif font-bold text-maroon mb-3">Let’s talk</strong>
              <span className="block text-lg font-medium text-maroon mb-2">Bespoke Experience</span>
              <p className="text-xs text-mauve leading-relaxed mb-8">
                Need extra slides, custom audio tracks, or special interactive features for weddings or proposals? Reach out directly.
              </p>
            </div>
            <a
              id="landing-custom-plan-cta"
              href="mailto:hello@amorah.xyz?subject=Customized%20Amorah%20request"
              className="w-full py-3.5 px-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon font-semibold text-xs border border-cream-border transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-coral" />
              <span>Contact Us</span>
              <ArrowUpRight className="w-4 h-4 text-coral" />
            </a>
          </div>
        </div>
      </section>

      {/* Closing CTA Section */}
      <section className="py-24 px-4 sm:px-6 bg-cream-card text-center border-t border-cream-border">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-maroon font-bold mb-8 tracking-tight">
            Some feelings deserve more than a text.
          </p>

          <button
            id="closing-create-story-button"
            onClick={() => onNavigate('/pricing')}
            className="px-9 py-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <span>Create your story</span>
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-coral" />
          </button>
        </div>
      </section>
    </div>
  );
};
