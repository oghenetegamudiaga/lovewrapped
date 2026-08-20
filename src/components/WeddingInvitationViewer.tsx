import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Calendar, MapPin, Check, Heart, Gift, MessageSquare, Send, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { Wedding, WeddingEvent, WeddingTheme } from '../types';
import { getWeddingTheme } from '../config/weddingThemes';
import { submitWeddingRsvpApi } from '../lib/api';

interface WeddingInvitationViewerProps {
  wedding?: Wedding | null;
  event?: WeddingEvent | null;
  theme?: WeddingTheme | null;
  slug?: string;
  onNavigate?: (path: string) => void;
  isSpike?: boolean;
}

export const WeddingInvitationViewer: React.FC<WeddingInvitationViewerProps> = ({
  wedding,
  event,
  theme: customTheme,
  slug,
  onNavigate,
  isSpike = false,
}) => {
  const [stage, setStage] = useState<'cover' | 'opening' | 'unveiled'>('cover');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [manualReducedMotion, setManualReducedMotion] = useState<boolean>(false);

  // RSVP Form state
  const [guestName, setGuestName] = useState('');
  const [attending, setAttending] = useState<boolean>(true);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [message, setMessage] = useState('');
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  // Resolve theme
  const activeTheme = customTheme || getWeddingTheme(wedding?.theme_id);

  // Resolve fallback data for spike testing
  const coupleNames = wedding?.couple_names || 'Becky & Martins';
  const coverPhoto = wedding?.cover_photo_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';
  const eventDate = event?.date || 'December 18, 2026';
  const eventTime = event?.time || '10:00 AM';
  const venueName = event?.venue_name || 'Eko Grand Ballroom';
  const venueAddress = event?.venue_address || 'Victoria Island, Lagos, Nigeria';
  const loveStory = wedding?.love_story || 'From quiet morning walks to a lifetime of laughter, we are overjoyed to celebrate our special day with the people who mean the world to us.';
  const registryInfo = wedding?.registry_info || 'Your presence at our wedding is the greatest gift of all. If you wish to honor us with a gift, a monetary contribution towards our new home would be warmly appreciated.';

  // Initials for monogram seal
  const nameParts = coupleNames.split('&').map((n) => n.trim());
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]} & ${nameParts[1][0]}` : 'B & M';

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
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const isReducedMotion = prefersReducedMotion || manualReducedMotion;

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
      await submitWeddingRsvpApi(activeSlug, {
        guest_name: guestName,
        attending,
        guest_count: guestCount,
        dietary_notes: dietaryNotes,
        message,
      });

      setRsvpSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit RSVP. Please try again.';
      setRsvpError(msg);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#2A0812] text-[#FDFBF7] font-serif overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Dev Mode Banner (Dev-only route test controls) */}
      {(isSpike || !wedding) && (
        <div className="fixed top-4 right-4 z-50 bg-[#1F050C]/90 backdrop-blur-md border border-[#D4AF37]/30 px-3.5 py-2 rounded-2xl text-[11px] font-sans text-[#FDFBF7] flex items-center gap-3 shadow-xl">
          <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Dev Mode (Scenes 1–4)
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={manualReducedMotion}
              onChange={(e) => setManualReducedMotion(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <span>Force Reduced Motion</span>
          </label>
        </div>
      )}

      <div className="relative max-w-md w-full min-h-[640px] sm:min-h-[740px] rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/40 bg-[#3B0E1B] flex flex-col">
        {/* Animated Container for Cover & Opening Doors (Scenes 1 & 2) */}
        <AnimatePresence mode="wait">
          {stage !== 'unveiled' && (
            <motion.div
              key="cover-layer"
              initial={{ opacity: 1 }}
              exit={isReducedMotion ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: isReducedMotion ? 0.4 : 0.8 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 text-center"
            >
              {/* Background Photo with Vignette */}
              <div className="absolute inset-0 z-0">
                <img
                  src={coverPhoto}
                  alt={coupleNames}
                  className="w-full h-full object-cover opacity-35 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2A0812] via-[#3B0E1B]/70 to-[#2A0812]/90" />
              </div>

              {/* Decorative Frame Overlay */}
              <div className="absolute inset-4 z-10 border border-[#D4AF37]/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <svg className="w-8 h-8 text-[#D4AF37]/70" viewBox="0 0 40 40">
                    <path fill="currentColor" d="M0,0 L15,0 L15,2 L2,2 L2,15 L0,15 Z M5,5 L12,5 L12,7 L7,7 L7,12 L5,12 Z" />
                  </svg>
                  <svg className="w-8 h-8 text-[#D4AF37]/70 rotate-90" viewBox="0 0 40 40">
                    <path fill="currentColor" d="M0,0 L15,0 L15,2 L2,2 L2,15 L0,15 Z M5,5 L12,5 L12,7 L7,7 L7,12 L5,12 Z" />
                  </svg>
                </div>
                <div className="flex justify-between">
                  <svg className="w-8 h-8 text-[#D4AF37]/70 -rotate-90" viewBox="0 0 40 40">
                    <path fill="currentColor" d="M0,0 L15,0 L15,2 L2,2 L2,15 L0,15 Z M5,5 L12,5 L12,7 L7,7 L7,12 L5,12 Z" />
                  </svg>
                  <svg className="w-8 h-8 text-[#D4AF37]/70 rotate-180" viewBox="0 0 40 40">
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
                    className="absolute inset-y-0 left-0 w-1/2 bg-[#3B0E1B] border-r border-[#D4AF37]/30 z-15 pointer-events-none"
                  />
                  <motion.div
                    animate={stage === 'opening' ? { x: '100%' } : { x: 0 }}
                    transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1] }}
                    className="absolute inset-y-0 right-0 w-1/2 bg-[#3B0E1B] border-l border-[#D4AF37]/30 z-15 pointer-events-none"
                  />
                </>
              )}

              {/* Cover Typography & Content */}
              <div className="relative z-20 pt-8 space-y-4 max-w-xs mx-auto">
                <motion.p
                  initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="font-sans text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-semibold"
                >
                  Together With Their Families
                </motion.p>

                <motion.div
                  initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className="py-2"
                >
                  <h1 className="text-4xl sm:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FDFBF7] via-[#F4E3B2] to-[#D4AF37] leading-tight">
                    {coupleNames}
                  </h1>
                </motion.div>

                <motion.p
                  initial={isReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-xs text-[#FDFBF7]/80 font-sans italic font-light"
                >
                  request the honor of your presence at their wedding celebration
                </motion.p>
              </div>

              {/* Date & Location Pill */}
              <motion.div
                initial={isReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="relative z-20 py-2 px-4 rounded-full bg-[#1F050C]/80 border border-[#D4AF37]/40 text-[11px] font-sans text-[#D4AF37] flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{eventDate.toUpperCase()} • {venueName.toUpperCase()}</span>
              </motion.div>

              {/* Interactive Monogram Wax Seal */}
              <div className="relative z-20 pb-6 flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  {!isReducedMotion && (
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 -m-3 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50"
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
                      className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#80182C] via-[#5C101E] to-[#3B0E1B] border-2 border-[#D4AF37] shadow-xl flex items-center justify-center cursor-pointer group active:scale-95"
                    >
                      <div className="w-16 h-16 rounded-full border border-[#D4AF37]/40 flex flex-col items-center justify-center bg-[#4A1525]/60 text-[#D4AF37] shadow-inner">
                        <span className="font-serif font-bold text-lg tracking-widest text-shadow">{initials}</span>
                        <span className="text-[8px] font-sans uppercase tracking-widest text-[#D4AF37]/80 mt-0.5">Unseal</span>
                      </div>
                    </motion.button>
                  </div>
                </div>

                <motion.p
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="text-[10px] font-sans tracking-[0.25em] text-[#D4AF37] uppercase font-semibold"
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
            className="flex-1 overflow-y-auto p-6 space-y-8 bg-gradient-to-b from-[#2A0812] via-[#3B0E1B] to-[#1F050C] text-[#FDFBF7]"
          >
            {/* Scene 3: Save-the-Date Reveal Graphic & Quick Shortcuts */}
            <div className="text-center space-y-4 pt-4 border-b border-[#D4AF37]/20 pb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-sans font-semibold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" /> Official Invitation
              </span>

              <h2 className="text-3xl font-serif font-bold text-[#F4E3B2]">
                {coupleNames}
              </h2>
              <p className="text-xs font-sans text-[#FDFBF7]/80 italic">
                Are getting married!
              </p>

              {/* Event Summary Card */}
              <div className="p-4 rounded-2xl bg-[#1F050C]/80 border border-[#D4AF37]/30 space-y-2 text-xs font-sans text-[#D4AF37]">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">{eventDate}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[#FDFBF7]/80">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{eventTime}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[#FDFBF7]/80">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{venueName} • {venueAddress}</span>
                </div>
              </div>

              {/* Quick Action Icon Shortcuts */}
              <div className="grid grid-cols-3 gap-3 pt-2 font-sans text-[11px]">
                <a
                  href="#rsvp-section"
                  className="p-3 rounded-2xl bg-[#3B0E1B] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] flex flex-col items-center gap-1.5 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>RSVP Now</span>
                </a>
                <a
                  href="#details-section"
                  className="p-3 rounded-2xl bg-[#3B0E1B] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] flex flex-col items-center gap-1.5 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Details</span>
                </a>
                <a
                  href="#registry-section"
                  className="p-3 rounded-2xl bg-[#3B0E1B] border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] flex flex-col items-center gap-1.5 transition-all"
                >
                  <Gift className="w-4 h-4" />
                  <span>Registry</span>
                </a>
              </div>
            </div>

            {/* Scene 4: Love Story & Full Details */}
            <div id="details-section" className="space-y-6 font-sans">
              {loveStory && (
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#F4E3B2] flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" /> Our Story
                  </h3>
                  <p className="text-xs text-[#FDFBF7]/80 leading-relaxed italic p-4 rounded-2xl bg-[#1F050C]/60 border border-[#D4AF37]/20">
                    "{loveStory}"
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-[#F4E3B2] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" /> Event Details
                </h3>

                <div className="p-4 rounded-2xl bg-[#1F050C]/80 border border-[#D4AF37]/30 space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#3B0E1B] border border-[#D4AF37]/30 text-[#D4AF37]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#F4E3B2]">{event?.title || 'Wedding Celebration'}</p>
                      <p className="text-[#FDFBF7]/70">{eventDate} at {eventTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t border-[#D4AF37]/15">
                    <div className="p-2 rounded-xl bg-[#3B0E1B] border border-[#D4AF37]/30 text-[#D4AF37]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#F4E3B2]">{venueName}</p>
                      <p className="text-[#FDFBF7]/70">{venueAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {registryInfo && (
                <div id="registry-section" className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#F4E3B2] flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#D4AF37]" /> Gift Registry & Wishlist
                  </h3>
                  <div className="p-4 rounded-2xl bg-[#1F050C]/60 border border-[#D4AF37]/20 text-xs text-[#FDFBF7]/80 leading-relaxed">
                    {registryInfo}
                  </div>
                </div>
              )}

              {/* Scene 4: Interactive Guest RSVP Form */}
              <div id="rsvp-section" className="space-y-4 pt-4 border-t border-[#D4AF37]/20">
                <div className="text-center space-y-1">
                  <h3 className="font-serif text-xl font-bold text-[#F4E3B2]">
                    RSVP to Our Celebration
                  </h3>
                  <p className="text-xs text-[#FDFBF7]/70">
                    Kindly respond by letting us know if you will be joining us.
                  </p>
                </div>

                {rsvpSuccess ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-2">
                    <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-serif font-bold text-base text-emerald-200">Thank You for Your RSVP!</p>
                    <p className="text-xs text-emerald-300/80">
                      Your response has been recorded. We look forward to celebrating together!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="p-5 rounded-2xl bg-[#1F050C]/90 border border-[#D4AF37]/30 space-y-4 text-xs">
                    {rsvpError && (
                      <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span>{rsvpError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-[#D4AF37] mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chief & Mrs. Adebayo"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#3B0E1B] border border-[#D4AF37]/30 text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#D4AF37] mb-1">Will you be attending? *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAttending(true)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-semibold ${
                            attending
                              ? 'bg-[#D4AF37] text-[#2A0812] border-[#D4AF37]'
                              : 'bg-[#3B0E1B] text-[#FDFBF7]/80 border-[#D4AF37]/30'
                          }`}
                        >
                          Joyfully Accepts
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttending(false)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-semibold ${
                            !attending
                              ? 'bg-[#D4AF37] text-[#2A0812] border-[#D4AF37]'
                              : 'bg-[#3B0E1B] text-[#FDFBF7]/80 border-[#D4AF37]/30'
                          }`}
                        >
                          Regretfully Declines
                        </button>
                      </div>
                    </div>

                    {attending && (
                      <div>
                        <label className="block text-[11px] font-semibold text-[#D4AF37] mb-1">Number of Guests (including yourself)</label>
                        <select
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="w-full p-3 rounded-xl bg-[#3B0E1B] border border-[#D4AF37]/30 text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37]"
                        >
                          <option value={1}>1 Guest</option>
                          <option value={2}>2 Guests</option>
                          <option value={3}>3 Guests</option>
                          <option value={4}>4 Guests</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-[#D4AF37] mb-1">Dietary Requirements / Special Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Vegetarian, Peanut allergy..."
                        value={dietaryNotes}
                        onChange={(e) => setDietaryNotes(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#3B0E1B] border border-[#D4AF37]/30 text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#D4AF37] mb-1">Personal Message for the Couple (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Send warm wishes to the couple..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-3 rounded-xl bg-[#3B0E1B] border border-[#D4AF37]/30 text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={rsvpSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4E3B2] text-[#2A0812] font-semibold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{rsvpSubmitting ? 'Submitting RSVP...' : 'Confirm RSVP'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Replay Controls Footer */}
            <div className="pt-6 border-t border-[#D4AF37]/20 flex items-center justify-between font-sans text-xs">
              <button
                onClick={handleReplay}
                className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#c29f2f] text-[#2A0812] font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replay Invitation</span>
              </button>

              <span className="text-[10px] text-[#FDFBF7]/50">
                Weddings by Amorah
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
