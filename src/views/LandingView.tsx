import React from 'react';
import { Heart, ArrowUpRight, Check, Mail } from 'lucide-react';

interface LandingViewProps {
  onNavigate: (path: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#2b0818] text-[#fce7f3] font-sans selection:bg-rose-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Copy Column */}
        <div className="lg:col-span-7 flex flex-col items-start z-10">
          <div className="eyebrow-pill mb-6">
            <span />
            Made for your favourite person
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.12] mb-6">
            Turn your love into<br />
            <em className="italic font-normal text-rose-300">an experience.</em>
          </h1>

          <p className="text-lg sm:text-xl text-rose-100/80 max-w-xl mb-8 font-normal leading-relaxed">
            A few memories. A few honest words. One beautiful story she’ll want to replay.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-6 w-full sm:w-auto">
            <button
              id="hero-create-yours-button"
              onClick={() => onNavigate('/pricing')}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-base shadow-xl shadow-rose-950/80 hover:shadow-rose-900/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-400/20"
            >
              <span>Create yours</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>

            <button
              id="hero-watch-demo-button"
              onClick={() => onNavigate('/w/demo')}
              className="px-6 py-4 rounded-full bg-rose-950/60 hover:bg-rose-900/50 text-rose-100 border border-rose-800/60 font-medium text-base transition-all flex items-center justify-center gap-2 hover:border-rose-600/50"
            >
              <span>Watch the demo</span>
            </button>
          </div>

          <p className="text-xs text-rose-300/60 font-medium tracking-wide">
            No app. No account. Just something unforgettable.
          </p>
        </div>

        {/* Right Phone Visual Column */}
        <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
          <div className="glow-one" />
          <div className="glow-two" />

          {/* Interactive Phone Card */}
          <div
            onClick={() => onNavigate('/w/demo')}
            className="relative w-full max-w-[320px] aspect-[9/16] rounded-[38px] bg-gradient-to-b from-[#4a102b] via-[#3a0d22] to-[#250614] p-6 border border-rose-500/30 phone-card-shadow flex flex-col justify-between cursor-pointer group hover:border-rose-400/60 transition-all transform hover:-translate-y-1"
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
          <div className="absolute top-12 -left-4 sm:-left-8 glass-card px-4 py-2 rounded-full text-xs font-semibold text-rose-200 shadow-xl border border-rose-500/30 flex items-center gap-1.5 animate-bounce-slow">
            <span>made with love</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </div>

          <div className="absolute bottom-16 -right-4 sm:-right-8 glass-card px-4 py-2 rounded-full text-xs font-semibold text-rose-200 shadow-xl border border-rose-500/30">
            your story, your way
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-[#250614] border-y border-rose-950" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="eyebrow-pill mb-3 justify-center">
              <span />
              Simple, really
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Something meaningful,<br />
              <em className="italic font-normal text-rose-300">in three little steps.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 01 */}
            <article className="glass-card p-8 rounded-3xl glass-card-hover flex flex-col justify-between">
              <div>
                <b className="block text-2xl font-serif font-bold text-rose-400 mb-4 opacity-90">01</b>
                <h3 className="font-serif font-bold text-xl text-white mb-3">Tell us about her</h3>
                <p className="text-sm text-rose-200/80 leading-relaxed font-normal">
                  Share a memory, your favourite things about her, and what you want to say.
                </p>
              </div>
            </article>

            {/* Step 02 */}
            <article className="glass-card p-8 rounded-3xl glass-card-hover flex flex-col justify-between">
              <div>
                <b className="block text-2xl font-serif font-bold text-rose-400 mb-4 opacity-90">02</b>
                <h3 className="font-serif font-bold text-xl text-white mb-3">Make it yours</h3>
                <p className="text-sm text-rose-200/80 leading-relaxed font-normal">
                  We shape your words into a beautiful story—ready for your personal touch.
                </p>
              </div>
            </article>

