export type PlanTier = 'free' | 'paid' | 'custom';

export type SlideType = 'text' | 'image';

export interface Slide {
  id: string;
  type: SlideType;
  content?: string; // Text content if type === 'text'
  url?: string;     // Image URL if type === 'image'
  caption?: string; // Optional image caption
  order: number;
}

export interface Experience {
  id: string;
  slug: string;
  sender_name: string;
  receiver_name: string;
  occasion: string; // 'Anniversary' | 'Birthday' | 'Romantic Surprise' | 'Just Because' | 'Appreciation' | 'Valentine' | string
  slides: Slide[];
  tier: PlanTier;
  image_count: number;
  is_paid: boolean;
  payment_reference: string | null;
  views_count: number;
  reactions_count: number;
  created_at: string;
}

export interface UserRecord {
  id: string;
  email: string;
  tier: PlanTier;
  created_at: string;
}

export interface AdminMetrics {
  totalUsers: number;
  totalExperiences: number;
  paidUsers: number;
  totalRevenueNgn: number;
  freeExperiencesCount: number;
  paidExperiencesCount: number;
  totalReactions: number;
}

export interface CreateExperiencePayload {
  sender_name: string;
  receiver_name: string;
  occasion: string;
  message: string;
  tier: PlanTier;
  images?: string[]; // Data URLs or uploaded URLs
  creator_email?: string;
}

export interface SlideBudgetInfo {
  tier: PlanTier;
  maxTotalSlides: number;
  maxImages: number;
  currentImages: number;
  textSlidesAvailable: number;
  charsPerTextSlide: number;
  totalTextBudget: number;
  usedTextChars: number;
  remainingTextChars: number;
  isOverflow: boolean;
  overflowMessage?: string;
}
