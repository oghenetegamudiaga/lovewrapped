import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { sealData, unsealData } from 'iron-session';
import { CreateExperiencePayload, Experience, UserRecord, CRMContact, SiteContentMap, CoupleAccount, BlogPost, Wedding, WeddingEvent, WeddingRSVP, CreateWeddingPayload, WeddingGuest, WeddingGuestEvent, WeddingGuestWithEvents, WeddingEventPayload } from '../src/types.js';
import { generateSlides } from '../src/lib/slideEngine.js';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase.js';
import { PAID_PLAN_PRICE_KOBO, PAID_PLAN_PRICE_NGN, PAID_PLAN_PRICE_FORMATTED, WEDDING_PLAN_PRICE_KOBO, WEDDING_PLAN_PRICE_NGN, WEDDING_PLAN_PRICE_FORMATTED } from '../src/constants.js';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = 3000;

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'connect-src': ["'self'", 'https:', 'wss:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cookieParser());
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Shared rate limiting configurations
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const weddingsAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const createExperienceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { message: 'Too many experiences created from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const weddingRsvpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { message: 'Too many RSVP submissions from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paystackInitializeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Too many payment initialization requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory data stores initialized with seed demo data
interface AdminRecordInternal {
  id: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'support';
  created_at: string;
  created_by?: string | null;
}

interface CoupleAccountInternal {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string | null;
  created_at: string;
}

const experiencesStore: Map<string, Experience> = new Map();
const usersStore: Map<string, UserRecord> = new Map();
const crmContactsStore: Map<string, CRMContact> = new Map();
const adminsStore: Map<string, AdminRecordInternal> = new Map();
const coupleAccountsStore: Map<string, CoupleAccountInternal> = new Map();
const blogPostsStore: Map<string, BlogPost> = new Map();
const weddingsStore: Map<string, Wedding> = new Map();
const weddingEventsStore: Map<string, WeddingEvent[]> = new Map();
const weddingRsvpsStore: Map<string, WeddingRSVP[]> = new Map();
const weddingGuestsStore: Map<string, WeddingGuest> = new Map();
const weddingGuestEventsStore: Map<string, string[]> = new Map(); // guestId -> event_id[]
const themeAssetsStore: Map<string, any> = new Map();

// Phase 4 Allowlists for Server-Side Input Validation
const VALID_THEME_IDS = new Set(['classic-burgundy', 'modern-emerald', 'boho-champagne']);
const VALID_COLOR_VARIANTS = new Set(['royal-gold', 'rose-gold', 'champagne-pearl', 'bronze-copper']);
const VALID_FONT_VARIANTS = new Set(['classic-serif', 'modern-sans', 'editorial-display']);
const VALID_SECTIONS = new Set(['schedule', 'love_story', 'registry', 'gallery', 'rsvp']);
const VALID_MUSIC_TRACKS = new Set(['romantic-strings', 'piano-acoustic', 'cinematic-love']);

// Helper to generate wedding slug using crypto.randomBytes
function generateWeddingSlug(brideFirstName: string, groomFirstName: string): string {
  const nameStr = `${brideFirstName || ''}-and-${groomFirstName || ''}`;
  const cleanNames = nameStr.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '') || 'wedding';
  const randomSuffix = crypto.randomBytes(6).toString('hex');
  return `${cleanNames}-${randomSuffix}`;
}

// Helper to generate secure guest token using crypto.randomBytes (24 hex chars = 96 bits entropy)
function generateGuestToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

// Seed Demo Blog Post
const seedBlogPost: BlogPost = {
  id: 'blog-seed-001',
  slug: 'crafting-the-perfect-digital-wedding-invitation',
  title: 'Crafting the Perfect Digital Wedding Invitation: A Modern Couple’s Guide',
  excerpt: 'Discover how to turn your wedding invitation into an immersive digital story that captivates your guests and streamlines your RSVPs.',
  content: `## Why Digital Wedding Invitations Matter\n\nYour wedding day is one of the most significant chapters of your shared journey. Traditional paper cards often get misplaced or overlooked, but a **digital invitation experience** stays accessible, interactive, and memorable.\n\n### 3 Key Benefits of Digital Invitations\n\n1. **Immersive Storytelling**: Share your favorite memories, video highlights, and custom music tracks.\n2. **Instant RSVP Management**: Collect responses, dietary notes, and guest counts in real time.\n3. **Multi-Event Organization**: Easily guide guests through traditional ceremonies, white weddings, and receptions in one unified experience.\n\n> *"Turn your feelings into a story they’ll want to replay."*\n\n### Getting Started\n\nCreating your invitation with **Weddings by Amorah** takes just a few minutes. Choose your theme, upload your memories, and share your personalized link with loved ones worldwide.`,
  cover_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  published: true,
  published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
};

blogPostsStore.set(seedBlogPost.id, seedBlogPost);
const siteContentStore: Map<string, string> = new Map([
  ['hero_eyebrow', 'Made for your favourite person'],
  ['hero_title_prefix', 'Turn your love into'],
  ['hero_title_highlight', 'an experience.'],
  ['hero_subtitle', 'A few memories. A few honest words. One beautiful story they’ll want to replay.'],
  ['hero_cta_create', 'Create yours'],
  ['hero_cta_view_demo', 'Watch the demo'],
  ['hero_tagline', 'No app. No account. Just something unforgettable.'],
  ['pricing_badge', 'Simple, Transparent Pricing'],
  ['pricing_title', 'Choose how you want to share your story'],
  ['pricing_free_title', 'Free Story'],
  ['pricing_free_desc', 'Perfect for a quick, heartfelt surprise with interactive slides & music.'],
  ['pricing_paid_title', 'Paid Story'],
  ['pricing_paid_desc', 'For unforgettable anniversaries, birthdays & grand romantic gestures.'],
]);

// Seed Demo CRM Contacts
const seedContact1: CRMContact = {
  id: 'crm-demo-1',
  name: 'Amaka Okafor',
  email: 'amaka.o@example.com',
  phone: '+234 803 123 4567',
  type: 'lead',
  status: 'new',
  source: 'Landing Page CTA',
  notes: 'Interested in a custom anniversary card package.',
  related_experience_id: null,
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
};

const seedContact2: CRMContact = {
  id: 'crm-demo-2',
  name: 'Tunde Bakare',
  email: 'tunde@example.com',
  phone: '+234 802 987 6543',
  type: 'support',
  status: 'in_progress',
  source: 'Checkout Help',
  notes: 'Asked about custom song upload option.',
  related_experience_id: 'exp-demo-001',
  created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
};

crmContactsStore.set(seedContact1.id, seedContact1);
crmContactsStore.set(seedContact2.id, seedContact2);

// Helper to generate slug with cryptographically secure random entropy (~64 bits)
function generateSlug(sender: string, receiver: string): string {
  const cleanSender = (sender || 'someone').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanReceiver = (receiver || 'love').toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = crypto.randomBytes(8).toString('base64url');
  return `love-${cleanSender}-${cleanReceiver}-${randomSuffix}`;
}

// Seed Demo Experience (`/w/demo`)
const seedDemoExperience: Experience = {
  id: 'exp-demo-001',
  slug: 'demo',
  sender_name: 'David',
  receiver_name: 'Sophia',
  occasion: '3rd Wedding Anniversary',
  tier: 'paid',
  image_count: 3,
  is_paid: true,
  payment_reference: 'ref_demo_paid_1001',
  views_count: 142,
  reactions_count: 28,
  created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  slides: [
    {
      id: 'slide-1',
      type: 'text',
      content: 'Dear Sophia,\n\nHappy 3rd Anniversary! Three years ago today, I made the best decision of my life when I walked down the aisle to meet you.',
      order: 1,
    },
    {
      id: 'slide-2',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1000&q=80',
      caption: 'Our magical wedding day in Lagos',
      order: 2,
    },
    {
      id: 'slide-3',
      type: 'text',
      content: 'Every single day with you is a gift. From our quiet morning coffees to our spontaneous weekend road trips, you fill my heart with unmatched joy.',
      order: 3,
    },
    {
      id: 'slide-4',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
      caption: 'Sunset in Zanzibar, 2025',
      order: 4,
    },
    {
      id: 'slide-5',
      type: 'text',
      content: 'Thank you for your warmth, your laughter, and the endless support you give me every step of the way. I love the home we have built together.',
      order: 5,
    },
    {
      id: 'slide-6',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80',
      caption: 'Forever my favorite smile',
      order: 6,
    },
    {
      id: 'slide-7',
      type: 'text',
      content: 'Here is to a lifetime of more laughter, deeper conversations, and endless love.\n\nWith all my heart,\nDavid 💖',
      order: 7,
    },
  ],
};

// Startup check for Supabase persistence
const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);

console.log(`[Amorah API Startup] isSupabaseConfigured: ${isSupabaseConfigured} (SUPABASE_URL set: ${hasSupabaseUrl}, SUPABASE_SERVICE_ROLE_KEY/ANON_KEY set: ${hasSupabaseKey})`);

if (isSupabaseConfigured) {
  console.log('✅ [Amorah API] Supabase DB is CONFIGURED and CONNECTED. Story data & links persist indefinitely with no TTL.');
} else {
  console.warn(
    '⚠️ [Amorah API] CRITICAL WARNING: Supabase credentials (SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY) are missing. Running on transient in-memory stores that WILL NOT PERSIST across Vercel serverless function instances!'
  );
}

experiencesStore.set('demo', seedDemoExperience);

// Seed initial users
usersStore.set('user-demo-1', {
  id: 'user-demo-1',
  email: 'david@example.com',
  tier: 'paid',
  created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
});

// API Router setup (supports dual mounting on '/api' and '/' for Vercel Serverless & Local)
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Amorah API',
    supabaseConfigured: isSupabaseConfigured,
    database: isSupabaseConfigured ? 'supabase' : 'in-memory (transient)',
    environment: process.env.NODE_ENV || 'development',
    persistence: isSupabaseConfigured
      ? 'Database persistent across serverless instances - links persist indefinitely (no TTL)'
      : 'WARNING: In-memory store active. Data will NOT persist across Vercel serverless function invocations!',
  });
});

