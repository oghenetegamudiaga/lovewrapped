import React from 'react';
import { Instagram, Mail, MessageSquare } from 'lucide-react';

export const CommunitySection: React.FC = () => {
  return (
    <section id="community" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFEFE] border-b border-cream-border/60 scroll-mt-12">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left Copy Column */}
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon mb-6 tracking-tight leading-tight">
            Join Our Thriving Community
          </h2>

          <p className="text-mauve text-base sm:text-lg leading-relaxed font-normal mb-8">
            You're not the only one turning ordinary days into something worth reopening. Come see what people are building, or reach us directly.
          </p>

          {/* Three Real Functional Link Pills */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <a
              id="community-instagram-link"
              href="https://instagram.com/getamorah"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-white hover:bg-cream-card text-maroon border border-cream-border font-semibold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer hover:border-coral"
            >
              <Instagram className="w-4 h-4 text-coral" />
              <span>Instagram</span>
            </a>

            <a
              id="community-email-link"
              href="mailto:hello@amorah.xyz"
              className="px-5 py-3 rounded-full bg-white hover:bg-cream-card text-maroon border border-cream-border font-semibold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer hover:border-coral"
            >
              <Mail className="w-4 h-4 text-coral" />
              <span>Email Us</span>
            </a>

            <a
              id="community-whatsapp-link"
              href="https://wa.me/2348000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-white hover:bg-cream-card text-maroon border border-cream-border font-semibold text-xs sm:text-sm shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer hover:border-coral"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right Image Column with Speech Bubble */}
        <div className="w-full lg:w-1/2 flex justify-center relative">
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-cream-card">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
              alt="Community Member Enjoying Story"
              className="w-full h-[360px] sm:h-[440px] object-cover object-center"
              loading="lazy"
            />

            {/* Floating Speech Bubble Accent */}
            <div className="absolute bottom-6 right-6 bg-coral text-white font-serif font-semibold text-sm px-5 py-2.5 rounded-2xl shadow-lg border border-white/20 backdrop-blur-xs animate-bounce-slow">
              <span>Amorah 💖</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
