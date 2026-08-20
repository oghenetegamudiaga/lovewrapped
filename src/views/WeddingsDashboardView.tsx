import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Edit3, UserCheck, X, Check, AlertCircle, Copy, Share2, Shield, Heart } from 'lucide-react';
import { Wedding, WeddingEvent, WeddingRSVP, CoupleAccount } from '../types';
import { getCoupleWeddingDashboardApi, updateCoupleWeddingDetailsApi } from '../lib/api';

interface WeddingsDashboardViewProps {
  weddingId: string;
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
}

export const WeddingsDashboardView: React.FC<WeddingsDashboardViewProps> = ({
  weddingId,
  onNavigate,
  currentCouple,
}) => {
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [rsvps, setRsvps] = useState<WeddingRSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Event Typo Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editVenueName, setEditVenueName] = useState('');
  const [editVenueAddress, setEditVenueAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getCoupleWeddingDashboardApi(weddingId);
        setWedding(res.wedding);
        setEvent(res.event);
        setRsvps(res.rsvps || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load wedding dashboard.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [weddingId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-8 h-8 text-coral animate-spin mb-3" />
        <p className="text-xs font-semibold text-mauve">Loading Couple Dashboard...</p>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 rounded-3xl bg-cream-card border border-cream-border max-w-md w-full shadow-lg">
          <Shield className="w-10 h-10 text-coral mx-auto mb-3" />
          <h2 className="font-serif text-xl font-bold text-maroon mb-2">Dashboard Access</h2>
          <p className="text-xs text-mauve mb-6">{error || 'Wedding invitation not found.'}</p>
          <button
            onClick={() => onNavigate('/weddings')}
            className="px-6 py-2.5 rounded-full bg-maroon text-cream font-semibold text-xs"
          >
            Back to Weddings
          </button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/w/wedding/${wedding.slug}`;
  const totalAttending = rsvps
    .filter((r) => r.attending)
    .reduce((sum, r) => sum + (r.guest_count || 1), 0);

  return (
    <div className="min-h-screen bg-cream text-maroon font-sans py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border shadow-md bg-cream-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral/10 text-coral text-[10px] font-semibold uppercase tracking-wider mb-2">
              <Heart className="w-3 h-3 fill-coral" /> Couple Dashboard
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-maroon">
              {wedding.couple_names}
            </h1>
            <p className="text-xs text-mauve mt-1">
              Manage your invitation, RSVPs, and event details.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(`/w/wedding/${wedding.slug}`)}
              className="px-5 py-2.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>View Guest Invitation</span>
            </button>
          </div>
        </div>

        {/* Share Link Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-cream-card border border-cream-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-semibold text-maroon">Shareable Guest Link:</p>
            <p className="font-mono text-mauve text-[11px] truncate max-w-md">{shareUrl}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              alert('Invitation link copied!');
            }}
            className="px-4 py-2 rounded-full bg-cream border border-cream-border text-maroon font-semibold text-xs hover:border-coral transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Copy className="w-3.5 h-3.5 text-coral" />
            <span>Copy Link</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-cream-card border border-cream-border text-center">
            <p className="text-[11px] font-semibold text-mauve uppercase tracking-wider">Total RSVPs</p>
            <p className="font-serif text-3xl font-bold text-maroon mt-1">{rsvps.length}</p>
          </div>
          <div className="p-6 rounded-3xl bg-cream-card border border-cream-border text-center">
            <p className="text-[11px] font-semibold text-mauve uppercase tracking-wider">Attending Guests</p>
            <p className="font-serif text-3xl font-bold text-emerald-700 mt-1">{totalAttending}</p>
          </div>
          <div className="p-6 rounded-3xl bg-cream-card border border-cream-border text-center">
            <p className="text-[11px] font-semibold text-mauve uppercase tracking-wider">Declined</p>
            <p className="font-serif text-3xl font-bold text-amber-700 mt-1">
              {rsvps.filter((r) => !r.attending).length}
            </p>
          </div>
        </div>

        {/* Event Details Card with Edit Trigger */}
        <div className="p-6 sm:p-8 rounded-3xl bg-cream-card border border-cream-border space-y-4">
          <div className="flex items-center justify-between border-b border-cream-border pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-maroon">Event Details</h2>
              <p className="text-xs text-mauve">Fix typos in date, time, or venue name post-creation.</p>
            </div>
            <button
              onClick={() => {
                setEditDate(event?.date || '');
                setEditTime(event?.time || '');
                setEditVenueName(event?.venue_name || '');
                setEditVenueAddress(event?.venue_address || '');
                setIsEditOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-cream border border-cream-border text-maroon hover:border-coral transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-coral" />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-mauve">Date & Time:</p>
              <p className="font-medium text-maroon">{event?.date || 'N/A'} at {event?.time || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold text-mauve">Venue & Location:</p>
              <p className="font-medium text-maroon">{event?.venue_name || 'N/A'} ({event?.venue_address || 'N/A'})</p>
            </div>
          </div>
        </div>

        {/* RSVP Guest Responses Table */}
        <div className="bg-cream-card rounded-3xl border border-cream-border overflow-hidden shadow-xs space-y-4 p-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-maroon">Guest RSVPs ({rsvps.length})</h2>
            <p className="text-xs text-mauve">Live responses submitted by your guests.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cream-border bg-cream/50 text-[11px] font-semibold text-mauve uppercase tracking-wider">
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Count</th>
                  <th className="py-3 px-4">Dietary Notes</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4 text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border text-xs text-maroon">
                {rsvps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-mauve">
                      No guest RSVPs submitted yet. Share your invitation link to collect responses.
                    </td>
                  </tr>
                ) : (
                  rsvps.map((r) => (
                    <tr key={r.id} className="hover:bg-cream/40 transition-colors">
                      <td className="py-3 px-4 font-semibold">{r.guest_name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.attending
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {r.attending ? 'Attending' : 'Declined'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{r.attending ? r.guest_count : '-'}</td>
                      <td className="py-3 px-4 text-mauve max-w-xs truncate">{r.dietary_notes || '-'}</td>
                      <td className="py-3 px-4 text-mauve max-w-xs truncate">{r.message || '-'}</td>
                      <td className="py-3 px-4 text-right text-mauve font-mono text-[11px]">
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Event Details Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-maroon/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border max-w-md w-full shadow-2xl space-y-5 bg-cream">
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <h3 className="font-serif font-bold text-lg text-maroon">Edit Event Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-full bg-cream-card text-maroon border border-cream-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSaving(true);
                try {
                  const res = await updateCoupleWeddingDetailsApi(weddingId, {
                    date: editDate,
                    time: editTime,
                    venue_name: editVenueName,
                    venue_address: editVenueAddress,
                  });
                  setEvent(res.event);
                  setIsEditOpen(false);
                } catch (err: unknown) {
                  alert('Failed to update event details.');
                } finally {
                  setIsSaving(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Event Date</label>
                <input
                  type="text"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Event Time</label>
                <input
                  type="text"
                  required
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  value={editVenueName}
                  onChange={(e) => setEditVenueName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Venue Address / City</label>
                <input
                  type="text"
                  value={editVenueAddress}
                  onChange={(e) => setEditVenueAddress(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-cream-card border border-cream-border text-maroon text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-border">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-full bg-cream-card border border-cream-border text-xs font-semibold text-maroon"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-maroon text-cream text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
