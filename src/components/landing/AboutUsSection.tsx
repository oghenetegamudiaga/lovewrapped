import React from 'react';

export const AboutUsSection: React.FC = () => {
  return (
    <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFEFE] border-b border-cream-border/60">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left Copy Column */}
        <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon mb-6 tracking-tight leading-tight">
            Where Emotions Keep Replayed
          </h2>

          <p className="text-mauve text-base sm:text-lg leading-relaxed font-normal">
            We started Amorah because a text message never felt like enough. A photo gets buried in a camera roll. A card gets read once and set aside. We wanted something that stayed: a link people actually reopen, a moment they tap through more than once. That's what we build. Interactive stories for anniversaries and proposals, and real wedding invitations guests can RSVP to, browse, and keep. One idea, built two ways.
          </p>
        </div>

        {/* Right Photo Collage Column */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md aspect-square">
            {/* Main Center Photo */}
            <div className="absolute top-4 left-4 right-12 bottom-12 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-cream-card">
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
                alt="Couple Embracing"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Overlapping Top Right Photo */}
            <div className="absolute top-0 right-0 w-36 sm:w-44 h-36 sm:h-44 rounded-2xl overflow-hidden shadow-lg border-4 border-white transform rotate-3 bg-cream-card">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=80"
                alt="Wedding Moment"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Overlapping Bottom Left Photo */}
            <div className="absolute bottom-0 left-0 w-40 sm:w-48 h-40 sm:h-48 rounded-2xl overflow-hidden shadow-lg border-4 border-white transform -rotate-3 bg-cream-card">
              <img
                src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=500&q=80"
                alt="Holding Hands"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