// Lightweight Signed URL Endpoint for Direct Client-to-Supabase Storage Uploads
apiRouter.post('/upload-url', async (req, res) => {
  try {
    const { fileName, contentType, bucket } = req.body;
    const allowedBuckets = ['experience-images', 'wedding-cover-photos', 'theme-assets'];
    const targetBucket = allowedBuckets.includes(bucket) ? bucket : 'experience-images';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${(fileName || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '')}`;

    if (isSupabaseConfigured && supabase) {
      // Attempt signed upload URL creation for target bucket
      const { data, error } = await supabase.storage
        .from(targetBucket)
        .createSignedUploadUrl(cleanFileName);

      const { data: publicUrlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(cleanFileName);

      if (!error && data) {
        return res.json({
          signedUrl: data.signedUrl,
          path: cleanFileName,
          token: data.token,
          publicUrl: publicUrlData.publicUrl,
        });
      }
    }

    return res.status(500).json({ message: 'Failed to generate upload URL. Please try again.' });
  } catch (err: any) {
    console.error('Signed upload URL error:', err);
    res.status(500).json({ message: 'Failed to generate upload URL. Please try again.' });
  }
});

// Dedicated Voice Message Upload Endpoint for Paid Tier
apiRouter.post('/upload-voice', async (req, res) => {
  try {
    const { audioData, fileName, contentType } = req.body;
    if (!audioData) {
      return res.status(400).json({ message: 'Audio data is required.' });
    }

    const cleanFileName = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${(fileName || 'recording.webm').replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const mimeType = contentType || 'audio/webm';

    if (isSupabaseConfigured && supabase) {
      let audioBuffer: Buffer;
      if (typeof audioData === 'string' && audioData.startsWith('data:')) {
        const base64Content = audioData.split(',')[1] || audioData;
        audioBuffer = Buffer.from(base64Content, 'base64');
      } else if (typeof audioData === 'string') {
        audioBuffer = Buffer.from(audioData, 'base64');
      } else {
        audioBuffer = Buffer.from(audioData);
      }

      const { error } = await supabase.storage
        .from('voice-messages')
        .upload(cleanFileName, audioBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error('Error uploading voice message to Supabase storage:', error);
        return res.status(500).json({ message: 'Failed to upload voice message to storage.' });
      }

      const { data: publicUrlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(cleanFileName);

      return res.json({
        url: publicUrlData.publicUrl,
        publicUrl: publicUrlData.publicUrl,
        path: cleanFileName,
      });
    }

    // Fallback when Supabase storage is not configured
    res.json({
      url: audioData,
      publicUrl: audioData,
      path: cleanFileName,
      fallback: true,
    });
  } catch (err: any) {
    console.error('Voice upload error:', err);
    res.status(500).json({ message: 'Failed to process voice upload. Please try again.' });
  }
});

// Create new experience
apiRouter.post('/experiences', createExperienceLimiter, async (req, res) => {
  try {
    const payload: CreateExperiencePayload = req.body;
    if (!payload || !payload.sender_name || !payload.receiver_name || !payload.message) {
      return res.status(400).json({ message: 'Sender name, receiver name, and message are required.' });
    }

    const sender_name = payload.sender_name.trim();
    const receiver_name = payload.receiver_name.trim();
    const occasion = (payload.occasion || 'Special Moment').trim();
    const message = payload.message.trim();
    const creator_email = payload.creator_email ? payload.creator_email.trim() : undefined;

    if (!sender_name) {
      return res.status(400).json({ message: 'Sender name cannot be empty.' });
    }
    if (sender_name.length > 60) {
      return res.status(400).json({ message: 'Sender name must be under 60 characters.' });
    }

    if (!receiver_name) {
      return res.status(400).json({ message: 'Receiver name cannot be empty.' });
    }
    if (receiver_name.length > 60) {
      return res.status(400).json({ message: 'Receiver name must be under 60 characters.' });
    }

    if (occasion.length > 60) {
      return res.status(400).json({ message: 'Occasion must be under 60 characters.' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message must be under 2000 characters.' });
    }

    if (creator_email) {
      if (creator_email.length > 255) {
        return res.status(400).json({ message: 'Creator email must be under 255 characters.' });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(creator_email)) {
        return res.status(400).json({ message: 'Please provide a valid creator email address.' });
      }
    }

    const id = crypto.randomUUID();
    const slug = generateSlug(sender_name, receiver_name);
    const tier = payload.tier || 'free';
    const images = payload.images || [];

    const generatedSlides = generateSlides(
      sender_name,
      receiver_name,
      occasion,
      message,
      tier,
      images
    );

    const experience: Experience = {
      id,
      slug,
      sender_name,
      receiver_name,
      occasion,
      tier,
      image_count: images.length,
      is_paid: tier === 'free', // Free tier is instantly active; Paid requires paystack step
      payment_reference: null,
      voice_message_url: payload.voice_message_url || null,
      views_count: 0,
      reactions_count: 0,
      created_at: new Date().toISOString(),
      slides: generatedSlides,
    };

    if (isSupabaseConfigured && supabase) {
      const { error: expError } = await supabase.from('experiences').insert({
        id: experience.id,
        slug: experience.slug,
        sender_name: experience.sender_name,
        receiver_name: experience.receiver_name,
        occasion: experience.occasion,
        tier: experience.tier,
        image_count: experience.image_count,
        is_paid: experience.is_paid,
        payment_reference: experience.payment_reference,
        voice_message_url: experience.voice_message_url,
        views_count: experience.views_count,
        reactions_count: experience.reactions_count,
        slides: experience.slides,
        created_at: experience.created_at,
      });

      if (expError) {
        console.error('CRITICAL: Error inserting experience to Supabase database:', expError);
        return res.status(500).json({ message: 'Failed to save experience. Please try again.' });
      }

      if (creator_email) {
        const { error: userError } = await supabase.from('users').insert({
          email: creator_email,
          tier,
        });

        if (userError) {
          console.error('CRITICAL: Error inserting user to Supabase database:', userError);
          return res.status(500).json({ message: 'Failed to save experience. Please try again.' });
        }
      }
    } else {
      console.warn(
        `⚠️ WARNING: [POST /experiences] Supabase is NOT configured. Created experience '${slug}' in transient in-memory store. It will NOT persist across Vercel serverless function invocations!`
      );
    }

    // Always sync to in-memory store for fast local access / fallback
    experiencesStore.set(slug, experience);
    if (creator_email) {
      const userId = `usr-${Date.now()}`;
      usersStore.set(userId, {
        id: userId,
        email: creator_email,
        tier,
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json(experience);
  } catch (err: any) {
    console.error('Error creating experience:', err);
    res.status(500).json({ message: 'Failed to save experience. Please try again.' });
  }
});

// Get experience by slug
apiRouter.get('/experiences/:slug', async (req, res) => {
  const slug = req.params.slug;

  if (isSupabaseConfigured && supabase) {
    const { data: expData, error } = await supabase
      .from('experiences')
      .select('*')
      .eq('slug', slug)
      .single();

    if (expData && !error) {
      const updatedViews = (expData.views_count || 0) + 1;
      await supabase
        .from('experiences')
        .update({ views_count: updatedViews })
        .eq('slug', slug);

      expData.views_count = updatedViews;
      return res.json(expData);
    }

    if (error && error.code !== 'PGRST116') {
      console.error(`[GET /experiences/${slug}] Supabase query error:`, error);
    }
  } else {
    console.warn(
      `⚠️ WARNING: [GET /experiences/${slug}] Supabase is NOT configured. Fallback to transient in-memory store.`
    );
  }

  // Fallback to in-memory store
  const exp = experiencesStore.get(slug);

  if (!exp) {
    return res.status(404).json({ message: 'Experience not found.' });
  }

  exp.views_count += 1;
  experiencesStore.set(slug, exp);

  res.json(exp);
});

// React to experience (Heart reaction)
apiRouter.post('/experiences/:slug/react', async (req, res) => {
  const slug = req.params.slug;

  if (isSupabaseConfigured && supabase) {
    const { data: expData } = await supabase
      .from('experiences')
      .select('reactions_count')
      .eq('slug', slug)
      .single();

    if (expData) {
      const updatedReactions = (expData.reactions_count || 0) + 1;
      await supabase
        .from('experiences')
        .update({ reactions_count: updatedReactions })
        .eq('slug', slug);

      return res.json({ reactions_count: updatedReactions });
    }
  }

  // Fallback
  const exp = experiencesStore.get(slug);

  if (!exp) {
    return res.status(404).json({ message: 'Experience not found.' });
  }

  exp.reactions_count += 1;
  experiencesStore.set(slug, exp);

  res.json({ reactions_count: exp.reactions_count });
});

// Initialize Paystack Payment
apiRouter.post('/paystack/initialize', paystackInitializeLimiter, async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ message: 'Paystack secret key (PAYSTACK_SECRET_KEY) is not configured on the server.' });
    }

    const { experience_id, email } = req.body;

    let exp: Experience | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('experiences').select('*').eq('id', experience_id).single();
      if (data) exp = data;
    }

    if (!exp) {
      for (const item of experiencesStore.values()) {
        if (item.id === experience_id) {
          exp = item;
          break;
        }
      }
    }

    if (!exp) {
      return res.status(404).json({ message: 'Experience not found.' });
    }

    const customerEmail = (email || exp.creator_email || '').trim();
    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({ message: 'A valid customer email address is required to initialize payment.' });
    }

    const reference = `LW_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Determine domain for Paystack checkout redirect callback_url
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'localhost:3000';
    const reqOrigin = req.headers.origin;
    const baseUrl = reqOrigin || `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/pay?expId=${encodeURIComponent(exp.id)}`;

    // Call Paystack's real Initialize Transaction API endpoint
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: customerEmail,
        amount: PAID_PLAN_PRICE_KOBO,
        reference,
        callback_url: callbackUrl,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack initialize error:', paystackData);
      return res.status(400).json({
        message: 'Failed to initialize payment transaction. Please try again.',
      });
    }

    const { authorization_url } = paystackData.data;

    exp.payment_reference = reference;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('experiences').update({ payment_reference: reference }).eq('id', exp.id);
    }
    experiencesStore.set(exp.slug, exp);

    return res.json({
      authorization_url,
      reference,
      amount: PAID_PLAN_PRICE_KOBO,
    });
  } catch (err: unknown) {
    console.error('Initialize payment exception:', err);
    return res.status(500).json({ message: 'Failed to initialize payment. Please try again.' });
  }
});

// Verify Paystack Payment
apiRouter.post('/paystack/verify', async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({ message: 'Paystack secret key (PAYSTACK_SECRET_KEY) is not configured on the server.' });
    }

    const { reference, experience_id } = req.body;
    if (!reference) {
      return res.status(400).json({ message: 'Transaction reference is required.' });
    }

    // Call Paystack's real Verify Transaction API endpoint
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack verify API error response:', paystackData);
      return res.status(400).json({
        message: 'Payment verification failed. Please try again.',
      });
    }

    const txData = paystackData.data;

    // Only set is_paid: true if data.status === 'success' AND data.amount === 200000 (PAID_PLAN_PRICE_KOBO)
    if (txData.status !== 'success' || txData.amount !== PAID_PLAN_PRICE_KOBO) {
      console.error(`Paystack verify failed status/amount check: status=${txData.status}, amount=${txData.amount}`);
      return res.status(400).json({
        message: 'Payment verification failed. Invalid transaction status or amount.',
      });
    }

    let exp: Experience | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('experiences')
        .select('*')
        .or(`id.eq.${experience_id},payment_reference.eq.${reference}`)
        .single();
      if (data) exp = data;
    }

    if (!exp) {
      for (const item of experiencesStore.values()) {
        if (item.id === experience_id || item.payment_reference === reference) {
          exp = item;
          break;
        }
      }
    }

    if (!exp) {
      return res.status(404).json({ message: 'Experience or transaction reference not found.' });
    }

    exp.is_paid = true;
    exp.payment_reference = reference;

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('experiences')
        .update({ is_paid: true, payment_reference: reference })
        .eq('id', exp.id);
    }

    experiencesStore.set(exp.slug, exp);

    return res.json({
      success: true,
      message: 'Payment verified successfully!',
      experience: exp,
    });
  } catch (err: unknown) {
    console.error('Verify payment exception:', err);
    return res.status(500).json({ message: 'Payment verification failed. Please try again.' });
  }
});

// Paystack Webhook endpoint with HMAC SHA512 signature verification
apiRouter.post('/paystack/webhook', async (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'] as string;

  if (!secretKey || !signature) {
    return res.status(401).json({ message: 'Unauthorized: Missing signature or secret key.' });
  }

  // Compute HMAC SHA512 hash of raw request body
  const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  const hash = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');

  if (hash !== signature) {
    return res.status(401).json({ message: 'Unauthorized: Invalid webhook signature.' });
  }

  const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

  if (event && event.event === 'charge.success') {
    const txData = event.data;
    if (txData && txData.status === 'success') {
      const reference = txData.reference;
      const metadata = txData.metadata || {};
      const isWedding = metadata.type === 'wedding' || reference?.startsWith('AMORAH_WEDDING_');

      if (isWedding && txData.amount >= WEDDING_PLAN_PRICE_KOBO) {
        const weddingId = metadata.wedding_id || metadata.weddingId;
        if (isSupabaseConfigured && supabase) {
          if (weddingId) {
            await supabase.from('weddings').update({ is_paid: true }).eq('id', weddingId);
          } else if (reference) {
            await supabase.from('weddings').update({ is_paid: true }).eq('payment_reference', reference);
          }
        }
        for (const w of weddingsStore.values()) {
          if (w.id === weddingId || w.payment_reference === reference) {
            w.is_paid = true;
            weddingsStore.set(w.id, w);
            break;
          }
        }
      } else if (txData.amount === PAID_PLAN_PRICE_KOBO) {
        if (reference) {
          if (isSupabaseConfigured && supabase) {
            await supabase
              .from('experiences')
              .update({ is_paid: true })
              .eq('payment_reference', reference);
          }

          for (const item of experiencesStore.values()) {
            if (item.payment_reference === reference) {
              item.is_paid = true;
              experiencesStore.set(item.slug, item);
              break;
            }
          }
        }
      }
    }
  }

  return res.status(200).json({ status: 'success' });
});

// Periodic Cleanup Task for Abandoned Unpaid Wedding Records (> 24 hours old)
async function cleanupUnpaidWeddings() {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('weddings')
        .delete()
        .eq('is_paid', false)
        .lt('created_at', cutoff);
    }
    for (const [id, w] of weddingsStore.entries()) {
      if (!w.is_paid && w.created_at < cutoff) {
        weddingsStore.delete(id);
        weddingEventsStore.delete(id);
      }
    }
  } catch (err) {
    console.error('Error cleaning up unpaid weddings:', err);
  }
}
setInterval(cleanupUnpaidWeddings, 60 * 60 * 1000);

// Admin Authentication & Session Management using iron-session
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;

if (!SESSION_SECRET) {
  console.error('🚨 FATAL: SESSION_SECRET (or ADMIN_SESSION_SECRET) environment variable is not set.');
  throw new Error('SESSION_SECRET environment variable is required and must be set in production.');
}

function requireRole(allowedRoles: Array<'super_admin' | 'admin' | 'support'>) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const sessionCookie = req.cookies?.admin_session;
      if (!sessionCookie) {
        return res.status(401).json({ message: 'Unauthorized. Admin session required.' });
      }

      const session = await unsealData<{
        isAdmin?: boolean;
        email?: string;
        role?: 'super_admin' | 'admin' | 'support';
        isRootAdmin?: boolean;
      }>(sessionCookie, { password: SESSION_SECRET });

      if (session && session.isAdmin) {
        const userRole = session.role || 'super_admin';
        if (allowedRoles.includes(userRole)) {
          (req as any).adminSession = { ...session, role: userRole };
          return next();
        }
        return res.status(403).json({ message: 'Forbidden. Insufficient permissions for this action.' });
      }

      return res.status(401).json({ message: 'Unauthorized. Invalid or expired session.' });
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized. Invalid session token.' });
    }
  };
}

async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  return requireRole(['super_admin', 'admin', 'support'])(req, res, next);
}

// Weddings Authentication & Session Management
async function requireCoupleAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const sessionCookie = req.cookies?.couple_session;
    if (!sessionCookie) {
      return res.status(401).json({ message: 'Unauthorized. Couple session required.' });
    }

    const session = await unsealData<{
      id: string;
      email: string;
      full_name?: string | null;
      loggedInAt: number;
    }>(sessionCookie, { password: SESSION_SECRET });

    if (session && session.id && session.email) {
      (req as any).coupleSession = session;
      return next();
    }

    return res.status(401).json({ message: 'Unauthorized. Invalid or expired couple session.' });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized. Invalid session token.' });
  }
}

async function optionalCoupleAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const sessionCookie = req.cookies?.couple_session;
    if (sessionCookie) {
      const session = await unsealData<{
        id: string;
        email: string;
        full_name?: string | null;
        loggedInAt: number;
      }>(sessionCookie, { password: SESSION_SECRET });

      if (session && session.id && session.email) {
        (req as any).coupleSession = session;
      }
    }
  } catch (err) {
    // Silently ignore invalid session cookie for optional auth
  }
  return next();
}

// POST /api/weddings/signup
apiRouter.post('/weddings/signup', weddingsAuthLimiter, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = full_name && typeof full_name === 'string' ? full_name.trim() : null;

    // Check if email already exists in Supabase or store
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase.from('couple_accounts').select('id').eq('email', cleanEmail).single();
      if (existing) {
        return res.status(400).json({ message: 'An account with this email address already exists.' });
      }
    }

    for (const acc of coupleAccountsStore.values()) {
      if (acc.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({ message: 'An account with this email address already exists.' });
      }
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newCoupleRecord: CoupleAccountInternal = {
      id,
      email: cleanEmail,
      password_hash,
      full_name: cleanFullName,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('couple_accounts').insert({
        id: newCoupleRecord.id,
        email: newCoupleRecord.email,
        password_hash: newCoupleRecord.password_hash,
        full_name: newCoupleRecord.full_name,
        created_at: newCoupleRecord.created_at,
      });

      if (error) {
        console.error('Supabase couple_account insert error:', error);
        return res.status(500).json({ message: 'Failed to create account. Please try again.' });
      }
    }

    coupleAccountsStore.set(id, newCoupleRecord);

    const sessionData = {
      id,
      email: cleanEmail,
      full_name: cleanFullName,
      loggedInAt: Date.now(),
    };

    const sealedCookie = await sealData(sessionData, {
      password: SESSION_SECRET,
      ttl: 7 * 24 * 60 * 60, // 7 days
    });

    res.cookie('couple_session', sealedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      couple: {
        id,
        email: cleanEmail,
        full_name: cleanFullName,
      },
    });
  } catch (err: unknown) {
    console.error('Couple signup error:', err);
    return res.status(500).json({ message: 'Failed to create account. Please try again.' });
  }
});

