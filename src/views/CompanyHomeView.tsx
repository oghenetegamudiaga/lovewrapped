import React from 'react';
import { HeroCarousel } from '../components/landing/HeroCarousel';
import { AboutUsSection } from '../components/landing/AboutUsSection';
import { ProductCardsSection } from '../components/landing/ProductCardsSection';
import { CommunitySection } from '../components/landing/CommunitySection';
import { Testimonials } from '../components/landing/Testimonials';
import { HomepageFaq } from '../components/landing/HomepageFaq';
import { FinalCtaSection } from '../components/landing/FinalCtaSection';

interface CompanyHomeViewProps {
  onNavigate: (path: string) => void;
}

export const CompanyHomeView: React.FC<CompanyHomeViewProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFEFE] text-maroon font-sans selection:bg-coral selection:text-white">
      {/* 1. Two-Slide Hero Carousel */}
      <HeroCarousel onNavigate={onNavigate} />

      {/* 2. About Us Brand Story Section */}
      <AboutUsSection />

      {/* 3. Explore Our Products (Exactly 2 Cards: Moments & Weddings by Amorah) */}
      <ProductCardsSection onNavigate={onNavigate} />

      {/* 4. Our Community Section */}
      <CommunitySection />

      {/* 5. Loved by Couples Worldwide (Testimonials) */}
      <Testimonials />

      {/* 6. Frequently Asked Questions (Accordion) */}
      <div id="faq" className="scroll-mt-12">
        <HomepageFaq />
      </div>

      {/* 7. Final Self-Serve Offer CTA Section */}
      <FinalCtaSection onNavigate={onNavigate} />
    </div>
  );
};