            {/* Step 03 */}
            <article className="glass-card p-8 rounded-3xl glass-card-hover flex flex-col justify-between">
              <div>
                <b className="block text-2xl font-serif font-bold text-rose-400 mb-4 opacity-90">03</b>
                <h3 className="font-serif font-bold text-xl text-white mb-3">Send the feeling</h3>
                <p className="text-sm text-rose-200/80 leading-relaxed font-normal">
                  Get a private link she can open anywhere, anytime. No downloads needed.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Available Plans Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="eyebrow-pill mb-3 justify-center">
            <span />
            Available Plans
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Pick the right tier<br />
            <em className="italic font-normal text-rose-300">for your moment.</em>
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="glass-card p-8 rounded-3xl text-left flex flex-col justify-between relative border border-rose-500/20">
            <div>
              <b className="block text-xs font-semibold uppercase tracking-wider text-rose-300/80 mb-2">Free Plan</b>
              <strong className="block text-4xl font-serif font-bold text-white mb-3">₦0</strong>
              <span className="block text-lg font-medium text-rose-100 mb-2">Essential Digital Story</span>
              <ul className="text-xs text-rose-200/70 space-y-2 mb-8 font-normal">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Up to 5 animated text slides</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Romantic typography & theme</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Instant shareable web link</span>
                </li>
              </ul>
            </div>
            <button
              id="landing-free-plan-cta"
              onClick={() => onNavigate('/create?plan=free')}
              className="w-full py-3.5 px-4 rounded-full bg-rose-950/80 hover:bg-rose-900/60 text-rose-100 font-semibold text-xs border border-rose-800/60 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Paid Premium Tier */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#4a102b] via-[#3a0d22] to-[#250614] text-left flex flex-col justify-between relative border-2 border-rose-500 shadow-xl shadow-rose-950/80">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Heart className="w-3 h-3 fill-white" />
              <span>Most Loved</span>
            </div>

            <div>
              <b className="block text-xs font-semibold uppercase tracking-wider text-rose-300 mb-2 pt-1">Premium Story</b>
              <strong className="block text-4xl font-serif font-bold text-white mb-3">₦3,000</strong>
              <span className="block text-lg font-medium text-rose-100 mb-2">Message + Photo Memories</span>
              <ul className="text-xs text-rose-200/90 space-y-2 mb-8 font-normal">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Up to 12 animated slides</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Upload up to 5 photo memories</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Ambient romantic background music</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Interactive heart reactions & analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>No LoveWrapped watermark</span>
                </li>
              </ul>
            </div>
            <button
              id="landing-paid-plan-cta"
              onClick={() => onNavigate('/create?plan=paid')}
              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 text-white font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Create Paid Story (₦3,000)</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Custom Tier */}
          <div className="glass-card p-8 rounded-3xl text-left flex flex-col justify-between relative border border-rose-500/20">
            <div>
              <b className="block text-xs font-semibold uppercase tracking-wider text-rose-300/80 mb-2">Custom Request</b>
              <strong className="block text-3xl font-serif font-bold text-white mb-3">Let’s talk</strong>
              <span className="block text-lg font-medium text-rose-100 mb-2">Bespoke Experience</span>
              <p className="text-xs text-rose-300/60 leading-relaxed mb-8">
                Need extra slides, custom audio tracks, or special interactive features for weddings or proposals? Reach out directly.
              </p>
            </div>
            <a
              id="landing-custom-plan-cta"
              href="mailto:hello@lovewrapped.app?subject=Customized%20LoveWrapped%20request"
              className="w-full py-3.5 px-4 rounded-full bg-rose-950/80 hover:bg-rose-900/60 text-rose-100 font-semibold text-xs border border-rose-800/60 transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Us</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Closing CTA Section */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-[#2b0818] via-[#3a0d22] to-[#250614] text-center border-t border-rose-950">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <p className="font-serif text-2xl sm:text-3xl md:text-4xl text-rose-100 font-bold mb-8 tracking-tight">
            Some feelings deserve more than a text.
          </p>

          <button
            id="closing-create-story-button"
            onClick={() => onNavigate('/pricing')}
            className="px-9 py-4 rounded-full bg-rose-100 hover:bg-white text-rose-950 font-bold text-base shadow-xl hover:shadow-rose-300/30 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Create your story</span>
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
};


