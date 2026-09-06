import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface FallingPetalsProps {
  count?: number;
  color?: string;
  isReducedMotion?: boolean;
  className?: string;
}

interface PetalData {
  id: number;
  startX: number;
  swayAmp: number;
  delay: number;
  duration: number;
  scale: number;
  startRotate: number;
  endRotate: number;
  color: string;
}

const DEFAULT_PETAL_COLORS = [
  '#F7D6D0', // Soft Blush
  '#E8B4B8', // Rose Quartz
  '#FDF9F6', // Warm Cream
  '#E2B79B', // Soft Rose Gold
  '#D4AF37', // Champagne Accent
];

export const FallingPetals: React.FC<FallingPetalsProps> = ({
  count = 8,
  color,
  isReducedMotion = false,
  className = '',
}) => {
  const petals = useMemo<PetalData[]>(() => {
    return Array.from({ length: count }, (_, idx) => {
      const startX = (idx * (100 / count)) + (Math.sin(idx * 2) * 5 + 3);
      const swayAmp = 20 + (idx % 3) * 15;
      const delay = (idx * 0.9) % 5;
      const duration = 8 + (idx % 4) * 1.5;
      const scale = 0.6 + (idx % 3) * 0.25;
      const startRotate = (idx * 45) % 180;
      const endRotate = startRotate + 240 + (idx % 2) * 120;
      const chosenColor = color || DEFAULT_PETAL_COLORS[idx % DEFAULT_PETAL_COLORS.length];

      return {
        id: idx,
        startX: Math.min(95, Math.max(5, startX)),
        swayAmp,
        delay,
        duration,
        scale,
        startRotate,
        endRotate,
        color: chosenColor,
      };
    });
  }, [count, color]);

  if (isReducedMotion) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-10 ${className}`}>
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            y: '-10vh',
            x: `${p.startX}vw`,
            rotate: p.startRotate,
            opacity: 0,
          }}
          animate={{
            y: '110vh',
            x: [
              `${p.startX}vw`,
              `calc(${p.startX}vw + ${p.swayAmp}px)`,
              `calc(${p.startX}vw - ${p.swayAmp}px)`,
              `${p.startX}vw`,
            ],
            rotate: p.endRotate,
            opacity: [0, 0.85, 0.9, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
          className="absolute top-0 left-0"
          style={{
            transformOrigin: 'center center',
            scale: p.scale,
          }}
        >
          {/* Organic Organic Rose Petal SVG */}
          <svg
            width="24"
            height="28"
            viewBox="0 0 24 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-xs"
            style={{ opacity: 0.8 }}
          >
            <path
              d="M12 2C16.5 2 22 7.5 22 14C22 20.5 16 26 12 26C8 26 2 20.5 2 14C2 7.5 7.5 2 12 2Z"
              fill={p.color}
              fillOpacity="0.75"
            />
            <path
              d="M12 4C14.5 4 19 8.5 19 14C19 18 15 22 12 24C9 22 5 18 5 14C5 8.5 9.5 4 12 4Z"
              fill="white"
              fillOpacity="0.2"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};
