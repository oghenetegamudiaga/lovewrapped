import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Calendar, MapPin, Check, Heart, Gift, MessageSquare, Send, Clock, UserCheck, AlertCircle, UserPlus, Download, ExternalLink, X, Image, Camera, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Wedding, WeddingEvent, WeddingTheme, WeddingGuest, ThemeAssetsMap } from '../types';
import { getWeddingTheme, resolveThemeStyles } from '../config/weddingThemes';
import { submitWeddingRsvpApi, getPublicThemeAssetsApi } from '../lib/api';
import { StaticInviteCard } from './StaticInviteCard';
import { downloadCard } from '../lib/downloadCard';
import { MusicPlayerToggle } from './MusicPlayerToggle';

interface WeddingInvitationViewerProps {
  wedding?: Wedding | null;
  events?: WeddingEvent[];
  event?: WeddingEvent | null;
  guest?: WeddingGuest | null;
  theme?: WeddingTheme | null;
  slug?: string;
  onNavigate?: (path: string) => void;
  isSpike?: boolean;
}

// Helper to parse date strings into Date objects
function parseEventDate(dateStr: string, timeStr?: string): Date {
  if (!dateStr) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const timePart = timeStr && /^\d{2}:\d{2}/.test(timeStr) ? timeStr : '10:00';
      const d = new Date(`${dateStr}T${timePart}:00`);
      if (!isNaN(d.getTime())) return d;
    }

    const combined = `${dateStr} ${timeStr || '10:00 AM'}`;
    const d = new Date(combined);
    if (!isNaN(d.getTime())) return d;

    const pureD = new Date(dateStr);
    if (!isNaN(pureD.getTime())) return pureD;
  } catch (e) {
    // fallback
  }
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // fallback +30 days
}

// Helper to format ISO dates into human readable strings
function formatEventDateTime(dateStr: string, timeStr?: string): { formattedDate: string; formattedTime: string; fullString: string } {
  try {
    if (dateStr) {
      const dateObj = parseEventDate(dateStr, timeStr);
      if (!isNaN(dateObj.getTime())) {
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }).format(dateObj);

        let formattedTime = '';
        if (timeStr && /^\d{2}:\d{2}/.test(timeStr)) {
          const [hh, mm] = timeStr.split(':').map(Number);
          const timeObj = new Date(2026, 0, 1, hh, mm);
          formattedTime = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(timeObj);
        } else {
          formattedTime = timeStr || '';
        }

        return {
          formattedDate,
          formattedTime,
          fullString: formattedTime ? `${formattedDate} at ${formattedTime}` : formattedDate,
        };
      }
    }
  } catch (e) {
    // fallback
  }
  return {
    formattedDate: dateStr || '',
    formattedTime: timeStr || '',
    fullString: `${dateStr}${timeStr ? ' at ' + timeStr : ''}`,
  };
}

