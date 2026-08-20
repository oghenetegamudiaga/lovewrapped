import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, Heart, Calendar, MapPin, DollarSign, Layers, Plus, Trash2, Palette, Type } from 'lucide-react';
import { WEDDING_THEMES, ACCENT_COLOR_VARIANTS, FONT_PAIRING_VARIANTS } from '../config/weddingThemes';
import { CreateWeddingPayload, WeddingEventPayload, CoupleAccount } from '../types';
import { createWeddingPaymentApi, verifyWeddingPaymentApi } from '../lib/api';
import { WEDDING_PLAN_PRICE_FORMATTED } from '../constants';

interface WeddingsCreateViewProps {
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
}

export const WeddingsCreateView: React.FC<WeddingsCreateViewProps> = ({ onNavigate, currentCouple }) => {
  const [step, setStep] = useState<number>(1);
  const [themeId, setThemeId] = useState<string>('classic-burgundy');
  const [colorVariant, setColorVariant] = useState<string>('royal-gold');
  const [fontVariant, setFontVariant] = useState<string>('classic-serif');

  const [brideFirstName, setBrideFirstName] = useState<string>('');
  const [brideOtherNames, setBrideOtherNames] = useState<string>('');
  const [groomFirstName, setGroomFirstName] = useState<string>('');
  const [groomOtherNames, setGroomOtherNames] = useState<string>('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string>('');
  const [loveStory, setLoveStory] = useState<string>('');
  const [musicTrack, setMusicTrack] = useState<string>('romantic-strings');
  const [registryInfo, setRegistryInfo] = useState<string>('');

  // Multi-event schedule state
  const [events, setEvents] = useState<WeddingEventPayload[]>([
    {
      title: 'Wedding Celebration & Reception',
      date: '',
      time: '10:00',
      venue_name: '',
      venue_address: '',
    },
  ]);

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

  const handleAddEvent = (presetTitle?: string) => {
    setEvents((prev) => [
      ...prev,
      {
        title: presetTitle || `Event #${prev.length + 1}`,
        date: prev[0]?.date || '',
        time: '12:00 PM',
        venue_name: '',
        venue_address: '',
      },
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    if (events.length <= 1) {
      alert('You must have at least one wedding event.');
      return;
    }
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEventChange = (index: number, field: keyof WeddingEventPayload, value: string) => {
    setEvents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleProceedToPayment = async () => {
    setError(null);
    setIsLoading(true);

    const validEvents = events.filter((e) => e.title.trim() && e.date.trim() && e.venue_name.trim());
    if (validEvents.length === 0) {
      setError('Please provide date and venue for at least one event.');
      setIsLoading(false);
      return;
    }

    const fullCoupleNames = `${brideFirstName}${brideOtherNames ? ' ' + brideOtherNames : ''} & ${groomFirstName}${groomOtherNames ? ' ' + groomOtherNames : ''}`;

    const payload: CreateWeddingPayload = {
      theme_id: themeId,
      color_variant: colorVariant,
      font_variant: fontVariant,
      section_order: ['schedule', 'love_story', 'registry', 'rsvp'],
      bride_first_name: brideFirstName,
      bride_other_names: brideOtherNames,
      groom_first_name: groomFirstName,
      groom_other_names: groomOtherNames,
      couple_names: fullCoupleNames,
      cover_photo_url: coverPhotoUrl,
      love_story: loveStory,
      music_track: musicTrack,
      registry_info: registryInfo,
      events: validEvents,
      event_title: validEvents[0].title,
      event_date: validEvents[0].date,
      event_time: validEvents[0].time,
      event_venue_name: validEvents[0].venue_name,
      event_venue_address: validEvents[0].venue_address,
    };

    try {
      const payRes = await createWeddingPaymentApi(payload);
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
            Craft a multi-event digital invitation experience for your special celebration.
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
          {/* STEP 1: Theme & Visual Variant Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon mb-1">Select Theme & Styling</h2>
                <p className="text-xs text-mauve">Pick a base theme, then choose a curated accent color & font pairing.</p>
              </div>

              {/* 3 Distinct Base Themes */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-maroon uppercase tracking-wider">1. Base Visual Theme</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.values(WEDDING_THEMES).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        themeId === t.id
                          ? 'border-maroon bg-cream/90 shadow-md scale-[1.01]'
                          : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: t.accentColor }}
                            />
                            <h3 className="font-serif text-base font-bold text-maroon">{t.name}</h3>
                          </div>
                          <p className="text-xs text-mauve mt-1 leading-relaxed">{t.description}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-maroon flex items-center justify-center shrink-0">
                          {themeId === t.id && <div className="w-2.5 h-2.5 rounded-full bg-maroon" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curated Accent Color Options */}
              <div className="space-y-3 pt-3 border-t border-cream-border">
                <label className="block text-xs font-bold text-maroon uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-coral" /> 2. Accent Color Variant
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.values(ACCENT_COLOR_VARIANTS).map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setColorVariant(c.id)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        colorVariant === c.id
                          ? 'border-maroon bg-cream/90 shadow-sm font-bold'
                          : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: c.accentColor }} />
                      <span className="text-[11px] text-maroon">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Curated Font Pairing Options */}
              <div className="space-y-3 pt-3 border-t border-cream-border">
                <label className="block text-xs font-bold text-maroon uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-coral" /> 3. Font Pairing Variant
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {Object.values(FONT_PAIRING_VARIANTS).map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => setFontVariant(f.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        fontVariant === f.id
                          ? 'border-maroon bg-cream/90 shadow-sm'
                          : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                      }`}
                    >
                      <p className={`text-xs font-bold text-maroon ${f.serifClass}`}>{f.name}</p>
                      <p className="text-[10px] text-mauve mt-1 leading-tight">{f.description}</p>
                    </button>
                  ))}
                </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-maroon mb-1">Bride's First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Temilolu"
                    value={brideFirstName}
                    onChange={(e) => setBrideFirstName(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-maroon mb-1">Bride's Other Names (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Adeola"
                    value={brideOtherNames}
                    onChange={(e) => setBrideOtherNames(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-maroon mb-1">Groom's First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juwon"
                    value={groomFirstName}
                    onChange={(e) => setGroomFirstName(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-maroon mb-1">Groom's Other Names (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Oluwaseun"
                    value={groomOtherNames}
                    onChange={(e) => setGroomOtherNames(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                  />
                </div>
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
                  disabled={!brideFirstName.trim() || !groomFirstName.trim()}
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Next: Event Schedule</span>
                  <ArrowRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Multi-Event Schedule */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-xl font-bold text-maroon mb-1">Multi-Event Schedule</h2>
                <p className="text-xs text-mauve">Add all events for your celebration (e.g. Traditional, White Wedding, Reception).</p>
              </div>

              {/* Preset Quick-Add Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-mauve">Quick Add Presets:</span>
                <button
                  type="button"
                  onClick={() => handleAddEvent('Traditional Ceremony / Engagement')}
                  className="px-3 py-1.5 rounded-full bg-cream border border-cream-border hover:border-coral text-maroon text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-coral" /> Traditional / Engagement
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEvent('Holy Matrimony / Church Service')}
                  className="px-3 py-1.5 rounded-full bg-cream border border-cream-border hover:border-coral text-maroon text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-coral" /> Holy Matrimony
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEvent('Grand Reception')}
                  className="px-3 py-1.5 rounded-full bg-cream border border-cream-border hover:border-coral text-maroon text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-coral" /> Reception
                </button>
              </div>

              {/* Events List Cards */}
              <div className="space-y-4">
                {events.map((ev, index) => (
                  <div key={index} className="p-5 rounded-2xl bg-cream/70 border border-cream-border space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-coral">
                        <Calendar className="w-3.5 h-3.5" /> Event #{index + 1}
                      </span>
                      {events.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEvent(index)}
                          className="p-1 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-maroon mb-1">Event Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Traditional Ceremony / Engagement"
                        value={ev.title}
                        onChange={(e) => handleEventChange(index, 'title', e.target.value)}
                        className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-maroon mb-1">Date *</label>
                        <input
                          type="date"
                          required
                          value={ev.date}
                          onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                          className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-maroon mb-1">Time *</label>
                        <input
                          type="time"
                          required
                          value={ev.time}
                          onChange={(e) => handleEventChange(index, 'time', e.target.value)}
                          className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-maroon mb-1">Venue Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Eko Hotel Grand Ballroom"
                        value={ev.venue_name}
                        onChange={(e) => handleEventChange(index, 'venue_name', e.target.value)}
                        className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-maroon mb-1">Venue Address / City (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Victoria Island, Lagos"
                        value={ev.venue_address || ''}
                        onChange={(e) => handleEventChange(index, 'venue_address', e.target.value)}
                        className="w-full p-3 rounded-xl bg-cream-card border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleAddEvent()}
                className="w-full py-3 rounded-2xl bg-cream border border-dashed border-maroon/40 hover:border-maroon text-maroon text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-coral" /> Add Another Event
              </button>

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
                  disabled={events.some((e) => !e.title.trim() || !e.date.trim() || !e.venue_name.trim())}
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
                  <span className="font-bold">{brideFirstName} & {groomFirstName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-mauve">Base Theme:</span>
                  <span className="font-bold capitalize">{themeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-mauve">Accent / Font:</span>
                  <span className="font-bold capitalize">{colorVariant} • {fontVariant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-mauve">Events Count:</span>
                  <span className="font-bold">{events.length} Event(s)</span>
                </div>
                <div className="space-y-1 pt-1 border-t border-cream-border">
                  {events.map((ev, i) => (
                    <p key={i} className="text-[11px] text-mauve">
                      • <strong className="text-maroon">{ev.title}</strong>: {ev.date} @ {ev.venue_name}
                    </p>
                  ))}
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
                  Share your general link or manage your guest list to send personalized links.
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
