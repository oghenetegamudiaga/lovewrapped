import React, { useState } from 'react';
import { Heart, Edit3, CheckCircle2, ArrowUpRight, RefreshCw, Sparkles } from 'lucide-react';
import { Experience } from '../types';
import { StoryViewer } from '../components/StoryViewer';
import { initializePaymentApi } from '../lib/api';

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

  const handleConfirmAction = async () => {
    setIsLoading(true);

    if (experience.tier === 'free') {
      onShareFree(experience);
    } else {
      try {
        const res = await initializePaymentApi(
          experience.id,
          'creator@lovewrapped.app'
        );
        onProceedToPayment(res.authorization_url, res.reference, experience.id);
      } catch (err) {
        console.error('Payment initialization failed:', err);
        alert('Failed to initialize payment. Please try again.');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#2b0818] text-[#fce7f3] py-12 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Step Indicator Header */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="eyebrow-pill mb-2 justify-center">
            <span />
            Preview Your Story
          </div>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-white">
            Story Preview for {experience.receiver_name}
          </h1>
          <p className="text-rose-200/80 text-xs sm:text-sm mt-2">
            Tap the story cards below to test transitions before sharing with {experience.receiver_name}.
          </p>
        </div>

        {/* Embedded Interactive Story Player */}
        <div className="my-6">
          <StoryViewer experience={experience} isPreview={true} />
        </div>

        {/* Action Controls Footer Bar */}
        <div className="max-w-md mx-auto glass-card p-6 rounded-3xl border border-rose-500/20 shadow-xl flex flex-col gap-3">
          <button
            id="preview-confirm-button"
            onClick={handleConfirmAction}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-semibold text-base shadow-xl shadow-rose-950/80 transition-all flex items-center justify-center gap-2 border border-rose-400/20"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : experience.tier === 'free' ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Get Shareable Link (Free)</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white" />
                <span>Complete Story & Pay ₦3,000</span>
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            id="preview-edit-button"
            onClick={onEditStory}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-full bg-rose-950/60 hover:bg-rose-900/50 text-rose-200 font-medium text-sm border border-rose-800/60 transition-colors flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-rose-300" />
            <span>Edit Messages & Photos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

