import React from 'react';
import { ScrollReveal } from '../common/ScrollReveal';

export const CommunitySection: React.FC = () => {
  return (
    <section id="community" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFEFE] border-b border-cream-border/60 scroll-mt-12">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left Copy Column */}
        <ScrollReveal delay={0} className="w-full lg:w-1/2 flex flex-col items-start text-left">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon mb-6 tracking-tight leading-tight">
            Join Our Thriving Community
          </h2>

          <p className="text-mauve text-base sm:text-lg leading-relaxed font-normal mb-8">
            Share your love stories and see how they're received. Connect and grow with others who believe in celebrating the people they love.
          </p>

          {/* Single Primary "Join Community" CTA Button */}
          <div className="w-full sm:w-auto">
            <a
              id="community-join-whatsapp-button"
              href="https://chat.whatsapp.com/DCOZ3PaIa8p3YUlmDW8jSv?s=cl&p=a&mlu=4&ilr=4"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full bg-[#3A0D22] hover:bg-[#2B0818] text-[#FFFDF9] font-semibold text-base sm:text-lg shadow-md hover:scale-[1.03] active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer border border-transparent"
            >
              <span>Join Community</span>
            </a>
          </div>
        </ScrollReveal>

        {/* Right Image Column */}
        <ScrollReveal delay={120} className="w-full lg:w-1/2 flex justify-center relative">
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden border-4 border-white border-cream-border bg-cream-card">
            <img
              src="/images/community-member.png"
              alt="Community Member Enjoying Story"
              className="w-full h-auto max-h-[460px] object-cover object-center"
              loading="lazy"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

