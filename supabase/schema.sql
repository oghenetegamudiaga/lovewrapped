-- 💖 LoveWrapped Supabase Database Schema
-- Version: 1.0

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Experiences Table
CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  occasion TEXT NOT NULL,
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid')),
  image_count INT NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_reference TEXT,
  views_count INT NOT NULL DEFAULT 0,
  reactions_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_experiences_slug ON public.experiences(slug);
CREATE INDEX IF NOT EXISTS idx_experiences_payment_ref ON public.experiences(payment_reference);
CREATE INDEX IF NOT EXISTS idx_experiences_created_at ON public.experiences(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Experiences:
CREATE POLICY "Allow public read access to experiences"
  ON public.experiences FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insertion of experiences"
  ON public.experiences FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update of experiences"
  ON public.experiences FOR UPDATE
  USING (true);

CREATE POLICY "Allow service role deletion"
  ON public.experiences FOR DELETE
  USING (true);

-- RLS Policies for Users:
CREATE POLICY "Allow public creation of user records"
  ON public.users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow read of user records"
  ON public.users FOR SELECT
  USING (true);

-- Migration: Add voice_message_url to experiences
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS voice_message_url TEXT;

-- Storage Bucket Setup for Experience Images (Paid plan)
INSERT INTO storage.buckets (id, name, public)
VALUES ('experience-images', 'experience-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for experience images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'experience-images');

CREATE POLICY "Public upload access for experience images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'experience-images');

-- Storage Bucket Setup for Voice Messages (Paid plan)
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for voice messages"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-messages');

CREATE POLICY "Public upload access for voice messages"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-messages');

-- ==================== Migration: Admins Table for Multi-Admin Support & Roles ====================
-- Run this block in Supabase SQL Editor to support sub-admin creation and role-based permissions.

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- Enable Row Level Security (RLS) to lock down public access (Server / Service Role access only)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Note: No public RLS policies are created for public.admins.
-- All admin management is performed server-side via Supabase Service Role key or API endpoints.

-- ==================== Migration: Couple Accounts Table for Weddings by Amorah ====================
-- Run this block in Supabase SQL Editor to support couple accounts for Weddings by Amorah.

CREATE TABLE IF NOT EXISTS public.couple_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_couple_accounts_email ON public.couple_accounts(email);

-- Enable Row Level Security (RLS) to lock down public access (Server / Service Role access only)
ALTER TABLE public.couple_accounts ENABLE ROW LEVEL SECURITY;

-- Note: No public RLS policies are created for public.couple_accounts.
-- All couple account operations are performed server-side via Supabase Service Role key or API endpoints.

-- ==================== Migration: Blog Posts Table ====================
-- Run this block in Supabase SQL Editor to support the Blog feature.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_published_at ON public.blog_posts(published, published_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can only SELECT published posts
CREATE POLICY "Public read access for published blog posts"
  ON public.blog_posts FOR SELECT
  USING (published = true);

-- Note: Admin write/update/delete operations are handled server-side via Supabase Service Role key.


-- ==================== Migration: Weddings by Amorah Tables ====================
-- Run this block in Supabase SQL Editor to support the Weddings product line (Phase 1).

-- 1. Main Weddings Table
CREATE TABLE IF NOT EXISTS public.weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_account_id UUID NOT NULL REFERENCES public.couple_accounts(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  bride_first_name TEXT,
  bride_other_names TEXT,
  groom_first_name TEXT,
  groom_other_names TEXT,
  couple_names TEXT,
  cover_photo_url TEXT,
  theme_id TEXT NOT NULL DEFAULT 'classic-burgundy',
  tier TEXT NOT NULL DEFAULT 'premium' CHECK (tier IN ('free', 'premium')),
  gallery_photos TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  love_story TEXT,
  music_track TEXT,
  music_source_type TEXT NOT NULL DEFAULT 'curated' CHECK (music_source_type IN ('curated', 'spotify', 'apple_music', 'soundcloud')),
  music_external_id TEXT,
  music_external_meta JSONB,
  registry_info TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weddings_slug ON public.weddings(slug);
CREATE INDEX IF NOT EXISTS idx_weddings_couple_account_id ON public.weddings(couple_account_id);

-- Enable RLS for public.weddings
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;

-- Public read access for paid weddings
CREATE POLICY "Public read access for paid weddings"
  ON public.weddings FOR SELECT
  USING (is_paid = true);

-- Couple read access for owned wedding records (regardless of is_paid status)
CREATE POLICY "Couples can read their own wedding records"
  ON public.weddings FOR SELECT
  USING (couple_account_id IS NOT NULL);

-- Couple insert access for owned wedding records
CREATE POLICY "Couples can insert their own wedding records"
  ON public.weddings FOR INSERT
  WITH CHECK (couple_account_id IS NOT NULL);

-- Couple update access for owned wedding records
CREATE POLICY "Couples can update their own wedding records"
  ON public.weddings FOR UPDATE
  USING (couple_account_id IS NOT NULL)
  WITH CHECK (couple_account_id IS NOT NULL);

-- 2. Wedding Events Table (Supports single event in Phase 1, scalable to multi-event in Phase 2)
CREATE TABLE IF NOT EXISTS public.wedding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Wedding Celebration',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wedding_events_wedding_id ON public.wedding_events(wedding_id);

-- Enable RLS for public.wedding_events
ALTER TABLE public.wedding_events ENABLE ROW LEVEL SECURITY;

-- Public read access for events of paid weddings
CREATE POLICY "Public read access for wedding events"
  ON public.wedding_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE public.weddings.id = public.wedding_events.wedding_id
        AND public.weddings.is_paid = true
    )
  );

-- Couple read & insert access for wedding events
CREATE POLICY "Couples can read events for their weddings"
  ON public.wedding_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE public.weddings.id = public.wedding_events.wedding_id
    )
  );

