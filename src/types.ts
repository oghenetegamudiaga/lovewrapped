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
  creator_email?: string;
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

/* ==================== CRM & Live Site Content Types ==================== */

export type CRMContactType = 'lead' | 'support';
export type CRMContactStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed' | 'lost';

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  type: CRMContactType;
  status: CRMContactStatus;
  source: string;
  notes?: string | null;
  related_experience_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteContentItem {
  key: string;
  value: string;
  updated_at?: string;
}

export type SiteContentMap = Record<string, string>;