// POST /api/weddings/login
apiRouter.post('/weddings/login', weddingsAuthLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let account: CoupleAccountInternal | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('couple_accounts').select('*').eq('email', cleanEmail).single();
      if (data) account = data;
    }

    if (!account) {
      for (const acc of coupleAccountsStore.values()) {
        if (acc.email.toLowerCase() === cleanEmail) {
          account = acc;
          break;
        }
      }
    }

    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatches = bcrypt.compareSync(password, account.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const sessionData = {
      id: account.id,
      email: account.email,
      full_name: account.full_name,
      loggedInAt: Date.now(),
    };

    const sealedCookie = await sealData(sessionData, {
      password: SESSION_SECRET,
      ttl: 7 * 24 * 60 * 60,
    });

    res.cookie('couple_session', sealedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      couple: {
        id: account.id,
        email: account.email,
        full_name: account.full_name,
      },
    });
  } catch (err: unknown) {
    console.error('Couple login error:', err);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// POST /api/weddings/logout
apiRouter.post('/weddings/logout', (req, res) => {
  res.clearCookie('couple_session', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/weddings/me
apiRouter.get('/weddings/me', requireCoupleAuth, (req, res) => {
  const session = (req as any).coupleSession || {};
  res.json({
    authenticated: true,
    couple: {
      id: session.id,
      email: session.email,
      full_name: session.full_name || null,
    },
  });
});

// GET /api/weddings/mine — List non-sensitive metadata for weddings owned by logged-in couple (requireCoupleAuth)
apiRouter.get('/weddings/mine', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    let list: Array<{
      id: string;
      slug: string;
      bride_first_name?: string;
      bride_other_names?: string;
      groom_first_name?: string;
      groom_other_names?: string;
      couple_names?: string;
      is_paid: boolean;
      created_at: string;
    }> = [];

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weddings')
        .select('id, slug, bride_first_name, bride_other_names, groom_first_name, groom_other_names, couple_names, is_paid, created_at')
        .eq('couple_account_id', couple.id)
        .order('created_at', { ascending: false });
      if (data && !error) {
        list = data;
      }
    } else {
      for (const w of weddingsStore.values()) {
        if (w.couple_account_id === couple.id) {
          list.push({
            id: w.id,
            slug: w.slug,
            bride_first_name: w.bride_first_name || undefined,
            bride_other_names: w.bride_other_names || undefined,
            groom_first_name: w.groom_first_name || undefined,
            groom_other_names: w.groom_other_names || undefined,
            couple_names: w.couple_names || undefined,
            is_paid: w.is_paid,
            created_at: w.created_at,
          });
        }
      }
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return res.json({ success: true, weddings: list });
  } catch (err: unknown) {
    console.error('Error fetching couple weddings:', err);
    return res.status(500).json({ message: 'Failed to fetch couple weddings.' });
  }
});

// POST /api/admin/login
apiRouter.post('/admin/login', adminLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rootEmail = (process.env.ADMIN_EMAIL || 'admin@lovewrapped.app').trim().toLowerCase();
    const rootHash = process.env.ADMIN_PASSWORD_HASH;

    if (cleanEmail === rootEmail) {
      if (!rootHash) {
        console.error('🚨 FATAL: ADMIN_PASSWORD_HASH environment variable is not set. Admin login is disabled until this is configured.');
        return res.status(503).json({ message: 'Admin login is not configured. Contact the system administrator.' });
      }

      const passwordMatches = bcrypt.compareSync(password, rootHash);
      if (!passwordMatches) {
        return res.status(401).json({ message: 'Invalid admin email or password.' });
      }

      const sessionData = {
        isAdmin: true,
        email: rootEmail,
        role: 'super_admin' as const,
        isRootAdmin: true,
        loggedInAt: Date.now(),
      };

      const sealedCookie = await sealData(sessionData, {
        password: SESSION_SECRET,
        ttl: 7 * 24 * 60 * 60, // 7 days
      });

      res.cookie('admin_session', sealedCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return res.json({ success: true, message: 'Admin login successful.', email: rootEmail, role: 'super_admin', isRootAdmin: true });
    }

    // Check database & in-memory store for sub-admin
    let adminRecord: AdminRecordInternal | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('admins').select('*').eq('email', cleanEmail).single();
      if (data) adminRecord = data;
    }

    if (!adminRecord) {
      for (const a of adminsStore.values()) {
        if (a.email.toLowerCase() === cleanEmail) {
          adminRecord = a;
          break;
        }
      }
    }

    if (!adminRecord) {
      return res.status(401).json({ message: 'Invalid admin email or password.' });
    }

    const passwordMatches = bcrypt.compareSync(password, adminRecord.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid admin email or password.' });
    }

    const sessionData = {
      isAdmin: true,
      email: adminRecord.email,
      role: adminRecord.role,
      isRootAdmin: false,
      loggedInAt: Date.now(),
    };

    const sealedCookie = await sealData(sessionData, {
      password: SESSION_SECRET,
      ttl: 7 * 24 * 60 * 60,
    });

    res.cookie('admin_session', sealedCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      message: 'Admin login successful.',
      email: adminRecord.email,
      role: adminRecord.role,
      isRootAdmin: false,
    });
  } catch (err: unknown) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// GET /api/admin/me (Check Session)
apiRouter.get('/admin/me', requireAdmin, (req, res) => {
  const session = (req as any).adminSession || {};
  res.json({
    authenticated: true,
    email: session.email || 'admin@lovewrapped.app',
    role: session.role || 'super_admin',
    isRootAdmin: Boolean(session.isRootAdmin),
  });
});

// POST /api/admin/logout
apiRouter.post('/admin/logout', (req, res) => {
  res.clearCookie('admin_session', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Admin API Routes
apiRouter.get('/admin/metrics', requireRole(['super_admin', 'admin']), async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: exps } = await supabase.from('experiences').select('*');
    const { data: users } = await supabase.from('users').select('*');

    const allExperiences: Experience[] = exps || [];
    const allUsers: UserRecord[] = users || [];

    const paidExps = allExperiences.filter((e) => e.tier === 'paid' && e.is_paid);
    const freeExps = allExperiences.filter((e) => e.tier === 'free');
    const paidUsersCount = allUsers.filter((u) => u.tier === 'paid').length;
    const totalReactions = allExperiences.reduce((acc, curr) => acc + (curr.reactions_count || 0), 0);
    const totalRevenueNgn = paidExps.length * PAID_PLAN_PRICE_NGN;

    return res.json({
      totalUsers: allUsers.length + allExperiences.length,
      totalExperiences: allExperiences.length,
      paidUsers: paidUsersCount || paidExps.length,
      totalRevenueNgn,
      freeExperiencesCount: freeExps.length,
      paidExperiencesCount: paidExps.length,
      totalReactions,
    });
  }

  // Fallback
  const allExperiences = Array.from(experiencesStore.values());
  const allUsers = Array.from(usersStore.values());

  const paidExps = allExperiences.filter((e) => e.tier === 'paid' && e.is_paid);
  const freeExps = allExperiences.filter((e) => e.tier === 'free');
  const paidUsersCount = allUsers.filter((u) => u.tier === 'paid').length;
  const totalReactions = allExperiences.reduce((acc, curr) => acc + (curr.reactions_count || 0), 0);

  const totalRevenueNgn = paidExps.length * PAID_PLAN_PRICE_NGN;

  res.json({
    totalUsers: allUsers.length + allExperiences.length,
    totalExperiences: allExperiences.length,
    paidUsers: paidUsersCount || paidExps.length,
    totalRevenueNgn,
    freeExperiencesCount: freeExps.length,
    paidExperiencesCount: paidExps.length,
    totalReactions,
  });
});

// GET /api/admin/metrics/timeseries - Daily revenue & signups trend over last 30 days
apiRouter.get('/admin/metrics/timeseries', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    let allExperiences: Experience[] = [];
    let allUsers: UserRecord[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data: exps } = await supabase.from('experiences').select('*');
      const { data: users } = await supabase.from('users').select('*');
      allExperiences = exps || [];
      allUsers = users || [];
    } else {
      allExperiences = Array.from(experiencesStore.values());
      allUsers = Array.from(usersStore.values());
    }

    const daysMap = new Map<string, { date: string; displayDate: string; revenue: number; paidCount: number; freeCount: number; signups: number }>();

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap.set(dateStr, {
        date: dateStr,
        displayDate,
        revenue: 0,
        paidCount: 0,
        freeCount: 0,
        signups: 0,
      });
    }

    for (const exp of allExperiences) {
      if (!exp.created_at) continue;
      const dateStr = new Date(exp.created_at).toISOString().split('T')[0];
      if (daysMap.has(dateStr)) {
        const entry = daysMap.get(dateStr)!;
        if (exp.tier === 'paid' && exp.is_paid) {
          entry.revenue += PAID_PLAN_PRICE_NGN;
          entry.paidCount += 1;
        } else {
          entry.freeCount += 1;
        }
      }
    }

    for (const user of allUsers) {
      if (!user.created_at) continue;
      const dateStr = new Date(user.created_at).toISOString().split('T')[0];
      if (daysMap.has(dateStr)) {
        const entry = daysMap.get(dateStr)!;
        entry.signups += 1;
      }
    }

    res.json(Array.from(daysMap.values()));
  } catch (err: unknown) {
    console.error('Timeseries error:', err);
    res.status(500).json({ message: 'Failed to fetch timeseries metrics.' });
  }
});

apiRouter.get('/admin/users', requireRole(['super_admin', 'admin']), async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return res.json(users || []);
  }

  const usersList = Array.from(usersStore.values());
  res.json(usersList);
});

apiRouter.get('/admin/experiences', requireRole(['super_admin', 'admin', 'support']), async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: exps } = await supabase
      .from('experiences')
      .select('id, slug, sender_name, receiver_name, occasion, tier, is_paid, payment_reference, image_count, views_count, reactions_count, created_at')
      .order('created_at', { ascending: false });
    return res.json(exps || []);
  }

  const expsList = Array.from(experiencesStore.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((exp) => ({
      id: exp.id,
      slug: exp.slug,
      sender_name: exp.sender_name,
      receiver_name: exp.receiver_name,
      occasion: exp.occasion,
      tier: exp.tier,
      is_paid: exp.is_paid,
      payment_reference: exp.payment_reference,
      image_count: exp.image_count,
      views_count: exp.views_count,
      reactions_count: exp.reactions_count,
      created_at: exp.created_at,
    }));
  res.json(expsList);
});

// PATCH /api/admin/experiences/:id/payment-status - Manual paid/refund toggle
apiRouter.patch('/admin/experiences/:id/payment-status', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const id = req.params.id;
    const { is_paid } = req.body;

    if (typeof is_paid !== 'boolean') {
      return res.status(400).json({ message: 'is_paid boolean is required.' });
    }

    let updatedExp: Experience | undefined;

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('experiences')
        .update({ is_paid })
        .eq('id', id)
        .select('id, slug, sender_name, receiver_name, occasion, tier, is_paid, payment_reference, image_count, views_count, reactions_count, created_at')
        .single();
      if (data) updatedExp = data;
    }

    for (const item of experiencesStore.values()) {
      if (item.id === id) {
        item.is_paid = is_paid;
        if (!updatedExp) updatedExp = item;
        experiencesStore.set(item.slug, item);
        break;
      }
    }

    if (!updatedExp) {
      return res.status(404).json({ message: 'Experience not found.' });
    }

    const sanitizedExp = {
      id: updatedExp.id,
      slug: updatedExp.slug,
      sender_name: updatedExp.sender_name,
      receiver_name: updatedExp.receiver_name,
      occasion: updatedExp.occasion,
      tier: updatedExp.tier,
      is_paid: updatedExp.is_paid,
      payment_reference: updatedExp.payment_reference,
      image_count: updatedExp.image_count,
      views_count: updatedExp.views_count,
      reactions_count: updatedExp.reactions_count,
      created_at: updatedExp.created_at,
    };

    return res.json({ success: true, experience: sanitizedExp });
  } catch (err: unknown) {
    console.error('Error updating payment status:', err);
    return res.status(500).json({ message: 'Failed to update payment status. Please try again.' });
  }
});

apiRouter.delete('/admin/experiences/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  const id = req.params.id;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('experiences').delete().eq('id', id);
    if (!error) {
      return res.json({ success: true, message: 'Experience deleted successfully.' });
    }
  }

  let targetSlug: string | null = null;
  for (const [slug, exp] of experiencesStore.entries()) {
    if (exp.id === id) {
      targetSlug = slug;
      break;
    }
  }

  if (targetSlug) {
    experiencesStore.delete(targetSlug);
    return res.json({ success: true, message: 'Experience deleted successfully.' });
  }

  res.status(404).json({ message: 'Experience not found.' });
});

/* ==================== Public Blog Endpoints ==================== */

// GET /api/blog — List published blog posts
apiRouter.get('/blog', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (data && !error) {
        return res.json(data);
      }
    }

    const posts = Array.from(blogPostsStore.values())
      .filter((p) => p.published)
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime());

    return res.json(posts);
  } catch (err: unknown) {
    console.error('Error fetching blog posts:', err);
    return res.status(500).json({ message: 'Failed to fetch blog posts.' });
  }
});

// GET /api/blog/:slug — Single published blog post
apiRouter.get('/blog/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (data && !error) {
        return res.json(data);
      }
    }

    let foundPost: BlogPost | undefined;
    for (const post of blogPostsStore.values()) {
      if (post.slug === slug && post.published) {
        foundPost = post;
        break;
      }
    }

    if (!foundPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    return res.json(foundPost);
  } catch (err: unknown) {
    console.error('Error fetching blog post:', err);
    return res.status(500).json({ message: 'Failed to fetch blog post.' });
  }
});

/* ==================== Weddings API Endpoints (Phase 1) ==================== */

// GET /api/weddings/slug/:slug — Public fetch of paid wedding + events (with optional ?g=:token for personalized guest context)
apiRouter.get('/weddings/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const token = req.query.g ? String(req.query.g).trim() : null;

    let wedding: Wedding | null = null;
    let events: WeddingEvent[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data: wData } = await supabase
        .from('weddings')
        .select('*')
        .eq('slug', slug)
        .eq('is_paid', true)
        .single();
      if (wData) wedding = wData;
    }

    if (!wedding) {
      for (const w of weddingsStore.values()) {
        if (w.slug === slug && w.is_paid) {
          wedding = w;
          break;
        }
      }
    }

    if (!wedding) {
      return res.status(404).json({ message: 'Wedding invitation not found or payment pending.' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data: eData } = await supabase
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', wedding.id);
      if (eData) events = eData;
    } else {
      events = weddingEventsStore.get(wedding.id) || [];
    }

    // Personalized Guest Token Handling (?g=:token)
    let activeGuest: WeddingGuest | null = null;
    let assignedEventIds: string[] = [];

    if (token) {
      if (isSupabaseConfigured && supabase) {
        const { data: gData } = await supabase
          .from('wedding_guests')
          .select('*')
          .eq('unique_link_token', token)
          .eq('wedding_id', wedding.id)
          .single();

        if (gData) {
          activeGuest = gData;
          // Open tracking: timestamp when guest opened personalized link
          if (!activeGuest.opened_at) {
            const openedAt = new Date().toISOString();
            activeGuest.opened_at = openedAt;
            await supabase.from('wedding_guests').update({ opened_at: openedAt }).eq('id', activeGuest.id);
          }

          // Fetch guest assigned events
          const { data: geData } = await supabase
            .from('wedding_guest_events')
            .select('event_id')
            .eq('guest_id', activeGuest.id);
          if (geData && geData.length > 0) {
            assignedEventIds = geData.map((ge) => ge.event_id);
          }
        }
      } else {
        for (const g of weddingGuestsStore.values()) {
          if (g.unique_link_token === token && g.wedding_id === wedding.id) {
            activeGuest = g;
            if (!g.opened_at) {
              g.opened_at = new Date().toISOString();
            }
            assignedEventIds = weddingGuestEventsStore.get(g.id) || [];
            break;
          }
        }
      }

      if (!activeGuest) {
        // SECURITY CHECK: Invalid token fails cleanly to generic 404 without exposing other guests' data
        return res.status(404).json({ message: 'Personalized wedding invitation link not found or invalid token.' });
      }

      // Filter events to ONLY show events assigned to this guest (if custom event assignment exists)
      if (assignedEventIds.length > 0) {
        events = events.filter((e) => assignedEventIds.includes(e.id));
      }
    }

    let guestRsvps: WeddingRSVP[] = [];
    if (activeGuest && isSupabaseConfigured && supabase) {
      const { data: rData } = await supabase
        .from('wedding_rsvps')
        .select('*')
        .eq('wedding_id', wedding.id)
        .eq('guest_id', activeGuest.id);
      if (rData) guestRsvps = rData;
    } else if (activeGuest) {
      const allRsvps = weddingRsvpsStore.get(wedding.id) || [];
      guestRsvps = allRsvps.filter((r) => r.guest_id === activeGuest.id);
    }

    return res.json({
      wedding,
      events,
      event: events.length > 0 ? events[0] : null,
      guest: activeGuest,
      guestRsvps,
    });
  } catch (err: unknown) {
    console.error('Error fetching wedding by slug:', err);
    return res.status(500).json({ message: 'Failed to fetch wedding invitation.' });
  }
});

