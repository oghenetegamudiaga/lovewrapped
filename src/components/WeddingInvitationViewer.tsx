import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Calendar, MapPin, Check, Eye } from 'lucide-react';

interface WeddingInvitationViewerProps {
  onNavigate?: (path: string) => void;
}

export const WeddingInvitationViewer: React.FC<WeddingInvitationViewerProps> = ({ onNavigate }) => {
  const [stage, setStage] = useState<'cover' | 'opening' | 'unveiled'>('cover');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [manualReducedMotion, setManualReducedMotion] = useState<boolean>(false);

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
      // Reduced motion fallback: Instant crossfade directly to unveiled stage
      setStage('unveiled');
    } else {
      // Full animation sequence: Trigger cracking & door split
      setStage('opening');
      setTimeout(() => {
        setStage('unveiled');
      }, 1200);
    }
  };

  const handleReplay = () => {
    setStage('cover');
  };

  return (
    <div className="relative min-h-screen bg-[#2A0812] text-[#FDFBF7] font-serif overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      {/* Dev Mode Banner (Dev-only route test controls) */}
      <div className="fixed top-4 right-4 z-50 bg-[#1F050C]/90 backdrop-blur-md border border-[#D4AF37]/30 px-3.5 py-2 rounded-2xl text-[11px] font-sans text-[#FDFBF7] flex items-center gap-3 shadow-xl">
        <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Dev Spike (Scenes 1 & 2)
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

      <div className="relative max-w-md w-full min-h-[640px] sm:min-h-[720px] rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/40 bg-[#3B0E1B] flex flex-col">
        {/* Animated Container for Cover & Opening Doors */}
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
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
                  alt="Couple Placeholder"
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
                    Becky & Martins
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
                <span>DECEMBER 18, 2026 • LAGOS, NIGERIA</span>
              </motion.div>

              {/* Interactive Monogram Wax Seal */}
              <div className="relative z-20 pb-6 flex flex-col items-center gap-3">
                <div className="relative flex items-center justify-center">
                  {/* Pulsing Halo Ring */}
                  {!isReducedMotion && (
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 -m-3 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50"
                    />
                  )}

                  {/* Wax Seal Button with Fragment Splitting Animation */}
                  <div className="relative">
                    {/* Left Half Seal Fragment (Splits Left) */}
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
                        <span className="font-serif font-bold text-lg tracking-widest text-shadow">B & M</span>
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

        {/* Scene 3 Placeholder (Revealed after Ritual Opening) */}
        <motion.div
          key="scene-3-placeholder"
          initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={stage === 'unveiled' ? { opacity: 1, scale: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex-1 p-6 flex flex-col justify-between bg-gradient-to-b from-[#2A0812] to-[#1F050C] text-[#FDFBF7]"
        >
          {/* Header */}
          <div className="space-y-3 text-center pt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-sans font-semibold uppercase tracking-wider">
              <Check className="w-3 h-3 text-[#D4AF37]" /> Scene 2 Opening Complete
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#F4E3B2]">
              Scene 3 Placeholder
            </h2>
            <p className="text-xs text-[#FDFBF7]/70 font-sans max-w-xs mx-auto">
              This area will host the full cinematic event itinerary, video story, RSVP form, and gift registry in Phase 1.
            </p>
          </div>

          {/* Sample Itinerary Preview Cards */}
          <div className="space-y-3 my-6 font-sans">
            <div className="p-3.5 rounded-2xl bg-[#3B0E1B]/80 border border-[#D4AF37]/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#F4E3B2]">Holy Matrimony</p>
                <p className="text-[11px] text-[#FDFBF7]/60">10:00 AM • St. Nicholas Cathedral</p>
              </div>
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#3B0E1B]/80 border border-[#D4AF37]/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#F4E3B2]">Grand Reception</p>
                <p className="text-[11px] text-[#FDFBF7]/60">02:30 PM • Eko Grand Ballroom</p>
              </div>
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
          </div>

          {/* Replay Controls */}
          <div className="pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between font-sans">
            <button
              onClick={handleReplay}
              className="px-4 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c29f2f] text-[#2A0812] font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replay Opening Ritual</span>
            </button>

            <span className="text-[10px] text-[#FDFBF7]/50">
              Motion: {isReducedMotion ? 'Reduced (Crossfade)' : 'Standard (3D Split)'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
