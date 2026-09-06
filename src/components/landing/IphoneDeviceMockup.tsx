import React, { useState, useEffect, useRef } from 'react';
import { Play, Smartphone, AlertCircle } from 'lucide-react';

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
    <div
      ref={containerRef}
      className={`relative w-full max-w-[300px] sm:max-w-[340px] md:max-w-[360px] mx-auto select-none ${className}`}
    >
      {/* Aspect Ratio Container matching realistic iPhone 17 495:1024 asset */}
      <div className="relative w-full aspect-[495/1024] group transition-transform duration-300 hover:scale-[1.01]">
        {/* Layer 1: Real Transparent PNG/WebP iPhone 17 Frame Overlay (Highest Z-Index) */}
        <picture className="absolute inset-0 z-30 pointer-events-none w-full h-full">
          <source srcSet="/images/iphone17_frame.webp" type="image/webp" />
          <img
            src="/images/iphone17_frame.png"
            alt="iPhone 17 Pro Frame"
            className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
          />
        </picture>

        {/* Layer 2: Screen Viewport Content (Positioned precisely inside frame transparent cutout) */}
        <div
          className="absolute z-10 overflow-hidden bg-[#1F050C]"
          style={{
            left: '3.838%',
            top: '1.5625%',
            width: '92.323%',
            height: '96.875%',
            borderRadius: '11.378% / 5.242%',
          }}
        >
          {!isPlaying ? (
            /* Idle State: Static Cover Image + Tap to Play Prompt */
            <div
              onClick={handleStartPlayback}
              className="relative w-full h-full cursor-pointer group/idle flex flex-col justify-between p-5 sm:p-6 text-cream"
            >
              <img
                src={coverPhotoUrl}
                alt={`${title} Preview Cover`}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover/idle:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F050C]/90 via-[#1F050C]/40 to-[#1F050C]/30" />

              {/* Top Header Label inside phone */}
              <div className="relative z-10 pt-8 sm:pt-10 text-center">
                <span className="text-[10px] sm:text-xs font-sans font-semibold uppercase tracking-widest text-coral bg-maroon/80 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
                  {title} Live Demo
                </span>
              </div>

              {/* Center Play Button Overlay */}
              <div className="relative z-10 my-auto text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-maroon/90 text-cream border-2 border-coral/80 flex items-center justify-center shadow-xl group-hover/idle:scale-110 group-hover/idle:bg-coral group-hover/idle:text-white transition-all cursor-pointer">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-maroon/90 text-cream text-[11px] sm:text-xs font-semibold shadow-lg border border-coral/30 backdrop-blur-md group-hover/idle:bg-coral transition-colors">
                  <Smartphone className="w-3.5 h-3.5 text-coral group-hover/idle:text-white" />
                  Tap to Play Live Demo
                </span>
              </div>

              {/* Bottom Footer Note inside phone */}
              <div className="relative z-10 text-center pb-4 sm:pb-6">
                <p className="text-[10px] sm:text-[11px] text-cream/80 font-serif italic">
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
                  className="w-full h-full border-0"
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