// POST /api/weddings/:slug/rsvp — Public guest RSVP submission (per-event & plus-one supported)
apiRouter.post('/weddings/:slug/rsvp', weddingRsvpLimiter, async (req, res) => {
  try {
    const { slug } = req.params;
    const { guest_name, attending, guest_count, dietary_notes, message, guest_id, event_id, plus_one_name } = req.body;

    if (!guest_name || typeof guest_name !== 'string' || !guest_name.trim()) {
      return res.status(400).json({ message: 'Guest name is required.' });
    }
    if (typeof attending !== 'boolean') {
      return res.status(400).json({ message: 'Attending status is required.' });
    }

    let weddingId: string | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('slug', slug)
        .eq('is_paid', true)
        .single();

      if (wedding) weddingId = wedding.id;
    }

    if (!weddingId) {
      for (const w of weddingsStore.values()) {
        if (w.slug === slug && w.is_paid) {
          weddingId = w.id;
          break;
        }
      }
    }

    if (!weddingId) {
      return res.status(404).json({ message: 'Wedding invitation not found.' });
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const rsvp: WeddingRSVP = {
      id,
      wedding_id: weddingId,
      guest_id: guest_id && typeof guest_id === 'string' ? guest_id : null,
      event_id: event_id && typeof event_id === 'string' ? event_id : null,
      guest_name: guest_name.trim(),
      attending,
      guest_count: typeof guest_count === 'number' && guest_count > 0 ? guest_count : 1,
      plus_one_name: plus_one_name && typeof plus_one_name === 'string' ? plus_one_name.trim() : null,
      dietary_notes: dietary_notes && typeof dietary_notes === 'string' ? dietary_notes.trim() : null,
      message: message && typeof message === 'string' ? message.trim() : null,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('wedding_rsvps').insert(rsvp);
      if (error) {
        console.error('Supabase wedding_rsvps insert error:', error);
        return res.status(500).json({ message: 'Failed to record RSVP submission.' });
      }

      // Update plus_one_name on wedding_guests if applicable
      if (guest_id && plus_one_name) {
        await supabase
          .from('wedding_guests')
          .update({ plus_one_name: plus_one_name.trim(), updated_at: now })
          .eq('id', guest_id);
      }
    }

    if (guest_id && plus_one_name) {
      const g = weddingGuestsStore.get(guest_id);
      if (g) {
        g.plus_one_name = plus_one_name.trim();
        g.updated_at = now;
      }
    }

    const list = weddingRsvpsStore.get(weddingId) || [];
    list.push(rsvp);
    weddingRsvpsStore.set(weddingId, list);

    return res.status(201).json({ success: true, rsvp });
  } catch (err: unknown) {
    console.error('Error submitting RSVP:', err);
    return res.status(500).json({ message: 'Failed to submit RSVP.' });
  }
});

// POST /api/weddings/create-free — Create free-tier Save-the-Date wedding card record (no events, no rsvps, requireCoupleAuth)
apiRouter.post('/weddings/create-free', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { theme_id, bride_first_name, groom_first_name, event_date } = req.body;

    const bFirstName = bride_first_name ? bride_first_name.trim().slice(0, 100) : '';
    const gFirstName = groom_first_name ? groom_first_name.trim().slice(0, 100) : '';

    if (!bFirstName || !gFirstName) {
      return res.status(400).json({ message: "Bride's first name and Groom's first name are required." });
    }

    const weddingId = crypto.randomUUID();
    const coupleNames = `${bFirstName} & ${gFirstName}`;
    const slug = generateWeddingSlug(bFirstName, gFirstName);
    const now = new Date().toISOString();
    const validTheme = theme_id && VALID_THEME_IDS.has(theme_id) ? theme_id : 'classic-burgundy';

    const weddingRecord: Wedding = {
      id: weddingId,
      couple_account_id: couple.id,
      slug,
      bride_first_name: bFirstName,
      groom_first_name: gFirstName,
      couple_names: coupleNames,
      theme_id: validTheme,
      tier: 'free',
      is_paid: false,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error: wErr } = await supabase.from('weddings').insert(weddingRecord);
      if (wErr) {
        console.error('Supabase free wedding insert error:', wErr);
        return res.status(500).json({ message: 'Failed to create free wedding card.' });
      }
    }

    weddingsStore.set(weddingId, weddingRecord);

    return res.status(201).json({
      success: true,
      wedding: weddingRecord,
    });
  } catch (err: unknown) {
    console.error('Error creating free wedding card:', err);
    return res.status(500).json({ message: 'Failed to create free wedding card.' });
  }
});

/**
 * Helper to upload couple cover photo / gallery photo binary to Supabase storage 'wedding-cover-photos' bucket.
 * Decodes base64 data URL, validates 10MB binary size limit and image MIME type, uploads to Storage, and returns public URL.
 */
async function processWeddingPhotoUpload(
  prefix: 'cover' | 'gallery',
  payloadUrl: string
): Promise<string> {
  const trimmed = payloadUrl.trim();
  if (!trimmed.startsWith('data:')) {
    // Already an HTTP/HTTPS public URL
    return trimmed;
  }

  // Parse MIME type & base64 content
  const matches = trimmed.match(/^data:([a-zA-Z0-9\/\-+.]+);base64,(.+)$/);
  let mimeType = 'image/jpeg';
  let base64Data = trimmed;

  if (matches && matches.length === 3) {
    mimeType = matches[1];
    base64Data = matches[2];
  } else {
    base64Data = trimmed.split(',')[1] || trimmed;
  }

  // Server-side MIME type validation
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    throw new Error('Invalid image file type. Only JPEG, PNG, WEBP, and GIF images are allowed.');
  }

  const buffer = Buffer.from(base64Data, 'base64');

  // Strict 10MB binary size check before attempting storage upload
  if (buffer.length > 10 * 1024 * 1024) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new Error(`Image size (${sizeMb}MB) exceeds the 10MB maximum limit.`);
  }

  if (isSupabaseConfigured && supabase) {
    const ext = (mimeType.split('/')[1] || 'jpeg').replace(/[^a-zA-Z0-9]/g, '');
    const cleanFileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('wedding-cover-photos')
      .upload(cleanFileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn(`⚠️ Supabase wedding-cover-photos storage upload error for ${prefix}:`, uploadError);
      // Fallback to returning compressed URL so creation workflow never fails or blocks
      return trimmed;
    }

    const { data: publicUrlData } = supabase.storage
      .from('wedding-cover-photos')
      .getPublicUrl(cleanFileName);

    if (publicUrlData && publicUrlData.publicUrl) {
      return publicUrlData.publicUrl;
    }
  }

  // Fallback when Supabase storage is not configured (transient memory)
  return trimmed;
}

// POST /api/weddings/upload-cover-photo — Upload couple cover photo to Supabase storage
apiRouter.post('/weddings/upload-cover-photo', optionalCoupleAuth, async (req, res) => {
  try {
    const { coverPhoto, image } = req.body;
    const rawData = coverPhoto || image;

    if (!rawData || typeof rawData !== 'string' || !rawData.trim()) {
      return res.status(400).json({ message: 'Cover photo image data is required.' });
    }

    const publicUrl = await processWeddingPhotoUpload('cover', rawData);
    return res.json({ url: publicUrl, publicUrl });
  } catch (err: any) {
    console.error('Error uploading wedding cover photo:', err);
    return res.status(400).json({ message: err.message || 'Failed to upload cover photo.' });
  }
});

// POST /api/weddings/upload-gallery-photo — Upload gallery photo to Supabase storage
apiRouter.post('/weddings/upload-gallery-photo', optionalCoupleAuth, async (req, res) => {
  try {
    const { galleryPhoto, image } = req.body;
    const rawData = galleryPhoto || image;

    if (!rawData || typeof rawData !== 'string' || !rawData.trim()) {
      return res.status(400).json({ message: 'Gallery photo image data is required.' });
    }

    const publicUrl = await processWeddingPhotoUpload('gallery', rawData);
    return res.json({ url: publicUrl, publicUrl });
  } catch (err: any) {
    console.error('Error uploading wedding gallery photo:', err);
    return res.status(400).json({ message: err.message || 'Failed to upload gallery photo.' });
  }
});

// POST /api/weddings/create-payment — Create wedding record (is_paid: false) & initialize Paystack transaction
apiRouter.post('/weddings/create-payment', requireCoupleAuth, paystackInitializeLimiter, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const payload: CreateWeddingPayload = req.body;

    const bride_first_name = payload.bride_first_name ? payload.bride_first_name.trim().slice(0, 100) : '';
    const groom_first_name = payload.groom_first_name ? payload.groom_first_name.trim().slice(0, 100) : '';
    const bride_other_names = payload.bride_other_names ? payload.bride_other_names.trim().slice(0, 100) : '';
    const groom_other_names = payload.groom_other_names ? payload.groom_other_names.trim().slice(0, 100) : '';

    if (!bride_first_name && !groom_first_name && (!payload.couple_names || !payload.couple_names.trim())) {
      return res.status(400).json({ message: "Bride's first name and Groom's first name are required." });
    }

    const hasEvents = payload.events && Array.isArray(payload.events) && payload.events.length > 0;
    const firstEvent = hasEvents ? payload.events![0] : null;
    const event_date = firstEvent?.date || payload.event_date;
    const event_venue_name = firstEvent?.venue_name || payload.event_venue_name;

    if (!event_date || !event_venue_name) {
      return res.status(400).json({ message: 'Event date and venue name are required.' });
    }

    const weddingId = crypto.randomUUID();
    const fallbackCoupleNames = payload.couple_names?.trim() || `${bride_first_name} & ${groom_first_name}`;
    const slug = generateWeddingSlug(bride_first_name || fallbackCoupleNames, groom_first_name || '');
    const now = new Date().toISOString();
    const ref = `AMORAH_WEDDING_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const theme_id = payload.theme_id && VALID_THEME_IDS.has(payload.theme_id) ? payload.theme_id : 'classic-burgundy';
    const color_variant = payload.color_variant && VALID_COLOR_VARIANTS.has(payload.color_variant) ? payload.color_variant : 'royal-gold';
    const font_variant = payload.font_variant && VALID_FONT_VARIANTS.has(payload.font_variant) ? payload.font_variant : 'classic-serif';
    const section_order = Array.isArray(payload.section_order)
      ? payload.section_order.filter((s) => typeof s === 'string' && VALID_SECTIONS.has(s))
      : ['schedule', 'love_story', 'registry', 'rsvp'];

    const weddingRecord: Wedding = {
      id: weddingId,
      couple_account_id: couple.id,
      slug,
      bride_first_name: bride_first_name || null,
      bride_other_names: bride_other_names || null,
      groom_first_name: groom_first_name || null,
      groom_other_names: groom_other_names || null,
      couple_names: fallbackCoupleNames,
      cover_photo_url: payload.cover_photo_url || null,
      theme_id,
      tier: payload.tier || 'premium',
      color_variant,
      font_variant,
      section_order: section_order.length > 0 ? section_order : ['schedule', 'love_story', 'registry', 'rsvp'],
      love_story: payload.love_story || null,
      gallery_photos: Array.isArray(payload.gallery_photos) ? payload.gallery_photos.filter(p => typeof p === 'string' && p.trim()).slice(0, 10) : [],
      music_track: payload.music_track && VALID_MUSIC_TRACKS.has(payload.music_track) ? payload.music_track : 'romantic-strings',
      registry_info: payload.registry_info || null,
      is_paid: false,
      payment_reference: ref,
      created_at: now,
      updated_at: now,
    };

    const eventRecords: WeddingEvent[] = [];
    if (hasEvents) {
      for (const ev of payload.events!) {
        eventRecords.push({
          id: crypto.randomUUID(),
          wedding_id: weddingId,
          title: ev.title ? ev.title.trim() : 'Wedding Celebration',
          date: ev.date.trim(),
          time: ev.time ? ev.time.trim() : '10:00 AM',
          venue_name: ev.venue_name.trim(),
          venue_address: ev.venue_address ? ev.venue_address.trim() : null,
          created_at: now,
        });
      }
    } else {
      eventRecords.push({
        id: crypto.randomUUID(),
        wedding_id: weddingId,
        title: payload.event_title || 'Wedding Celebration',
        date: payload.event_date ? payload.event_date.trim() : 'December 18, 2026',
        time: payload.event_time ? payload.event_time.trim() : '10:00 AM',
        venue_name: payload.event_venue_name ? payload.event_venue_name.trim() : 'Main Venue',
        venue_address: payload.event_venue_address ? payload.event_venue_address.trim() : null,
        created_at: now,
      });
    }

    if (isSupabaseConfigured && supabase) {
      const { error: wErr } = await supabase.from('weddings').insert(weddingRecord);
      if (wErr) {
        console.error('Supabase weddings insert error:', wErr);
        return res.status(500).json({ message: 'Failed to create wedding record.' });
      }
      for (const evRec of eventRecords) {
        await supabase.from('wedding_events').insert(evRec);
      }
    }

    weddingsStore.set(weddingId, weddingRecord);
    weddingEventsStore.set(weddingId, eventRecords);

    // Return callback URL for Paystack redirect back
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer as string).origin : `${req.protocol}://${req.get('host')}`);
    const callback_url = `${origin}/weddings/create?step=payment-return&reference=${ref}`;

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return res.json({
        authorization_url: callback_url,
        reference: ref,
        weddingId,
        slug,
        amount: WEDDING_PLAN_PRICE_KOBO,
      });
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: couple.email,
        amount: WEDDING_PLAN_PRICE_KOBO,
        reference: ref,
        callback_url,
        metadata: {
          couple_id: couple.id,
          wedding_id: weddingId,
          type: 'wedding',
        },
      }),
    });

    const data = await response.json();
    if (!data.status) {
      return res.status(400).json({ message: data.message || 'Failed to initialize Paystack checkout.' });
    }

    return res.json({
      authorization_url: data.data.authorization_url,
      reference: ref,
      weddingId,
      slug,
      amount: WEDDING_PLAN_PRICE_KOBO,
    });
  } catch (err: unknown) {
    console.error('Error initializing wedding payment:', err);
    return res.status(500).json({ message: 'Payment initialization failed.' });
  }
});

