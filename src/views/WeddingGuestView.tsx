import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Wedding, WeddingEvent, WeddingGuest } from '../types';
import { getPublicWeddingBySlugApi, getPublicGuestWeddingInviteApi, verifyWeddingPaymentApi } from '../lib/api';
import { WeddingInvitationViewer } from '../components/WeddingInvitationViewer';

interface WeddingGuestViewProps {
  slug: string;
  guestSlug?: string | null;
  onNavigate: (path: string) => void;
}

export const WeddingGuestView: React.FC<WeddingGuestViewProps> = ({ slug, guestSlug, onNavigate }) => {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [guest, setGuest] = useState<WeddingGuest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'NOT_FOUND' | 'PAYMENT_PENDING' | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  async function loadWedding() {
    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setPaymentRef(null);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const targetGuest = guestSlug || searchParams.get('g') || searchParams.get('guest') || undefined;

      let res;
      if (targetGuest) {
        res = await getPublicGuestWeddingInviteApi(slug, targetGuest);
      } else {
        res = await getPublicWeddingBySlugApi(slug);
      }

      setWedding(res.wedding);
      setEvents(res.events || (res.event ? [res.event] : []));
      setGuest(res.guest || null);

      if (res.wedding) {
        const guestPrefix = res.guest ? `Invitation for ${res.guest.name} | ` : '';
        document.title = `${guestPrefix}${res.wedding.couple_names}: Wedding Invitation | Amorah`;
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Unable to load wedding invitation.';
      setError(msg);
      if (err.error_type === 'PAYMENT_PENDING' || msg.toLowerCase().includes('payment pending')) {
        setErrorType('PAYMENT_PENDING');
        setPaymentRef(err.reference || null);
      } else {
        setErrorType('NOT_FOUND');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      loadWedding();
    }
  }, [slug, guestSlug]);

  const handleCheckPaymentStatus = async () => {
    if (!paymentRef) {
      loadWedding();
      return;
    }
    setIsVerifying(true);
    setVerifyNotice(null);
    try {
      const verRes = await verifyWeddingPaymentApi(paymentRef);
      if (verRes.success) {
        setVerifyNotice('Payment verified! Loading invitation...');
        await loadWedding();
      } else {
        setVerifyNotice('Payment is still pending on Paystack. Please check back in a moment.');
      }
    } catch (err: any) {
      setVerifyNotice(err.message || 'Payment is still processing or not yet confirmed.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#2A0812] flex flex-col items-center justify-center p-6 text-center text-[#FDFBF7]">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
        <p className="text-xs font-serif tracking-widest uppercase text-[#D4AF37]">Opening Wedding Invitation...</p>
      </div>
    );
  }

  if (errorType === 'PAYMENT_PENDING') {
    return (
      <div className="min-h-screen bg-[#2A0812] flex flex-col items-center justify-center p-6 text-center text-[#FDFBF7]">
        <div className="p-8 rounded-3xl bg-[#3B0E1B] border border-[#D4AF37]/30 max-w-md w-full space-y-5">
          <Clock className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-[#F4E3B2]">Payment Pending</h2>
          <p className="text-xs text-[#FDFBF7]/80 font-sans leading-relaxed">
            This wedding invitation has been created, but payment confirmation is currently pending.
          </p>
          {verifyNotice && (
            <p className="text-xs font-medium text-amber-300 bg-amber-950/60 p-3 rounded-2xl border border-amber-500/30">
              {verifyNotice}
            </p>
          )}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleCheckPaymentStatus}
              disabled={isVerifying}
              className="w-full py-3 rounded-full bg-[#D4AF37] hover:bg-[#b8972e] text-[#2A0812] font-bold text-xs font-sans transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Paystack Status...</span>
                </>
              ) : (
                <>
                  <span>Check Payment Status</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="w-full py-2.5 rounded-full bg-transparent hover:bg-white/5 text-[#FDFBF7]/70 font-semibold text-xs font-sans border border-[#FDFBF7]/20 cursor-pointer"
            >
              Go to Amorah Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (errorType === 'NOT_FOUND' || error || !wedding) {
    return (
      <div className="min-h-screen bg-[#2A0812] flex flex-col items-center justify-center p-6 text-center text-[#FDFBF7]">
        <div className="p-8 rounded-3xl bg-[#3B0E1B] border border-[#D4AF37]/30 max-w-md w-full space-y-5">
          <AlertCircle className="w-10 h-10 text-coral mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-[#F4E3B2]">Invitation Not Found</h2>
          <p className="text-xs text-[#FDFBF7]/80 font-sans leading-relaxed">
            We couldn't find a wedding invitation matching this link. Please check the URL or contact the couple.
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="w-full py-3 rounded-full bg-[#D4AF37] hover:bg-[#b8972e] text-[#2A0812] font-bold text-xs font-sans cursor-pointer"
          >
            Go to Amorah Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <WeddingInvitationViewer
      wedding={wedding}
      events={events}
      guest={guest}
      slug={slug}
      onNavigate={onNavigate}
    />
  );
};
