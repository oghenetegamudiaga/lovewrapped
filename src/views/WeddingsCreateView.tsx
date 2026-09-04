import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, Heart, Calendar, MapPin, DollarSign, Layers, Plus, Trash2, Palette, Type, Download, Image, FileText, Music, Volume2, VolumeX, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { WEDDING_THEMES, ACCENT_COLOR_VARIANTS, FONT_PAIRING_VARIANTS } from '../config/weddingThemes';
import { CreateWeddingPayload, WeddingEventPayload, CoupleAccount, ThemeAssetsMap, CardTemplateRecord, MusicSourceType } from '../types';
import { MusicPlatformType } from '../lib/musicProviders';
import { createWeddingPaymentApi, verifyWeddingPaymentApi, createFreeWeddingApi, getPublicThemeAssetsApi, getActiveTemplatesApi, validateMusicLinkApi } from '../lib/api';
import { uploadImageDirectToStorage } from '../lib/storageUpload';
import { WEDDING_PLAN_PRICE_FORMATTED } from '../constants';
import { StaticInviteCard } from '../components/StaticInviteCard';
import { downloadCard } from '../lib/downloadCard';
import { CURATED_MUSIC_TRACKS } from '../components/MusicPlayerToggle';

interface WeddingsCreateViewProps {
  onNavigate: (path: string) => void;
  currentCouple?: CoupleAccount | null;
}