// POST /api/weddings/verify-payment — Verify Paystack reference and mark wedding as paid
apiRouter.post('/weddings/verify-payment', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { reference } = req.body;

    if (!reference || typeof reference !== 'string') {
      return res.status(400).json({ message: 'Payment reference is required.' });
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (PAYSTACK_SECRET_KEY && !reference.startsWith('LW_REF_') && !reference.startsWith('AMORAH_WEDDING_MOCK')) {
      const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const verData = await resp.json();
      if (!verData.status || verData.data.status !== 'success') {
        return res.status(400).json({ message: 'Payment verification failed or transaction not completed.' });
      }
      if (verData.data.amount < WEDDING_PLAN_PRICE_KOBO) {
        return res.status(400).json({ message: 'Payment amount mismatch.' });
      }
    }

    // Find pre-created wedding record by payment_reference
    let targetWedding: Wedding | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('weddings')
        .select('*')
        .eq('payment_reference', reference)
        .single();
      if (data) targetWedding = data;
    }

    if (!targetWedding) {
      for (const w of weddingsStore.values()) {
        if (w.payment_reference === reference) {
          targetWedding = w;
          break;
        }
      }
    }

    if (!targetWedding) {
      return res.status(404).json({ message: 'Wedding record not found for this payment reference.' });
    }

    // Ownership Enforcement
    if (targetWedding.couple_account_id !== couple.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to verify this wedding.' });
    }

    // Flip is_paid to true
    if (!targetWedding.is_paid) {
      targetWedding.is_paid = true;
      targetWedding.updated_at = new Date().toISOString();

      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('weddings')
          .update({ is_paid: true, updated_at: targetWedding.updated_at })
          .eq('id', targetWedding.id);
      }
      weddingsStore.set(targetWedding.id, targetWedding);
    }

    let eventRecords = weddingEventsStore.get(targetWedding.id) || [];
    if (isSupabaseConfigured && supabase && eventRecords.length === 0) {
      const { data: evData } = await supabase
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', targetWedding.id);
      if (evData) eventRecords = evData;
    }

    return res.json({
      success: true,
      wedding: targetWedding,
      events: eventRecords,
      event: eventRecords[0] || null,
      shareUrl: `/w/wedding/${targetWedding.slug}`,
    });
  } catch (err: unknown) {
    console.error('Error verifying wedding payment:', err);
    return res.status(500).json({ message: 'Payment verification failed.' });
  }
});

// GET /api/weddings/dashboard/:weddingId — Couple Dashboard fetch (ownership check enforced)
apiRouter.get('/weddings/dashboard/:weddingId', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId } = req.params;

    let targetWedding: Wedding | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('weddings').select('*').eq('id', weddingId).single();
      if (data) targetWedding = data;
    }

    if (!targetWedding) {
      targetWedding = weddingsStore.get(weddingId);
    }

    if (!targetWedding) {
      return res.status(404).json({ message: 'Wedding invitation not found.' });
    }

    // SERVER-SIDE OWNERSHIP ENFORCEMENT: logged-in couple MUST own this wedding
    if (targetWedding.couple_account_id !== couple.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to view this dashboard.' });
    }

    let events: WeddingEvent[] = [];
    let rsvps: WeddingRSVP[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data: eData } = await supabase.from('wedding_events').select('*').eq('wedding_id', weddingId);
      if (eData) events = eData;

      const { data: rData } = await supabase
        .from('wedding_rsvps')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: false });
      if (rData) rsvps = rData;
    } else {
      events = weddingEventsStore.get(weddingId) || [];
      rsvps = (weddingRsvpsStore.get(weddingId) || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return res.json({
      wedding: targetWedding,
      events,
      event: events.length > 0 ? events[0] : null,
      rsvps,
    });
  } catch (err: unknown) {
    console.error('Error fetching wedding dashboard:', err);
    return res.status(500).json({ message: 'Failed to fetch wedding dashboard.' });
  }
});

// GET /api/weddings/guest-invite/:weddingSlug/:guestSlug — Public personalized guest invite route
apiRouter.get('/weddings/guest-invite/:weddingSlug/:guestSlug', async (req, res) => {
  try {
    const { weddingSlug, guestSlug } = req.params;

    let targetWedding: Wedding | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('weddings').select('*').eq('slug', weddingSlug).single();
      if (data) targetWedding = data;
    }

    if (!targetWedding) {
      targetWedding = Array.from(weddingsStore.values()).find((w) => w.slug === weddingSlug);
    }

    if (!targetWedding) {
      return res.status(404).json({ message: 'Wedding invitation not found.' });
    }

    let targetGuest: WeddingGuest | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('wedding_id', targetWedding.id)
        .or(`unique_link_token.eq.${guestSlug},id.eq.${guestSlug}`)
        .maybeSingle();
      if (data) targetGuest = data;
    }

    if (!targetGuest) {
      targetGuest = Array.from(weddingGuestsStore.values()).find(
        (g) => g.wedding_id === targetWedding!.id && (g.unique_link_token === guestSlug || g.id === guestSlug)
      );
    }

    // Mark viewed_at/opened_at timestamp on first view
    if (targetGuest && !targetGuest.opened_at) {
      const now = new Date().toISOString();
      targetGuest.opened_at = now;
      if (isSupabaseConfigured && supabase) {
        await supabase.from('wedding_guests').update({ opened_at: now }).eq('id', targetGuest.id);
      }
      if (weddingGuestsStore.has(targetGuest.id)) {
        weddingGuestsStore.set(targetGuest.id, targetGuest);
      }
    }

    let events: WeddingEvent[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data: eData } = await supabase.from('wedding_events').select('*').eq('wedding_id', targetWedding.id);
      if (eData) events = eData;
    } else {
      events = weddingEventsStore.get(targetWedding.id) || [];
    }

    return res.json({
      wedding: targetWedding,
      guest: targetGuest || null,
      events,
      event: events.length > 0 ? events[0] : null,
    });
  } catch (err: unknown) {
    console.error('Error fetching guest invite:', err);
    return res.status(500).json({ message: 'Failed to load guest invitation.' });
  }
});

// POST /api/weddings/:slug/rsvp — Invitee RSVP submission endpoint
apiRouter.post('/weddings/:slug/rsvp', weddingRsvpLimiter, async (req, res) => {
  try {
    const { slug } = req.params;
    const { guest_name, attending, guest_count, plus_one_name, dietary_notes, message, guest_id, event_id } = req.body;

    if (!guest_name || typeof guest_name !== 'string' || !guest_name.trim()) {
      return res.status(400).json({ message: 'Guest name is required.' });
    }

    let targetWedding: Wedding | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('weddings').select('*').eq('slug', slug).single();
      if (data) targetWedding = data;
    }

    if (!targetWedding) {
      targetWedding = Array.from(weddingsStore.values()).find((w) => w.slug === slug);
    }

    if (!targetWedding) {
      return res.status(404).json({ message: 'Wedding invitation not found.' });
    }

    const rsvpId = crypto.randomUUID();
    const now = new Date().toISOString();

    const rsvpRecord: WeddingRSVP = {
      id: rsvpId,
      wedding_id: targetWedding.id,
      guest_id: guest_id || null,
      event_id: event_id || null,
      guest_name: guest_name.trim(),
      attending: !!attending,
      guest_count: attending ? (guest_count || 1) : 0,
      plus_one_name: plus_one_name && typeof plus_one_name === 'string' ? plus_one_name.trim() : null,
      dietary_notes: dietary_notes && typeof dietary_notes === 'string' ? dietary_notes.trim() : null,
      message: message && typeof message === 'string' ? message.trim() : null,
      created_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('wedding_rsvps').insert(rsvpRecord);
      if (guest_id) {
        const guestUpdates: any = { updated_at: now };
        if (rsvpRecord.plus_one_name) guestUpdates.plus_one_name = rsvpRecord.plus_one_name;
        if (rsvpRecord.dietary_notes) guestUpdates.dietary_notes = rsvpRecord.dietary_notes;
        await supabase.from('wedding_guests').update(guestUpdates).eq('id', guest_id);
      }
    }

    const existingRsvps = weddingRsvpsStore.get(targetWedding.id) || [];
    existingRsvps.push(rsvpRecord);
    weddingRsvpsStore.set(targetWedding.id, existingRsvps);

    if (guest_id && weddingGuestsStore.has(guest_id)) {
      const g = weddingGuestsStore.get(guest_id);
      if (g) {
        if (rsvpRecord.plus_one_name) g.plus_one_name = rsvpRecord.plus_one_name;
        if (rsvpRecord.dietary_notes) g.dietary_notes = rsvpRecord.dietary_notes;
        g.updated_at = now;
        weddingGuestsStore.set(guest_id, g);
      }
    }

    return res.status(201).json({
      success: true,
      rsvp: rsvpRecord,
    });
  } catch (err: unknown) {
    console.error('Error recording wedding RSVP:', err);
    return res.status(500).json({ message: 'Failed to submit RSVP.' });
  }
});

/* ==================== Phase 2 Guest Management API Routes ==================== */

// Helper to verify couple ownership of a wedding
async function checkWeddingOwnership(weddingId: string, coupleId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from('weddings').select('couple_account_id').eq('id', weddingId).single();
    if (data && data.couple_account_id === coupleId) return true;
  }
  const w = weddingsStore.get(weddingId);
  return !!(w && w.couple_account_id === coupleId);
}

// GET /api/weddings/dashboard/:weddingId/guests — Fetch guest list with assigned events & RSVP breakdown
apiRouter.get('/weddings/dashboard/:weddingId/guests', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId } = req.params;

    const isOwner = await checkWeddingOwnership(weddingId, couple.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied: You do not own this wedding.' });
    }

    let guests: WeddingGuest[] = [];
    let guestEvents: WeddingGuestEvent[] = [];
    let rsvps: WeddingRSVP[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data: gData } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('name', { ascending: true });
      if (gData) guests = gData;

      const { data: geData } = await supabase
        .from('wedding_guest_events')
        .select('*');
      if (geData) guestEvents = geData;

      const { data: rData } = await supabase
        .from('wedding_rsvps')
        .select('*')
        .eq('wedding_id', weddingId);
      if (rData) rsvps = rData;
    } else {
      guests = Array.from(weddingGuestsStore.values())
        .filter((g) => g.wedding_id === weddingId)
        .sort((a, b) => a.name.localeCompare(b.name));
      rsvps = weddingRsvpsStore.get(weddingId) || [];
    }

    const preAddedGuestIds = new Set(guests.map((g) => g.id));
    const preAddedGuestNames = new Set(guests.map((g) => g.name.toLowerCase().trim()));

    // Find RSVPs that do not belong to a pre-added guest
    const standaloneRsvps = rsvps.filter(
      (r) => (!r.guest_id || !preAddedGuestIds.has(r.guest_id)) && !preAddedGuestNames.has(r.guest_name.toLowerCase().trim())
    );

    // Group standalone RSVPs by guest_id or normalized guest_name
    const standaloneMap = new Map<string, WeddingRSVP[]>();
    for (const r of standaloneRsvps) {
      const key = r.guest_id ? `id_${r.guest_id}` : `name_${r.guest_name.toLowerCase().trim()}`;
      if (!standaloneMap.has(key)) {
        standaloneMap.set(key, []);
      }
      standaloneMap.get(key)!.push(r);
    }

    const synthesizedGuests: WeddingGuest[] = [];
    standaloneMap.forEach((gRsvps) => {
      const firstRsvp = gRsvps[0];
      const plusOne = gRsvps.find((r) => r.plus_one_name)?.plus_one_name || null;
      const dietary = gRsvps.find((r) => r.dietary_notes)?.dietary_notes || null;
      const earliestCreated = gRsvps.reduce(
        (min, r) => (r.created_at < min ? r.created_at : min),
        firstRsvp.created_at
      );

      const synthGuest: WeddingGuest = {
        id: firstRsvp.guest_id || `synth_${firstRsvp.id}`,
        wedding_id: weddingId,
        name: firstRsvp.guest_name,
        email: null,
        unique_link_token: '',
        plus_one_allowed: !!plusOne,
        plus_one_name: plusOne,
        dietary_notes: dietary,
        added_by: 'self',
        is_synthesized: true,
        opened_at: earliestCreated,
        created_at: earliestCreated,
        updated_at: earliestCreated,
      };
      synthesizedGuests.push(synthGuest);
    });

    const allGuests = [
      ...guests.map((g) => ({ ...g, is_synthesized: false })),
      ...synthesizedGuests,
    ].sort((a, b) => a.name.localeCompare(b.name));

    // Attach event_ids array & direct rsvp_status to each guest
    const guestsWithEvents: WeddingGuestWithEvents[] = allGuests.map((g) => {
      const gRsvps = rsvps.filter(
        (r) => (r.guest_id && r.guest_id === g.id) || r.guest_name.toLowerCase().trim() === g.name.toLowerCase().trim()
      );

      let event_ids: string[] = [];
      if (g.added_by === 'self') {
        event_ids = gRsvps.map((r) => r.event_id).filter(Boolean) as string[];
      } else {
        if (isSupabaseConfigured && supabase) {
          event_ids = guestEvents.filter((ge) => ge.guest_id === g.id).map((ge) => ge.event_id);
        } else {
          event_ids = weddingGuestEventsStore.get(g.id) || [];
        }
      }

      let rsvp_status: 'attending' | 'declined' | 'pending' = 'pending';
      let attending_headcount = 0;

      if (gRsvps.length > 0) {
        const isAttending = gRsvps.some((r) => r.attending);
        rsvp_status = isAttending ? 'attending' : 'declined';
        attending_headcount = isAttending ? Math.max(...gRsvps.map((r) => r.guest_count || 1)) : 0;
      }

      return { ...g, event_ids, rsvp_status, attending_headcount };
    });

    return res.json(guestsWithEvents);
  } catch (err: unknown) {
    console.error('Error fetching wedding guests:', err);
    return res.status(500).json({ message: 'Failed to fetch guest list.' });
  }
});

// POST /api/weddings/dashboard/:weddingId/guests — Manually add a guest
apiRouter.post('/weddings/dashboard/:weddingId/guests', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId } = req.params;
    const { name, email, plus_one_allowed, dietary_notes, event_ids } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Guest name is required.' });
    }

    const isOwner = await checkWeddingOwnership(weddingId, couple.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied: You do not own this wedding.' });
    }

    const guestId = crypto.randomUUID();
    const token = generateGuestToken();
    const now = new Date().toISOString();

    const guestRecord: WeddingGuest = {
      id: guestId,
      wedding_id: weddingId,
      name: name.trim(),
      email: email && typeof email === 'string' ? email.trim() : null,
      unique_link_token: token,
      plus_one_allowed: !!plus_one_allowed,
      plus_one_name: null,
      dietary_notes: dietary_notes && typeof dietary_notes === 'string' ? dietary_notes.trim() : null,
      added_by: 'couple',
      opened_at: null,
      created_at: now,
      updated_at: now,
    };

    const targetEvents: string[] = Array.isArray(event_ids) ? event_ids : [];

    if (isSupabaseConfigured && supabase) {
      const { error: gErr } = await supabase.from('wedding_guests').insert(guestRecord);
      if (gErr) {
        console.error('Supabase wedding_guests insert error:', gErr);
        return res.status(500).json({ message: 'Failed to create guest record.' });
      }
      for (const evId of targetEvents) {
        await supabase.from('wedding_guest_events').insert({ guest_id: guestId, event_id: evId });
      }
    }

    weddingGuestsStore.set(guestId, guestRecord);
    weddingGuestEventsStore.set(guestId, targetEvents);

    return res.status(201).json({
      success: true,
      guest: { ...guestRecord, event_ids: targetEvents },
    });
  } catch (err: unknown) {
    console.error('Error adding wedding guest:', err);
    return res.status(500).json({ message: 'Failed to add guest.' });
  }
});

