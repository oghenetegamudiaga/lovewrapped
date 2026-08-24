import { PAID_PLAN_PRICE_FORMATTED, WEDDING_PLAN_PRICE_FORMATTED } from '../constants.js';

export interface HomepageFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const HOMEPAGE_FAQ_DATA: HomepageFaqItem[] = [
  {
    id: 'difference',
    question: "What's the difference between Amorah Moments and Weddings by Amorah?",
    answer: 'Amorah Moments is designed for romantic surprises, anniversaries, birthdays, and proposals with interactive multi-slide storytelling, background music, and voice message recordings. Weddings by Amorah is built specifically for wedding invitations, multi-event schedules, gift registries, real-time guest RSVP tracking, and couple dashboards.',
  },
  {
    id: 'no-app',
    question: 'Do recipients or guests need to download an app or create an account?',
    answer: 'No! Recipients of Moments cards and wedding guests can view your experience, listen to background music, and submit RSVPs directly on any mobile or desktop browser without downloading an app or signing up.',
  },
  {
    id: 'cost',
    question: 'How much does it cost?',
    answer: `We offer Free Tiers for creating quick digital cards and invitations. Our Paid Tiers (${PAID_PLAN_PRICE_FORMATTED} for Paid Moments, ${WEDDING_PLAN_PRICE_FORMATTED} for Premium Weddings) unlock full multi-scene websites, custom background music (Spotify/Apple Music/SoundCloud), voice notes, photo galleries, and real-time RSVP management.`,
  },
  {
    id: 'photos',
    question: 'Can I upload my own photos?',
    answer: 'Yes! You can upload your favorite photos directly into your Moments slides or Wedding gallery from your phone or computer.',
  },
  {
    id: 'rsvp',
    question: 'Can wedding guests RSVP directly on the invitation?',
    answer: 'Yes! Guests can submit their attendance status, guest count, plus-one details, dietary notes, and custom messages directly on your invitation. All responses update instantly on your private couple dashboard.',
  },
  {
    id: 'setup-time',
    question: 'How long does it take to create an experience?',
    answer: 'It takes less than 5 minutes! Enter your details, upload your photos, choose a theme and music track, and your shareable link is generated instantly.',
  },
  {
    id: 'preview',
    question: 'Can I preview my experience before paying?',
    answer: 'Absolutely. You can customize, edit, and preview your complete experience in real time before completing payment.',
  },
];
