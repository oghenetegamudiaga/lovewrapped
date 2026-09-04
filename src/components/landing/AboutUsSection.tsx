import React from 'react';
import { ScrollReveal } from '../common/ScrollReveal';

export const AboutUsSection: React.FC = () => {
  return (
    <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFEFE] border-b border-cream-border/60">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left Copy Column */}
        <ScrollReveal delay={0} className="w-full lg:w-1/2 flex flex-col items-start text-left">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon mb-6 tracking-tight leading-tight">
            Where Emotions Keep Replayed
          </h2>

          <p className="text-mauve text-base sm:text-lg leading-relaxed font-normal">
            We started Amorah because a text message never felt like enough. A photo gets buried in a camera roll. A card gets read once and set aside. We wanted something that stayed: a link people actually reopen, a moment they tap through more than once. That's what we build. Interactive stories for anniversaries and proposals, and real wedding invitations guests can RSVP to, browse, and keep. One idea, built two ways.
          </p>
        </ScrollReveal>

        {/* Right Photo Collage Column */}
        <ScrollReveal delay={120} className="w-full lg:w-1/2 flex justify-center">
          <img
            src="/images/about-us-collage.png"
            alt="Amorah Stories Photo Collage"
            className="w-full max-w-lg h-auto object-contain drop-shadow-md"
            loading="lazy"
          />
        </ScrollReveal>
      </div>
    </section>
  );
};
