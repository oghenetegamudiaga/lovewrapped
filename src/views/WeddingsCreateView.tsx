import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, Heart, Calendar, MapPin, DollarSign, Layers } from 'lucide-react';
import { WEDDING_THEMES } from '../config/weddingThemes';
import { CreateWeddingPayload, CoupleAccount } from '../types';
import { createWeddingPaymentApi, verifyWeddingPaymentApi } from '../lib/api';
import { WEDDING_PLAN_PRICE_FORMATTED } from '../constants';

interface WeddingsCreateViewProps {
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
}

export const WeddingsCreateView: React.FC<WeddingsCreateViewProps> = ({ onNavigate, currentCouple }) => {
  const [step, setStep] = useState<number>(1);
  const [themeId, setThemeId] = useState<string>('classic-burgundy');
  const [coupleNames, setCoupleNames] = useState<string>('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>('');
  const [loveStory, setLoveStory] = useState<string>('');
  const [musicTrack, setMusicTrack] = useState<string>('romantic-strings');
  const [eventTitle, setEventTitle] = useState<string>('Wedding Celebration');
  const [eventDate, setEventDate] = useState<string>('');
  const [eventTime, setEventTime] = useState<string>('10:00 AM');
  const [eventVenueName, setEventVenueName] = useState<string>('');
  const [eventVenueAddress, setEventVenueAddress] = useState<string>('');
  const [registryInfo, setRegistryInfo] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [createdWeddingId, setCreatedWeddingId] = useState<string | null>(null);

  // Compress & upload image payload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
          setCoverPhotoUrl(compressedUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProceedToPayment = async () => {
    setError(null);
    setIsLoading(true);

    const payload: CreateWeddingPayload = {
      theme_id: themeId,
      couple_names: coupleNames,
      cover_photo_url: coverPhotoUrl,
      love_story: loveStory,
      music_track: musicTrack,
      registry_info: registryInfo,
      event_title: eventTitle,
      event_date: eventDate,
      event_time: eventTime,
      event_venue_name: eventVenueName,
      event_venue_address: eventVenueAddress,
    };

    try {
      const payRes = await createWeddingPaymentApi(payload);

      // Verify payment (simulated / real Paystack loop)
      const verRes = await verifyWeddingPaymentApi(payRes.reference, payload);

      if (verRes.success) {
        setCreatedShareUrl(verRes.shareUrl);
        setCreatedWeddingId(verRes.wedding.id);
        setStep(6); // Success Step
      } else {
        setError('Payment verification failed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process payment checkout.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-maroon font-sans py-12 px-4 sm:px-6 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        {/* Header & Step Indicator */}
        <div className="text-center mb-8">
          <div className="eyebrow-pill mb-3 mx-auto">
            <span>Step {step <= 5 ? step : 5} of 5</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon mb-2">
            Create Your Wedding Invitation
          </h1>
          <p className="text-xs sm:text-sm text-mauve">
            Craft a cinematic digital invitation experience for your special day.
          </p>
        </div>

        {/* Step Progress Bar */}
        {step <= 5 && (
          <div className="flex items-center justify-between mb-8 gap-2 px-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-maroon' : 'bg-cream-border'
                }`}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Builder Form Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border shadow-xl bg-cream-card">
          {/* STEP 1: Theme Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon mb-1">Select Theme</h2>
                <p className="text-xs text-mauve">Choose the aesthetic framework for your digital invitation.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {Object.values(WEDDING_THEMES).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      themeId === t.id
                        ? 'border-maroon bg-cream/90 shadow-md scale-[1.01]'
                        : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-coral uppercase tracking-wider">Royal Luxury Theme</span>
                        <h3 className="font-serif text-lg font-bold text-maroon mt-0.5">{t.name}</h3>
                        <p className="text-xs text-mauve mt-1">{t.description}</p>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-maroon flex items-center justify-center">
                        {themeId === t.id && <div className="w-3 h-3 rounded-full bg-maroon" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-cream-border flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Couple Details</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Couple Names & Cover Photo */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon mb-1">Couple Details & Photography</h2>
                <p className="text-xs text-mauve">Enter your names and upload a featured photo for the cover.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Couple Names *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Becky & Martins"
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Cover Photo (Optional)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {coverPhotoUrl ? (
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-cream-border shrink-0">
                      <img src={coverPhotoUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverPhotoUrl('')}
                        className="absolute top-1 right-1 bg-maroon/80 text-cream text-[10px] p-1 rounded-full"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full p-6 border-2 border-dashed border-cream-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-cream/60 transition-colors">
                      <Upload className="w-6 h-6 text-mauve mb-2" />
                      <span className="text-xs font-semibold text-maroon">Upload Cover Photo</span>
                      <span className="text-[10px] text-mauve mt-1">PNG, JPG up to 10MB</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Our Love Story (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Share a short note about your journey together..."
                  value={loveStory}
                  onChange={(e) => setLoveStory(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div className="pt-4 border-t border-cream-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-full bg-cream text-maroon border border-cream-border text-xs font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!coupleNames.trim()}
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Next: Event Details</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Single Event Details */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon mb-1">Wedding Event Schedule</h2>
                <p className="text-xs text-mauve">Enter the date, time, and venue for your celebration.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Wedding Celebration & Reception"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-maroon mb-1">Event Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saturday, December 18, 2026"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-maroon mb-1">Event Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM Prompt"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Venue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eko Grand Ballroom"
                  value={eventVenueName}
                  onChange={(e) => setEventVenueName(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Venue Address / City (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Victoria Island, Lagos, Nigeria"
                  value={eventVenueAddress}
                  onChange={(e) => setEventVenueAddress(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div className="pt-4 border-t border-cream-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-full bg-cream text-maroon border border-cream-border text-xs font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!eventDate.trim() || !eventVenueName.trim()}
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Next: Gift Registry</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Gift Registry Info */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon mb-1">Gift Registry & Wishlist</h2>
                <p className="text-xs text-mauve">Provide bank account or wish list details for your guests (optional).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-maroon mb-1">Registry Notes / Account Info</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Account Name: Becky & Martins Wedding / Bank: GTBank / Account No: 0123456789"
                  value={registryInfo}
                  onChange={(e) => setRegistryInfo(e.target.value)}
                  className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                />
              </div>

              <div className="pt-4 border-t border-cream-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-full bg-cream text-maroon border border-cream-border text-xs font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Review & Pay</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Paystack Checkout */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon mb-1">Review & Activate Invitation</h2>
                <p className="text-xs text-mauve">Confirm details and activate your digital wedding invitation package.</p>
              </div>

              <div className="p-5 rounded-2xl bg-cream border border-cream-border space-y-3 text-xs text-maroon">
                <div className="flex justify-between">
                  <span className="font-semibold text-mauve">Couple:</span>
                  <span className="font-bold">{coupleNames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-mauve">Date & Venue:</span>
                  <span className="font-medium">{eventDate} • {eventVenueName}</span>
                </div>
                <div className="flex justify-between border-t border-cream-border pt-2">
                  <span className="font-semibold text-mauve">Package Price:</span>
                  <span className="font-bold text-coral text-sm">{WEDDING_PLAN_PRICE_FORMATTED}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-cream-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-full bg-cream text-maroon border border-cream-border text-xs font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleProceedToPayment}
                  className="px-8 py-3.5 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoading ? 'Processing Checkout...' : `Pay ${WEDDING_PLAN_PRICE_FORMATTED} & Publish`}</span>
                  <Sparkles className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Success & Shareable Link */}
          {step === 6 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold text-maroon mb-2">
                  Your Wedding Invitation is Live!
                </h2>
                <p className="text-xs text-mauve max-w-sm mx-auto">
                  Share this link with your family and guests to start collecting RSVPs.
                </p>
              </div>

              {createdShareUrl && (
                <div className="p-4 rounded-2xl bg-cream border border-cream-border font-mono text-xs text-maroon flex items-center justify-between gap-2">
                  <span className="truncate">{window.location.origin}{createdShareUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${createdShareUrl}`);
                      alert('Shareable link copied to clipboard!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-maroon text-cream font-sans text-[11px] font-semibold"
                  >
                    Copy
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                {createdShareUrl && (
                  <button
                    type="button"
                    onClick={() => onNavigate(createdShareUrl)}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-maroon text-cream font-semibold text-xs shadow-md"
                  >
                    Preview Guest View
                  </button>
                )}
                {createdWeddingId && (
                  <button
                    type="button"
                    onClick={() => onNavigate(`/weddings/dashboard/${createdWeddingId}`)}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-cream-card text-maroon border border-cream-border font-semibold text-xs"
                  >
                    Go to Couple Dashboard
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
