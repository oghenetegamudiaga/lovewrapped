import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Copy, Share2, Check, RefreshCw, ExternalLink, Heart, ShieldCheck, AlertCircle } from 'lucide-react';
import { Experience } from '../types';
import { verifyPaymentApi } from '../lib/api';
import { PAID_PLAN_PRICE_FORMATTED, DEFAULT_PAYMENT_REF } from '../constants.js';

interface PayViewProps {
  reference: string;
  experienceId: string;
  onViewExperience: (slug: string) => void;
}

export const PayView: React.FC<PayViewProps> = ({
  reference: propReference,
  experienceId: propExperienceId,
  onViewExperience,
}) => {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract reference and experience ID from URL query parameters (redirect callback)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const effectiveRef = searchParams.get('reference') || searchParams.get('trxref') || propReference;
  const effectiveExpId = searchParams.get('expId') || propExperienceId;

  const verifyPayment = async () => {
    setIsVerifying(true);
    setErrorMsg(null);

    try {
      if (!effectiveRef || effectiveRef === DEFAULT_PAYMENT_REF) {
        throw new Error('No transaction reference found in payment callback URL.');
      }

      const res = await verifyPaymentApi(effectiveRef, effectiveExpId);
      if (res.success && res.experience) {
        setExperience(res.experience);
        setIsPaidSuccess(true);

        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#df6d73', '#b15260', '#3a0d22', '#6f4658'],
        });
      } else {
        throw new Error('Payment verification was not successful.');
      }
    } catch (err: unknown) {
      console.error('Payment verification failed:', err);
      const msg = err instanceof Error ? err.message : 'Payment verification failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [effectiveRef, effectiveExpId]);

  const getShareableUrl = () => {
    if (!experience) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/w/${experience.slug}`;
  };

  const handleCopyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = getShareableUrl();
    const text = encodeURIComponent(
      `💖 I created a special Amorah story card for ${experience?.receiver_name || 'you'}! Tap here to view: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const amountText = PAID_PLAN_PRICE_FORMATTED;

  return (
    <div className="min-h-[85vh] bg-[#FFFEFE] text-maroon py-12 px-4 sm:px-6 flex items-center justify-center font-sans">
      <div className="max-w-md mx-auto w-full">
        {!isPaidSuccess ? (
          /* Payment Verification Box */
          <div className="glass-card rounded-3xl border border-cream-border shadow-md overflow-hidden">
            {/* Paystack Header Banner */}
            <div className="bg-cream-card text-maroon p-6 text-center border-b border-cream-border">
              <div className="flex items-center justify-center gap-1.5 text-xs text-dustyRose uppercase tracking-widest font-medium mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Paystack Secured Payment</span>
              </div>
              <h2 className="font-serif font-bold text-2xl text-maroon">Amorah Experience</h2>
              <div className="mt-3 inline-block bg-cream-border/60 border border-cream-border px-5 py-1.5 rounded-full text-maroon font-bold text-2xl">
                {amountText}
              </div>
              {effectiveRef && (
                <p className="text-[11px] text-mauve mt-2 font-mono">
                  Ref: {effectiveRef}
                </p>
              )}
            </div>

            <div className="p-8 text-center space-y-6">
              {isVerifying ? (
                <div className="py-6 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 text-coral animate-spin" />
                  <p className="text-sm font-medium text-maroon">
                    Verifying your Paystack payment...
                  </p>
                  <p className="text-xs text-mauve">
                    Please wait a moment while we confirm your transaction.
                  </p>
                </div>
              ) : errorMsg ? (
                <div className="py-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-coral/10 border border-coral/40 text-maroon text-xs flex items-center gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-coral shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    id="retry-verification-button"
                    onClick={verifyPayment}
                    className="w-full py-3.5 px-6 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <RefreshCw className="w-4 h-4 text-coral" />
                    <span>Retry Verification</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* Payment Success & Link Activation Box */
          <div className="glass-card rounded-3xl border border-cream-border shadow-md p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                Payment Verified 🎉
              </span>
              <h2 className="font-serif font-bold text-2xl text-maroon mt-3">
                Your Story Card is Live!
              </h2>
              <p className="text-xs sm:text-sm text-mauve mt-1">
                Your digital experience for {experience?.receiver_name} is active and ready to share.
              </p>
            </div>

            {/* Generated Shareable Link Card */}
            <div className="p-4 rounded-2xl bg-cream-card border border-cream-border text-left space-y-2">
              <label className="block text-[11px] font-medium text-mauve">
                Public Share Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareableUrl()}
                  className="flex-1 bg-cream px-3 py-2 rounded-xl border border-cream-border text-xs font-mono text-maroon focus:outline-none"
                />
                <button
                  id="copy-link-button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-xl bg-maroon text-cream hover:bg-maroon-light transition-colors shrink-0"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4 text-coral" />
                </button>
              </div>
              {copied && (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Link copied to clipboard!
                </p>
              )}
            </div>

            {/* Sharing CTAs */}
            <div className="flex flex-col gap-3">
              <button
                id="whatsapp-share-button"
                onClick={handleWhatsAppShare}
                className="w-full py-3.5 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>

              {navigator.share && (
                <button
                  id="native-share-button"
                  onClick={() => {
                    const url = getShareableUrl();
                    navigator.share({
                      title: `Amorah for ${experience?.receiver_name || 'You'}`,
                      text: `💖 Check out this special story card created for ${experience?.receiver_name || 'you'}!`,
                      url: url,
                    }).catch(() => {});
                  }}
                  className="w-full py-3 px-4 rounded-full bg-cream-card hover:bg-cream-border text-maroon font-medium text-xs border border-cream-border transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-coral" />
                  <span>More Device Share Options</span>
                </button>
              )}

              <button
                id="view-experience-button"
                onClick={() => experience && onViewExperience(experience.slug)}
                className="w-full py-3.5 px-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-cream text-cream" />
                <span>View Story Experience</span>
                <ExternalLink className="w-4 h-4 text-coral" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
