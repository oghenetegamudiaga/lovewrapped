import dotenv from 'dotenv';
dotenv.config();

import crypto from 'crypto';
import express from 'express';
import { CreateExperiencePayload, Experience, UserRecord } from '../src/types.js';
import { generateSlides } from '../src/lib/slideEngine.js';
import { isSupabaseConfigured, supabase } from '../src/lib/supabase.js';
import { PAID_PLAN_PRICE_KOBO, PAID_PLAN_PRICE_NGN, PAID_PLAN_PRICE_FORMATTED } from '../src/constants.js';

const app = express();
const PORT = 3000;

app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// In-memory data stores initialized with seed demo data
const experiencesStore: Map<string, Experience> = new Map();
const usersStore: Map<string, UserRecord> = new Map();

// Helper to generate slug
function generateSlug(sender: string, receiver: string): string {
  const cleanSender = (sender || 'someone').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanReceiver = (receiver || 'love').toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7);
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
    service: 'LoveWrapped API',
    database: isSupabaseConfigured ? 'supabase' : 'in-memory',
  });
});

// Lightweight Signed URL Endpoint for Direct Client-to-Supabase Storage Uploads
apiRouter.post('/upload-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${(fileName || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '')}`;

    if (isSupabaseConfigured && supabase) {
      // Attempt signed upload URL creation
      const { data, error } = await supabase.storage
        .from('experience-images')
        .createSignedUploadUrl(cleanFileName);

      const { data: publicUrlData } = supabase.storage
        .from('experience-images')
        .getPublicUrl(cleanFileName);

      if (!error && data) {
        return res.json({
          signedUrl: data.signedUrl,
          path: cleanFileName,
          token: data.token,
          publicUrl: publicUrlData.publicUrl,
        });
      }

      // If signed upload URL is not supported by bucket config, provide Supabase client parameters for direct upload
      return res.json({
        path: cleanFileName,
        publicUrl: publicUrlData.publicUrl,
        supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
      });
    }

    // Fallback if Supabase storage is not configured locally
    res.json({
      fallback: true,
      path: cleanFileName,
    });
  } catch (err: any) {
    console.error('Signed upload URL error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate upload URL' });
  }
});

// Create new experience
apiRouter.post('/experiences', async (req, res) => {
  try {
    const payload: CreateExperiencePayload = req.body;
    if (!payload || !payload.sender_name || !payload.receiver_name || !payload.message) {
      return res.status(400).json({ message: 'Sender, receiver, and message are required.' });
    }

    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const slug = generateSlug(payload.sender_name, payload.receiver_name);
    const tier = payload.tier || 'free';
    const images = payload.images || [];

    const generatedSlides = generateSlides(
      payload.sender_name,
      payload.receiver_name,
      payload.occasion || 'Special Moment',
      payload.message,
      tier,
      images
    );

    const experience: Experience = {
      id,
      slug,
      sender_name: payload.sender_name,
      receiver_name: payload.receiver_name,
      occasion: payload.occasion || 'Special Moment',
      tier,
      image_count: images.length,
      is_paid: tier === 'free', // Free tier is instantly active; Paid requires paystack step
      payment_reference: null,
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
        views_count: experience.views_count,
        reactions_count: experience.reactions_count,
        slides: experience.slides,
        created_at: experience.created_at,
      });

      if (expError) {
        console.error('Error inserting experience to Supabase:', expError);
      }

      if (payload.creator_email) {
        await supabase.from('users').insert({
          email: payload.creator_email,
          tier,
        });
      }
    }

    // Always sync to in-memory store for fast local access / fallback
    experiencesStore.set(slug, experience);
    if (payload.creator_email) {
      const userId = `usr-${Date.now()}`;
      usersStore.set(userId, {
        id: userId,
        email: payload.creator_email,
        tier,
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json(experience);
  } catch (err: any) {
    console.error('Error creating experience:', err);
    res.status(500).json({ message: err.message || 'Failed to save experience.' });
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
apiRouter.post('/paystack/initialize', async (req, res) => {
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
        message: paystackData.message || 'Failed to initialize Paystack transaction.',
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
    const msg = err instanceof Error ? err.message : 'Internal server error initializing payment.';
    return res.status(500).json({ message: msg });
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
      return res.status(400).json({
        message: paystackData.message || 'Payment verification failed on Paystack.',
      });
    }

    const txData = paystackData.data;

    // Only set is_paid: true if data.status === 'success' AND data.amount === 200000 (PAID_PLAN_PRICE_KOBO)
    if (txData.status !== 'success' || txData.amount !== PAID_PLAN_PRICE_KOBO) {
      return res.status(400).json({
        message: `Payment verification failed. Status: ${txData.status}, Amount: ${txData.amount}`,
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
    const msg = err instanceof Error ? err.message : 'Internal server error verifying payment.';
    return res.status(500).json({ message: msg });
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
    if (txData && txData.status === 'success' && txData.amount === PAID_PLAN_PRICE_KOBO) {
      const reference = txData.reference;
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

  return res.status(200).json({ status: 'success' });
});

// Admin Middleware / Auth Check
const ADMIN_PASSCODE = 'lovewrapped2026'; // Default admin password

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['x-admin-passcode'];
  if (authHeader === ADMIN_PASSCODE) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized. Invalid admin passcode.' });
  }
}

// Admin API Routes
apiRouter.get('/admin/metrics', requireAdmin, async (req, res) => {
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

apiRouter.get('/admin/users', requireAdmin, async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return res.json(users || []);
  }

  const usersList = Array.from(usersStore.values());
  res.json(usersList);
});

apiRouter.get('/admin/experiences', requireAdmin, async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: exps } = await supabase.from('experiences').select('*').order('created_at', { ascending: false });
    return res.json(exps || []);
  }

  const expsList = Array.from(experiencesStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json(expsList);
});

apiRouter.delete('/admin/experiences/:id', requireAdmin, async (req, res) => {
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

// Register API router on both /api prefix and root / prefix to guarantee routing under Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
