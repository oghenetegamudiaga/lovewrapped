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