// PATCH /api/weddings/dashboard/:weddingId/guests/:guestId — Edit guest details & event assignments
apiRouter.patch('/weddings/dashboard/:weddingId/guests/:guestId', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId, guestId } = req.params;
    const { name, email, plus_one_allowed, dietary_notes, event_ids } = req.body;

    const isOwner = await checkWeddingOwnership(weddingId, couple.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied: You do not own this wedding.' });
    }

    if (guestId.startsWith('synth_')) {
      return res.status(400).json({ message: 'Cannot edit or delete a self-submitted RSVP response.' });
    }

    const now = new Date().toISOString();
    const updates: Partial<WeddingGuest> = { updated_at: now };

    if (name && typeof name === 'string') updates.name = name.trim();
    if (email !== undefined) updates.email = email ? email.trim() : null;
    if (typeof plus_one_allowed === 'boolean') updates.plus_one_allowed = plus_one_allowed;
    if (dietary_notes !== undefined) updates.dietary_notes = dietary_notes ? dietary_notes.trim() : null;

    let updatedGuest: WeddingGuest | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('wedding_guests')
        .update(updates)
        .eq('id', guestId)
        .eq('wedding_id', weddingId)
        .select()
        .single();
      if (data && !error) updatedGuest = data;

      if (Array.isArray(event_ids)) {
        await supabase.from('wedding_guest_events').delete().eq('guest_id', guestId);
        for (const evId of event_ids) {
          await supabase.from('wedding_guest_events').insert({ guest_id: guestId, event_id: evId });
        }
      }
    }

    const g = weddingGuestsStore.get(guestId);
    if (g && g.wedding_id === weddingId) {
      Object.assign(g, updates);
      updatedGuest = g;
      if (Array.isArray(event_ids)) {
        weddingGuestEventsStore.set(guestId, event_ids);
      }
    }

    if (!updatedGuest) {
      return res.status(404).json({ message: 'Guest record not found.' });
    }

    const assignedEvents = Array.isArray(event_ids) ? event_ids : (weddingGuestEventsStore.get(guestId) || []);

    return res.json({
      success: true,
      guest: { ...updatedGuest, event_ids: assignedEvents },
    });
  } catch (err: unknown) {
    console.error('Error updating wedding guest:', err);
    return res.status(500).json({ message: 'Failed to update guest.' });
  }
});

// DELETE /api/weddings/dashboard/:weddingId/guests/:guestId — Delete guest record
apiRouter.delete('/weddings/dashboard/:weddingId/guests/:guestId', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId, guestId } = req.params;

    const isOwner = await checkWeddingOwnership(weddingId, couple.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied: You do not own this wedding.' });
    }

    if (guestId.startsWith('synth_')) {
      return res.status(400).json({ message: 'Cannot edit or delete a self-submitted RSVP response.' });
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('wedding_guests').delete().eq('id', guestId).eq('wedding_id', weddingId);
    }

    weddingGuestsStore.delete(guestId);
    weddingGuestEventsStore.delete(guestId);

    return res.json({ success: true, message: 'Guest deleted successfully.' });
  } catch (err: unknown) {
    console.error('Error deleting wedding guest:', err);
    return res.status(500).json({ message: 'Failed to delete guest.' });
  }
});

// POST /api/weddings/dashboard/:weddingId/guests/import — Bulk CSV import with server-side validation & dedup
apiRouter.post('/weddings/dashboard/:weddingId/guests/import', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId } = req.params;
    const { guests: rawGuests } = req.body;

    if (!Array.isArray(rawGuests) || rawGuests.length === 0) {
      return res.status(400).json({ message: 'No guest items provided for CSV import.' });
    }

    // SERVER-SIDE VALIDATION: Max 500 rows per CSV import call
    if (rawGuests.length > 500) {
      return res.status(400).json({ message: 'CSV import exceeds the limit of 500 guests per batch.' });
    }

    const isOwner = await checkWeddingOwnership(weddingId, couple.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied: You do not own this wedding.' });
    }

    // Existing guests for deduplication
    let existingGuests: WeddingGuest[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('wedding_guests').select('*').eq('wedding_id', weddingId);
      if (data) existingGuests = data;
    } else {
      existingGuests = Array.from(weddingGuestsStore.values()).filter((g) => g.wedding_id === weddingId);
    }

    const existingEmails = new Set(existingGuests.map((g) => g.email?.toLowerCase()).filter(Boolean));
    const existingNames = new Set(existingGuests.map((g) => g.name.toLowerCase().trim()));

    const imported: WeddingGuestWithEvents[] = [];
    const now = new Date().toISOString();

    for (const raw of rawGuests) {
      const name = typeof raw.name === 'string' ? raw.name.trim() : '';
      if (!name) continue; // skip blank names

      const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';

      // DEDUP STRATEGY: Skip if email matches existing, or exact name matches if email is missing
      if (email && existingEmails.has(email)) continue;
      if (!email && existingNames.has(name.toLowerCase())) continue;

      const guestId = crypto.randomUUID();
      const token = generateGuestToken();
      const plus_one_allowed = !!raw.plus_one_allowed;
      const dietary_notes = typeof raw.dietary_notes === 'string' ? raw.dietary_notes.trim() : null;

      const guestRecord: WeddingGuest = {
        id: guestId,
        wedding_id: weddingId,
        name,
        email: email || null,
        unique_link_token: token,
        plus_one_allowed,
        plus_one_name: null,
        dietary_notes,
        added_by: 'couple',
        opened_at: null,
        created_at: now,
        updated_at: now,
      };

      const event_ids: string[] = Array.isArray(raw.event_ids) ? raw.event_ids : [];

      if (isSupabaseConfigured && supabase) {
        await supabase.from('wedding_guests').insert(guestRecord);
        for (const evId of event_ids) {
          await supabase.from('wedding_guest_events').insert({ guest_id: guestId, event_id: evId });
        }
      }

      weddingGuestsStore.set(guestId, guestRecord);
      weddingGuestEventsStore.set(guestId, event_ids);

      if (email) existingEmails.add(email);
      existingNames.add(name.toLowerCase());

      imported.push({ ...guestRecord, event_ids });
    }

    return res.status(201).json({
      success: true,
      imported_count: imported.length,
      guests: imported,
    });
  } catch (err: unknown) {
    console.error('Error importing guests CSV:', err);
    return res.status(500).json({ message: 'Failed to import guests.' });
  }
});

