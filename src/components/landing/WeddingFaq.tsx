import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WEDDING_PLAN_PRICE_FORMATTED } from '../../constants.js';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'pricing',
    question: 'How much does a digital wedding invitation cost?',
    answer: `We offer a Free Tier that lets you customize and download a beautiful static digital invitation card. Our Premium Tier (${WEDDING_PLAN_PRICE_FORMATTED}) unlocks the full multi-scene interactive website experience, custom Spotify/Apple Music/SoundCloud background audio, photo gallery (up to 10 photos), gift registry link, multi-event schedules, and real-time RSVP management from your couple dashboard.`,
  },
  {
    id: 'guest-access',
    question: 'Can guests view our invitation or RSVP without an account?',
    answer: 'Yes! Guests can access your personalized wedding link on any mobile or desktop browser and submit RSVPs instantly without creating an account or downloading an app.',
  },
  {
    id: 'photo-cap',
    question: 'How many photos can we upload to our wedding gallery?',
    answer: 'Premium invitations support up to 10 high-resolution photos in your gallery, plus a main cover photo for your invitation card. You can easily manage or replace photos anytime from your dashboard.',
  },
  {
    id: 'registry',
    question: 'Can we add our gift registry or cash contribution link?',
    answer: 'Yes. You can paste your direct online gift registry URL (e.g., Amazon, Target, or custom gift link) along with gift instructions for your guests to view inside your invitation.',
  },
  {
    id: 'setup-time',
    question: 'How long does it take to create a digital wedding invitation?',
    answer: 'It takes less than 5 minutes! Simply fill in your names and event details, choose a theme and background music, upload your photos, and your personalized shareable web link is ready immediately.',
  },
  {
    id: 'calendar-download',
    question: 'Can guests save the event to their calendar or download the card?',
    answer: 'Yes! Guests can clock-in event dates directly into Google Calendar or Apple iCal with a single tap, and download high-resolution invitation cards to save on their devices.',
  },
];

export const WeddingFaq: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('pricing'); // Default open first FAQ item

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-20 px-4 sm:px-6 bg-[#FFFEFE] border-t border-cream-border/60">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-mauve text-base max-w-xl mx-auto leading-relaxed">
            Everything you need to know about creating and sharing your digital wedding invitations with Weddings by Amorah.
          </p>
        </div>

        {/* Interactive Accordion List */}
        <div className="space-y-4">
          {FAQ_DATA.map((item) => {
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