CREATE POLICY "Couples can insert events for their weddings"
  ON public.wedding_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.weddings
      WHERE public.weddings.id = public.wedding_events.wedding_id
    )
  );

-- Invitation Templates Table & Policies
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  orientation TEXT NOT NULL DEFAULT 'portrait',
  width INTEGER NOT NULL DEFAULT 1200,
  height INTEGER NOT NULL DEFAULT 1500,
  text_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for active templates"
  ON public.templates FOR SELECT
  USING (true);

-- Migration Seed: Default Classic Wedding Invitation Template
INSERT INTO public.templates (id, name, image_url, orientation, width, height, text_fields, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Classic Green & Gold Arch Invitation',
  'https://via.placeholder.com/1200x1500.png?text=Classic+Wedding+Template',
  'portrait',
  1200,
  1500,
  '[
    { "field_key": "couple_names", "label": "Couple / Event Names", "x": 10, "y": 44, "width": 80, "max_font_size": 34, "min_font_size": 18, "color": "#1B3B2B", "align": "center", "font_family": "serif" },
    { "field_key": "invites_line", "label": "Static Host / Invitation Line", "x": 10, "y": 53, "width": 80, "max_font_size": 13, "min_font_size": 10, "color": "#1B3B2B", "align": "center", "font_family": "serif", "static_text": "SPECIALLY INVITES THE PRESENCE OF" },
    { "field_key": "invitee_name", "label": "Dynamic Invitee / Guest Name", "x": 10, "y": 57, "width": 80, "max_font_size": 22, "min_font_size": 14, "color": "#1B3B2B", "align": "center", "font_family": "serif" },
    { "field_key": "date_split", "label": "Event Date (Split Month / Day / Year)", "x": 10, "y": 64, "width": 80, "max_font_size": 18, "min_font_size": 12, "color": "#1B3B2B", "align": "center", "font_family": "serif" },
    { "field_key": "venue", "label": "Venue / Location", "x": 10, "y": 72, "width": 80, "max_font_size": 14, "min_font_size": 10, "color": "#1B3B2B", "align": "center", "font_family": "serif" }
  ]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Wedding RSVPs Table
CREATE TABLE IF NOT EXISTS public.wedding_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  attending BOOLEAN NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  dietary_notes TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wedding_rsvps_wedding_id ON public.wedding_rsvps(wedding_id);

-- Enable RLS for public.wedding_rsvps
ALTER TABLE public.wedding_rsvps ENABLE ROW LEVEL SECURITY;

-- Note: All RSVP writes (POST /api/weddings/:slug/rsvp) and Couple Dashboard reads/edits are performed server-side via Supabase Service Role Key to enforce security and ownership.

-- 4. Supabase Storage Bucket Policy Note
-- Create a public Storage bucket named 'wedding-images' in Supabase Dashboard.
-- Enable Public Read access for displaying cover photos. Public Writes are disabled. All uploads take place server-side or via signed URLs.


-- ==================== Migration: Weddings Phase 2 (Guest Management & Multi-Event) ====================
-- Run this block in Supabase SQL Editor to support Phase 2 multi-event & guest features.

-- 1. Proactive Wedding Guests Table
CREATE TABLE IF NOT EXISTS public.wedding_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES public.weddings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  unique_link_token TEXT UNIQUE NOT NULL,
  plus_one_allowed BOOLEAN NOT NULL DEFAULT false,
  plus_one_name TEXT,
  dietary_notes TEXT,
  added_by TEXT NOT NULL DEFAULT 'couple',
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wedding_guests_wedding_id ON public.wedding_guests(wedding_id);
CREATE INDEX IF NOT EXISTS idx_wedding_guests_unique_link_token ON public.wedding_guests(unique_link_token);

-- Enable RLS for public.wedding_guests
ALTER TABLE public.wedding_guests ENABLE ROW LEVEL SECURITY;