// GET /api/weddings/dashboard/:weddingId/guests/export — Download CSV of guest list + RSVP status
apiRouter.get('/weddings/dashboard/:weddingId/guests/export', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId } = req.params;

    const isOwner = await checkWeddingOwnership(weddingId, couple.id);
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied: You do not own this wedding.' });
    }

    let guests: WeddingGuest[] = [];
    let rsvps: WeddingRSVP[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data: gData } = await supabase.from('wedding_guests').select('*').eq('wedding_id', weddingId);
      if (gData) guests = gData;

      const { data: rData } = await supabase.from('wedding_rsvps').select('*').eq('wedding_id', weddingId);
      if (rData) rsvps = rData;
    } else {
      guests = Array.from(weddingGuestsStore.values()).filter((g) => g.wedding_id === weddingId);
      rsvps = weddingRsvpsStore.get(weddingId) || [];
    }

    const preAddedGuestIds = new Set(guests.map((g) => g.id));
    const preAddedGuestNames = new Set(guests.map((g) => g.name.toLowerCase().trim()));

    const standaloneRsvps = rsvps.filter(
      (r) => (!r.guest_id || !preAddedGuestIds.has(r.guest_id)) && !preAddedGuestNames.has(r.guest_name.toLowerCase().trim())
    );

    const standaloneMap = new Map<string, WeddingRSVP[]>();
    for (const r of standaloneRsvps) {
      const key = r.guest_id ? `id_${r.guest_id}` : `name_${r.guest_name.toLowerCase().trim()}`;
      if (!standaloneMap.has(key)) {
        standaloneMap.set(key, []);
      }
      standaloneMap.get(key)!.push(r);
    }

    const synthesizedGuests: WeddingGuest[] = [];
    standaloneMap.forEach((gRsvps) => {
      const firstRsvp = gRsvps[0];
      const plusOne = gRsvps.find((r) => r.plus_one_name)?.plus_one_name || null;
      const dietary = gRsvps.find((r) => r.dietary_notes)?.dietary_notes || null;
      const earliestCreated = gRsvps.reduce(
        (min, r) => (r.created_at < min ? r.created_at : min),
        firstRsvp.created_at
      );

      const synthGuest: WeddingGuest = {
        id: firstRsvp.guest_id || `synth_${firstRsvp.id}`,
        wedding_id: weddingId,
        name: firstRsvp.guest_name,
        email: null,
        unique_link_token: '',
        plus_one_allowed: !!plusOne,
        plus_one_name: plusOne,
        dietary_notes: dietary,
        added_by: 'self',
        opened_at: earliestCreated,
        created_at: earliestCreated,
        updated_at: earliestCreated,
      };
      synthesizedGuests.push(synthGuest);
    });

    const allExportGuests = [...guests, ...synthesizedGuests].sort((a, b) => a.name.localeCompare(b.name));

    const csvRows = [
      ['Guest Name', 'Email', 'Plus One Allowed', 'Plus One Name', 'Dietary Notes', 'Opened At', 'RSVP Status', 'Guest Count', 'Personal Message', 'Added By', 'Unique Link Token'],
    ];

    for (const g of allExportGuests) {
      const gRsvps = rsvps.filter(
        (r) => (r.guest_id && r.guest_id === g.id) || r.guest_name.toLowerCase().trim() === g.name.toLowerCase().trim()
      );
      const isAttending = gRsvps.some((r) => r.attending);
      const hasResponded = gRsvps.length > 0;
      const status = hasResponded ? (isAttending ? 'Attending' : 'Declined') : 'Pending';
      const guestCount = isAttending ? Math.max(...gRsvps.map((r) => r.guest_count || 1)) : 0;
      const messages = gRsvps.map((r) => r.message).filter(Boolean).join(' | ');

      csvRows.push([
        `"${g.name.replace(/"/g, '""')}"`,
        `"${(g.email || '').replace(/"/g, '""')}"`,
        g.plus_one_allowed ? 'Yes' : 'No',
        `"${(g.plus_one_name || '').replace(/"/g, '""')}"`,
        `"${(g.dietary_notes || '').replace(/"/g, '""')}"`,
        g.opened_at ? new Date(g.opened_at).toLocaleString() : 'Not Opened',
        status,
        String(guestCount),
        `"${messages.replace(/"/g, '""')}"`,
        g.added_by || 'couple',
        g.unique_link_token || '',
      ]);
    }

    const csvContent = csvRows.map((r) => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="wedding-guests-${weddingId}.csv"`);
    return res.send(csvContent);
  } catch (err: unknown) {
    console.error('Error exporting guest list CSV:', err);
    return res.status(500).json({ message: 'Failed to export guest list.' });
  }
});

// PATCH /api/weddings/dashboard/:weddingId — Couple Dashboard edit event typos (ownership check enforced)
apiRouter.patch('/weddings/dashboard/:weddingId', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId } = req.params;
    const { date, time, venue_name, venue_address } = req.body;

    let targetWedding: Wedding | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('weddings').select('*').eq('id', weddingId).single();
      if (data) targetWedding = data;
    }

    if (!targetWedding) {
      targetWedding = weddingsStore.get(weddingId);
    }

    if (!targetWedding) {
      return res.status(404).json({ message: 'Wedding invitation not found.' });
    }

    // SERVER-SIDE OWNERSHIP ENFORCEMENT: logged-in couple MUST own this wedding
    if (targetWedding.couple_account_id !== couple.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to edit this wedding.' });
    }

    const updates: Partial<WeddingEvent> = {};
    if (date && typeof date === 'string') updates.date = date.trim();
    if (time && typeof time === 'string') updates.time = time.trim();
    if (venue_name && typeof venue_name === 'string') updates.venue_name = venue_name.trim();
    if (venue_address !== undefined) updates.venue_address = venue_address ? venue_address.trim() : null;

    let updatedEvent: WeddingEvent | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('wedding_events')
        .update(updates)
        .eq('wedding_id', weddingId)
        .select()
        .single();
      if (data && !error) updatedEvent = data;
    }

    const eventsList = weddingEventsStore.get(weddingId) || [];
    if (eventsList.length > 0) {
      eventsList[0] = { ...eventsList[0], ...updates };
      weddingEventsStore.set(weddingId, eventsList);
      if (!updatedEvent) updatedEvent = eventsList[0];
    }

    return res.json({ success: true, event: updatedEvent });
  } catch (err: unknown) {
    console.error('Error updating wedding details:', err);
    return res.status(500).json({ message: 'Failed to update wedding details.' });
  }
});

// PATCH /api/weddings/dashboard/:weddingId/info — Edit wedding-level registry_info, love_story, couple_names (ownership check & input caps enforced)
apiRouter.patch('/weddings/dashboard/:weddingId/info', requireCoupleAuth, async (req, res) => {
  try {
    const couple = (req as any).coupleSession;
    const { weddingId } = req.params;
    const { registry_info, love_story, music_track, couple_names } = req.body;

    let targetWedding: Wedding | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('weddings').select('*').eq('id', weddingId).single();
      if (data) targetWedding = data;
    }

    if (!targetWedding) {
      targetWedding = weddingsStore.get(weddingId);
    }

    if (!targetWedding) {
      return res.status(404).json({ message: 'Wedding invitation not found.' });
    }

    // SERVER-SIDE OWNERSHIP ENFORCEMENT: logged-in couple MUST own this wedding
    if (targetWedding.couple_account_id !== couple.id) {
      return res.status(403).json({ message: 'Access denied: You do not have permission to edit this wedding.' });
    }

    const updates: Partial<Wedding> = { updated_at: new Date().toISOString() };
    if (req.body.bride_first_name && typeof req.body.bride_first_name === 'string') {
      updates.bride_first_name = req.body.bride_first_name.trim().slice(0, 100);
    }
    if (typeof req.body.bride_other_names === 'string') {
      updates.bride_other_names = req.body.bride_other_names.trim().slice(0, 100) || null;
    }
    if (req.body.groom_first_name && typeof req.body.groom_first_name === 'string') {
      updates.groom_first_name = req.body.groom_first_name.trim().slice(0, 100);
    }
    if (typeof req.body.groom_other_names === 'string') {
      updates.groom_other_names = req.body.groom_other_names.trim().slice(0, 100) || null;
    }
    if (couple_names && typeof couple_names === 'string') {
      updates.couple_names = couple_names.trim().slice(0, 200);
    }
    if (req.body.theme_id && VALID_THEME_IDS.has(req.body.theme_id)) {
      updates.theme_id = req.body.theme_id;
    }
    if (req.body.color_variant && VALID_COLOR_VARIANTS.has(req.body.color_variant)) {
      updates.color_variant = req.body.color_variant;
    }
    if (req.body.font_variant && VALID_FONT_VARIANTS.has(req.body.font_variant)) {
      updates.font_variant = req.body.font_variant;
    }
    if (Array.isArray(req.body.section_order)) {
      const validSecs = req.body.section_order.filter((s: any) => typeof s === 'string' && VALID_SECTIONS.has(s));
      if (validSecs.length > 0) {
        updates.section_order = validSecs;
      }
    }
    if (registry_info !== undefined) {
      updates.registry_info = typeof registry_info === 'string' ? registry_info.trim().slice(0, 5000) : null;
    }
    if (love_story !== undefined) {
      updates.love_story = typeof love_story === 'string' ? love_story.trim().slice(0, 5000) : null;
    }
    if (music_track !== undefined) {
      updates.music_track = typeof music_track === 'string' && VALID_MUSIC_TRACKS.has(music_track) ? music_track : 'romantic-strings';
    }
    if (req.body.cover_photo_url !== undefined) {
      updates.cover_photo_url = typeof req.body.cover_photo_url === 'string' && req.body.cover_photo_url.trim() ? req.body.cover_photo_url.trim() : null;
    }
    if (Array.isArray(req.body.gallery_photos)) {
      updates.gallery_photos = req.body.gallery_photos.filter((p: any) => typeof p === 'string' && p.trim()).slice(0, 10);
    }

    let updatedWedding: Wedding | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weddings')
        .update(updates)
        .eq('id', weddingId)
        .select()
        .single();
      if (data && !error) updatedWedding = data;
    }

    const w = weddingsStore.get(weddingId);
    if (w) {
      Object.assign(w, updates);
      if (!updatedWedding) updatedWedding = w;
    }

    return res.json({ success: true, wedding: updatedWedding || { ...targetWedding, ...updates } });
  } catch (err: unknown) {
    console.error('Error updating wedding info:', err);
    return res.status(500).json({ message: 'Failed to update wedding info.' });
  }
});

/* ==================== Admin Weddings Management Routes ==================== */

// GET /api/admin/weddings — List non-sensitive metadata only (Privacy compliant)
apiRouter.get('/admin/weddings', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('weddings')
        .select('id, bride_first_name, bride_other_names, groom_first_name, groom_other_names, couple_names, slug, theme_id, is_paid, payment_reference, created_at')
        .order('created_at', { ascending: false });

      if (data && !error) {
        return res.json(data);
      }
    }

    const weddingsList = Array.from(weddingsStore.values())
      .map((w) => ({
        id: w.id,
        bride_first_name: w.bride_first_name,
        bride_other_names: w.bride_other_names,
        groom_first_name: w.groom_first_name,
        groom_other_names: w.groom_other_names,
        couple_names: w.couple_names,
        slug: w.slug,
        theme_id: w.theme_id,
        is_paid: w.is_paid,
        payment_reference: w.payment_reference,
        created_at: w.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json(weddingsList);
  } catch (err: unknown) {
    console.error('Error fetching admin weddings list:', err);
    return res.status(500).json({ message: 'Failed to fetch weddings list.' });
  }
});

// DELETE /api/admin/weddings/:id — Delete wedding record
apiRouter.delete('/admin/weddings/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('weddings').delete().eq('id', id);
    }

    weddingsStore.delete(id);
    weddingEventsStore.delete(id);
    weddingRsvpsStore.delete(id);

    return res.json({ success: true, message: 'Wedding invitation deleted.' });
  } catch (err: unknown) {
    console.error('Error deleting wedding:', err);
    return res.status(500).json({ message: 'Failed to delete wedding.' });
  }
});

/* ==================== Invitation Templates API Routes ==================== */

const templatesStore = new Map<string, any>();

const DEFAULT_SEED_TEMPLATE = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Classic Green & Gold Arch Invitation',
  image_url: 'https://via.placeholder.com/1200x1500.png?text=Classic+Wedding+Template',
  orientation: 'portrait',
  width: 1200,
  height: 1500,
  text_fields: [
    { field_key: 'couple_names', label: 'Couple / Event Names', x: 10, y: 44, width: 80, max_font_size: 34, min_font_size: 18, color: '#1B3B2B', align: 'center', font_family: 'serif' },
    { field_key: 'invites_line', label: 'Static Host / Invitation Line', x: 10, y: 53, width: 80, max_font_size: 13, min_font_size: 10, color: '#1B3B2B', align: 'center', font_family: 'serif', static_text: 'SPECIALLY INVITES THE PRESENCE OF' },
    { field_key: 'invitee_name', label: 'Dynamic Invitee / Guest Name', x: 10, y: 57, width: 80, max_font_size: 22, min_font_size: 14, color: '#1B3B2B', align: 'center', font_family: 'serif' },
    { field_key: 'date_split', label: 'Event Date (Split Month / Day / Year)', x: 10, y: 64, width: 80, max_font_size: 18, min_font_size: 12, color: '#1B3B2B', align: 'center', font_family: 'serif' },
    { field_key: 'venue', label: 'Venue / Location', x: 10, y: 72, width: 80, max_font_size: 14, min_font_size: 10, color: '#1B3B2B', align: 'center', font_family: 'serif' },
  ],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
templatesStore.set(DEFAULT_SEED_TEMPLATE.id, DEFAULT_SEED_TEMPLATE);

// GET /api/templates/active — Public endpoint returning active invitation card templates
apiRouter.get('/templates/active', async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        return res.json(data);
      }
    }

    const activeLocal = Array.from(templatesStore.values()).filter((t) => t.is_active);
    return res.json(activeLocal.length > 0 ? activeLocal : [DEFAULT_SEED_TEMPLATE]);
  } catch (err: unknown) {
    console.error('Error fetching active templates:', err);
    return res.json([DEFAULT_SEED_TEMPLATE]);
  }
});

// GET /api/admin/templates — Admin endpoint to list all templates
apiRouter.get('/admin/templates', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        return res.json(data);
      }
    }

    return res.json(Array.from(templatesStore.values()));
  } catch (err: unknown) {
    console.error('Error fetching admin templates:', err);
    return res.status(500).json({ message: 'Failed to fetch templates list.' });
  }
});

// POST /api/admin/templates — Admin endpoint to create a new invitation template
apiRouter.post('/admin/templates', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { name, image_url, orientation, width, height, text_fields, is_active } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required.' });
    }

    if (!image_url || typeof image_url !== 'string') {
      return res.status(400).json({ message: 'Template image URL is required.' });
    }

    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTemplate = {
      id: templateId,
      name: name.trim(),
      image_url: image_url.trim(),
      orientation: orientation === 'landscape' || orientation === 'square' ? orientation : 'portrait',
      width: typeof width === 'number' && width > 0 ? width : 1200,
      height: typeof height === 'number' && height > 0 ? height : 1500,
      text_fields: Array.isArray(text_fields) ? text_fields : [],
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('templates').insert(newTemplate).select().single();
      if (data && !error) {
        templatesStore.set(data.id, data);
        return res.json({ success: true, template: data });
      }
    }

    templatesStore.set(templateId, newTemplate);
    return res.json({ success: true, template: newTemplate });
  } catch (err: unknown) {
    console.error('Error creating template:', err);
    return res.status(500).json({ message: 'Failed to create template.' });
  }
});

// PATCH /api/admin/templates/:id — Admin endpoint to update template configuration
apiRouter.patch('/admin/templates/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url, orientation, width, height, text_fields, is_active } = req.body;

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof image_url === 'string' && image_url.trim()) updates.image_url = image_url.trim();
    if (orientation) updates.orientation = orientation;
    if (typeof width === 'number' && width > 0) updates.width = width;
    if (typeof height === 'number' && height > 0) updates.height = height;
    if (Array.isArray(text_fields)) updates.text_fields = text_fields;
    if (typeof is_active === 'boolean') updates.is_active = is_active;

    let updatedTemplate: any = null;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('templates').update(updates).eq('id', id).select().single();
      if (data && !error) updatedTemplate = data;
    }

    const local = templatesStore.get(id);
    if (local) {
      Object.assign(local, updates);
      if (!updatedTemplate) updatedTemplate = local;
    }

    return res.json({ success: true, template: updatedTemplate || { id, ...updates } });
  } catch (err: unknown) {
    console.error('Error updating template:', err);
    return res.status(500).json({ message: 'Failed to update template.' });
  }
});

// DELETE /api/admin/templates/:id — Admin endpoint to delete template
apiRouter.delete('/admin/templates/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('templates').delete().eq('id', id);
    }

    templatesStore.delete(id);
    return res.json({ success: true, message: 'Template deleted.' });
  } catch (err: unknown) {
    console.error('Error deleting template:', err);
    return res.status(500).json({ message: 'Failed to delete template.' });
  }
});

/* ==================== Theme Scene Backdrops API Routes ==================== */

// GET /api/theme-assets — Public endpoint to fetch theme background assets map
apiRouter.get('/theme-assets', async (req, res) => {
  try {
    const assetsMap: Record<string, any> = {};

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('theme_assets').select('*');
      if (data && !error) {
        data.forEach((row) => {
          assetsMap[row.theme_id] = row;
        });
        return res.json(assetsMap);
      }
    }

    for (const [tId, asset] of themeAssetsStore.entries()) {
      assetsMap[tId] = asset;
    }

    return res.json(assetsMap);
  } catch (err: unknown) {
    console.error('Error fetching theme assets:', err);
    return res.status(500).json({ message: 'Failed to fetch theme assets.' });
  }
});

/**
 * Helper to upload theme asset image binary to Supabase storage 'theme-assets' bucket.
 * Decodes base64 data URL, validates 5MB size limit on binary, uploads to Storage, and returns public URL.
 */
async function processThemeAssetImageUpload(
  themeId: string,
  field: 'cover' | 'reveal' | 'template',
  payloadUrl: string
): Promise<string> {
  const trimmed = payloadUrl.trim();
  if (!trimmed.startsWith('data:')) {
    // Already an HTTP/HTTPS public URL
    return trimmed;
  }

  // Parse MIME type & base64 content
  const matches = trimmed.match(/^data:([a-zA-Z0-9\/\-+.]+);base64,(.+)$/);
  let mimeType = 'image/jpeg';
  let base64Data = trimmed;

  if (matches && matches.length === 3) {
    mimeType = matches[1];
    base64Data = matches[2];
  } else {
    base64Data = trimmed.split(',')[1] || trimmed;
  }

  const buffer = Buffer.from(base64Data, 'base64');

  // Strict 5MB binary size check before attempting storage upload
  if (buffer.length > 5 * 1024 * 1024) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new Error(`Theme asset ${field} image size (${sizeMb}MB) exceeds 5MB limit.`);
  }

  if (isSupabaseConfigured && supabase) {
    const ext = (mimeType.split('/')[1] || 'jpeg').replace(/[^a-zA-Z0-9]/g, '');
    const cleanFileName = `${themeId}_${field}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('theme-assets')
      .upload(cleanFileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`Supabase theme-assets storage upload error for ${field}:`, uploadError);
      throw new Error(`Failed to upload ${field} image to Supabase storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('theme-assets')
      .getPublicUrl(cleanFileName);

    return publicUrlData.publicUrl;
  }

  // Fallback when Supabase storage is not configured (transient memory)
  return trimmed;
}

// POST /api/admin/theme-assets/:themeId — Admin endpoint to upload/replace theme background scene images & static card templates
apiRouter.post('/admin/theme-assets/:themeId', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { themeId } = req.params;
    const { cover_background_url, reveal_background_url, card_template_url, text_zone } = req.body;

    if (!VALID_THEME_IDS.has(themeId)) {
      return res.status(400).json({ message: `Invalid theme_id. Must be one of: ${Array.from(VALID_THEME_IDS).join(', ')}` });
    }

    const existing = themeAssetsStore.get(themeId) || { theme_id: themeId };
    let newCoverUrl: string | null = existing.cover_background_url || null;
    let newRevealUrl: string | null = existing.reveal_background_url || null;
    let newTemplateUrl: string | null = existing.card_template_url || null;

    // Process cover_background_url upload to Supabase Storage
    if (cover_background_url !== undefined) {
      if (typeof cover_background_url === 'string' && cover_background_url.trim()) {
        try {
          newCoverUrl = await processThemeAssetImageUpload(themeId, 'cover', cover_background_url);
        } catch (err: any) {
          return res.status(400).json({ message: err.message || 'Cover background image processing failed.' });
        }
      } else {
        newCoverUrl = null;
      }
    }

    // Process reveal_background_url upload to Supabase Storage
    if (reveal_background_url !== undefined) {
      if (typeof reveal_background_url === 'string' && reveal_background_url.trim()) {
        try {
          newRevealUrl = await processThemeAssetImageUpload(themeId, 'reveal', reveal_background_url);
        } catch (err: any) {
          return res.status(400).json({ message: err.message || 'Reveal background image processing failed.' });
        }
      } else {
        newRevealUrl = null;
      }
    }

    // Process card_template_url upload to Supabase Storage
    if (card_template_url !== undefined) {
      if (typeof card_template_url === 'string' && card_template_url.trim()) {
        try {
          newTemplateUrl = await processThemeAssetImageUpload(themeId, 'template', card_template_url);
        } catch (err: any) {
          return res.status(400).json({ message: err.message || 'Card template image processing failed.' });
        }
      } else {
        newTemplateUrl = null;
      }
    }

    // Server-side clamping and validation for text_zone (0% to 100%)
    let validatedTextZone: { top: number; left: number; width: number; height: number } | null | undefined = undefined;
    if (text_zone !== undefined) {
      if (text_zone === null) {
        validatedTextZone = null;
      } else if (typeof text_zone === 'object') {
        const top = Math.min(100, Math.max(0, Number(text_zone.top) ?? 50));
        const left = Math.min(100, Math.max(0, Number(text_zone.left) ?? 10));
        const width = Math.min(100, Math.max(5, Number(text_zone.width) ?? 80));
        const height = Math.min(100, Math.max(5, Number(text_zone.height) ?? 40));
        validatedTextZone = { top, left, width, height };
      }
    }

    const now = new Date().toISOString();
    const updatedRecord = {
      theme_id: themeId,
      cover_background_url: newCoverUrl,
      reveal_background_url: newRevealUrl,
      card_template_url: newTemplateUrl,
      text_zone: validatedTextZone !== undefined ? validatedTextZone : (existing.text_zone || { top: 50, left: 10, width: 80, height: 40 }),
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('theme_assets')
        .upsert(updatedRecord, { onConflict: 'theme_id' })
        .select()
        .single();

      if (error) {
        console.error('Supabase theme_assets upsert error:', error);
        return res.status(500).json({ message: 'Failed to update theme assets in database.' });
      }
      if (data) {
        themeAssetsStore.set(themeId, data);
        return res.json({ success: true, asset: data });
      }
    }

    themeAssetsStore.set(themeId, updatedRecord);
    return res.json({ success: true, asset: updatedRecord });
  } catch (err: unknown) {
    console.error('Error updating theme assets:', err);
    return res.status(500).json({ message: 'Failed to update theme assets.' });
  }
});

/* ==================== Admin Blog Management Routes ==================== */

// GET /api/admin/blog — List all blog posts (published + drafts)
apiRouter.get('/admin/blog', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        return res.json(data);
      }
    }

    const posts = Array.from(blogPostsStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return res.json(posts);
  } catch (err: unknown) {
    console.error('Error fetching admin blog posts:', err);
    return res.status(500).json({ message: 'Failed to fetch blog posts.' });
  }
});

// POST /api/admin/blog — Create new blog post
apiRouter.post('/admin/blog', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { title, slug, excerpt, content, cover_image_url, published } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Blog post title is required.' });
    }
    if (!excerpt || typeof excerpt !== 'string' || !excerpt.trim()) {
      return res.status(400).json({ message: 'Blog post excerpt is required.' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Blog post content is required.' });
    }

    const cleanTitle = title.trim();
    const cleanExcerpt = excerpt.trim();
    const cleanContent = content.trim();
    const cleanCoverUrl = cover_image_url && typeof cover_image_url === 'string' ? cover_image_url.trim() : null;

    const generatedSlug = (slug && typeof slug === 'string' && slug.trim())
      ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase.from('blog_posts').select('id').eq('slug', generatedSlug).single();
      if (existing) {
        return res.status(400).json({ message: 'A blog post with this slug already exists.' });
      }
    }

    for (const p of blogPostsStore.values()) {
      if (p.slug === generatedSlug) {
        return res.status(400).json({ message: 'A blog post with this slug already exists.' });
      }
    }

    const isPublished = Boolean(published);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newPost: BlogPost = {
      id,
      slug: generatedSlug,
      title: cleanTitle,
      excerpt: cleanExcerpt,
      content: cleanContent,
      cover_image_url: cleanCoverUrl,
      published: isPublished,
      published_at: isPublished ? now : null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('blog_posts').insert(newPost);
      if (error) {
        console.error('Supabase blog_posts insert error:', error);
        return res.status(500).json({ message: 'Failed to save blog post to database.' });
      }
    }

    blogPostsStore.set(id, newPost);

    return res.status(201).json(newPost);
  } catch (err: unknown) {
    console.error('Error creating blog post:', err);
    return res.status(500).json({ message: 'Failed to create blog post.' });
  }
});

// PATCH /api/admin/blog/:id — Update existing blog post
apiRouter.patch('/admin/blog/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, slug, excerpt, content, cover_image_url, published } = req.body;

    let existingPost: BlogPost | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('blog_posts').select('*').eq('id', id).single();
      if (data) existingPost = data;
    }

    if (!existingPost) {
      existingPost = blogPostsStore.get(id);
    }

    if (!existingPost) {
      return res.status(404).json({ message: 'Blog post not found.' });
    }

    const now = new Date().toISOString();
    const updates: Partial<BlogPost> = { updated_at: now };

    if (title && typeof title === 'string') updates.title = title.trim();
    if (excerpt && typeof excerpt === 'string') updates.excerpt = excerpt.trim();
    if (content && typeof content === 'string') updates.content = content.trim();
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url ? cover_image_url.trim() : null;

    if (slug && typeof slug === 'string' && slug.trim()) {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (cleanSlug !== existingPost.slug) {
        if (isSupabaseConfigured && supabase) {
          const { data: existing } = await supabase.from('blog_posts').select('id').eq('slug', cleanSlug).neq('id', id).single();
          if (existing) {
            return res.status(400).json({ message: 'A blog post with this slug already exists.' });
          }
        }
        updates.slug = cleanSlug;
      }
    }

    if (typeof published === 'boolean') {
      updates.published = published;
      if (published && !existingPost.published_at) {
        updates.published_at = now;
      }
    }

    let updatedPost: BlogPost = { ...existingPost, ...updates };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase blog_posts update error:', error);
        return res.status(500).json({ message: 'Failed to update blog post.' });
      }
      if (data) updatedPost = data;
    }

    blogPostsStore.set(id, updatedPost);

    return res.json(updatedPost);
  } catch (err: unknown) {
    console.error('Error updating blog post:', err);
    return res.status(500).json({ message: 'Failed to update blog post.' });
  }
});

// DELETE /api/admin/blog/:id — Delete blog post
apiRouter.delete('/admin/blog/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const id = req.params.id;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('blog_posts').delete().eq('id', id);
    }

    blogPostsStore.delete(id);

    return res.json({ success: true, message: 'Blog post deleted.' });
  } catch (err: unknown) {
    console.error('Error deleting blog post:', err);
    return res.status(500).json({ message: 'Failed to delete blog post.' });
  }
});

/* ==================== Public Site Content (CMS) Endpoint ==================== */

apiRouter.get('/content', async (req, res) => {
  try {
    const result: Record<string, string> = {};

    // Populate defaults from in-memory map
    for (const [k, v] of siteContentStore.entries()) {
      result[k] = v;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('site_content').select('*');
      if (data && !error) {
        for (const row of data) {
          if (row.key && row.value !== undefined) {
            result[row.key] = row.value;
          }
        }
      }
    }

    res.json(result);
  } catch (err: unknown) {
    console.error('Error fetching site content:', err);
    const fallback: Record<string, string> = {};
    for (const [k, v] of siteContentStore.entries()) {
      fallback[k] = v;
    }
    res.json(fallback);
  }
});

// Admin Live Content Editing (CMS) Endpoint
apiRouter.patch('/admin/content', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || typeof value !== 'string') {
      return res.status(400).json({ message: 'Key and value strings are required.' });
    }

    const updatedAt = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('site_content')
        .upsert({ key, value, updated_at: updatedAt });

      if (error) {
        console.error('Supabase site_content upsert error:', error);
      }
    }

    siteContentStore.set(key, value);

    return res.json({ success: true, key, value, updated_at: updatedAt });
  } catch (err: unknown) {
    console.error('Error updating site content:', err);
    res.status(500).json({ message: 'Failed to update site content.' });
  }
});

/* ==================== Admin CRM Contact Routes ==================== */

apiRouter.get('/admin/crm', requireRole(['super_admin', 'admin', 'support']), async (req, res) => {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data && !error) {
        return res.json(data);
      }
    }

    const contacts = Array.from(crmContactsStore.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    res.json(contacts);
  } catch (err: unknown) {
    console.error('Error fetching CRM contacts:', err);
    res.status(500).json({ message: 'Failed to fetch CRM contacts.' });
  }
});

apiRouter.post('/admin/crm', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { name, email, phone, type, status, source, notes, related_experience_id } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const now = new Date().toISOString();
    const contact: CRMContact = {
      id: `crm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      email,
      phone: phone || null,
      type: type || 'lead',
      status: status || 'new',
      source: source || 'Admin Manual Add',
      notes: notes || null,
      related_experience_id: related_experience_id || null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('crm_contacts').insert(contact);
      if (error) {
        console.error('Supabase crm_contacts insert error:', error);
      }
    }

    crmContactsStore.set(contact.id, contact);

    res.status(201).json(contact);
  } catch (err: unknown) {
    console.error('Error creating CRM contact:', err);
    res.status(500).json({ message: 'Failed to create CRM contact.' });
  }
});

