import React, { useState, useEffect, useRef } from 'react';
import { Play, RefreshCw, Smartphone, AlertCircle } from 'lucide-react';

interface IphoneDeviceMockupProps {
  demoUrl?: string;
  coverPhotoUrl?: string;
  title?: string;
  className?: string;
}

export const IphoneDeviceMockup: React.FC<IphoneDeviceMockupProps> = ({
  demoUrl = '/w/demo',
  coverPhotoUrl = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1000&q=80',
  title = 'Amorah Moments',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Lazy loading observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleStartPlayback = () => {
    setIsPlaying(true);
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-[310px] sm:max-w-[350px] mx-auto ${className}`}>
      {/* iPhone 17 Chassis */}
      <div className="relative mx-auto rounded-[48px] border-[9px] sm:border-[11px] border-[#1F050C] bg-[#1F050C] shadow-2xl p-1.5 phone-card-shadow transition-transform hover:scale-[1.01]">
        {/* Dynamic Island Pill */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#1F050C] rounded-full z-40 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        {/* Home Bar Indicator */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-40 pointer-events-none" />

        {/* Screen Viewport */}
        <div className="relative rounded-[36px] overflow-hidden h-[500px] sm:h-[560px] w-full bg-cream">
          {!isPlaying ? (
            /* Idle State: Static Cover Image + Tap to Play Prompt */
            <div
              onClick={handleStartPlayback}
              className="relative w-full h-full cursor-pointer group flex flex-col justify-between p-6 text-cream"
            >
              <img
                src={coverPhotoUrl}
                alt={`${title} Preview Cover`}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F050C]/90 via-[#1F050C]/40 to-[#1F050C]/30" />

              {/* Top Header Label inside phone */}
              <div className="relative z-10 pt-6 text-center">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-widest text-coral bg-maroon/80 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
                  {title} Live Demo
                </span>
              </div>

              {/* Center Play Button Overlay */}
              <div className="relative z-10 my-auto text-center flex flex-col items-center gap-3">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-maroon/90 text-cream border-2 border-coral/80 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-coral group-hover:text-white transition-all cursor-pointer">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-maroon/90 text-cream text-xs font-semibold shadow-lg border border-coral/30 backdrop-blur-md group-hover:bg-coral transition-colors">
                  <Smartphone className="w-3.5 h-3.5 text-coral group-hover:text-white" />
                  Tap to Play Live Demo
                </span>
              </div>

              {/* Bottom Footer Note inside phone */}
              <div className="relative z-10 text-center pb-2">
                <p className="text-[11px] text-cream/80 font-serif italic">
                  Tap to open & step through real slides
                </p>
              </div>
            </div>
          ) : (
            /* Active Playing State: Live Embedded Iframe */
            <div className="relative w-full h-full bg-cream">
              {isVisible && !hasError ? (
                <iframe
                  src={demoUrl}
                  title={`${title} Live Interactive Demo`}
                  className="w-full h-full border-0 rounded-[36px]"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin"
                  onError={() => setHasError(true)}
                />
              ) : (
                /* Fallback View if iframe error occurs */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-cream text-maroon space-y-3">
                  <AlertCircle className="w-8 h-8 text-coral" />
                  <p className="font-serif text-sm font-bold">Could not load live preview</p>
                  <button
                    type="button"
                    onClick={() => setIsPlaying(false)}
                    className="px-4 py-1.5 rounded-full bg-maroon text-cream text-xs font-semibold"
                  >
                    Reset Preview
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
