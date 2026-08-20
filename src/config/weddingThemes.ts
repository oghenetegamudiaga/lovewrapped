import { WeddingTheme } from '../types';

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
};

export const DEFAULT_WEDDING_THEME = WEDDING_THEMES['classic-burgundy'];

export function getWeddingTheme(themeId?: string | null): WeddingTheme {
  if (!themeId) return DEFAULT_WEDDING_THEME;
  return WEDDING_THEMES[themeId] || DEFAULT_WEDDING_THEME;
}
