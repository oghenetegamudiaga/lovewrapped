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
  slides?: Slide[];
  tier: PlanTier;
  image_count: number;
  is_paid: boolean;
  payment_reference: string | null;
  creator_email?: string;
  voice_message_url?: string | null;
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

export type AdminRole = 'super_admin' | 'admin' | 'support';

export interface AdminRecord {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
  created_by?: string | null;
}

export interface CoupleAccount {
  id: string;
  email: string;
  full_name?: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url?: string | null;
  published: boolean;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
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
  voice_message_url?: string | null;
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

/* ==================== Weddings by Amorah Types ==================== */

export interface WeddingTheme {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  cardBgColor: string;
  textColor: string;
  accentColor: string;
  secondaryColor: string;
  serifFont: string;
  sansFont: string;
  sealColor: string;
  sealMonogramColor: string;
  frameStyle: string;
  ribbonColor: string;
  coverPhotoFramePosition?: {
    x: string;
    y: string;
    width: string;
    height: string;
    borderRadius?: string;
    rotation?: string;
  };
}

export interface Wedding {
  id: string;
  couple_account_id: string;
  slug: string;
  bride_first_name?: string | null;
  bride_other_names?: string | null;
  groom_first_name?: string | null;
  groom_other_names?: string | null;
  couple_names?: string | null;
  cover_photo_url?: string | null;
  theme_id: string;
  tier?: 'free' | 'premium';
  color_variant?: string | null;
  font_variant?: string | null;
  section_order?: string[] | null;
  love_story?: string | null;
  gallery_photos?: string[] | null;
  music_track?: string | null;
  registry_info?: string | null;
  is_paid: boolean;
  payment_reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  title: string;
  date: string;
  time: string;
  venue_name: string;
  venue_address?: string | null;
  created_at: string;
}

export interface WeddingRSVP {
  id: string;
  wedding_id: string;
  guest_id?: string | null;
  event_id?: string | null;
  guest_name: string;
  attending: boolean;
  guest_count: number;
  plus_one_name?: string | null;
  dietary_notes?: string | null;
  message?: string | null;
  created_at: string;
}

export interface WeddingGuest {
  id: string;
  wedding_id: string;
  name: string;
  email?: string | null;
  unique_link_token: string;
  plus_one_allowed: boolean;
  plus_one_name?: string | null;
  dietary_notes?: string | null;
  added_by: 'couple' | 'self';
  is_synthesized?: boolean;
  rsvp_status?: 'attending' | 'declined' | 'pending';
  attending_headcount?: number;
  opened_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingGuestEvent {
  guest_id: string;
  event_id: string;
}

export interface WeddingGuestWithEvents extends WeddingGuest {
  event_ids: string[];
}

export interface WeddingEventPayload {
  title: string;
  date: string;
  time: string;
  venue_name: string;
  venue_address?: string;
}

export interface CreateWeddingPayload {
  theme_id: string;
  tier?: 'free' | 'premium';
  color_variant?: string;
  font_variant?: string;
  section_order?: string[];
  bride_first_name: string;
  bride_other_names?: string;
  groom_first_name: string;
  groom_other_names?: string;
  couple_names?: string;
  cover_photo_url?: string;
  love_story?: string;
  gallery_photos?: string[];
  music_track?: string;
  registry_info?: string;
  // Multi-event array (backward compatible with single event)
  events?: WeddingEventPayload[];
  // Legacy single-event fields for backward compatibility
  event_title?: string;
  event_date?: string;
  event_time?: string;
  event_venue_name?: string;
  event_venue_address?: string;
}

export interface TextZone {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ThemeAssetRecord {
  theme_id: string;
  cover_background_url?: string | null;
  reveal_background_url?: string | null;
  card_template_url?: string | null;
  text_zone?: TextZone | null;
  created_at?: string;
  updated_at?: string;
}

export type ThemeAssetsMap = Record<string, ThemeAssetRecord>;

export interface CardTemplateField {
  field_key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  max_font_size: number;
  min_font_size: number;
  color: string;
  align: 'center' | 'left' | 'right';
  font_family: 'serif' | 'sans';
  static_text?: string;
}

export interface CardTemplateRecord {
  id: string;
  name: string;
  image_url: string;
  orientation: 'portrait' | 'landscape' | 'square';
  width: number;
  height: number;
  text_fields: CardTemplateField[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
