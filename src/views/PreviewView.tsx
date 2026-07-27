import React, { useState } from 'react';
import { Heart, Edit3, CheckCircle2, ArrowUpRight, RefreshCw, Sparkles } from 'lucide-react';
import { Experience } from '../types';
import { StoryViewer } from '../components/StoryViewer';
import { initializePaymentApi } from '../lib/api';
import { PAID_PLAN_PRICE_FORMATTED } from '../constants.js';

interface PreviewViewProps {
  experience: Experience;
  onEditStory: () => void;
  onShareFree: (experience: Experience) => void;
  onProceedToPayment: (authUrl: string, reference: string, expId: string) => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  experience,
  onEditStory,
  onShareFree,
  onProceedToPayment,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(experience.creator_email || '');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleConfirmAction = async () => {
    setEmailError(null);
    setIsLoading(true);

    if (experience.tier === 'free') {
      onShareFree(experience);
    } else {
      const targetEmail = (email || experience.creator_email || '').trim();
      if (!targetEmail || !targetEmail.includes('@')) {
        setEmailError('Please enter a valid email address to receive payment confirmation & story link.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await initializePaymentApi(experience.id, targetEmail);
        if (res.authorization_url) {
          onProceedToPayment(res.authorization_url, res.reference, experience.id);
          // Redirect browser directly to Paystack's real hosted checkout page
          window.location.href = res.authorization_url;
        } else {
          throw new Error('No authorization URL returned from Paystack.');
        }
      } catch (err: unknown) {
        console.error('Payment initialization failed:', err);
        const msg = err instanceof Error ? err.message : 'Failed to initialize Paystack payment. Please try again.';
        alert(msg);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream text-maroon py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator Header */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="eyebrow-pill mb-2 justify-center">
            <span />
            Preview Your Story
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-maroon">
            Story Preview for {experience.receiver_name}
          </h1>
          <p className="text-mauve text-xs sm:text-sm mt-2">
            Tap the story cards below to test transitions before sharing with {experience.receiver_name}.
          </p>
        </div>

        {/* Embedded Interactive Story Player - Keeps dark maroon theme internally */}
        <div className="my-6">
          <StoryViewer experience={experience} isPreview={true} />
        </div>

        {/* Action Controls Footer Bar */}
        <div className="max-w-md mx-auto glass-card p-6 rounded-3xl border border-cream-border shadow-md flex flex-col gap-3">
          {experience.tier !== 'free' && !experience.creator_email && (
            <div className="text-left mb-2">
              <label className="block text-xs font-medium text-mauve mb-1">
                Your Email (for receipt & experience management):
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60"
              />
              {emailError && (
                <p className="text-[11px] text-coral mt-1 font-medium">{emailError}</p>
              )}
            </div>
          )}

          <button
            id="preview-confirm-button"
            onClick={handleConfirmAction}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-base shadow-md transition-all flex items-center justify-center gap-2 border border-maroon/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Redirecting to Paystack...</span>
              </>
            ) : experience.tier === 'free' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-coral" />
                <span>Get Shareable Link (Free)</span>
                <ArrowUpRight className="w-4 h-4 text-coral" />
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 fill-cream text-cream" />
                <span>Complete Story & Pay {PAID_PLAN_PRICE_FORMATTED}</span>
                <ArrowUpRight className="w-4 h-4 text-coral" />
              </>
            )}
          </button>

          <button
            id="preview-edit-button"
            onClick={onEditStory}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon font-medium text-sm border border-cream-border transition-colors flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-coral" />
            <span>Edit Messages & Photos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
