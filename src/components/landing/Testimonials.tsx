import React from 'react';
import { TESTIMONIALS_DATA } from '../../config/testimonials';

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 bg-cream-card/40 border-b border-cream-border/60">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-sans font-semibold tracking-widest text-coral mb-2 block">
            Love from Couples & Creators
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-maroon tracking-tight mb-4">
            Loved by Couples Worldwide
          </h2>
          <p className="text-mauve text-base leading-relaxed">
            See how Amorah turns special moments into unforgettable digital memories.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS_DATA.map((item) => (
            <div
              key={item.id}
              className="bg-cream border border-cream-border p-6 rounded-3xl shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Clean Star Rating Display */}
                <div className="flex items-center gap-1 mb-4 text-amber-500 text-xs">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>

                <p className="text-mauve text-xs sm:text-sm leading-relaxed mb-6 font-normal italic">
                  “{item.quote}”
                </p>
              </div>

              <div className="pt-4 border-t border-cream-border/60">
                <p className="font-serif text-sm font-bold text-maroon">
                  {item.authorName}
                </p>
                <p className="text-mauve/80 text-xs font-sans mt-0.5">
                  {item.authorContext}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
