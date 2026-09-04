import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { HOMEPAGE_FAQ_DATA } from '../../config/homepageFaq';

export const HomepageFaq: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('difference');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-20 px-4 sm:px-6 bg-[#FFFEFE] border-b border-cream-border/60">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase font-sans font-semibold tracking-widest text-coral mb-2 block">
            Got Questions?
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-mauve text-base max-w-xl mx-auto leading-relaxed">
            Everything you need to know about creating and sharing digital experiences with Amorah.
          </p>
        </div>

        {/* Interactive Accordion List */}
        <div className="space-y-4">
          {HOMEPAGE_FAQ_DATA.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-cream-border rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-cream-card/30 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base sm:text-lg font-bold text-maroon pr-2">
                    {item.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-cream-card flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-maroon text-cream' : 'text-maroon'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-mauve text-sm leading-relaxed border-t border-cream-border/40 font-normal">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
