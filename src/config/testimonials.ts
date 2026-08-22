// TODO: Replace with real customer testimonials when collected

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorContext: string;
  rating: number; // 1-5
}

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 't-1',
    quote: 'Our guests were blown away by our wedding invitation! The music, event schedule, and instant RSVP tracking made managing 250 guests completely stress-free.',
    authorName: 'Amina & Tunde',
    authorContext: 'Bride & Groom, Lagos',
    rating: 5,
  },
  {
    id: 't-2',
    quote: 'I created a Moments story for my wife on our 5th wedding anniversary. Adding our voice recording and photo slides had her in happy tears. Absolutely unforgettable.',
    authorName: 'David K.',
    authorContext: 'Created a Moments Story for 5th Anniversary',
    rating: 5,
  },
  {
    id: 't-3',
    quote: 'The traditional ceremony and white wedding multi-event schedules saved us so many phone calls. Everyone knew where to be and when.',
    authorName: 'Chiamaka B.',
    authorContext: 'Bride, Abuja',
    rating: 5,
  },
  {
    id: 't-4',
    quote: 'Super easy to set up. It took me less than 5 minutes to create a birthday surprise card for my partner with our favorite Spotify track.',
    authorName: 'Emeka O.',
    authorContext: 'Created a Birthday Surprise Moments Card',
    rating: 5,
  },
];
