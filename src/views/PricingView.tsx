import React from 'react';
import { Sparkles, ArrowUpRight, Check, Heart, Mail } from 'lucide-react';
import { PlanTier } from '../types';

interface PricingViewProps {
  onSelectPlan: (plan: PlanTier) => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onSelectPlan }) => {
  return (
    <div className="min-h-[85vh] bg-[#2b0818] text-[#fce7f3] py-16 px-4 sm:px-6 flex flex-col justify-center">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="eyebrow-pill mb-3 justify-center">
            <span />
            First, choose your experience
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            How do you want<br />
            <em className="italic font-normal text-rose-300">to tell your story?</em>
          </h1>
          <p className="text-rose-200/80 text-base leading-relaxed">
            Start with the option that feels right. You can see exactly what is included before creating anything.
          </p>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-4xl mx-auto">
          {/* Free Tier */}
          <button
            id="tier-free-button"
            onClick={() => onSelectPlan('free')}
            className="glass-card p-8 rounded-3xl glass-card-hover text-left flex flex-col justify-between group relative border border-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
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
            <div className="pt-4 border-t border-rose-900/40 flex items-center justify-between text-xs font-semibold text-rose-300 group-hover:text-white">
              <span>Get Started Free</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* Paid Tier (Most Loved) */}
          <button
            id="tier-paid-button"
            onClick={() => onSelectPlan('paid')}
            className="p-8 rounded-3xl bg-gradient-to-b from-[#4a102b] via-[#3a0d22] to-[#250614] text-left flex flex-col justify-between group relative border-2 border-rose-500 shadow-xl shadow-rose-950/80 transform hover:-translate-y-1 transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
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
            <div className="pt-4 border-t border-rose-900/40 flex items-center justify-between text-xs font-bold text-rose-300 group-hover:text-white">
              <span>Create Paid Experience</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </button>

          {/* Custom Tier */}
          <a
            id="tier-custom-button"
            href="mailto:hello@lovewrapped.app?subject=Customized%20LoveWrapped%20request"
            className="glass-card p-8 rounded-3xl glass-card-hover text-left flex flex-col justify-between group relative border border-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <div>
              <b className="block text-xs font-semibold uppercase tracking-wider text-rose-300/80 mb-2">Custom Request</b>
              <strong className="block text-3xl font-serif font-bold text-white mb-3">Let’s talk</strong>
              <span className="block text-lg font-medium text-rose-100 mb-2">Bespoke Experience</span>
              <p className="text-xs text-rose-300/60 leading-relaxed mb-8">
                Need extra slides, custom audio tracks, or special interactive features for weddings or proposals? Reach out directly.
              </p>
            </div>
            <div className="pt-4 border-t border-rose-900/40 flex items-center justify-between text-xs font-semibold text-rose-300 group-hover:text-white">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                <span>Contact Us</span>
              </span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

