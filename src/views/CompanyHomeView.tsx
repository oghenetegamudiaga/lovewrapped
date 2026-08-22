import React from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { ProductShowcase } from '../components/landing/ProductShowcase';
import { Testimonials } from '../components/landing/Testimonials';
import { HomepageFaq } from '../components/landing/HomepageFaq';
import { IphoneDeviceMockup } from '../components/landing/IphoneDeviceMockup';

interface CompanyHomeViewProps {
  onNavigate: (path: string) => void;
}

export const CompanyHomeView: React.FC<CompanyHomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-cream text-maroon font-sans selection:bg-coral selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-maroon leading-[1.12] mb-6 max-w-4xl">
          Turn Every Special Moment Into an<br />
          <em className="italic font-normal text-coral">Unforgettable Digital Experience.</em>
        </h1>

        <p className="text-lg sm:text-xl text-mauve max-w-2xl mb-10 font-normal leading-relaxed">
          Amorah creates interactive digital stories and scene-based invitations for life's most meaningful occasions — from anniversaries and romantic surprises to weddings.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
          <a
            href="#products"
            className="px-8 py-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-maroon/20 cursor-pointer"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-5 h-5 text-coral" />
          </a>

          <button
            id="company-hero-create-button"
            onClick={() => onNavigate('/pricing')}
            className="px-6 py-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon border border-cream-border font-medium text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Create Yours</span>
          </button>
        </div>
      </section>

      {/* Stacked Full-Width Product Showcase Sections */}
      <div id="products" className="scroll-mt-12">
        {/* 1. Amorah Moments Section (Copy Left, iPhone 17 Live Demo Mockup Right) */}
        <ProductShowcase
          eyebrow="PRODUCT LINE"
          title="Amorah Moments"
          description="Personalized interactive digital cards for anniversaries, birthdays, proposals, and romantic surprises. A few memories, a few honest words, one beautiful story they’ll want to replay."
          bullets={[
            'Interactive multi-slide storytelling with photos & music',
            'Voice message recordings & custom slide themes',
            'Instant shareable link with zero app downloads',
          ]}
          ctaText="Create Moments"
          ctaPath="/pricing"
          onNavigate={onNavigate}
          customPreview={
            <IphoneDeviceMockup
              demoUrl="/w/demo"
              coverPhotoUrl="https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1000&q=80"
              title="Amorah Moments"
            />
          }
          imagePosition="right"
          bgColor="bg-cream-card/60"
        />

        {/* 2. Weddings by Amorah Section (Image Left, Copy Right — Stacked below Moments) */}
        <ProductShowcase
          eyebrow="PRODUCT LINE"
          title="Weddings by Amorah"
          description="Cinematic digital wedding invitations, multi-event schedules, and real-time RSVP management. Designed to give your guests an unforgettable preview of your wedding day."
          bullets={[
            'Scene-based digital invitations with animated typography',
            'Real-time guest RSVP tracking & dietary preferences',
            'Traditional, White Wedding & Reception multi-event support',
          ]}
          ctaText="Create Wedding Invitation"
          ctaPath="/weddings/create"
          onNavigate={onNavigate}
          imageSrc="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80"
          imageAlt="Weddings by Amorah Digital Invitation Preview"
          imagePosition="left"
          bgColor="bg-cream"
        />
      </div>

      {/* 3. Customer Reviews Section */}
      <Testimonials />

      {/* 4. Homepage Accordion FAQ Section */}
      <HomepageFaq />

      {/* 5. Demo Teaser & Final CTA Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-maroon text-cream shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-coral/20 text-coral mx-auto flex items-center justify-center mb-2">
              <PlayCircle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-cream">
              See Amorah in Action
            </h2>
            <p className="text-cream/80 text-base max-w-lg mx-auto pb-4">
              Watch a sample story experience to see how easy it is to share meaningful memories.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                id="home-watch-demo-cta"
                onClick={() => onNavigate('/w/demo')}
                className="px-8 py-3.5 rounded-full bg-coral hover:bg-coral-dark text-white font-semibold text-sm shadow-md hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Watch Sample Demo</span>
                <PlayCircle className="w-4 h-4" />
              </button>
              <button
                id="home-create-story-cta"
                onClick={() => onNavigate('/pricing')}
                className="px-6 py-3.5 rounded-full bg-maroon-light hover:bg-maroon text-cream border border-cream/20 text-sm font-medium transition-all cursor-pointer"
              >
                <span>Create a Story Now</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
