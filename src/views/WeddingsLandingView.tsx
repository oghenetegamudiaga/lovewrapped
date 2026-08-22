import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Calendar, CheckCircle2, ArrowRight, ShieldCheck, UserCheck, Layers, LogOut, User, Play, Smartphone } from 'lucide-react';
import { getCoupleMeApi, getCoupleMyWeddingsApi, logoutCoupleApi } from '../lib/api';
import { CoupleAccount } from '../types';
import { WeddingInvitationViewer } from '../components/WeddingInvitationViewer';
import { useSiteContent } from '../lib/useSiteContent';
import { WeddingFeatures } from '../components/landing/WeddingFeatures';
import { WeddingSteps } from '../components/landing/WeddingSteps';
import { WeddingFaq } from '../components/landing/WeddingFaq';

interface WeddingsLandingViewProps {
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
  onLogout?: () => void;
}

export const WeddingsLandingView: React.FC<WeddingsLandingViewProps> = ({ onNavigate, currentCouple, onLogout }) => {
  const [couple, setCouple] = useState<CoupleAccount | null>(currentCouple || null);
  const [weddingsCount, setWeddingsCount] = useState<number>(0);
  const [firstWeddingId, setFirstWeddingId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { content } = useSiteContent();
  const demoCoverPhotoUrl = content['weddings_demo_cover_photo_url'] || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsAuthLoading(true);
      try {
        const meRes = await getCoupleMeApi();
        if (meRes.authenticated && meRes.couple) {
          setCouple(meRes.couple);

          const mineRes = await getCoupleMyWeddingsApi().catch(() => ({ weddings: [] }));
          const list = mineRes.weddings || [];
          setWeddingsCount(list.length);
          if (list.length > 0) {
            setFirstWeddingId(list[0].id);
          }
        } else {
          setCouple(null);
        }
      } catch (err) {
        setCouple(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutCoupleApi();
      setCouple(null);
      if (onLogout) onLogout();
    } catch (err) {
      setCouple(null);
    }
  };

  const handleCreateYoursRedirect = () => {
    if (couple) {
      if (weddingsCount === 1 && firstWeddingId) {
        onNavigate(`/weddings/dashboard/${firstWeddingId}`);
      } else if (weddingsCount > 1) {
        onNavigate('/weddings/mine');
      } else {
        onNavigate('/weddings/create');
      }
    } else {
      onNavigate('/weddings/signup');
    }
  };

  const handleSeeSampleScroll = () => {
    const el = document.getElementById('phone-mockup-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream text-maroon font-sans selection:bg-coral selection:text-white">
      {/* Logged-In Welcome Banner */}
      {!isAuthLoading && couple && (
        <div className="bg-maroon text-cream py-3 px-4 shadow-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-coral fill-coral" />
              <span>Welcome back, <strong className="text-coral">{couple.full_name || couple.email}</strong>!</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateYoursRedirect}
                className="px-4 py-1.5 rounded-full bg-coral hover:bg-coral-dark text-white font-semibold text-xs shadow-xs cursor-pointer transition-all"
              >
                Go to Dashboard ({weddingsCount} {weddingsCount === 1 ? 'Wedding' : 'Weddings'})
              </button>
              <button
                onClick={() => onNavigate('/weddings/create')}
                className="px-4 py-1.5 rounded-full bg-cream-card/20 hover:bg-cream-card/30 text-cream font-semibold text-xs cursor-pointer transition-all"
              >
                Create Another Invitation
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-full hover:bg-cream-card/20 text-cream/80 hover:text-cream cursor-pointer transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-maroon leading-[1.12] mb-6 max-w-4xl">
          Digital Wedding Invitations<br />
          <em className="italic font-normal text-coral">as unforgettable as your love story.</em>
        </h1>

        <p className="text-lg sm:text-xl text-mauve max-w-2xl mb-8 font-normal leading-relaxed">
          Transform your special day into a captivating, scene-based digital experience. Collect RSVPs, share your schedule, and give your guests a memorable preview of your wedding day.
        </p>

        {/* Updated Hero CTAs */}
        <div className="flex flex-col items-center gap-4 mb-12 w-full sm:w-auto">
          <div className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
            {/* Primary CTA: Create Yours */}
            <button
              id="weddings-hero-create-yours-button"
              onClick={handleCreateYoursRedirect}
              className="px-8 py-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border border-maroon/20 cursor-pointer"
            >
              <span>Create Yours</span>
              <ArrowRight className="w-5 h-5 text-coral" />
            </button>

            {/* Secondary CTA: See a Sample */}
            <button
              id="weddings-hero-see-sample-button"
              onClick={handleSeeSampleScroll}
              className="px-7 py-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon border border-cream-border font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Play className="w-4 h-4 text-coral fill-coral" />
              <span>See a Sample</span>
            </button>
          </div>

          {/* De-emphasized Couple Sign In Text Link */}
          {!couple && (
            <p className="text-xs text-mauve font-medium">
              Already have an account?{' '}
              <button
                type="button"
                id="weddings-hero-login-link"
                onClick={() => onNavigate('/weddings/login')}
                className="font-semibold text-maroon hover:text-coral underline underline-offset-4 transition-colors cursor-pointer"
              >
                Couple Sign In
              </button>
            </p>
          )}
        </div>

        <p className="text-xs text-mauve/80 font-medium tracking-wide flex items-center gap-2 mb-12">
          <ShieldCheck className="w-4 h-4 text-coral inline" />
          <span>Private couple accounts • Instant setup • Built for Nigerian & Global Weddings</span>
        </p>

        {/* INTERACTIVE PHONE MOCKUP IN HERO */}
        <div id="phone-mockup-section" className="relative w-full max-w-sm sm:max-w-md mx-auto pt-4">
          <div className="relative mx-auto rounded-[48px] border-[10px] border-[#1F050C] bg-[#1F050C] shadow-2xl p-2 phone-card-shadow">
            {/* Phone Notch & Speaker Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#1F050C] rounded-b-2xl z-40 flex items-center justify-center">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Embedded Live Interactive Viewer Component */}
            <div className="relative rounded-[36px] overflow-hidden h-[680px] w-full">
              <WeddingInvitationViewer isSpike wedding={{ cover_photo_url: demoCoverPhotoUrl } as any} onNavigate={onNavigate} />
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold text-mauve uppercase tracking-widest bg-cream-card px-3 py-1 rounded-full border border-cream-border">
              <Smartphone className="w-3.5 h-3.5 text-coral" /> Interactive Live Preview — Tap wax seal to open
            </span>
          </div>
        </div>
      </section>

      {/* 1. Text-Led Editorial Features Section */}
      <WeddingFeatures />

      {/* 2. How It Works / Steps Section */}
      <WeddingSteps onActionClick={handleCreateYoursRedirect} />

      {/* 3. Interactive Accordion FAQ Section */}
      <WeddingFaq />

      {/* CTA Footer Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-maroon text-cream shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4 text-cream">
              Ready to create your wedding story?
            </h2>
            <p className="text-cream/80 text-base max-w-lg mx-auto mb-8">
              Sign up today to lock in early access to our full invitation suite and couple dashboard.
            </p>
            <button
              id="weddings-cta-signup-button"
              onClick={handleCreateYoursRedirect}
              className="px-8 py-4 rounded-full bg-coral hover:bg-coral-dark text-white font-semibold text-base shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>{couple ? 'Go to My Weddings' : 'Create Yours Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
