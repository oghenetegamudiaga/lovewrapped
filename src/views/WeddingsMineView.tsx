import React, { useState, useEffect } from 'react';
import { Heart, Plus, Calendar, ArrowRight, ExternalLink, LogOut, Sparkles, Shield, CheckCircle2, Clock } from 'lucide-react';
import { getCoupleMyWeddingsApi, getCoupleMeApi, logoutCoupleApi } from '../lib/api';
import { CoupleAccount } from '../types';

interface WeddingsMineViewProps {
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
  onLogout?: () => void;
}

interface WeddingSummary {
  id: string;
  slug: string;
  bride_first_name?: string;
  bride_other_names?: string;
  groom_first_name?: string;
  groom_other_names?: string;
  couple_names?: string;
  is_paid: boolean;
  created_at: string;
}

export const WeddingsMineView: React.FC<WeddingsMineViewProps> = ({ onNavigate, currentCouple, onLogout }) => {
  const [weddings, setWeddings] = useState<WeddingSummary[]>([]);
  const [couple, setCouple] = useState<CoupleAccount | null>(currentCouple || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [meRes, mineRes] = await Promise.all([
          getCoupleMeApi().catch(() => ({ authenticated: false, couple: null })),
          getCoupleMyWeddingsApi(),
        ]);

        if (meRes.authenticated && meRes.couple) {
          setCouple(meRes.couple);
        }
        setWeddings(mineRes.weddings || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load your weddings.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogoutClick = async () => {
    try {
      await logoutCoupleApi();
      if (onLogout) onLogout();
      onNavigate('/weddings');
    } catch (err) {
      onNavigate('/weddings');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center font-sans">
        <Sparkles className="w-8 h-8 text-coral animate-spin mb-3" />
        <p className="text-xs font-semibold text-mauve">Loading your weddings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-maroon font-sans py-12 px-4 sm:px-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header Bar */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border shadow-md bg-cream-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon">
              {couple?.full_name ? `Welcome, ${couple.full_name}` : 'Your Wedding Invitations'}
            </h1>
            <p className="text-xs text-mauve mt-1">
              Select a wedding invitation to manage RSVPs, event schedules, and customization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/weddings/create')}
              className="px-5 py-2.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-coral" />
              <span>Create New Invitation</span>
            </button>
            <button
              onClick={handleLogoutClick}
              className="p-2.5 rounded-full bg-cream border border-cream-border text-mauve hover:text-maroon transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {/* Weddings Card Grid */}
        {weddings.length === 0 ? (
          <div className="p-12 rounded-3xl bg-cream-card border border-cream-border text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 fill-coral" />
            </div>
            <h2 className="font-serif text-xl font-bold text-maroon">No Wedding Invitations Yet</h2>
            <p className="text-xs text-mauve max-w-sm mx-auto">
              You haven't created any digital wedding invitations yet. Start crafting your celebration today!
            </p>
            <button
              onClick={() => onNavigate('/weddings/create')}
              className="px-6 py-3 rounded-full bg-maroon text-cream font-semibold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-coral" />
              <span>Create Your First Invitation</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {weddings.map((w) => (
              <div
                key={w.id}
                className="glass-card p-6 rounded-3xl border border-cream-border bg-cream-card shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        w.is_paid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {w.is_paid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active & Published
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" /> Payment Pending
                        </>
                      )}
                    </span>
                    <span className="text-[10px] text-mauve flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-coral" />
                      {new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-maroon pt-1">
                    {w.bride_first_name && w.groom_first_name
                      ? `${w.bride_first_name}${w.bride_other_names ? ' ' + w.bride_other_names : ''} & ${w.groom_first_name}${w.groom_other_names ? ' ' + w.groom_other_names : ''}`
                      : w.couple_names || 'Wedding Invitation'}
                  </h3>
                  <p className="text-xs text-mauve font-mono truncate">
                    slug: /w/wedding/{w.slug}
                  </p>
                </div>

                <div className="pt-3 border-t border-cream-border flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onNavigate(`/w/wedding/${w.slug}`)}
                    className="px-3.5 py-2 rounded-xl bg-cream border border-cream-border text-maroon hover:border-coral font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-coral" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => onNavigate(`/weddings/dashboard/${w.id}`)}
                    className="px-4 py-2 rounded-xl bg-maroon text-cream font-semibold flex items-center gap-1.5 shadow-sm hover:scale-[1.02] cursor-pointer"
                  >
                    <span>Manage Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5 text-coral" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
