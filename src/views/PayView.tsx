import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CreditCard, CheckCircle2, Copy, Share2, Sparkles, RefreshCw, ExternalLink, Heart, ShieldCheck } from 'lucide-react';
import { Experience } from '../types';
import { verifyPaymentApi } from '../lib/api';
import { PAID_PLAN_PRICE_FORMATTED, DEFAULT_PAYMENT_REF } from '../constants.js';

interface PayViewProps {
  reference: string;
  experienceId: string;
  onViewExperience: (slug: string) => void;
}

export const PayView: React.FC<PayViewProps> = ({
  reference,
  experienceId,
  onViewExperience,
}) => {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'ussd'>('card');

  // Load experience details
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        if (experienceId) {
          const verified = await verifyPaymentApi(reference, experienceId);
          if (isMounted) {
            setExperience(verified.experience);
            if (verified.experience.is_paid) {
              setIsPaidSuccess(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load experience for payment:', err);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [reference, experienceId]);

  // Simulate Paystack transaction verification
  const handleSimulatePayment = async () => {
    setIsProcessing(true);

    try {
      const res = await verifyPaymentApi(reference, experienceId);
      if (res.success && res.experience) {
        setExperience(res.experience);
        setIsPaidSuccess(true);

        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#ec4899', '#fb7185', '#38bdf8', '#fbbf24'],
        });
      }
    } catch (err) {
      console.error('Payment verification failed:', err);
      alert('Payment verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
      `💖 I created a special LoveWrapped story card for ${experience?.receiver_name || 'you'}! Tap here to view: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const amountText = PAID_PLAN_PRICE_FORMATTED;

  return (
    <div className="min-h-[85vh] bg-[#2b0818] text-[#fce7f3] py-12 px-4 sm:px-6 flex items-center justify-center font-sans">
      <div className="max-w-md mx-auto w-full">
        {!isPaidSuccess ? (
          /* Payment Checkout Box */
          <div className="glass-card rounded-3xl border border-rose-500/20 shadow-2xl overflow-hidden">
            {/* Paystack Header Banner */}
            <div className="bg-gradient-to-r from-rose-950 via-[#3a0d22] to-rose-950 text-white p-6 text-center border-b border-rose-800/40">
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-300 uppercase tracking-widest font-medium mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Paystack Secured Checkout</span>
              </div>
              <h2 className="font-serif font-bold text-2xl text-white">LoveWrapped Experience</h2>
              <div className="mt-3 inline-block bg-rose-500/10 border border-rose-500/30 px-5 py-1.5 rounded-full text-rose-300 font-bold text-2xl">
                {amountText}
              </div>
              <p className="text-[11px] text-rose-300/60 mt-2 font-mono">
                Ref: {reference || DEFAULT_PAYMENT_REF}
              </p>
            </div>

            {/* Payment Method Tabs */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-2 bg-[#3a0d22] p-1 rounded-2xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 rounded-xl transition-all ${
                    paymentMethod === 'card' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'text-rose-300/80 hover:text-white'
                  }`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-2 rounded-xl transition-all ${
                    paymentMethod === 'bank' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'text-rose-300/80 hover:text-white'
                  }`}
                >
                  Bank
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ussd')}
                  className={`py-2 rounded-xl transition-all ${
                    paymentMethod === 'ussd' ? 'bg-rose-600 text-white font-semibold shadow-md' : 'text-rose-300/80 hover:text-white'
                  }`}
                >
                  USSD
                </button>
              </div>

              {/* Form details / Test card simulation info */}
              <div className="p-4 rounded-2xl bg-[#3a0d22]/80 border border-rose-800/50 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-white">
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span>Test Environment Payment</span>
                </div>
                <p className="text-rose-200/80 leading-relaxed">
                  Click below to simulate an instant Paystack payment confirmation.
                </p>
              </div>

              {/* Action Button */}
              <button
                id="paystack-complete-button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="w-full py-4 px-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base shadow-xl shadow-emerald-950/80 transition-all flex items-center justify-center gap-2 border border-emerald-400/20"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Verifying Paystack Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Confirm Payment ({amountText})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Payment Success & Link Activation Box */
          <div className="glass-card rounded-3xl border border-rose-500/20 shadow-2xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
                Payment Verified 🎉
              </span>
              <h2 className="font-serif font-bold text-2xl text-white mt-3">
                Your Story Card is Live!
              </h2>
              <p className="text-xs sm:text-sm text-rose-200/80 mt-1">
                Your digital experience for {experience?.receiver_name} is active and ready to share.
              </p>
            </div>

            {/* Generated Shareable Link Card */}
            <div className="p-4 rounded-2xl bg-[#3a0d22]/80 border border-rose-800/60 text-left space-y-2">
              <label className="block text-[11px] font-medium text-rose-300">
                Public Share Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareableUrl()}
                  className="flex-1 bg-[#2b0818] px-3 py-2 rounded-xl border border-rose-800/80 text-xs font-mono text-rose-100 focus:outline-none"
                />
                <button
                  id="copy-link-button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors shrink-0"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Link copied to clipboard!
                </p>
              )}
            </div>

            {/* Sharing CTAs */}
            <div className="flex flex-col gap-3">
              <button
                id="whatsapp-share-button"
                onClick={handleWhatsAppShare}
                className="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
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
                      title: `LoveWrapped for ${experience?.receiver_name || 'You'}`,
                      text: `💖 Check out this special story card created for ${experience?.receiver_name || 'you'}!`,
                      url: url,
                    }).catch(() => {});
                  }}
                  className="w-full py-3 px-4 rounded-full bg-[#3a0d22] hover:bg-[#4a102b] text-rose-100 font-medium text-xs border border-rose-800/60 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>More Device Share Options</span>
                </button>
              )}

              <button
                id="view-experience-button"
                onClick={() => experience && onViewExperience(experience.slug)}
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                <span>View Story Experience</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

