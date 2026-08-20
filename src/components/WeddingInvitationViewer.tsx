import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Calendar, MapPin, Check, Heart, Gift, MessageSquare, Send, Clock, UserCheck, AlertCircle, UserPlus, Download, ExternalLink } from 'lucide-react';
import { Wedding, WeddingEvent, WeddingTheme, WeddingGuest } from '../types';
import { getWeddingTheme, resolveThemeStyles } from '../config/weddingThemes';
import { submitWeddingRsvpApi } from '../lib/api';

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
  const [stage, setStage] = useState<'cover' | 'opening' | 'unveiled'>('cover');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Dynamic Theme & Variant Styles Computation
  const themeStyles = resolveThemeStyles(
    wedding?.theme_id,
    wedding?.color_variant,
    wedding?.font_variant
  );

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
  const activeEvents: WeddingEvent[] = propEvents && propEvents.length > 0
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

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [isPastAllEvents, setIsPastAllEvents] = useState<boolean>(false);
  const [targetEventTitle, setTargetEventTitle] = useState<string>('');

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
    if (isReducedMotion) {
      setStage('unveiled');
    } else {
      setStage('opening');
      setTimeout(() => {
        setStage('unveiled');
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

      case 'rsvp':
        return (
          <div key="rsvp" id="rsvp-section" className={`space-y-4 pt-4 border-t border-white/10 ${sansClass}`}>
            <div className="text-center space-y-1">
              <h3 className={`text-xl font-bold ${serifClass}`} style={{ color: secondaryColor }}>
                RSVP to Our Events
              </h3>
              <p className="text-xs opacity-75">
                Kindly select your attendance for each event in our celebration schedule.
              </p>
            </div>

            {rsvpSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-serif font-bold text-base text-emerald-200">Thank You for Your RSVP!</p>
                <p className="text-xs text-emerald-300/80">
                  Your responses have been recorded. We look forward to celebrating with you!
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleRsvpSubmit}
                className="p-5 rounded-2xl border space-y-4 text-xs shadow-lg"
                style={{ backgroundColor: activeTheme.bgColor, borderColor: `${accentColor}40` }}
              >
                {rsvpError && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{rsvpError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: accentColor }}>Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief & Mrs. Adebayo"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-3 rounded-xl border text-white focus:outline-none"
                    style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}40` }}
                  />
                </div>

                {/* Per-Event Attendance Selectors */}
                <div className="space-y-3 pt-1 border-t border-white/10">
                  <p className="text-[11px] font-semibold" style={{ color: accentColor }}>Select Attendance Per Event:</p>
                  {activeEvents.map((ev) => {
                    const isAttending = eventAttendance[ev.id] ?? true;
                    return (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl border space-y-2"
                        style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}30` }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold" style={{ color: secondaryColor }}>{ev.title}</p>
                            <p className="text-[10px] opacity-60">{ev.date} • {ev.venue_name}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEventAttendance((prev) => ({ ...prev, [ev.id]: true }))}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                isAttending ? 'opacity-100 shadow-sm' : 'opacity-40'
                              }`}
                              style={{ backgroundColor: accentColor, color: activeTheme.bgColor }}
                            >
                              Attending
                            </button>
                            <button
                              type="button"
                              onClick={() => setEventAttendance((prev) => ({ ...prev, [ev.id]: false }))}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                !isAttending ? 'bg-amber-800 text-white' : 'opacity-40 border border-white/20'
                              }`}
                            >
                              Declining
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Plus-One Handling */}
                {(guest ? guest.plus_one_allowed : true) && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold" style={{ color: accentColor }}>
                      <input
                        type="checkbox"
                        checked={hasPlusOne}
                        onChange={(e) => setHasPlusOne(e.target.checked)}
                        className="w-4 h-4 rounded text-gold"
                      />
                      <span className="flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> Bringing a Plus-One Guest?
                      </span>
                    </label>

                    {hasPlusOne && (
                      <input
                        type="text"
                        placeholder="Plus-One Full Name (e.g. Jane Doe)"
                        value={plusOneName}
                        onChange={(e) => setPlusOneName(e.target.value)}
                        className="w-full p-3 rounded-xl border text-white focus:outline-none"
                        style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}40` }}
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: accentColor }}>Dietary Notes / Special Requirements</label>
                  <input
                    type="text"
                    placeholder="e.g. Vegetarian, Peanut allergy..."
                    value={dietaryNotes}
                    onChange={(e) => setDietaryNotes(e.target.value)}
                    className="w-full p-3 rounded-xl border text-white focus:outline-none"
                    style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}40` }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1" style={{ color: accentColor }}>Personal Message for the Couple</label>
                  <textarea
                    rows={2}
                    placeholder="Send warm wishes..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl border text-white focus:outline-none"
                    style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}40` }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor, color: activeTheme.bgColor }}
                >
                  <Send className="w-4 h-4" />
                  <span>{rsvpSubmitting ? 'Submitting RSVPs...' : 'Confirm All RSVPs'}</span>
                </button>
              </form>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`relative min-h-screen text-[#FDFBF7] ${sansClass} overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 select-none`}
      style={{ backgroundColor: activeTheme.bgColor }}
    >

      <div
        className="relative max-w-md w-full min-h-[640px] sm:min-h-[740px] rounded-3xl overflow-hidden shadow-2xl border flex flex-col"
        style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}50` }}
      >
        {/* Animated Cover & Opening Doors (Scenes 1 & 2) */}
        <AnimatePresence mode="wait">
          {stage !== 'unveiled' && (
            <motion.div
              key="cover-layer"
              initial={{ opacity: 1 }}
              exit={isReducedMotion ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: isReducedMotion ? 0.4 : 0.8 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 text-center"
            >
              <div className="absolute inset-0 z-0">
                <img
                  src={coverPhoto}
                  alt={coupleNames}
                  className="w-full h-full object-cover opacity-35 scale-105"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t"
                  style={{
                    backgroundImage: `linear-gradient(to top, ${activeTheme.bgColor}, ${activeTheme.cardBgColor}B3, ${activeTheme.bgColor}E6)`,
                  }}
                />
              </div>

              {/* Decorative Corner Filigree Frame */}
              <div
                className="absolute inset-4 z-10 border rounded-2xl pointer-events-none flex flex-col justify-between p-3"
                style={{ borderColor: `${accentColor}40` }}
              >
                <div className="flex justify-between">
                  <svg className="w-8 h-8 opacity-80" style={{ color: accentColor }} viewBox="0 0 40 40">
                    <path fill="currentColor" d="M0,0 L15,0 L15,2 L2,2 L2,15 L0,15 Z M5,5 L12,5 L12,7 L7,7 L7,12 L5,12 Z" />
                  </svg>
                  <svg className="w-8 h-8 opacity-80 rotate-90" style={{ color: accentColor }} viewBox="0 0 40 40">
                    <path fill="currentColor" d="M0,0 L15,0 L15,2 L2,2 L2,15 L0,15 Z M5,5 L12,5 L12,7 L7,7 L7,12 L5,12 Z" />
                  </svg>
                </div>
                <div className="flex justify-between">
                  <svg className="w-8 h-8 opacity-80 -rotate-90" style={{ color: accentColor }} viewBox="0 0 40 40">
                    <path fill="currentColor" d="M0,0 L15,0 L15,2 L2,2 L2,15 L0,15 Z M5,5 L12,5 L12,7 L7,7 L7,12 L5,12 Z" />
                  </svg>
                  <svg className="w-8 h-8 opacity-80 rotate-180" style={{ color: accentColor }} viewBox="0 0 40 40">
                    <path fill="currentColor" d="M0,0 L15,0 L15,2 L2,2 L2,15 L0,15 Z M5,5 L12,5 L12,7 L7,7 L7,12 L5,12 Z" />
                  </svg>
                </div>
              </div>

              {/* Split Opening Doors (Scene 2 Transition) */}
              {!isReducedMotion && (
                <>
                  <motion.div
                    animate={stage === 'opening' ? { x: '-100%' } : { x: 0 }}
                    transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1] }}
                    className="absolute inset-y-0 left-0 w-1/2 border-r z-15 pointer-events-none"
                    style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}30` }}
                  />
                  <motion.div
                    animate={stage === 'opening' ? { x: '100%' } : { x: 0 }}
                    transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1] }}
                    className="absolute inset-y-0 right-0 w-1/2 border-l z-15 pointer-events-none"
                    style={{ backgroundColor: activeTheme.cardBgColor, borderColor: `${accentColor}30` }}
                  />
                </>
              )}

              {/* Cover Typography */}
              <div className="relative z-20 pt-8 space-y-4 max-w-xs mx-auto">
                <motion.p
                  initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-[11px] tracking-[0.3em] uppercase font-semibold"
                  style={{ color: accentColor }}
                >
                  {guest ? `Special Invitation For ${guest.name}` : 'Together With Their Families'}
                </motion.p>

                <motion.div
                  initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="py-2"
                >
                  <h1 className={`text-4xl sm:text-5xl font-bold leading-tight ${serifClass}`} style={{ color: secondaryColor }}>
                    {coupleNames}
                  </h1>
                </motion.div>

                <motion.p
                  initial={isReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-xs opacity-80 italic font-light"
                >
                  request the honor of your presence at their wedding celebration
                </motion.p>
              </div>

              {/* Date & Location Pill */}
              <motion.div
                initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="relative z-20 py-2 px-4 rounded-full border text-[11px] flex items-center gap-2"
                style={{ backgroundColor: `${activeTheme.bgColor}CC`, borderColor: `${accentColor}40`, color: accentColor }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {(activeEvents[0] ? formatEventDateTime(activeEvents[0].date, activeEvents[0].time).formattedDate : '').toUpperCase()} • {activeEvents[0]?.venue_name.toUpperCase()}
                </span>
              </motion.div>

              {/* Interactive Wax Seal */}
              <div className="relative z-20 pb-6 flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  {!isReducedMotion && (
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 -m-3 rounded-full border"
                      style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}50` }}
                    />
                  )}

                  <div className="relative">
                    <motion.button
                      type="button"
                      onClick={handleUnseal}
                      animate={
                        stage === 'opening' && !isReducedMotion
                          ? { x: -40, rotate: -25, opacity: 0, scale: 0.8 }
                          : { x: 0, rotate: 0, opacity: 1, scale: 1 }
                      }
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${activeTheme.sealColor} border-2 shadow-xl flex items-center justify-center cursor-pointer active:scale-95`}
                      style={{ borderColor: accentColor }}
                    >
                      <div className="w-16 h-16 rounded-full border flex flex-col items-center justify-center shadow-inner" style={{ borderColor: `${accentColor}40`, backgroundColor: `${activeTheme.bgColor}99` }}>
                        <span className={`font-bold text-lg tracking-widest ${serifClass}`} style={{ color: accentColor }}>{initials}</span>
                        <span className="text-[8px] uppercase tracking-widest opacity-80 mt-0.5" style={{ color: accentColor }}>Unseal</span>
                      </div>
                    </motion.button>
                  </div>
                </div>

                <motion.p
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="text-[10px] tracking-[0.25em] uppercase font-semibold"
                  style={{ color: accentColor }}
                >
                  Tap Wax Seal to Open
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scenes 3 & 4 (Revealed Content) */}
        {stage === 'unveiled' && (
          <motion.div
            key="unveiled-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 overflow-y-auto p-6 space-y-8 text-white"
            style={{ backgroundColor: activeTheme.bgColor }}
          >
            {/* Scene 3: Save-the-Date Graphic & Countdown */}
            <div className="text-center space-y-4 pt-4 border-b border-white/10 pb-8">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider"
                style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
              >
                <Sparkles className="w-3 h-3" /> Official Invitation
              </span>

              {guest && (
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                  Warm Welcome, {guest.name}
                </p>
              )}

              <h2 className={`text-3xl font-bold ${serifClass}`} style={{ color: secondaryColor }}>
                {coupleNames}
              </h2>
              <p className="text-xs italic opacity-80">
                Are getting married!
              </p>

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
            </div>

            {/* Scene 4: Dynamically Ordered Sections */}
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
          </motion.div>
        )}
      </div>
    </div>
  );
};
