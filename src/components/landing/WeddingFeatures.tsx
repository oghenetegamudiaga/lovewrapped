import React from 'react';

export interface FeatureItem {
  id: string;
  number: string;
  title: string;
  description: string;
}

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: 'rsvp',
    number: '01',
    title: 'Wedding RSVP',
    description: 'Collect guest RSVPs in real time with headcount, dietary preferences, and personal messages sent directly to your couple dashboard.',
  },
  {
    id: 'gallery',
    number: '02',
    title: 'The Gallery',
    description: 'Share your love story visually with a beautifully styled photo gallery, allowing couples to upload and present their favorite memories.',
  },
  {
    id: 'registry',
    number: '03',
    title: 'The Registry',
    description: 'Direct guests to your gift registry URL or provide gift contribution details seamlessly inside your digital invitation experience.',
  },
  {
    id: 'card',
    number: '04',
    title: 'Personalized Invitation Card',
    description: 'Download and share a custom-designed digital invitation card featuring elegant typography, bride & groom names, and event schedules.',
  },
  {
    id: 'calendar',
    number: '05',
    title: 'Google & Apple Calendar Integration',
    description: 'Enable guests to clock-in your event date and venue details directly to Google Calendar or Apple iCal with a single click.',
  },
  {
    id: 'experience',
    number: '06',
    title: 'A Beautiful Digital Experience',
    description: 'Deliver a multi-scene, music-enhanced interactive web story that runs smoothly on any smartphone, tablet, or desktop browser.',
  },
];

export const WeddingFeatures: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 bg-[#FFFEFE] border-y border-cream-border/60">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-sans font-semibold tracking-widest text-coral mb-2 block">
            Designed for Modern Couples
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon tracking-tight mb-4">
            Crafted for Your Special Day
          </h2>
          <p className="text-mauve text-base leading-relaxed">
            Everything you need to invite, excite, and seamlessly manage your wedding guests, thoughtfully designed without clutter.
          </p>
        </div>

        {/* Editorial Text-Led 6-Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {FEATURES_DATA.map((feature) => (
            <div
              key={feature.id}
              className="bg-white border border-cream-border/80 p-8 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-border/60">
                  <span className="font-serif text-sm font-semibold text-coral tracking-widest">
                    {feature.number}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-coral/40 group-hover:bg-coral transition-colors" />
                </div>
                <h3 className="font-serif text-xl font-bold text-maroon mb-3 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-mauve text-sm leading-relaxed font-normal">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
