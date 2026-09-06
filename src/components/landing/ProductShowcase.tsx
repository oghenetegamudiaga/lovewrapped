import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface ProductShowcaseProps {
  eyebrow?: string;
  title: string;
  description: string;
  bullets: string[];
  ctaText: string;
  ctaPath: string;
  onNavigate: (path: string) => void;
  imageSrc?: string;
  imageAlt?: string;
  customPreview?: React.ReactNode;
  imagePosition?: 'left' | 'right';
  bgColor?: string;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  eyebrow,
  title,
  description,
  bullets,
  ctaText,
  ctaPath,
  onNavigate,
  imageSrc,
  imageAlt,
  customPreview,
  imagePosition = 'right',
  bgColor = 'bg-[#FFFEFE]',
}) => {
  const isImageLeft = imagePosition === 'left';

  return (
    <section className={`py-16 sm:py-24 px-4 sm:px-6 ${bgColor} border-b border-cream-border/60`}>
      <div className="max-w-6xl mx-auto">
        <div
          className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
            isImageLeft ? 'lg:flex-row-reverse' : ''
          }`}
        >
          {/* Copy Side */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            {eyebrow && (
              <span className="text-xs font-semibold text-coral uppercase tracking-widest mb-2 block font-sans">
                {eyebrow}
              </span>
            )}
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-maroon mb-4 tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-mauve text-base sm:text-lg leading-relaxed mb-6 font-normal">
              {description}
            </p>

            {/* Bullet List with Minimal Markers (No stock icons) */}
            <ul className="space-y-3.5 mb-8">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-maroon/90 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-coral shrink-0 mt-2.5" />
                  <span className="leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button (Solid Dark Styling) */}
            <div>
              <button
                type="button"
                onClick={() => onNavigate(ctaPath)}
                className="px-8 py-4 rounded-full bg-maroon hover:bg-maroon-light text-cream font-semibold text-sm sm:text-base shadow-md hover:scale-[1.01] active:scale-95 transition-all inline-flex items-center gap-2.5 cursor-pointer border border-maroon/20"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-coral" />
              </button>
            </div>
          </div>

          {/* Image / Demo Side */}
          <div className="w-full lg:w-1/2 flex justify-center">
            {customPreview ? (
              customPreview
            ) : (
              <div className="relative mx-auto rounded-3xl overflow-hidden border-4 border-cream-card border-cream-border bg-[#1F050C] max-w-md lg:max-w-none w-full">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt={imageAlt || title}
                    loading="lazy"
                    className="w-full h-[360px] sm:h-[460px] lg:h-[500px] object-cover object-center"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-maroon/80 via-transparent to-transparent flex items-end p-6 text-cream">
                  <span className="text-xs uppercase font-sans font-semibold tracking-widest text-cream/90 bg-maroon/80 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xs">
                    {title} Live Preview
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
