import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { CreateExperiencePayload, Experience, UserRecord } from './src/types';
import { generateSlides } from './src/lib/slideEngine';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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

// API Routes

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LoveWrapped API',
    database: isSupabaseConfigured ? 'supabase' : 'in-memory',
  });
});

// Image Upload Endpoint for Paid Plan
app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64, fileName } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ message: 'No image data provided.' });
    }

    if (isSupabaseConfigured && supabase) {
      const cleanFileName = `${Date.now()}_${(fileName || 'image.jpg').replace(/[^a-zA-Z0-9._-]/g, '')}`;
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const { error } = await supabase.storage
        .from('experience-images')
        .upload(cleanFileName, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Supabase image upload error:', error);
        return res.status(500).json({ message: 'Failed to upload image to Supabase storage.' });
      }

      const { data: publicUrlData } = supabase.storage
        .from('experience-images')
        .getPublicUrl(cleanFileName);

      return res.json({ url: publicUrlData.publicUrl });
    }

    // Fallback: return base64 data string directly if Supabase storage is not configured
    res.json({ url: imageBase64 });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ message: err.message || 'Image upload failed' });
  }
});

// Create new experience
app.post('/api/experiences', async (req, res) => {
  const payload: CreateExperiencePayload = req.body;
  if (!payload.sender_name || !payload.receiver_name || !payload.message) {
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
});

// Get experience by slug
app.get('/api/experiences/:slug', async (req, res) => {
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
app.post('/api/experiences/:slug/react', async (req, res) => {
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
app.post('/api/paystack/initialize', async (req, res) => {
  const { experience_id } = req.body;
  
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

  const reference = `LW_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  exp.payment_reference = reference;

  if (isSupabaseConfigured && supabase) {
    await supabase.from('experiences').update({ payment_reference: reference }).eq('id', exp.id);
  }

  experiencesStore.set(exp.slug, exp);

  res.json({
    authorization_url: `/pay?ref=${reference}&expId=${exp.id}`,
    reference,
    amount: 300000, // ₦3,000 in kobo
  });
});

// Verify Paystack Payment
app.post('/api/paystack/verify', async (req, res) => {
  const { reference, experience_id } = req.body;

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

  res.json({
    success: true,
    message: 'Payment verified successfully!',
    experience: exp,
  });
});

// Paystack Webhook endpoint
app.post('/api/paystack/webhook', async (req, res) => {
  const event = req.body;
  if (event && event.event === 'charge.success') {
    const reference = event.data?.reference;
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
  res.status(200).json({ status: 'success' });
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
app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: exps } = await supabase.from('experiences').select('*');
    const { data: users } = await supabase.from('users').select('*');

    const allExperiences: Experience[] = exps || [];
    const allUsers: UserRecord[] = users || [];

    const paidExps = allExperiences.filter((e) => e.tier === 'paid' && e.is_paid);
    const freeExps = allExperiences.filter((e) => e.tier === 'free');
    const paidUsersCount = allUsers.filter((u) => u.tier === 'paid').length;
    const totalReactions = allExperiences.reduce((acc, curr) => acc + (curr.reactions_count || 0), 0);
    const totalRevenueNgn = paidExps.length * 3000;

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

  const totalRevenueNgn = paidExps.length * 3000;

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

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return res.json(users || []);
  }

  const usersList = Array.from(usersStore.values());
  res.json(usersList);
});

app.get('/api/admin/experiences', requireAdmin, async (req, res) => {
  if (isSupabaseConfigured && supabase) {
    const { data: exps } = await supabase.from('experiences').select('*').order('created_at', { ascending: false });
    return res.json(exps || []);
  }

  const expsList = Array.from(experiencesStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json(expsList);
});

app.delete('/api/admin/experiences/:id', requireAdmin, async (req, res) => {
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

// Start Express + Vite server setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`💖 LoveWrapped server running on http://0.0.0.0:${PORT}`);
  });
}

start();