export const WeddingsCreateView: React.FC<WeddingsCreateViewProps> = ({ onNavigate, currentCouple }) => {
  // Step 0: Tier selection ('free' | 'premium' | null)
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium' | null>(null);

  // Premium Flow State (Steps 1 to 6)
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
  const [musicSourceType, setMusicSourceType] = useState<MusicSourceType>('curated');
  const [musicExternalId, setMusicExternalId] = useState<string | null>(null);
  const [musicExternalMeta, setMusicExternalMeta] = useState<Record<string, any> | null>(null);
  const [customMusicUrl, setCustomMusicUrl] = useState<string>('');
  const [isValidatingMusic, setIsValidatingMusic] = useState<boolean>(false);
  const [musicValidationError, setMusicValidationError] = useState<string | null>(null);
  const [validatedMusicPlatform, setValidatedMusicPlatform] = useState<MusicPlatformType | null>(null);
  const [registryInfo, setRegistryInfo] = useState<string>('');
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [themeAssets, setThemeAssets] = useState<ThemeAssetsMap>({});
  const [activeTemplates, setActiveTemplates] = useState<CardTemplateRecord[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplateRecord | null>(null);

  useEffect(() => {
    getPublicThemeAssetsApi().then(setThemeAssets).catch(() => {});
    getActiveTemplatesApi().then((tpls) => {
      setActiveTemplates(tpls);
      if (tpls.length > 0) setSelectedTemplate(tpls[0]);
    }).catch(() => {});
  }, []);

  const handleValidateCustomMusicUrl = async (urlToValidate: string) => {
    setCustomMusicUrl(urlToValidate);
    if (!urlToValidate.trim()) {
      setMusicValidationError(null);
      setValidatedMusicPlatform(null);
      setMusicExternalId(null);
      setMusicExternalMeta(null);
      return;
    }

    setIsValidatingMusic(true);
    setMusicValidationError(null);

    try {
      const res = await validateMusicLinkApi(urlToValidate);
      if (res.valid && res.type) {
        setMusicSourceType(res.type);
        setMusicExternalId(res.externalId || null);
        setMusicExternalMeta(res.externalMeta || null);
        setValidatedMusicPlatform(res.type);
        setMusicValidationError(null);
      } else {
        setMusicValidationError(res.message || 'Please paste a valid Spotify, Apple Music, or SoundCloud link.');
        setValidatedMusicPlatform(null);
        setMusicExternalId(null);
        setMusicExternalMeta(null);
      }
    } catch (err: any) {
      setMusicValidationError('Unable to validate music link. Please try again.');
      setValidatedMusicPlatform(null);
      setMusicExternalId(null);
      setMusicExternalMeta(null);
    } finally {
      setIsValidatingMusic(false);
    }
  };

  // Multi-event schedule state for Premium
  const [events, setEvents] = useState<WeddingEventPayload[]>([
    {
      title: 'Wedding Celebration & Reception',
      date: '',
      time: '10:00',
      venue_name: '',
      venue_address: '',
    },
  ]);

  // Free Tier Flow State
  const FREE_THEMES = ['classic-burgundy', 'modern-emerald'];
  const [freeStep, setFreeStep] = useState<number>(1); // 1: Theme, 2: Details, 3: Download Card
  const [freeThemeId, setFreeThemeId] = useState<string>('classic-burgundy');
  const [freeBrideFirstName, setFreeBrideFirstName] = useState<string>('');
  const [freeGroomFirstName, setFreeGroomFirstName] = useState<string>('');
  const [freeWeddingDate, setFreeWeddingDate] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [createdWeddingId, setCreatedWeddingId] = useState<string | null>(null);

  const [isUploadingCoverPhoto, setIsUploadingCoverPhoto] = useState(false);
  const [isUploadingGalleryPhoto, setIsUploadingGalleryPhoto] = useState(false);

  // Compress & upload image payload to Supabase Storage for Premium Cover Photo
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCoverPhoto(true);
    try {
      const publicUrl = await uploadImageDirectToStorage(file, { bucket: 'wedding-cover-photos' });
      setCoverPhotoUrl(publicUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload cover photo.';
      alert(msg);
    } finally {
      setIsUploadingCoverPhoto(false);
    }
  };

  // Gallery Multi-Photo Upload Handler (up to 10 photos)
  const handleGalleryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - galleryPhotos.length;
    if (remainingSlots <= 0) {
      alert('Maximum of 10 gallery photos reached.');
      return;
    }

    const filesToUpload = (Array.from(files) as File[]).slice(0, remainingSlots);
    setIsUploadingGalleryPhoto(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        try {
          const url = await uploadImageDirectToStorage(file, { bucket: 'wedding-cover-photos' });
          uploadedUrls.push(url);
        } catch (err) {
          console.warn('Failed to upload a gallery photo:', err);
        }
      }

      if (uploadedUrls.length > 0) {
        setGalleryPhotos((prev) => [...prev, ...uploadedUrls].slice(0, 10));
      }
    } finally {
      setIsUploadingGalleryPhoto(false);
    }
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

  useEffect(() => {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const stepParam = searchParams.get('step');
    const refParam = searchParams.get('reference') || searchParams.get('trxref');

    if ((stepParam === 'payment-return' || refParam) && refParam) {
      setSelectedTier('premium');
      verifyReturnPayment(refParam);
    }
  }, []);

  const verifyReturnPayment = async (ref: string) => {
    setIsLoading(true);
    setError(null);
    setStep(5);

    try {
      const verRes = await verifyWeddingPaymentApi(ref);
      if (verRes.success && verRes.wedding) {
        setCreatedShareUrl(verRes.shareUrl || `/w/wedding/${verRes.wedding.slug}`);
        setCreatedWeddingId(verRes.wedding.id);
        setStep(6);

        if (typeof window !== 'undefined' && window.history?.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        throw new Error('Payment verification was not successful.');
      }
    } catch (err: unknown) {
      console.error('Error verifying returned wedding payment:', err);
      const msg = err instanceof Error ? err.message : 'Payment verification failed. Please try again.';
      setError(msg);
      setStep(5);
    } finally {
      setIsLoading(false);
    }
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
      tier: 'premium',
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
      music_source_type: musicSourceType,
      music_external_id: musicExternalId,
      music_external_meta: musicExternalMeta,
      gallery_photos: galleryPhotos,
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
      if (payRes.authorization_url) {
        window.location.href = payRes.authorization_url;
      } else {
        throw new Error('Failed to initialize Paystack checkout.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process payment checkout.';
      setError(msg);
      setIsLoading(false);
    }
  };

  // Free Tier Card Submission
  const handleCreateFreeCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!freeBrideFirstName.trim() || !freeGroomFirstName.trim()) {
      setError("Please provide both Bride's and Groom's first names.");
      return;
    }

    setIsLoading(true);
    try {
      await createFreeWeddingApi({
        theme_id: freeThemeId,
        bride_first_name: freeBrideFirstName.trim(),
        groom_first_name: freeGroomFirstName.trim(),
        event_date: freeWeddingDate.trim(),
      });
      setFreeStep(3);
    } catch (err: unknown) {
      console.warn('Free card endpoint notice:', err);
      // Even if API fails or running offline, allow card rendering & download
      setFreeStep(3);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger rasterized image download with watermark enabled and 800px width cap
  const handleDownloadCardImage = async (format: 'jpeg' | 'png') => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    setError(null);
    try {
      await downloadCard(cardRef.current, format, {
        watermark: true,
        maxWidth: 800,
        filename: `${freeBrideFirstName.toLowerCase()}-and-${freeGroomFirstName.toLowerCase()}-save-the-date`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to download card image.';
      setError(msg);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEFE] text-maroon font-sans py-12 px-4 sm:px-6 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        {/* STEP 0: TIER CHOICE SELECTION */}
        {selectedTier === null && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="eyebrow-pill mb-3 mx-auto">
                <span>Select Package Tier</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon mb-2">
                Create Your Wedding Experience
              </h1>
              <p className="text-xs sm:text-sm text-mauve max-w-md mx-auto">
                Choose between a fast Save-the-Date static card download or a full interactive invitation suite.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Option A: Free Tier */}
              <div
                onClick={() => {
                  setSelectedTier('free');
                  setFreeStep(1);
                }}
                className="p-6 rounded-3xl border-2 border-cream-border bg-cream-card hover:border-maroon transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                      Free Tier
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-maroon mb-1">
                    Free Save-the-Date Card
                  </h3>
                  <p className="text-xs text-mauve mb-4 leading-relaxed">
                    Designed for quick sharing. Pick a theme, enter couple names & date, and download a ready-to-send card image.
                  </p>
                  <ul className="space-y-2 text-xs text-maroon mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Choice of 2 curated base themes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant JPEG & PNG download</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Watermarked (800px max width)</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  className="w-full py-3 rounded-full bg-cream border border-maroon/30 group-hover:bg-maroon group-hover:text-cream text-maroon text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Start Free Flow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Option B: Premium Tier */}
              <div
                onClick={() => {
                  setSelectedTier('premium');
                  setStep(1);
                }}
                className="p-6 rounded-3xl border-2 border-coral/50 bg-cream-card hover:border-coral transition-all cursor-pointer shadow-md hover:shadow-lg flex flex-col justify-between relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Recommended
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-coral/10 text-coral text-[11px] font-bold uppercase tracking-wider">
                      {WEDDING_PLAN_PRICE_FORMATTED}
                    </span>
                    <Heart className="w-5 h-5 text-coral group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-maroon mb-1">
                    Premium Invitation Suite
                  </h3>
                  <p className="text-xs text-mauve mb-4 leading-relaxed">
                    Full interactive digital invitation with guest RSVP tracking, multi-event schedule & personalized guest links.
                  </p>
                  <ul className="space-y-2 text-xs text-maroon mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                      <span>All themes, color & font variants</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                      <span>Multi-event schedule & RSVP management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                      <span>Love story, gift registry & music</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-coral shrink-0" />
                      <span>No watermark & custom shareable link</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  className="w-full py-3 rounded-full bg-maroon text-cream text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Choose Premium ({WEDDING_PLAN_PRICE_FORMATTED})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FREE TIER FLOW */}
        {selectedTier === 'free' && (
          <div className="w-full">
            {/* Header & Back to Tier Selection */}
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={() => {
                  if (freeStep > 1) {
                    setFreeStep((prev) => prev - 1);
                  } else {
                    setSelectedTier(null);
                  }
                }}
                className="text-xs font-semibold text-mauve hover:text-maroon flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Change Tier
              </button>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Free Save-the-Date Card (Step {freeStep} of 3)
              </span>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="font-semibold">Error:</span> {error}
              </div>
            )}

            <div className="glass-card p-6 sm:p-8 rounded-3xl border border-cream-border shadow-xl bg-cream-card">
              {/* FREE STEP 1: Select between exactly 2 themes */}
              {freeStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-maroon mb-1">Select Free Theme</h2>
                    <p className="text-xs text-mauve">Choose between our 2 free-tier Save-the-Date theme options.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {FREE_THEMES.map((tId) => {
                      const t = WEDDING_THEMES[tId];
                      if (!t) return null;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setFreeThemeId(t.id)}
                          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                            freeThemeId === t.id
                              ? 'border-maroon bg-cream/90 shadow-md scale-[1.01]'
                              : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: t.accentColor }}
                            />
                            <div>
                              <h3 className="font-serif text-base font-bold text-maroon">{t.name}</h3>
                              <p className="text-xs text-mauve mt-0.5">{t.description}</p>
                            </div>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 border-maroon flex items-center justify-center shrink-0">
                            {freeThemeId === t.id && <div className="w-2.5 h-2.5 rounded-full bg-maroon" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-cream-border flex justify-end">
                    <button
                      type="button"
                      onClick={() => setFreeStep(2)}
                      className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Next: Enter Details</span>
                      <ArrowRight className="w-4 h-4 text-coral" />
                    </button>
                  </div>
                </div>
              )}

              {/* FREE STEP 2: Minimal details (Couple first names + Wedding date only) */}
              {freeStep === 2 && (
                <form onSubmit={handleCreateFreeCard} className="space-y-6">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-maroon mb-1">Couple Details & Wedding Date</h2>
                    <p className="text-xs text-mauve">Enter your first names and celebration date for the Save-the-Date card.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-maroon mb-1">Bride's First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Temilolu"
                        value={freeBrideFirstName}
                        onChange={(e) => setFreeBrideFirstName(e.target.value)}
                        className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-maroon mb-1">Groom's First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Juwon"
                        value={freeGroomFirstName}
                        onChange={(e) => setFreeGroomFirstName(e.target.value)}
                        className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-maroon mb-1">Wedding Date (Optional)</label>
                    <input
                      type="date"
                      value={freeWeddingDate}
                      onChange={(e) => setFreeWeddingDate(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral cursor-pointer"
                    />
                  </div>

                  <div className="pt-4 border-t border-cream-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setFreeStep(1)}
                      className="px-5 py-2.5 rounded-full bg-cream text-maroon border border-cream-border text-xs font-medium cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!freeBrideFirstName.trim() || !freeGroomFirstName.trim() || isLoading}
                      className="px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>{isLoading ? 'Generating Card...' : 'Generate Card Preview'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* FREE STEP 3: Render StaticInviteCard with Watermark & Download buttons */}
              {freeStep === 3 && (
                <div className="space-y-6 text-center">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-maroon mb-1">
                      Your Save-the-Date Card is Ready!
                    </h2>
                    <p className="text-xs text-mauve max-w-sm mx-auto">
                      Download your watermarked card below as a JPEG or PNG file ready for sharing.
                    </p>
                  </div>

                  {/* Rendered Static Card Frame */}
                  <div className="py-2 overflow-hidden flex justify-center">
                    <StaticInviteCard
                      cardRef={cardRef}
                      brideFirstName={freeBrideFirstName}
                      groomFirstName={freeGroomFirstName}
                      weddingDate={freeWeddingDate}
                      themeId={freeThemeId}
                      template={selectedTemplate}
                      watermark={true}
                    />
                  </div>

                  {/* Watermark & Resolution Cap Notice */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
                    <span>Free Tier Output: Watermarked "Made with Amorah" mark & 800px maximum width.</span>
                  </div>

                  {/* Download Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownloadCardImage('jpeg')}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 text-coral" />
                      <span>{isDownloading ? 'Exporting JPEG...' : 'Download JPEG (800px)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownloadCardImage('png')}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-cream-card text-maroon border border-cream-border font-semibold text-xs shadow-sm hover:bg-cream transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Image className="w-4 h-4 text-coral" />
                      <span>{isDownloading ? 'Exporting PNG...' : 'Download PNG (800px)'}</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-cream-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFreeStep(2);
                      }}
                      className="text-xs font-semibold text-mauve hover:text-maroon"
                    >
                      Edit Card Details
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTier('premium');
                        setStep(1);
                      }}
                      className="text-xs font-bold text-coral hover:underline flex items-center gap-1"
                    >
                      Upgrade to Premium ({WEDDING_PLAN_PRICE_FORMATTED}) for RSVP & full invitation suite <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PREMIUM TIER FLOW (UNCHANGED FULL MULTI-STEP INVITATION SUITE) */}
        {selectedTier === 'premium' && (
          <div className="w-full">
            {/* Header & Step Indicator */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-start mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (step > 1) {
                      setStep((prev) => prev - 1);
                    } else {
                      setSelectedTier(null);
                    }
                  }}
                  className="text-xs font-semibold text-mauve hover:text-maroon flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Tier
                </button>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-maroon mb-2">
                Create Your Premium Wedding Invitation
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
                              {themeAssets[t.id]?.cover_background_url && (
                                <span className="inline-flex items-center text-[10px] font-semibold text-coral bg-coral/10 px-2.5 py-0.5 rounded-full mt-2 border border-coral/20">
                                  Photographic Backdrop Included
                                </span>
                              )}
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
                            className="absolute top-1 right-1 bg-maroon/80 text-cream text-[10px] p-1 rounded-full cursor-pointer"
                          >
                            ✕
                          </button>
                          {isUploadingCoverPhoto && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-semibold gap-1">
                              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                              <span>Uploading...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="w-full p-6 border-2 border-dashed border-cream-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-cream/60 transition-colors relative overflow-hidden">
                          {isUploadingCoverPhoto ? (
                            <div className="flex flex-col items-center justify-center py-2 text-maroon">
                              <Sparkles className="w-6 h-6 animate-spin text-coral mb-2" />
                              <span className="text-xs font-semibold">Uploading Cover Photo to Storage...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-mauve mb-2" />
                              <span className="text-xs font-semibold text-maroon">Upload Cover Photo</span>
                              <span className="text-[10px] text-mauve mt-1">PNG, JPG up to 10MB</span>
                              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingCoverPhoto} className="hidden" />
                            </>
                          )}
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

                  {/* Pre-Wedding Photo Gallery Upload (Up to 10 photos) */}
                  <div className="space-y-3 pt-3 border-t border-cream-border">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-maroon uppercase tracking-wider flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-coral" /> Pre-Wedding Photo Gallery ({galleryPhotos.length} / 10)
                      </label>
                      <span className="text-[11px] text-mauve">PNG, JPG up to 10MB each</span>
                    </div>

                    {galleryPhotos.length < 10 && (
                      <label className="w-full p-4 border-2 border-dashed border-cream-border hover:border-coral rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-cream/30 hover:bg-cream/70 transition-all">
                        {isUploadingGalleryPhoto ? (
                          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-maroon py-1">
                            <Sparkles className="w-4 h-4 animate-spin text-coral" />
                            <span>Uploading Gallery Photos to Storage...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-mauve mb-1" />
                            <span className="text-xs font-semibold text-maroon">Add Pre-Wedding Photos</span>
                            <span className="text-[10px] text-mauve mt-0.5">Select up to 10 photos for your gallery grid</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={isUploadingGalleryPhoto}
                              onChange={handleGalleryPhotoUpload}
                              className="hidden"
                            />
                          </>
                        )}
                      </label>
                    )}

                    {galleryPhotos.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                        {galleryPhotos.map((photoUrl, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-cream-border group">
                            <img src={photoUrl} alt={`Gallery photo ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setGalleryPhotos((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-maroon/80 text-cream text-[10px] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Background Song Selection (Curated or Spotify/YouTube Link) */}
                  <div className="space-y-4 pt-3 border-t border-cream-border">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-maroon uppercase tracking-wider flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-coral" /> Background Love Song
                      </label>
                    </div>

                    {/* Toggle between Curated Tracks and Custom Link */}
                    <div className="flex items-center gap-2 p-1 rounded-2xl bg-cream-card border border-cream-border">
                      <button
                        type="button"
                        onClick={() => {
                          setMusicSourceType('curated');
                          setMusicValidationError(null);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          musicSourceType === 'curated'
                            ? 'bg-maroon text-cream shadow-sm'
                            : 'text-mauve hover:text-maroon'
                        }`}
                      >
                        Choose from our tracks
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validatedMusicPlatform) {
                            setMusicSourceType(validatedMusicPlatform);
                          } else {
                            setMusicSourceType('spotify');
                          }
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          musicSourceType !== 'curated'
                            ? 'bg-maroon text-cream shadow-sm'
                            : 'text-mauve hover:text-maroon'
                        }`}
                      >
                        Link your own song (Spotify / Apple Music / SoundCloud)
                      </button>
                    </div>

                    {/* Option 1: Curated Music Grid */}
                    {musicSourceType === 'curated' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {Object.values(CURATED_MUSIC_TRACKS).map((track) => (
                          <div
                            key={track.id}
                            onClick={() => setMusicTrack(track.id)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              musicTrack === track.id
                                ? 'border-maroon bg-cream/90 shadow-sm font-bold'
                                : 'border-cream-border bg-cream/40 hover:bg-cream/70'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase font-semibold text-coral">{track.genre}</span>
                                <div className="w-4 h-4 rounded-full border border-maroon flex items-center justify-center">
                                  {musicTrack === track.id && <div className="w-2 h-2 rounded-full bg-maroon" />}
                                </div>
                              </div>
                              <p className="text-xs font-serif font-bold text-maroon leading-snug">{track.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Option 2: Custom Song URL (Spotify, Apple Music, SoundCloud) */
                      <div className="space-y-3 p-4 rounded-2xl bg-cream-card/60 border border-cream-border">
                        <div>
                          <label className="block text-xs font-semibold text-maroon mb-1">
                            Spotify, Apple Music, or SoundCloud Song Link
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              placeholder="Paste link e.g. https://open.spotify.com/track/... or https://music.apple.com/... or https://soundcloud.com/..."
                              value={customMusicUrl}
                              onChange={(e) => handleValidateCustomMusicUrl(e.target.value)}
                              className="w-full p-3 rounded-xl bg-cream border border-cream-border text-maroon text-xs focus:outline-none focus:border-coral placeholder:text-mauve/60 pr-10"
                            />
                            {isValidatingMusic && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <RefreshCw className="w-4 h-4 text-coral animate-spin" />
                              </div>
                            )}
                          </div>
                          {musicValidationError && (
                            <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{musicValidationError}</span>
                            </p>
                          )}
                        </div>

                        {/* Live Detected Preview Widget */}
                        {validatedMusicPlatform && (musicExternalId || musicExternalMeta) && (
                          <div className="space-y-2 pt-2 border-t border-cream-border/60">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {validatedMusicPlatform === 'spotify' && 'Spotify Track Validated'}
                                {validatedMusicPlatform === 'apple_music' && 'Apple Music Song Validated'}
                                {validatedMusicPlatform === 'soundcloud' && 'SoundCloud Track Validated'}
                              </span>
                            </div>

                            {/* Embedded Live Preview */}
                            <div className="rounded-xl overflow-hidden border border-cream-border bg-black/90 shadow-md">
                              {validatedMusicPlatform === 'spotify' && musicExternalId && (
                                <iframe
                                  src={`https://open.spotify.com/embed/track/${musicExternalId}?utm_source=generator&theme=0`}
                                  width="100%"
                                  height="80"
                                  frameBorder="0"
                                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                  loading="lazy"
                                  title="Spotify Song Preview"
                                />
                              )}
                              {validatedMusicPlatform === 'apple_music' && (
                                <iframe
                                  src={`https://embed.music.apple.com/${musicExternalMeta?.country || 'us'}/album/${musicExternalMeta?.albumId || ''}?i=${musicExternalMeta?.songId || musicExternalId || ''}`}
                                  width="100%"
                                  height="175"
                                  frameBorder="0"
                                  allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                                  loading="lazy"
                                  title="Apple Music Song Preview"
                                />
                              )}
                              {validatedMusicPlatform === 'soundcloud' && (
                                <iframe
                                  src={musicExternalMeta?.embedUrl || `https://w.soundcloud.com/player/?url=${encodeURIComponent(musicExternalMeta?.trackUrl || customMusicUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
                                  width="100%"
                                  height="166"
                                  frameBorder="0"
                                  allow="autoplay"
                                  loading="lazy"
                                  title="SoundCloud Song Preview"
                                />
                              )}
                            </div>
                          </div>
                        )}

                        {/* Expectation Copy Note */}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-maroon/90 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5 text-amber-900">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Embedded Player Expectations:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-mauve text-[10.5px]">
                            <li><strong>Spotify & Apple Music:</strong> Plays a 30-second preview unless guests have an active subscription session in their browser.</li>
                            <li><strong>SoundCloud:</strong> Plays the full track if the uploader has made it publicly streamable.</li>
                          </ul>
                        </div>
                      </div>
                    )}
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
        )}
      </div>
    </div>
  );
};
