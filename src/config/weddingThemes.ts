import { WeddingTheme } from '../types';

export interface AccentColorVariant {
  id: string;
  name: string;
  accentColor: string;
  secondaryColor: string;
  badgeBg: string;
  previewCss: string;
}

export interface FontPairingVariant {
  id: string;
  name: string;
  serifClass: string;
  sansClass: string;
  description: string;
}

export const WEDDING_THEMES: Record<string, WeddingTheme> = {
  'classic-burgundy': {
    id: 'classic-burgundy',
    name: 'Classic Royal Burgundy',
    description: 'Deep crimson velvet tones with ornate gold filigree and regal typography.',
    bgColor: '#2A0812',
    cardBgColor: '#3B0E1B',
    textColor: '#FDFBF7',
    accentColor: '#D4AF37',
    secondaryColor: '#F4E3B2',
    serifFont: 'serif',
    sansFont: 'sans-serif',
    sealColor: 'from-[#80182C] via-[#5C101E] to-[#3B0E1B]',
    sealMonogramColor: '#D4AF37',
    frameStyle: 'ornate-gold',
    ribbonColor: '#D4AF37',
  },
  'modern-emerald': {
    id: 'modern-emerald',
    name: 'Modern Emerald & Bronze',
    description: 'Rich emerald green canvas with sleek bronze trim and polished modern elegance.',
    bgColor: '#0A231C',
    cardBgColor: '#12332A',
    textColor: '#F5FAF8',
    accentColor: '#E6C280',
    secondaryColor: '#C4A468',
    serifFont: 'serif',
    sansFont: 'sans-serif',
    sealColor: 'from-[#144438] via-[#0E352B] to-[#0A231C]',
    sealMonogramColor: '#E6C280',
    frameStyle: 'sleek-bronze',
    ribbonColor: '#E6C280',
  },
  'boho-champagne': {
    id: 'boho-champagne',
    name: 'Boho Champagne & Rose Gold',
    description: 'Warm champagne rose tones with soft botanical ornaments and romantic warmth.',
    bgColor: '#25151A',
    cardBgColor: '#361D24',
    textColor: '#FDF7F8',
    accentColor: '#B76E79',
    secondaryColor: '#F7D6D0',
    serifFont: 'serif',
    sansFont: 'sans-serif',
    sealColor: 'from-[#6E3B46] via-[#4A252E] to-[#25151A]',
    sealMonogramColor: '#F7D6D0',
    frameStyle: 'rose-botanical',
    ribbonColor: '#B76E79',
  },
};

export const ACCENT_COLOR_VARIANTS: Record<string, AccentColorVariant> = {
  'royal-gold': {
    id: 'royal-gold',
    name: 'Royal Gold',
    accentColor: '#D4AF37',
    secondaryColor: '#F4E3B2',
    badgeBg: '#D4AF37',
    previewCss: 'bg-[#D4AF37]',
  },
  'rose-gold': {
    id: 'rose-gold',
    name: 'Rose Gold',
    accentColor: '#B76E79',
    secondaryColor: '#F7D6D0',
    badgeBg: '#B76E79',
    previewCss: 'bg-[#B76E79]',
  },
  'champagne-pearl': {
    id: 'champagne-pearl',
    name: 'Champagne Pearl',
    accentColor: '#E6C280',
    secondaryColor: '#FBE8D3',
    badgeBg: '#E6C280',
    previewCss: 'bg-[#E6C280]',
  },
  'bronze-copper': {
    id: 'bronze-copper',
    name: 'Bronze Copper',
    accentColor: '#CD7F32',
    secondaryColor: '#E8C39E',
    badgeBg: '#CD7F32',
    previewCss: 'bg-[#CD7F32]',
  },
};

export const FONT_PAIRING_VARIANTS: Record<string, FontPairingVariant> = {
  'classic-serif': {
    id: 'classic-serif',
    name: 'Classic Regal Serif',
    serifClass: 'font-serif',
    sansClass: 'font-sans',
    description: 'Timeless luxury serif headers paired with clean body text.',
  },
  'modern-sans': {
    id: 'modern-sans',
    name: 'Sleek Modern Sans',
    serifClass: 'font-sans font-bold tracking-tight',
    sansClass: 'font-sans',
    description: 'Clean contemporary typography for modern celebrations.',
  },
  'editorial-display': {
    id: 'editorial-display',
    name: 'Editorial Luxury Display',
    serifClass: 'font-serif tracking-wide italic',
    sansClass: 'font-sans tracking-wide',
    description: 'High-contrast editorial display styling for romantic flare.',
  },
};

export const DEFAULT_WEDDING_THEME = WEDDING_THEMES['classic-burgundy'];
export const DEFAULT_ACCENT_COLOR = ACCENT_COLOR_VARIANTS['royal-gold'];
export const DEFAULT_FONT_PAIRING = FONT_PAIRING_VARIANTS['classic-serif'];

export function getWeddingTheme(themeId?: string | null): WeddingTheme {
  if (!themeId) return DEFAULT_WEDDING_THEME;
  return WEDDING_THEMES[themeId] || DEFAULT_WEDDING_THEME;
}

export function resolveThemeStyles(
  themeId?: string | null,
  colorVariantId?: string | null,
  fontVariantId?: string | null
) {
  const baseTheme = getWeddingTheme(themeId);
  const colorVar = (colorVariantId && ACCENT_COLOR_VARIANTS[colorVariantId]) || DEFAULT_ACCENT_COLOR;
  const fontVar = (fontVariantId && FONT_PAIRING_VARIANTS[fontVariantId]) || DEFAULT_FONT_PAIRING;

  return {
    baseTheme,
    accentColor: colorVar.accentColor,
    secondaryColor: colorVar.secondaryColor,
    serifClass: fontVar.serifClass,
    sansClass: fontVar.sansClass,
    bgColor: baseTheme.bgColor,
    cardBgColor: baseTheme.cardBgColor,
    sealColor: baseTheme.sealColor,
  };
}