// Helper to format ISO dates for Google Calendar URLs
function formatGoogleCalendarDate(d: Date): string {
  return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

// Helper to generate iCalendar (.ics) download file Blob
function downloadIcsFile(ev: WeddingEvent, coupleNames: string) {
  const startDate = parseEventDate(ev.date, ev.time);
  const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

  const startStr = formatGoogleCalendarDate(startDate);
  const endStr = formatGoogleCalendarDate(endDate);

  const location = `${ev.venue_name}${ev.venue_address ? `, ${ev.venue_address}` : ''}`;
  const title = `${coupleNames} - ${ev.title}`;

  const csContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amorah Weddings//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Wedding Celebration for ${coupleNames.replace(/,/g, '\\,')}`,
    `LOCATION:${location.replace(/,/g, '\\,')}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([csContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${ev.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const WeddingInvitationViewer: React.FC<WeddingInvitationViewerProps> = ({
  wedding,
  events: propEvents,
  event: singleEvent,
  guest,
  theme: customTheme,
  slug,
  onNavigate,
  isSpike = false,
}) => {
  const [stage, setStage] = useState<'loading' | 'cover' | 'unsealing' | 'ready'>(
    isSpike ? 'ready' : 'loading'
  );
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isUnsealing, setIsUnsealing] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Dynamic Theme & Variant Styles Computation
  const themeStyles = resolveThemeStyles(
    wedding?.theme_id,
    wedding?.color_variant,
    wedding?.font_variant
  );

  const activeThemeId = wedding?.theme_id || 'classic-burgundy';
  const activeTheme = customTheme || themeStyles.baseTheme;
  const accentColor = themeStyles.accentColor;
  const secondaryColor = themeStyles.secondaryColor;
  const serifClass = themeStyles.serifClass;
  const sansClass = themeStyles.sansClass;

  // Section Order Resolution (Default fallback if missing)
  const sectionOrder = (wedding?.section_order && wedding.section_order.length > 0)
    ? wedding.section_order
    : ['schedule', 'love_story', 'registry', 'rsvp'];

  // Normalize multi-event array
  const activeEvents: WeddingEvent[] = useMemo(() => {
    return propEvents && propEvents.length > 0
      ? propEvents
      : singleEvent
      ? [singleEvent]
      : [
          {
            id: 'demo-ev-1',
            wedding_id: 'demo',
            title: 'Wedding Celebration & Reception',
            date: 'December 18, 2026',
            time: '10:00 AM',
            venue_name: 'Eko Grand Ballroom',
            venue_address: 'Victoria Island, Lagos, Nigeria',
            created_at: new Date().toISOString(),
          },
        ];
  }, [propEvents, singleEvent]);

  // RSVP Form state
  const [guestName, setGuestName] = useState(guest?.name || '');
  const [hasPlusOne, setHasPlusOne] = useState(!!guest?.plus_one_name);
  const [plusOneName, setPlusOneName] = useState(guest?.plus_one_name || '');
  const [dietaryNotes, setDietaryNotes] = useState(guest?.dietary_notes || '');
  const [message, setMessage] = useState('');

  const [eventAttendance, setEventAttendance] = useState<{ [eventId: string]: boolean }>(() => {
    const initial: { [eventId: string]: boolean } = {};
    activeEvents.forEach((ev) => {
      initial[ev.id] = true;
    });
    return initial;
  });

  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [isDownloadingCard, setIsDownloadingCard] = useState<boolean>(false);
  const [themeAssets, setThemeAssets] = useState<ThemeAssetsMap>({});
  const [coverPhotoStatus, setCoverPhotoStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [activeView, setActiveView] = useState<'photo_hero' | 'details' | 'card_download'>('photo_hero');
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const personalizedCardRef = useRef<HTMLDivElement>(null);

  // Name display computation (First Names for primary cards, Full Names for legal/details)
  const firstNames = wedding?.bride_first_name && wedding?.groom_first_name
    ? `${wedding.bride_first_name} & ${wedding.groom_first_name}`
    : (wedding?.couple_names ? wedding.couple_names.split('&').map((n) => n.trim().split(' ')[0]).join(' & ') : 'Becky & Martins');

  const fullCoupleNames = wedding?.bride_first_name && wedding?.groom_first_name
    ? `${wedding.bride_first_name}${wedding.bride_other_names ? ' ' + wedding.bride_other_names : ''} & ${wedding.groom_first_name}${wedding.groom_other_names ? ' ' + wedding.groom_other_names : ''}`
    : (wedding?.couple_names || 'Becky & Martins');

  const coupleNames = firstNames;
  const coverPhoto = wedding?.cover_photo_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';
  const loveStory = wedding?.love_story || 'From quiet morning walks to a lifetime of laughter, we are overjoyed to celebrate our special day with the people who mean the world to us.';
  const registryInfo = wedding?.registry_info || 'Your presence at our wedding is the greatest gift of all. If you wish to honor us with a gift, a monetary contribution towards our new home would be warmly appreciated.';

  const nameParts = firstNames.split('&').map((n) => n.trim());
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]} & ${nameParts[1][0]}` : 'B & M';

  const galleryPhotosList = React.useMemo(() => {
    const list: string[] = [];
    if (wedding?.gallery_photos && Array.isArray(wedding.gallery_photos)) {
      wedding.gallery_photos.forEach((p) => {
        if (typeof p === 'string' && p.trim()) list.push(p.trim());
      });
    }
    if (list.length === 0 && coverPhoto && coverPhoto.trim()) {
      list.push(coverPhoto.trim());
    }
    return list;
  }, [wedding?.gallery_photos, coverPhoto]);

  useEffect(() => {
    if (coverPhoto && coverPhoto.trim().length > 0) {
      console.log('[WeddingInvitationViewer] Cover photo URL set:', coverPhoto);
      setCoverPhotoStatus('loading');
    } else {
      console.log('[WeddingInvitationViewer] No cover photo set; using theme pattern fallback.');
      setCoverPhotoStatus('error');
    }
  }, [coverPhoto]);

  const getSanitizedRegistryUrl = (rawUrl?: string | null): string | null => {
    if (!rawUrl || !rawUrl.trim()) return null;
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.includes(':') && !trimmed.startsWith('http')) return null;
    return `https://${trimmed}`;
  };

  const hasRegistryInfo = !!(
    (wedding?.registry_url && wedding.registry_url.trim().length > 0) ||
    (wedding?.registry_info && wedding.registry_info.trim().length > 0) ||
    isSpike
  );

  useEffect(() => {
    if (isSpike) return;

    let isMounted = true;
    const startTime = Date.now();
    const minDuration = 1800; // 1.8s minimum smooth loading sequence

    const assetsPromise = getPublicThemeAssetsApi()
      .then((assets) => {
        if (isMounted) setThemeAssets(assets);
      })
      .catch(() => {});

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min(100, Math.floor((elapsed / minDuration) * 100));

      if (isMounted) {
        setLoadingProgress(progressPercent);
      }

      if (elapsed >= minDuration) {
        clearInterval(interval);
        assetsPromise.finally(() => {
          if (isMounted) {
            setLoadingProgress(100);
            setTimeout(() => {
              if (isMounted) {
                setStage('cover');
              }
            }, 200);
          }
        });
      }
    }, 40);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isSpike]);

  const handleDownloadPersonalizedCard = async (format: 'jpeg' | 'png') => {
    if (!personalizedCardRef.current) return;
    setIsDownloadingCard(true);
    try {
      const gName = guestName.trim() || guest?.name || 'Honored Guest';
      await downloadCard(personalizedCardRef.current, format, {
        watermark: false, // Premium - no watermark
        filename: `${gName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-wedding-card`,
      });
    } catch (err) {
      console.error('Error downloading personalized card:', err);
    } finally {
      setIsDownloadingCard(false);
    }
  };

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isPastAllEvents, setIsPastAllEvents] = useState<boolean>(false);
  const [targetEventTitle, setTargetEventTitle] = useState<string>('');



  // Live Countdown Interval Effect
  useEffect(() => {
    const now = Date.now();
    const sortedUpcoming = activeEvents
      .map((ev) => ({ event: ev, targetDate: parseEventDate(ev.date, ev.time) }))
      .filter((item) => item.targetDate.getTime() > now)
      .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

    if (sortedUpcoming.length === 0) {
      setIsPastAllEvents(true);
      setTimeLeft(null);
      return;
    }

    const nextEv = sortedUpcoming[0];
    setTargetEventTitle(nextEv.event.title);
    setIsPastAllEvents(false);

    const updateCountdown = () => {
      const diff = nextEv.targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setIsPastAllEvents(true);
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [activeEvents]);

  // Detect OS/Browser prefers-reduced-motion setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const isReducedMotion = prefersReducedMotion;

  const handleUnseal = () => {
    if (isUnsealing || stage !== 'cover') return;
    setIsUnsealing(true);

    if (isReducedMotion) {
      setStage('ready');
      setIsUnsealing(false);
    } else {
      setStage('unsealing');
      setTimeout(() => {
        setStage('ready');
        setIsUnsealing(false);
      }, 1200);
    }
  };

  const handleReplay = () => {
    setStage('cover');
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRsvpError(null);
    setRsvpSubmitting(true);

    try {
      const activeSlug = slug || wedding?.slug || 'demo';

      for (const ev of activeEvents) {
        const isAttending = eventAttendance[ev.id] ?? true;
        const totalGuests = isAttending ? (hasPlusOne && plusOneName.trim() ? 2 : 1) : 0;

        await submitWeddingRsvpApi(activeSlug, {
          guest_name: guestName,
          attending: isAttending,
          guest_count: totalGuests,
          plus_one_name: hasPlusOne && plusOneName.trim() ? plusOneName.trim() : undefined,
          dietary_notes: dietaryNotes,
          message,
          guest_id: guest?.id,
          event_id: ev.id,
        });
      }

      setRsvpSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit RSVP. Please try again.';
      setRsvpError(msg);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // Render individual Scene 4 sections dynamically based on sectionOrder
  const renderSectionByKey = (sectionKey: string) => {
    switch (sectionKey) {
      case 'schedule':
        return (
          <div key="schedule" id="details-section" className={`space-y-4 ${sansClass}`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${serifClass}`} style={{ color: secondaryColor }}>
              <Calendar className="w-4 h-4" style={{ color: accentColor }} /> Event Schedule & Locations
            </h3>

            {activeEvents.map((ev, idx) => {
              const formattedDT = formatEventDateTime(ev.date, ev.time);
              const startDate = parseEventDate(ev.date, ev.time);
              const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
              const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                `${coupleNames} - ${ev.title}`
              )}&dates=${formatGoogleCalendarDate(startDate)}/${formatGoogleCalendarDate(endDate)}&location=${encodeURIComponent(
                `${ev.venue_name}, ${ev.venue_address || ''}`
              )}&details=${encodeURIComponent(`Wedding Celebration for ${fullCoupleNames}`)}`;

              const mapQuery = `${ev.venue_name}${ev.venue_address ? `, ${ev.venue_address}` : ''}`;

              return (
                <div
                  key={ev.id || idx}
                  className="p-4 sm:p-5 rounded-2xl border space-y-4 text-xs shadow-md"
                  style={{ backgroundColor: activeTheme.bgColor, borderColor: `${accentColor}40` }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: accentColor }}>
                        Event #{idx + 1}
                      </span>
                      <h4 className={`text-base font-bold mt-0.5 ${serifClass}`} style={{ color: secondaryColor }}>
                        {ev.title}
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-2 opacity-90">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                      <span>{formattedDT.fullString}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
                      <div>
                        <p className="font-semibold" style={{ color: secondaryColor }}>{ev.venue_name}</p>
                        {ev.venue_address && <p className="text-[11px] opacity-75">{ev.venue_address}</p>}
                      </div>
                    </div>
                  </div>

                  {/* GOOGLE MAPS EMBED IFRAME */}
                  <div className="rounded-2xl overflow-hidden border border-white/10" style={{ backgroundColor: activeTheme.bgColor }}>
                    <iframe
                      title={`Map location for ${ev.venue_name}`}
                      width="100%"
                      height="160"
                      frameBorder="0"
                      style={{ border: 0, borderRadius: '1rem' }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    />
                  </div>

                  {/* ADD TO CALENDAR BUTTONS */}
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-semibold" style={{ color: accentColor }}>Add to Calendar:</span>
                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border hover:opacity-90 flex items-center gap-1 transition-all"
                      style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}40`, color: accentColor }}
                    >
                      <ExternalLink className="w-3 h-3" /> Google Calendar
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(ev, coupleNames)}
                      className="px-3 py-1.5 rounded-xl border hover:opacity-90 flex items-center gap-1 transition-all cursor-pointer"
                      style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}40`, color: accentColor }}
                    >
                      <Download className="w-3 h-3" /> Apple / Outlook (.ics)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'love_story':
        if (!loveStory) return null;
        return (
          <div key="love_story" className={`space-y-2 ${sansClass}`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${serifClass}`} style={{ color: secondaryColor }}>
              <Heart className="w-4 h-4 fill-current" style={{ color: accentColor }} /> Our Story
            </h3>
            <p
              className="text-xs opacity-90 leading-relaxed italic p-4 rounded-2xl border"
              style={{ backgroundColor: activeTheme.bgColor, borderColor: `${accentColor}30` }}
            >
              "{loveStory}"
            </p>
          </div>
        );

      case 'registry':
        if (!registryInfo) return null;
        return (
          <div key="registry" id="registry-section" className={`space-y-2 ${sansClass}`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 ${serifClass}`} style={{ color: secondaryColor }}>
              <Gift className="w-4 h-4" style={{ color: accentColor }} /> Gift Registry & Wishlist
            </h3>
            <div
              className="p-4 rounded-2xl border text-xs opacity-90 leading-relaxed whitespace-pre-line"
              style={{ backgroundColor: activeTheme.bgColor, borderColor: `${accentColor}30` }}
            >
              {registryInfo}
            </div>
          </div>
        );

      case 'gallery':
        const galleryPhotos = wedding?.gallery_photos || [];
        return (
          <div key="gallery" id="gallery-section" className={`space-y-4 pt-4 border-t border-white/10 ${sansClass}`}>
            <div className="text-center space-y-1">
              <h3 className={`text-xl font-bold ${serifClass}`} style={{ color: secondaryColor }}>
                Pre-Wedding Gallery
              </h3>
              <p className="text-xs opacity-75">
                Moments & memories from our journey together.
              </p>
            </div>

            {galleryPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {galleryPhotos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxPhoto(photoUrl)}
                    className="relative aspect-square rounded-2xl overflow-hidden border cursor-pointer group shadow-md"
                    style={{ borderColor: `${accentColor}40` }}
                  >
                    <img
                      src={photoUrl}
                      alt={`Pre-wedding photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl border text-center opacity-75" style={{ backgroundColor: activeTheme.bgColor, borderColor: `${accentColor}30` }}>
                <p className="text-xs italic">Pre-wedding photos coming soon!</p>
              </div>
            )}
          </div>
        );

      case 'rsvp':
        return null;

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative ${stage !== 'unveiled' || isSpike ? 'h-full min-h-screen w-full p-0' : 'min-h-screen p-4 sm:p-6'} text-[#FDFBF7] ${sansClass} overflow-y-auto flex flex-col items-center justify-center select-none`}
      style={{ backgroundColor: activeTheme.bgColor }}
    >

      <div
        className={`relative ${stage !== 'unveiled' || isSpike ? 'h-full min-h-screen w-full rounded-none border-0 shadow-none' : 'max-w-md w-full min-h-[640px] sm:min-h-[740px] rounded-3xl border shadow-2xl'} overflow-hidden flex flex-col`}
        style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}50` }}
      >
        {/* Animated Cover, Loading Sequence & 3D Opening Doors */}
        <AnimatePresence mode="wait">
          {stage === 'loading' && (
            <motion.div
              key="loading-layer"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
              style={{ backgroundColor: activeTheme.bgColor }}
            >
              {/* Subtle Material Grain Texture Overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
                <filter id="loader-noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#loader-noise)" />
              </svg>

              <div className="relative z-10 flex flex-col items-center gap-6 max-w-xs mx-auto">
                {/* Centered Monogram Ring Emblem */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center shadow-xl"
                  style={{
                    borderColor: `${accentColor}80`,
                    backgroundColor: `${activeTheme.cardBgColor}80`,
                  }}
                >
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-dashed flex items-center justify-center"
                    style={{ borderColor: `${accentColor}50` }}
                  >
                    <span
                      className={`font-serif font-bold text-lg sm:text-xl tracking-widest ${serifClass}`}
                      style={{ color: accentColor }}
                    >
                      {initials}
                    </span>
                  </div>
                </motion.div>

                {/* Thin Horizontal Linear Progress Bar */}
                <div className="w-40 sm:w-48 h-0.5 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className="h-full transition-all duration-75 ease-linear rounded-full"
                    style={{
                      width: `${loadingProgress}%`,
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${accentColor}AA`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {stage === 'cover' && (
            <motion.div
              key="cover-layer"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 text-center overflow-hidden [perspective:1200px]"
              style={{ backgroundColor: activeTheme.bgColor }}
            >
              {/* Material Texture Overlay: Subtle Paper/Fabric Noise */}
              <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none z-1 mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
                <filter id="paper-noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter="url(#paper-noise)" />
              </svg>

              {/* Ornate Vertical Seam / Ribbon Divider */}
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 sm:w-1.5 z-10 pointer-events-none shadow-[0_0_12px_rgba(0,0,0,0.5)]"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`,
                  opacity: 0.8,
                }}
              />

              {/* 3D Swinging Door Panels (Scene 2 Transition) */}
              {!isReducedMotion && (
                <>
                  <motion.div
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: stage !== 'cover' ? -105 : 0, opacity: stage === 'view_prompt' ? 0 : 1 }}
                    transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1] }}
                    className="absolute inset-y-0 left-0 w-1/2 border-r z-20 pointer-events-none shadow-2xl"
                    style={{
                      backgroundColor: activeTheme.cardBgColor,
                      borderColor: `${accentColor}40`,
                      transformOrigin: 'left center',
                    }}
                  />
                  <motion.div
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: stage !== 'cover' ? 105 : 0, opacity: stage === 'view_prompt' ? 0 : 1 }}
                    transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1] }}
                    className="absolute inset-y-0 right-0 w-1/2 border-l z-20 pointer-events-none shadow-2xl"
                    style={{
                      backgroundColor: activeTheme.cardBgColor,
                      borderColor: `${accentColor}40`,
                      transformOrigin: 'right center',
                    }}
                  />
                </>
              )}

              {/* Minimal & Premium Opening State: Tactile 3D Wax Seal + CTA Only */}
              {stage === 'cover' && (
                <div className="relative z-30 my-auto flex flex-col items-center justify-center gap-6">
                  {/* Tactile 3D Embossed Wax Seal Button */}
                  <div className="relative flex items-center justify-center">
                    {!isReducedMotion && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 -m-4 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${accentColor}40 0%, transparent 70%)`,
                        }}
                      />
                    )}

                    <motion.button
                      type="button"
                      disabled={isUnsealing || stage !== 'cover'}
                      onClick={handleUnseal}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full cursor-pointer flex items-center justify-center shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-4px_8px_rgba(0,0,0,0.5)] border-2 transition-transform disabled:pointer-events-none"
                      style={{
                        backgroundColor: activeTheme.cardBgColor,
                        borderColor: accentColor,
                      }}
                    >
                      {/* Outer Stamp Rim */}
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"
                        style={{
                          borderColor: `${accentColor}70`,
                          backgroundColor: `${activeTheme.bgColor}D9`,
                        }}
                      >
                        <span
                          className={`font-serif font-bold text-2xl sm:text-3xl tracking-widest ${serifClass}`}
                          style={{
                            color: accentColor,
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          {initials}
                        </span>
                      </div>
                    </motion.button>
                  </div>

                  {/* Single CTA Copy Line */}
                  <motion.p
                    animate={{ opacity: [0.65, 1, 0.65] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs sm:text-sm tracking-[0.3em] uppercase font-semibold text-center px-4"
                    style={{ color: accentColor, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
                  >
                    Click to Open Invitation
                  </motion.p>
                </div>
              )}
            </motion.div>
          )}

          {/* Phase 2: Tap-to-Open Layered Reveal Sequence */}
          {stage === 'unsealing' && (
            <motion.div
              key="unsealing-layer"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-between p-6 text-center overflow-hidden [perspective:1200px]"
              style={{ backgroundColor: activeTheme.bgColor }}
            >
              {/* Layer 1: Background Camera Push (2-3% scale up over full duration) */}
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                initial={{ scale: 1 }}
                animate={{ scale: 1.03 }}
                transition={{ duration: 2.0, ease: 'easeOut' }}
              >
                {/* Material Texture Overlay */}
                <svg className="w-full h-full opacity-15 mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
                  <filter id="unseal-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                  <rect width="100%" height="100%" filter="url(#unseal-noise)" />
                </svg>
              </motion.div>

              {/* Layer 2: Seam & Wax Seal Dissolve (Fades out & scales down over 0.5s) */}
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* Vertical Ribbon Seam */}
                <div
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 sm:w-1.5 shadow-[0_0_12px_rgba(0,0,0,0.5)]"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`,
                    opacity: 0.8,
                  }}
                />
                {/* 3D Wax Seal Emblem */}
                <div
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 flex items-center justify-center shadow-2xl"
                  style={{
                    backgroundColor: activeTheme.cardBgColor,
                    borderColor: accentColor,
                  }}
                >
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed flex items-center justify-center"
                    style={{
                      borderColor: `${accentColor}70`,
                      backgroundColor: `${activeTheme.bgColor}D9`,
                    }}
                  >
                    <span className={`font-serif font-bold text-2xl sm:text-3xl tracking-widest ${serifClass}`} style={{ color: accentColor }}>
                      {initials}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Layers 3 & 4: Staggered Content Reveal Timeline */}
              <div className="relative z-30 my-auto space-y-4 max-w-xs mx-auto text-center">
                {/* Layer 4a: Eyebrow Text (Delay 0.65s) */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.65, ease: 'easeOut' }}
                  className="text-[11px] tracking-[0.3em] uppercase font-semibold"
                  style={{ color: accentColor }}
                >
                  {guest ? `Special Invitation For ${guest.name}` : 'Together With Their Families'}
                </motion.p>

                {/* Layer 3: Title / Couple Names Glow-In (Delay 0.35s, Blur-to-Sharp & Soft Glow) */}
                <motion.div
                  initial={{ opacity: 0, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
                  className="py-1"
                >
                  <h1
                    className={`text-4xl sm:text-5xl font-bold leading-tight ${serifClass}`}
                    style={{
                      color: secondaryColor,
                      textShadow: `0 0 24px ${accentColor}AA, 0 2px 8px rgba(0,0,0,0.7)`,
                    }}
                  >
                    {coupleNames}
                  </h1>
                </motion.div>

                {/* Layer 4b: Subtitle Text (Delay 0.75s) */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.75, ease: 'easeOut' }}
                  className="text-xs opacity-80 italic font-light"
                >
                  request the honor of your presence at their wedding celebration
                </motion.p>

                {/* Layer 4c: Date Badge (Delay 0.85s) */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.85, ease: 'easeOut' }}
                  className="inline-flex py-1.5 px-3.5 rounded-full border text-[10px] items-center gap-1.5"
                  style={{ backgroundColor: `${activeTheme.bgColor}E6`, borderColor: `${accentColor}40`, color: accentColor }}
                >
                  <Calendar className="w-3 h-3" />
                  <span>
                    {(activeEvents[0] ? formatEventDateTime(activeEvents[0].date, activeEvents[0].time).formattedDate : '').toUpperCase()}
                  </span>
                </motion.div>

                {/* Layer 4d: Venue Details (Delay 0.95s) */}
                {activeEvents[0]?.venue_name && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.95, ease: 'easeOut' }}
                    className="text-[11px] opacity-75 uppercase tracking-wider font-medium"
                    style={{ color: secondaryColor }}
                  >
                    {activeEvents[0].venue_name}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene 3 & 4 (Terminal Resting State: Full-Bleed Photo Screen OR Template Details Screen) */}
        {stage === 'ready' && (
          <AnimatePresence mode="wait">
            {activeView === 'photo_hero' ? (
              /* View 1: Screen 2 (Dedicated Full-Bleed Couple Photo Hero Screen) */
              <motion.div
                key="photo-hero-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative flex-1 h-full w-full overflow-hidden flex flex-col justify-between select-none"
              >
                {/* Layer 0: Full-Bleed Viewport Photo Backdrop with Continuous Ambient Motion (9s loop) */}
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
                  animate={!isReducedMotion ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {coverPhoto && coverPhoto.trim().length > 0 && coverPhotoStatus !== 'error' ? (
                    <motion.img
                      key={coverPhoto}
                      src={coverPhoto}
                      alt={`${coupleNames} Full-Bleed Viewport Photo`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: coverPhotoStatus === 'loaded' ? 1 : 0.5 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      onLoad={() => setCoverPhotoStatus('loaded')}
                      onError={() => setCoverPhotoStatus('error')}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : themeAssets[activeThemeId]?.reveal_background_url ? (
                    <img
                      src={themeAssets[activeThemeId]!.reveal_background_url!}
                      alt="Theme Reveal Backdrop Scene"
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div
                      className="w-full h-full relative flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: activeTheme.bgColor }}
                    >
                      {/* Intentional theme texture + radial glow fallback */}
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{
                          backgroundImage: `radial-gradient(circle at 50% 40%, ${accentColor} 0%, transparent 70%)`,
                        }}
                      />
                      <svg className="w-full h-full opacity-10 mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
                        <filter id="fallback-pattern-noise">
                          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                          <feColorMatrix type="saturate" values="0" />
                        </filter>
                        <rect width="100%" height="100%" filter="url(#fallback-pattern-noise)" />
                      </svg>
                    </div>
                  )}
                  {/* High contrast gradient overlay for text legibility without overall dimming */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40 pointer-events-none z-1" />
                </motion.div>

                {/* Top Header Badge & Overlay Info on Photo Screen */}
                <div className="relative z-10 p-6 text-center pt-8 space-y-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider shadow-lg backdrop-blur-md"
                    style={{ backgroundColor: `${activeTheme.cardBgColor}CC`, borderColor: `${accentColor}40`, color: accentColor }}
                  >
                    Official Wedding Invitation
                  </span>
                  <h1
                    className={`text-2xl sm:text-3xl font-bold leading-tight drop-shadow-md text-white ${serifClass}`}
                  >
                    {coupleNames}
                  </h1>
                  <p className="text-xs opacity-90 font-medium tracking-wide text-white/90">
                    {activeEvents[0] ? formatEventDateTime(activeEvents[0].date, activeEvents[0].time).formattedDate : 'December 18, 2026'}
                    {activeEvents[0]?.venue_name && ` • ${activeEvents[0].venue_name}`}
                  </p>
                </div>

                {/* Bottom Section on Photo Screen: Action Buttons Row */}
                <div className="relative z-10 p-3 sm:p-6 pb-5 sm:pb-8 text-center">
                  {/* Circular Icon Action Badges (Gift Registry, RSVP, Gallery, Event Details) */}
                  <div className="flex items-center justify-center gap-3 sm:gap-9 flex-nowrap sm:flex-wrap select-none max-w-full">
                    {/* 1. Gift Registry Button */}
                    {hasRegistryInfo && (
                      <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const sanitizedUrl = getSanitizedRegistryUrl(wedding?.registry_url || wedding?.registry_info);
                            if (sanitizedUrl) {
                              window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              setActiveView('details');
                              setTimeout(() => {
                                const el = document.getElementById('registry-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }
                          }}
                          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-white bg-black/25 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
                          title="Gift Registry"
                        >
                          <Gift className="w-4 h-4 sm:w-6 sm:h-6 text-white stroke-[2]" />
                        </button>
                        <span className="text-[10px] sm:text-xs font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] whitespace-nowrap">
                          Gift Registry
                        </span>
                      </div>
                    )}

                    {/* 2. RSVP Button */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRsvpModalOpen(true)}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-white bg-black/25 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
                        title="Respond to RSVP"
                      >
                        <Mail className="w-4 h-4 sm:w-6 sm:h-6 text-white stroke-[2]" />
                      </button>
                      <span className="text-[10px] sm:text-xs font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] whitespace-nowrap">
                        RSVP
                      </span>
                    </div>

                    {/* 3. Gallery / Media Button */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (galleryPhotosList.length > 0) {
                            setActiveGalleryIndex(0);
                            setIsGalleryOpen(true);
                          } else {
                            setActiveView('details');
                            setTimeout(() => {
                              const el = document.getElementById('gallery-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }
                        }}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-white bg-black/25 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
                        title="Photo Gallery"
                      >
                        <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white stroke-[2]" />
                      </button>
                      <span className="text-[10px] sm:text-xs font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] whitespace-nowrap">
                        Gallery
                      </span>
                    </div>

                    {/* 4. Event Details Button */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveView('details')}
                        className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-white bg-black/25 backdrop-blur-xs flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
                        title="Event Details"
                      >
                        <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-white stroke-[2]" />
                      </button>
                      <span className="text-[10px] sm:text-xs font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] whitespace-nowrap">
                        Event Details
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeView === 'details' ? (
              /* View 2: Screen 3 (Dedicated Template Detail & Scroll Screen) */
              <motion.div
                key="template-details-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative flex-1 overflow-y-auto text-white flex flex-col min-h-0 h-full w-full select-none"
                style={{ backgroundColor: activeTheme.bgColor }}
              >
                {/* 100% Template-Themed Background ONLY — NO COUPLE PHOTO */}
                <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none z-0 mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
                  <filter id="detail-paper-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                  <rect width="100%" height="100%" filter="url(#detail-paper-noise)" />
                </svg>

                {/* Sticky Navigation Bar with Back to Cover Button */}
                <div
                  className="sticky top-0 z-30 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between shadow-md shrink-0"
                  style={{ backgroundColor: `${activeTheme.cardBgColor}F0`, borderColor: `${accentColor}30` }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveView('photo_hero')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer hover:opacity-80 active:scale-95"
                    style={{ backgroundColor: `${activeTheme.bgColor}99`, borderColor: `${accentColor}40`, color: secondaryColor }}
                  >
                    <span>← Photo Cover</span>
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                    {coupleNames}
                  </span>
                </div>

                {/* Scrollable Detail Content (Padded Stack) */}
                <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Couple Context Header */}
                  <div className="text-center space-y-1 pb-4 border-b border-white/10">
                    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: accentColor }}>
                      Celebration of {coupleNames}
                    </p>
                    <h2 className={`text-3xl font-bold ${serifClass}`} style={{ color: secondaryColor }}>
                      {coupleNames}
                    </h2>
                    {guest && (
                      <p className="text-xs font-semibold uppercase tracking-widest pt-1" style={{ color: accentColor }}>
                        Warm Welcome, {guest.name}
                      </p>
                    )}
                  </div>

                  {/* LIVE COUNTDOWN TIMER BANNER */}
                  <div
                    className="p-4 rounded-2xl border space-y-2 text-center shadow-lg"
                    style={{ backgroundColor: `${activeTheme.bgColor}F2`, borderColor: `${accentColor}40` }}
                  >
                    {isPastAllEvents ? (
                      <div className="space-y-1 py-1">
                        <Heart className="w-5 h-5 mx-auto fill-current" style={{ color: accentColor }} />
                        <p className={`font-bold text-sm ${serifClass}`} style={{ color: secondaryColor }}>
                          Thank you for celebrating with us!
                        </p>
                        <p className="text-[10px] opacity-60">
                          Our wedding events have concluded. We are forever grateful for your love and support.
                        </p>
                      </div>
                    ) : timeLeft ? (
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-semibold flex items-center justify-center gap-1" style={{ color: accentColor }}>
                          <Clock className="w-3 h-3" /> Countdown To {targetEventTitle || 'Special Day'}
                        </p>
                        <div className="grid grid-cols-4 gap-2 font-mono text-center">
                          <div className="p-2 rounded-xl border" style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}30` }}>
                            <span className="block text-xl font-bold" style={{ color: secondaryColor }}>{timeLeft.days}</span>
                            <span className="text-[9px] uppercase" style={{ color: accentColor }}>Days</span>
                          </div>
                          <div className="p-2 rounded-xl border" style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}30` }}>
                            <span className="block text-xl font-bold" style={{ color: secondaryColor }}>{timeLeft.hours}</span>
                            <span className="text-[9px] uppercase" style={{ color: accentColor }}>Hours</span>
                          </div>
                          <div className="p-2 rounded-xl border" style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}30` }}>
                            <span className="block text-xl font-bold" style={{ color: secondaryColor }}>{timeLeft.minutes}</span>
                            <span className="text-[9px] uppercase" style={{ color: accentColor }}>Mins</span>
                          </div>
                          <div className="p-2 rounded-xl border" style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}30` }}>
                            <span className="block text-xl font-bold" style={{ color: secondaryColor }}>{timeLeft.seconds}</span>
                            <span className="text-[9px] uppercase" style={{ color: accentColor }}>Secs</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: accentColor }}>Calculating event countdown...</p>
                    )}
                  </div>

                  {/* Dynamically Ordered Sections */}
                  <div className="space-y-6">
                    {sectionOrder.map((key) => renderSectionByKey(key))}
                  </div>

                  {/* Footer Replay */}
                  <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs">
                    <button
                      onClick={handleReplay}
                      className="px-4 py-2 rounded-full font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      style={{ backgroundColor: accentColor, color: activeTheme.bgColor }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Replay Invitation</span>
                    </button>

                    <span className="text-[10px] opacity-50">
                      Weddings by Amorah
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* View 3: Screen 4 (Personalized Card Download Page) */
              <motion.div
                key="card-download-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative flex-1 overflow-y-auto text-white flex flex-col min-h-0 h-full w-full select-none"
                style={{ backgroundColor: activeTheme.bgColor }}
              >
                {/* 100% Template-Themed Paper Texture Background */}
                <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none z-0 mix-blend-overlay" xmlns="http://www.w3.org/2000/svg">
                  <filter id="download-paper-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                  </filter>
                  <rect width="100%" height="100%" filter="url(#download-paper-noise)" />
                </svg>

                {/* Sticky Navigation Header with Back to Invitation Button */}
                <div
                  className="sticky top-0 z-30 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between shadow-md shrink-0"
                  style={{ backgroundColor: `${activeTheme.cardBgColor}F0`, borderColor: `${accentColor}30` }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveView('details')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer hover:opacity-80 active:scale-95"
                    style={{ backgroundColor: `${activeTheme.bgColor}99`, borderColor: `${accentColor}40`, color: secondaryColor }}
                  >
                    <span>← Return to Invitation</span>
                  </button>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                    Personalized Card
                  </span>
                </div>

                {/* Card Container & Download Controls */}
                <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 flex flex-col items-center justify-center">
                  <div className="text-center space-y-1 max-w-sm mx-auto">
                    <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: accentColor }}>
                      Official Pass
                    </span>
                    <h3 className={`text-2xl font-bold ${serifClass}`} style={{ color: secondaryColor }}>
                      Your Personalized Invitation Card
                    </h3>
                    <p className="text-xs opacity-75">
                      Save your official invitation pass to your device to bring to the wedding celebration.
                    </p>
                  </div>

                  {/* Rendered Personalized Card (Full Resolution Engine) */}
                  <div className="py-2 overflow-hidden flex justify-center w-full max-w-md mx-auto">
                    <StaticInviteCard
                      cardRef={personalizedCardRef}
                      brideFirstName={wedding?.bride_first_name || nameParts[0] || 'Bride'}
                      groomFirstName={wedding?.groom_first_name || nameParts[1] || 'Groom'}
                      customText={guestName.trim() || guest?.name || 'Honored Guest'}
                      weddingDate={activeEvents[0]?.date}
                      venueName={activeEvents[0]?.venue_name}
                      venueAddress={activeEvents[0]?.venue_address || undefined}
                      themeId={wedding?.theme_id}
                      colorVariant={wedding?.color_variant || undefined}
                      fontVariant={wedding?.font_variant || undefined}
                      watermark={false}
                    />
                  </div>

                  {/* Download Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs pt-2">
                    <button
                      type="button"
                      disabled={isDownloadingCard}
                      onClick={() => handleDownloadPersonalizedCard('png')}
                      className="w-full py-3 px-6 rounded-full font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                      style={{ backgroundColor: accentColor, color: activeTheme.bgColor }}
                    >
                      <Download className="w-4 h-4" />
                      <span>{isDownloadingCard ? 'Saving Image...' : 'Save Invitation (PNG)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDownloadingCard}
                      onClick={() => handleDownloadPersonalizedCard('jpeg')}
                      className="w-full py-2.5 px-5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                      style={{
                        backgroundColor: `${activeTheme.cardBgColor}CC`,
                        borderColor: `${accentColor}40`,
                        color: secondaryColor,
                      }}
                    >
                      <Image className="w-3.5 h-3.5" />
                      <span>{isDownloadingCard ? 'Saving Image...' : 'Save as JPEG'}</span>
                    </button>
                  </div>

                  {/* Way Back to Main Experience */}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveView('details')}
                      className="text-xs opacity-75 hover:opacity-100 underline tracking-wider"
                      style={{ color: accentColor }}
                    >
                      ← Return to Full Invitation Experience
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Floating Background Music Player / Embed Widget */}
      <MusicPlayerToggle
        musicTrackId={wedding?.music_track}
        musicSourceType={wedding?.music_source_type}
        musicExternalId={wedding?.music_external_id}
        musicExternalMeta={wedding?.music_external_meta}
        accentColor={accentColor}
        bgColor={activeTheme.bgColor}
      />

      {/* Interactive RSVP Form Modal Overlay */}
      <AnimatePresence>
        {isRsvpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative max-w-md w-full rounded-3xl p-6 shadow-2xl border space-y-5 my-auto"
              style={{ backgroundColor: activeTheme.bgColor, borderColor: `${accentColor}40` }}
            >
              <button
                type="button"
                onClick={() => setIsRsvpModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-full bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 pr-6">
                <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: accentColor }}>
                  Official Response
                </span>
                <h3 className={`text-xl font-bold ${serifClass}`} style={{ color: secondaryColor }}>
                  RSVP for {coupleNames}
                </h3>
                {guest && (
                  <p className="text-xs opacity-70">Personalized link for {guest.name}</p>
                )}
              </div>

              {rsvpSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className={`text-lg font-bold ${serifClass}`} style={{ color: secondaryColor }}>
                    RSVP Submitted Successfully!
                  </h4>
                  <p className="text-xs opacity-80 max-w-xs mx-auto">
                    Thank you! The couple has been notified of your response. We look forward to celebrating together.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRsvpModalOpen(false);
                      setActiveView('card_download');
                    }}
                    className="w-full py-3 px-6 rounded-full font-bold text-xs shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor, color: activeTheme.bgColor }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Your Invitation</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs">
                  {rsvpError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{rsvpError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] uppercase font-semibold mb-1 opacity-80" style={{ color: secondaryColor }}>
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Temiloluwa Akindele"
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-white/5 border-white/15 focus:outline-none focus:border-emerald-400 transition-all text-white placeholder-white/40"
                    />
                  </div>

                  {/* Attendance Selector per event */}
                  <div className="space-y-3 pt-1">
                    <label className="block text-[11px] uppercase font-semibold opacity-80" style={{ color: secondaryColor }}>
                      Event Attendance
                    </label>
                    {activeEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border bg-white/5 border-white/15 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{ev.title}</span>
                          <span className="text-[10px] opacity-60">{ev.date}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEventAttendance((prev) => ({ ...prev, [ev.id]: true }))}
                            className={`py-2 rounded-lg font-semibold text-xs border transition-all ${
                              eventAttendance[ev.id] !== false
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                                : 'bg-white/5 border-white/10 opacity-60'
                            }`}
                          >
                            Joyfully Accepts
                          </button>
                          <button
                            type="button"
                            onClick={() => setEventAttendance((prev) => ({ ...prev, [ev.id]: false }))}
                            className={`py-2 rounded-lg font-semibold text-xs border transition-all ${
                              eventAttendance[ev.id] === false
                                ? 'bg-rose-500/25 border-rose-400 text-rose-300'
                                : 'bg-white/5 border-white/10 opacity-60'
                            }`}
                          >
                            Regretfully Declines
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Plus One Toggle */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasPlusOne}
                        onChange={(e) => setHasPlusOne(e.target.checked)}
                        className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-0"
                      />
                      <span className="text-[11px] font-semibold opacity-90" style={{ color: secondaryColor }}>
                        Attending with a Plus-One Guest
                      </span>
                    </label>
                    {hasPlusOne && (
                      <input
                        type="text"
                        value={plusOneName}
                        onChange={(e) => setPlusOneName(e.target.value)}
                        placeholder="Plus-one guest name"
                        className="w-full px-3.5 py-2 rounded-xl border bg-white/5 border-white/15 focus:outline-none focus:border-emerald-400 transition-all text-white placeholder-white/40"
                      />
                    )}
                  </div>

                  {/* Dietary Requirements */}
                  <div>
                    <label className="block text-[11px] uppercase font-semibold mb-1 opacity-80" style={{ color: secondaryColor }}>
                      Dietary Requirements / Allergies (Optional)
                    </label>
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      placeholder="e.g. Vegetarian, Halal, Nut Allergy"
                      className="w-full px-3.5 py-2 rounded-xl border bg-white/5 border-white/15 focus:outline-none focus:border-emerald-400 transition-all text-white placeholder-white/40"
                    />
                  </div>

                  {/* Note to Couple */}
                  <div>
                    <label className="block text-[11px] uppercase font-semibold mb-1 opacity-80" style={{ color: secondaryColor }}>
                      Warm Wishes to Couple (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Leave a sweet note for the couple..."
                      className="w-full px-3.5 py-2 rounded-xl border bg-white/5 border-white/15 focus:outline-none focus:border-emerald-400 transition-all text-white placeholder-white/40 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpSubmitting}
                    className="w-full py-3 rounded-full font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 mt-2"
                    style={{ backgroundColor: accentColor, color: activeTheme.bgColor }}
                  >
                    {rsvpSubmitting ? (
                      <span>Submitting Response...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm & Submit RSVP</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Multi-Photo Gallery Carousel Modal Overlay */}
        <AnimatePresence>
          {isGalleryOpen && galleryPhotosList.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-between p-4 sm:p-6 select-none"
            >
              {/* Top Header & Dismiss Button */}
              <div className="w-full flex items-center justify-between text-white border-b border-white/10 pb-3 z-10">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Photo Gallery ({activeGalleryIndex + 1} of {galleryPhotosList.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGalleryOpen(false)}
                  className="p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                  title="Close Gallery"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Active Photo Container with Carousel Controls */}
              <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center py-4 px-2 sm:px-12 my-auto">
                {/* Left Arrow Button */}
                {galleryPhotosList.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveGalleryIndex((prev) => (prev === 0 ? galleryPhotosList.length - 1 : prev - 1));
                    }}
                    className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white backdrop-blur transition-all cursor-pointer active:scale-95 shadow-xl"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                )}

                {/* Current Enlarged Photo */}
                <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={galleryPhotosList[activeGalleryIndex]}
                      src={galleryPhotosList[activeGalleryIndex]}
                      alt={`Gallery photo ${activeGalleryIndex + 1}`}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/15"
                    />
                  </AnimatePresence>
                </div>

                {/* Right Arrow Button */}
                {galleryPhotosList.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveGalleryIndex((prev) => (prev === galleryPhotosList.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white backdrop-blur transition-all cursor-pointer active:scale-95 shadow-xl"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnail Strip Indicator */}
              <div className="w-full flex flex-col items-center gap-3 pt-2 z-10">
                {galleryPhotosList.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto max-w-full px-4 py-1">
                    {galleryPhotosList.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveGalleryIndex(idx)}
                        className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          idx === activeGalleryIndex
                            ? 'border-emerald-400 scale-110 shadow-lg'
                            : 'border-white/20 opacity-50 hover:opacity-80'
                        }`}
                      >
                        <img src={photo} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[11px] opacity-60">
                  Showing {activeGalleryIndex + 1} of {galleryPhotosList.length} photos
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
};
