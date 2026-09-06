import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const isPlaceholderKey = (key: string) =>
  !key ||
  key === 'your-service-role-key' ||
  key === 'your-anon-key' ||
  key === 'MY_SUPABASE_SERVICE_ROLE_KEY';

const isPlaceholderUrl = (url: string) =>
  !url || url === 'https://your-project.supabase.co';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !isPlaceholderUrl(supabaseUrl) &&
  serviceRoleKey &&
  !isPlaceholderKey(serviceRoleKey)
);

if (!isSupabaseConfigured) {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'FATAL CONFIGURATION ERROR: SUPABASE_SERVICE_ROLE_KEY is missing or invalid in server environment. Backend API requires a valid SUPABASE_SERVICE_ROLE_KEY to perform database operations.'
    );
  } else {
    console.warn(
      'WARNING: SUPABASE_SERVICE_ROLE_KEY is missing or invalid in local environment. Server-side Supabase integration is disabled.'
    );
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;