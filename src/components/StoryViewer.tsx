import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Volume2, VolumeX, RotateCcw, Sparkles, ChevronLeft, ChevronRight, Share2, Copy, Check, X, Send } from 'lucide-react';
import { Experience } from '../types';
import { SlideCard } from './SlideCard';
import { soundSynth } from '../lib/sound';
import { reactToExperienceApi } from '../lib/api';

interface StoryViewerProps {
  experience: Experience;
  isPreview?: boolean;
  autoOpenShare?: boolean;
  onNavigateToCreate?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  experience,
  isPreview = false,
  autoOpenShare = false,
  onNavigateToCreate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(true);
  const [reactionsCount, setReactionsCount] = useState(experience.reactions_count || 0);
  const [isEndCard, setIsEndCard] = useState(false);

  // Share Modal states
  const [shareModalOpen, setShareModalOpen] = useState(autoOpenShare);
  const [copied, setCopied] = useState(false);

  const slides = experience.slides || [];
  const totalSlides = slides.length;
  const timerRef = useRef<number | null>(null);

  const SLIDE_DURATION_MS = 6000; // 6 seconds per slide
  const TICK_INTERVAL_MS = 50;

  const getShareableUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/w/${experience.slug || 'demo'}`;
  };

  const handleCopyLink = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = getShareableUrl();
    const text = encodeURIComponent(
      `💖 I created a special LoveWrapped story card for ${experience.receiver_name || 'you'}! Tap here to view: ${url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = getShareableUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LoveWrapped for ${experience.receiver_name || 'You'}`,
          text: `💖 Check out this special story card created for ${experience.receiver_name || 'you'}!`,
          url: url,
        });
      } catch (err) {
        console.log('Share dismissed or failed:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Advance to next slide
  const handleNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setIsEndCard(true);
      setIsPaused(true);
    }
  }, [currentIndex, totalSlides]);

  // Go to previous slide
  const handlePrev = useCallback(() => {
    if (isEndCard) {
      setIsEndCard(false);
      setCurrentIndex(totalSlides - 1);
      setProgress(0);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex, isEndCard, totalSlides]);

  // Restart story
  const handleRestart = () => {
    setCurrentIndex(0);
    setProgress(0);
    setIsEndCard(false);
    setIsPaused(false);
  };

  // Timer loop for slide progress
  useEffect(() => {
    if (isPaused || isEndCard || totalSlides === 0) return;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK_INTERVAL_MS / SLIDE_DURATION_MS) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL_MS);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, isEndCard, handleNext, totalSlides]);

  // Reset progress when index changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // Sound toggle
  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const playing = soundSynth.toggle();
    setIsMuted(!playing);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      soundSynth.stop();
    };
  }, []);

  // Heart reaction click
  const handleHeartReaction = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger colorful confetti burst
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffe4e6'],
    });

    setReactionsCount((prev) => prev + 1);

    if (!isPreview && experience.slug) {
      try {
        await reactToExperienceApi(experience.slug);
      } catch (err) {
        console.error('Failed to register reaction:', err);
      }
    }
  };

  if (totalSlides === 0) {
    return (
      <div className="w-full h-96 bg-rose-950 text-rose-200 rounded-3xl flex items-center justify-center p-6 text-center">
        <p>No slides generated yet. Enter your message to create your story!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[9/16] max-h-[820px] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-rose-900/30 select-none flex flex-col">
      {/* Top Progress Segment Bars */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 pt-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex gap-1.5 pointer-events-none">
        {slides.map((_, idx) => {
          let segmentWidth = '0%';
          if (idx < currentIndex) segmentWidth = '100%';
          else if (idx === currentIndex) segmentWidth = `${progress}%`;

          return (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ width: isEndCard ? '100%' : segmentWidth }}
              />
            </div>
          );
        })}
      </div>

      {/* Top Control Bar (Sender badge, Audio, and Share Link button) */}
      <div className="absolute top-7 inset-x-0 z-30 px-4 flex items-center justify-between text-white text-xs font-medium">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          <span className="truncate max-w-[120px] sm:max-w-[150px]">
            To {experience.receiver_name || 'You'} from {experience.sender_name || 'Someone'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShareModalOpen(true);
            }}
            className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-rose-300 hover:text-white transition-colors"
            title="Share story link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white transition-colors"
            title={isMuted ? 'Unmute romantic music' : 'Mute music'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />}
          </button>
        </div>
      </div>

      {/* Main Slide Content OR End Card */}
      <div
        className="relative flex-1 w-full h-full cursor-pointer"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {!isEndCard ? (
          <SlideCard
            slide={slides[currentIndex]}
            senderName={experience.sender_name}
            receiverName={experience.receiver_name}
            occasion={experience.occasion}
            tier={experience.tier}
            totalSlides={totalSlides}
            currentSlideIndex={currentIndex}
          />
        ) : (
          /* End Card Screen */
          <div className="relative z-30 w-full h-full bg-gradient-to-br from-rose-950 via-slate-950 to-black text-white p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-rose-500/30 animate-bounce">
              <Heart className="w-8 h-8 fill-white" />
            </div>

            <h2 className="font-serif font-bold text-2xl text-rose-100 mb-2">
              The End of a Special Story 💖
            </h2>
            <p className="text-sm text-rose-200/80 mb-8 max-w-xs leading-relaxed">
              Created with love for {experience.receiver_name} by {experience.sender_name}.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShareModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all border border-rose-400/20"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Story Link</span>
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-3 px-4 rounded-full bg-white/10 hover:bg-white/20 text-rose-100 font-medium text-sm border border-white/20 flex items-center justify-center gap-2 backdrop-blur-sm transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay Story</span>
              </button>

              {onNavigateToCreate && (
                <button
                  onClick={onNavigateToCreate}
                  className="w-full py-3 px-4 rounded-full bg-white/10 hover:bg-white/20 text-rose-100 font-medium text-sm border border-white/20 flex items-center justify-center gap-2 backdrop-blur-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-rose-300" />
                  <span>Create Your Own LoveWrapped</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tap zones for Left (30%) and Right (70%) navigation (only rendered when story is playing) */}
        {!isEndCard && (
          <div className="absolute inset-0 z-20 flex pointer-events-auto">
            <div
              className="w-[30%] h-full group flex items-center justify-start pl-2"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            >
              <ChevronLeft className="w-6 h-6 text-white/30 group-hover:text-white/80 transition-opacity" />
            </div>
            <div
              className="w-[70%] h-full group flex items-center justify-end pr-2"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="w-6 h-6 text-white/30 group-hover:text-white/80 transition-opacity" />
            </div>
          </div>
        )}
      </div>

      {/* Share Modal Popup */}
      {shareModalOpen && (
        <div
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#2b0818] border border-rose-500/30 rounded-3xl p-6 w-full max-w-xs text-center space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-rose-950 text-rose-300 hover:text-white border border-rose-800/60"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-400/30 flex items-center justify-center mx-auto">
              <Share2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-white">Shareable Link Available</h3>
              <p className="text-xs text-rose-200/80 mt-1">
                Share this personalized link with {experience.receiver_name || 'your loved one'}!
              </p>
            </div>

            {/* Link Box */}
            <div className="bg-[#3a0d22] p-2.5 rounded-2xl border border-rose-800/60 text-left space-y-1.5">
              <span className="text-[10px] text-rose-300/70 font-semibold uppercase tracking-wider block">
                Story URL
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareableUrl()}
                  className="flex-1 bg-[#2b0818] px-2.5 py-1.5 rounded-xl border border-rose-800/80 text-xs font-mono text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition-colors shrink-0"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && (
                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <Check className="w-3 h-3" /> Copied to clipboard!
                </p>
              )}
            </div>

            {/* Share Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full py-2.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 rounded-full bg-rose-950 hover:bg-rose-900 text-rose-200 font-medium text-xs border border-rose-800/60 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>More Share Options</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Reaction Button (Bottom Right) */}
      {!isEndCard && (
        <div className="absolute bottom-12 right-4 z-30 flex items-center gap-1.5">
          <button
            onClick={handleHeartReaction}
            className="w-12 h-12 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 border border-white/20 hover:scale-110 active:scale-95 transition-all"
            title="Send love reaction"
          >
            <Heart className="w-6 h-6 fill-white" />
          </button>
          {reactionsCount > 0 && (
            <span className="bg-black/60 text-rose-200 text-xs px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
              {reactionsCount}
            </span>
          )}
        </div>
      )}

      {/* Watermark for Free Plan */}
      {experience.tier === 'free' && (
        <div className="absolute bottom-0 inset-x-0 z-30 py-2 px-3 bg-black/85 text-center text-[10px] text-rose-300/90 font-medium border-t border-rose-900/40 backdrop-blur-md flex items-center justify-center gap-1">
          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
          <span>Created with <strong>LoveWrapped</strong> • Create your own free story</span>
        </div>
      )}
    </div>
  );
};