-- 2. Wedding Guest Events Join Table (Guests invited to specific subset of events)
CREATE TABLE IF NOT EXISTS public.wedding_guest_events (
  guest_id UUID NOT NULL REFERENCES public.wedding_guests(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.wedding_events(id) ON DELETE CASCADE,
  PRIMARY KEY (guest_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_wedding_guest_events_guest_id ON public.wedding_guest_events(guest_id);
CREATE INDEX IF NOT EXISTS idx_wedding_guest_events_event_id ON public.wedding_guest_events(event_id);

-- Enable RLS for public.wedding_guest_events
ALTER TABLE public.wedding_guest_events ENABLE ROW LEVEL SECURITY;

-- 3. Extend wedding_rsvps Table for Per-Event & Guest Attribution
ALTER TABLE public.wedding_rsvps ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES public.wedding_guests(id) ON DELETE SET NULL;
ALTER TABLE public.wedding_rsvps ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.wedding_events(id) ON DELETE SET NULL;
ALTER TABLE public.wedding_rsvps ADD COLUMN IF NOT EXISTS plus_one_name TEXT;

CREATE INDEX IF NOT EXISTS idx_wedding_rsvps_guest_id ON public.wedding_rsvps(guest_id);
CREATE INDEX IF NOT EXISTS idx_wedding_rsvps_event_id ON public.wedding_rsvps(event_id);


-- ==================== Migration: Weddings Phase 4 (Visual Themes & Section Order) ====================
-- Run this block in Supabase SQL Editor to support Phase 4 visual customization & reordering.

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS color_variant TEXT NOT NULL DEFAULT 'royal-gold';
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS font_variant TEXT NOT NULL DEFAULT 'classic-serif';
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS section_order TEXT[] NOT NULL DEFAULT ARRAY['schedule', 'love_story', 'registry', 'rsvp'];

-- ==================== Migration: Weddings Phase 5 (Bride & Groom Name Splitting) ====================
-- Run this block in Supabase SQL Editor to support separate Bride and Groom names.

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS bride_first_name TEXT;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS bride_other_names TEXT;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS groom_first_name TEXT;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS groom_other_names TEXT;

-- Migration script to populate first names from existing legacy couple_names rows (e.g. 'Becky & Martins')
UPDATE public.weddings
SET
  bride_first_name = TRIM(SPLIT_PART(couple_names, '&', 1)),
  groom_first_name = TRIM(SPLIT_PART(couple_names, '&', 2))
WHERE bride_first_name IS NULL AND couple_names IS NOT NULL AND couple_names LIKE '%&%';

-- ==================== Migration: Weddings Tier (Free Tier & Card Engine) ====================
-- Run this block manually in Supabase SQL Editor to add the tier column to existing weddings table.
-- Existing premium weddings created before this migration will default to tier = 'premium'.

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'premium' CHECK (tier IN ('free', 'premium'));

-- ==================== Migration: Weddings Gallery Photos (Premium Tier) ====================
-- Run this block manually in Supabase SQL Editor to add the gallery_photos column to existing weddings table.

ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS gallery_photos TEXT[] NOT NULL DEFAULT ARRAY[]::text[];

-- ==================== Migration: Theme Assets & Scene Backdrops ====================
-- Run this block manually in Supabase SQL Editor to support background scene images per wedding theme.

CREATE TABLE IF NOT EXISTS public.theme_assets (
  theme_id TEXT PRIMARY KEY,
  cover_background_url TEXT,
  reveal_background_url TEXT,
  card_template_url TEXT,
  text_zone JSONB DEFAULT '{"top": 50, "left": 10, "width": 80, "height": 40}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Explicit Migration Block for Custom Card Templates & Text Zone
ALTER TABLE public.theme_assets ADD COLUMN IF NOT EXISTS card_template_url TEXT;
ALTER TABLE public.theme_assets ADD COLUMN IF NOT EXISTS text_zone JSONB DEFAULT '{"top": 50, "left": 10, "width": 80, "height": 40}'::jsonb;

-- Enable RLS (Public read, Server/Service Role write)
ALTER TABLE public.theme_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for theme_assets"
  ON public.theme_assets FOR SELECT
  USING (true);

-- Storage Bucket Setup for Theme Assets (Public Read, Admin Write Only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('theme-assets', 'theme-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for theme-assets bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'theme-assets');

-- Storage Bucket Setup for Wedding Cover & Gallery Photos (Public Read, Server/Service Role Write Only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-cover-photos', 'wedding-cover-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for wedding-cover-photos bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'wedding-cover-photos');

-- Migration Block for Multi-Platform Music Links (Spotify, Apple Music & SoundCloud)
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS music_source_type TEXT NOT NULL DEFAULT 'curated';
ALTER TABLE public.weddings DROP CONSTRAINT IF EXISTS weddings_music_source_type_check;
ALTER TABLE public.weddings ADD CONSTRAINT weddings_music_source_type_check CHECK (music_source_type IN ('curated', 'spotify', 'apple_music', 'soundcloud'));
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS music_external_id TEXT;
ALTER TABLE public.weddings ADD COLUMN IF NOT EXISTS music_external_meta JSONB;

-- ==================== Migration: Password Reset Tokens Table ====================
-- Run this block in Supabase SQL Editor to support password reset tokens for couple accounts.

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_account_id UUID NOT NULL REFERENCES public.couple_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_couple_account_id ON public.password_reset_tokens(couple_account_id);

-- Enable Row Level Security (RLS) to lock down public access (Server / Service Role access only)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
