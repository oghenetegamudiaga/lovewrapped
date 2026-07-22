-- 💖 LoveWrapped Supabase Database Schema
-- Version: 1.0

CREATE EXTENSION IF NOT EXISTS uuid-ossp;

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