apiRouter.patch('/admin/crm/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const updatedAt = new Date().toISOString();

    let updatedContact: CRMContact | undefined;

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('crm_contacts')
        .update({ ...updates, updated_at: updatedAt })
        .eq('id', id)
        .select()
        .single();
      if (data) updatedContact = data;
    }

    for (const [cId, item] of crmContactsStore.entries()) {
      if (item.id === id) {
        const merged = { ...item, ...updates, updated_at: updatedAt };
        crmContactsStore.set(cId, merged);
        if (!updatedContact) updatedContact = merged;
        break;
      }
    }

    if (!updatedContact) {
      return res.status(404).json({ message: 'CRM contact not found.' });
    }

    res.json(updatedContact);
  } catch (err: unknown) {
    console.error('Error updating CRM contact:', err);
    res.status(500).json({ message: 'Failed to update CRM contact.' });
  }
});

apiRouter.delete('/admin/crm/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const id = req.params.id;

    if (isSupabaseConfigured && supabase) {
      await supabase.from('crm_contacts').delete().eq('id', id);
    }

    crmContactsStore.delete(id);
    res.json({ success: true, message: 'CRM contact deleted.' });
  } catch (err: unknown) {
    console.error('Error deleting CRM contact:', err);
    res.status(500).json({ message: 'Failed to delete CRM contact.' });
  }
});

/* ==================== Admin Settings & Sub-Admin Routes ==================== */

// GET /api/admin/settings/admins — list sub-admins
apiRouter.get('/admin/settings/admins', requireRole(['super_admin']), async (req, res) => {
  try {
    let list: any[] = [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('admins')
        .select('id, email, role, created_at, created_by')
        .order('created_at', { ascending: false });

      if (data && !error) {
        list = data;
      }
    }

    if (list.length === 0) {
      list = Array.from(adminsStore.values()).map((a) => ({
        id: a.id,
        email: a.email,
        role: a.role,
        created_at: a.created_at,
        created_by: a.created_by,
      }));
    }

    res.json(list);
  } catch (err: unknown) {
    console.error('Error fetching admins:', err);
    res.status(500).json({ message: 'Failed to fetch sub-admins.' });
  }
});

// POST /api/admin/settings/admins — create new sub-admin
apiRouter.post('/admin/settings/admins', requireRole(['super_admin']), async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const validRoles = ['super_admin', 'admin', 'support'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (super_admin, admin, or support).' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rootEmail = (process.env.ADMIN_EMAIL || 'admin@lovewrapped.app').trim().toLowerCase();

    if (cleanEmail === rootEmail) {
      return res.status(400).json({ message: 'An admin account with this email already exists.' });
    }

    // Check existing email
    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase.from('admins').select('id').eq('email', cleanEmail).single();
      if (existing) {
        return res.status(400).json({ message: 'An admin account with this email already exists.' });
      }
    }

    for (const a of adminsStore.values()) {
      if (a.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({ message: 'An admin account with this email already exists.' });
      }
    }

    const creatorSession = (req as any).adminSession;
    const password_hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newAdminRecord: AdminRecordInternal = {
      id,
      email: cleanEmail,
      password_hash,
      role,
      created_at: now,
      created_by: creatorSession?.email || null,
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('admins').insert({
        id: newAdminRecord.id,
        email: newAdminRecord.email,
        password_hash: newAdminRecord.password_hash,
        role: newAdminRecord.role,
        created_at: newAdminRecord.created_at,
      });

      if (error) {
        console.error('Supabase admin insert error:', error);
        return res.status(500).json({ message: 'Failed to create sub-admin in database.' });
      }
    }

    adminsStore.set(id, newAdminRecord);

    const publicRecord = {
      id,
      email: cleanEmail,
      role,
      created_at: now,
      created_by: creatorSession?.email || null,
    };

    res.status(201).json(publicRecord);
  } catch (err: unknown) {
    console.error('Error creating sub-admin:', err);
    res.status(500).json({ message: 'Failed to create sub-admin.' });
  }
});

// PATCH /api/admin/settings/admins/:id — update role
apiRouter.patch('/admin/settings/admins/:id', requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['super_admin', 'admin', 'support'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (super_admin, admin, or support).' });
    }

    // Demotion check: ensure at least one super_admin exists
    if (role !== 'super_admin') {
      let superAdminCount = 1; // Count implicit root admin
      if (isSupabaseConfigured && supabase) {
        const { data: superAdmins } = await supabase
          .from('admins')
          .select('id')
          .eq('role', 'super_admin')
          .neq('id', id);

        superAdminCount += superAdmins?.length || 0;
      } else {
        for (const [aId, a] of adminsStore.entries()) {
          if (aId !== id && a.role === 'super_admin') {
            superAdminCount++;
          }
        }
      }

      if (superAdminCount < 1) {
        return res.status(400).json({ message: 'Cannot demote admin: system must have at least one super admin.' });
      }
    }

    let updatedAdmin: any = null;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('admins')
        .update({ role })
        .eq('id', id)
        .select('id, email, role, created_at, created_by')
        .single();

      if (error) {
        console.error('Supabase admin role update error:', error);
      } else if (data) {
        updatedAdmin = data;
      }
    }

    for (const [aId, item] of adminsStore.entries()) {
      if (item.id === id) {
        item.role = role;
        adminsStore.set(aId, item);
        if (!updatedAdmin) {
          updatedAdmin = {
            id: item.id,
            email: item.email,
            role: item.role,
            created_at: item.created_at,
            created_by: item.created_by,
          };
        }
        break;
      }
    }

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Sub-admin not found.' });
    }

    return res.json({ success: true, admin: updatedAdmin });
  } catch (err: unknown) {
    console.error('Error updating sub-admin role:', err);
    res.status(500).json({ message: 'Failed to update sub-admin role.' });
  }
});

// DELETE /api/admin/settings/admins/:id — delete sub-admin
apiRouter.delete('/admin/settings/admins/:id', requireRole(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if target is a super_admin and ensure at least one super_admin remains
    let targetIsSuperAdmin = false;

    if (isSupabaseConfigured && supabase) {
      const { data: target } = await supabase.from('admins').select('role').eq('id', id).single();
      if (target?.role === 'super_admin') targetIsSuperAdmin = true;
    } else {
      const target = adminsStore.get(id);
      if (target?.role === 'super_admin') targetIsSuperAdmin = true;
    }

    if (targetIsSuperAdmin) {
      let superAdminCount = 1; // Count root admin
      if (isSupabaseConfigured && supabase) {
        const { data: superAdmins } = await supabase
          .from('admins')
          .select('id')
          .eq('role', 'super_admin')
          .neq('id', id);

        superAdminCount += superAdmins?.length || 0;
      } else {
        for (const [aId, a] of adminsStore.entries()) {
          if (aId !== id && a.role === 'super_admin') {
            superAdminCount++;
          }
        }
      }

      if (superAdminCount < 1) {
        return res.status(400).json({ message: 'Cannot remove sub-admin: system must have at least one super admin.' });
      }
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('admins').delete().eq('id', id);
    }

    adminsStore.delete(id);

    return res.json({ success: true, message: 'Sub-admin removed successfully.' });
  } catch (err: unknown) {
    console.error('Error deleting sub-admin:', err);
    res.status(500).json({ message: 'Failed to remove sub-admin.' });
  }
});

// PATCH /api/admin/settings/password — change logged-in admin password
apiRouter.patch('/admin/settings/password', requireRole(['super_admin', 'admin', 'support']), async (req, res) => {
  try {
    const session = (req as any).adminSession;
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (session.isRootAdmin) {
      return res.status(400).json({
        message: 'Root admin password is set via environment variables (ADMIN_PASSWORD_HASH) and cannot be changed here.',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    const adminEmail = session.email;
    let targetAdmin: AdminRecordInternal | null = null;

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('admins').select('*').eq('email', adminEmail).single();
      if (data) targetAdmin = data;
    }

    if (!targetAdmin) {
      for (const a of adminsStore.values()) {
        if (a.email.toLowerCase() === adminEmail.toLowerCase()) {
          targetAdmin = a;
          break;
        }
      }
    }

    if (!targetAdmin) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    const passwordValid = bcrypt.compareSync(currentPassword, targetAdmin.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('admins')
        .update({ password_hash: newHash })
        .eq('id', targetAdmin.id);

      if (error) {
        console.error('Supabase password update error:', error);
        return res.status(500).json({ message: 'Failed to update password.' });
      }
    }

    targetAdmin.password_hash = newHash;
    adminsStore.set(targetAdmin.id, targetAdmin);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: unknown) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Failed to change password.' });
  }
});

// Register API router on both /api prefix and root / prefix to guarantee routing under Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
