import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Wedding, WeddingEvent, WeddingGuest } from '../types';
import { getPublicWeddingBySlugApi, getPublicGuestWeddingInviteApi } from '../lib/api';
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

  useEffect(() => {
    async function loadWedding() {
      setIsLoading(true);
      setError(null);
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
          document.title = `${guestPrefix}${res.wedding.couple_names} — Wedding Invitation | Amorah`;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Wedding invitation not found.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      loadWedding();
    }
  }, [slug, guestSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#2A0812] flex flex-col items-center justify-center p-6 text-center text-[#FDFBF7]">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mb-3" />
        <p className="text-xs font-serif tracking-widest uppercase text-[#D4AF37]">Opening Wedding Invitation...</p>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen bg-[#2A0812] flex flex-col items-center justify-center p-6 text-center text-[#FDFBF7]">
        <div className="p-8 rounded-3xl bg-[#3B0E1B] border border-[#D4AF37]/30 max-w-md w-full shadow-2xl space-y-4">
          <AlertCircle className="w-10 h-10 text-coral mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-[#F4E3B2]">Invitation Not Found</h2>
          <p className="text-xs text-[#FDFBF7]/70 font-sans">{error || 'This wedding invitation link is invalid or payment is pending.'}</p>
          <button
            onClick={() => onNavigate('/')}
            className="px-6 py-2.5 rounded-full bg-[#D4AF37] text-[#2A0812] font-semibold text-xs font-sans"
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
