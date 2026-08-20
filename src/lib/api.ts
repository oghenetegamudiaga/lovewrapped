import { AdminMetrics, CreateExperiencePayload, Experience, UserRecord, CRMContact, SiteContentMap, AdminRole, AdminRecord, BlogPost, Wedding, WeddingEvent, WeddingRSVP, CreateWeddingPayload, WeddingGuest, WeddingGuestWithEvents, CoupleAccount } from '../types.js';

const API_BASE = '/api';

export interface AdminTimeseriesPoint {
  date: string;
  displayDate: string;
  revenue: number;
  paidCount: number;
  freeCount: number;
  signups: number;
}

/**
 * Helper to fetch JSON with error handling & credentials for httpOnly session cookies.
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMessage = `Server error (${res.status})`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) {
        errorMessage = parsed.message;
      }
    } catch {
      if (text && text.length < 150) {
        errorMessage = `Server error (${res.status}): ${text}`;
      }
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function getSignedUploadUrlApi(
  fileName: string,
  contentType: string
): Promise<{
  signedUrl?: string;
  token?: string;
  path: string;
  publicUrl?: string;
  fallback?: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}> {
  return apiFetch('/upload-url', {
    method: 'POST',
    body: JSON.stringify({ fileName, contentType }),
  });
}

export async function uploadVoiceApi(
  audioData: string,
  fileName: string,
  contentType: string
): Promise<{ url: string; publicUrl: string; path: string }> {
  return apiFetch('/upload-voice', {
    method: 'POST',
    body: JSON.stringify({ audioData, fileName, contentType }),
  });
}

export async function createExperienceApi(payload: CreateExperiencePayload): Promise<Experience> {
  return apiFetch<Experience>('/experiences', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getExperienceApi(slug: string): Promise<Experience> {
  return apiFetch<Experience>(`/experiences/${encodeURIComponent(slug)}`);
}

export async function reactToExperienceApi(slug: string): Promise<{ reactions_count: number }> {
  return apiFetch<{ reactions_count: number }>(`/experiences/${encodeURIComponent(slug)}/react`, {
    method: 'POST',
  });
}

export async function initializePaymentApi(
  experienceId: string,
  email: string
): Promise<{ authorization_url: string; reference: string }> {
  return apiFetch<{ authorization_url: string; reference: string }>('/paystack/initialize', {
    method: 'POST',
    body: JSON.stringify({ experience_id: experienceId, email }),
  });
}

export async function verifyPaymentApi(
  reference: string,
  experienceId: string
): Promise<{ success: boolean; experience: Experience }> {
  return apiFetch<{ success: boolean; experience: Experience }>('/paystack/verify', {
    method: 'POST',
    body: JSON.stringify({ reference, experience_id: experienceId }),
  });
}

/* ==================== Public Blog Endpoints ==================== */

export async function getPublicBlogPostsApi(): Promise<BlogPost[]> {
  return apiFetch<BlogPost[]>('/blog');
}

export async function getPublicBlogPostBySlugApi(slug: string): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/blog/${encodeURIComponent(slug)}`);
}

/* ==================== Admin API Calls (Cookie Auth) ==================== */

export async function adminLoginApi(email: string, password: string): Promise<{ success: boolean; email: string; role: AdminRole; isRootAdmin?: boolean }> {
  return apiFetch<{ success: boolean; email: string; role: AdminRole; isRootAdmin?: boolean }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function adminLogoutApi(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/admin/logout', {
    method: 'POST',
  });
}

export async function getAdminMeApi(): Promise<{ authenticated: boolean; email: string; role: AdminRole; isRootAdmin?: boolean }> {
  return apiFetch<{ authenticated: boolean; email: string; role: AdminRole; isRootAdmin?: boolean }>('/admin/me');
}

export async function getAdminMetricsApi(): Promise<AdminMetrics> {
  return apiFetch<AdminMetrics>('/admin/metrics');
}

export async function getAdminTimeseriesApi(): Promise<AdminTimeseriesPoint[]> {
  return apiFetch<AdminTimeseriesPoint[]>('/admin/metrics/timeseries');
}

export async function getAdminUsersApi(): Promise<UserRecord[]> {
  return apiFetch<UserRecord[]>('/admin/users');
}

export async function getAdminExperiencesApi(): Promise<Experience[]> {
  return apiFetch<Experience[]>('/admin/experiences');
}

export async function updateAdminExperiencePaymentStatusApi(id: string, is_paid: boolean): Promise<{ success: boolean; experience: Experience }> {
  return apiFetch<{ success: boolean; experience: Experience }>(`/admin/experiences/${id}/payment-status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_paid }),
  });
}

export async function deleteAdminExperienceApi(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/admin/experiences/${id}`, {
    method: 'DELETE',
  });
}

/* ==================== CRM Admin Endpoints ==================== */

export async function getAdminCrmContactsApi(): Promise<CRMContact[]> {
  return apiFetch<CRMContact[]>('/admin/crm');
}

export async function createAdminCrmContactApi(payload: Partial<CRMContact>): Promise<CRMContact> {
  return apiFetch<CRMContact>('/admin/crm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCrmContactApi(id: string, updates: Partial<CRMContact>): Promise<CRMContact> {
  return apiFetch<CRMContact>(`/admin/crm/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteAdminCrmContactApi(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/admin/crm/${id}`, {
    method: 'DELETE',
  });
}

/* ==================== Site Content CMS Endpoints ==================== */

export async function updateSiteContentApi(key: string, value: string): Promise<{ success: boolean; key: string; value: string }> {
  return apiFetch<{ success: boolean; key: string; value: string }>('/admin/content', {
    method: 'PATCH',
    body: JSON.stringify({ key, value }),
  });
}

/* ==================== Admin Blog Management API ==================== */

export async function getAdminBlogPostsApi(): Promise<BlogPost[]> {
  return apiFetch<BlogPost[]>('/admin/blog');
}

export async function createAdminBlogPostApi(payload: {
  title: string;
  slug?: string;
  excerpt: string;
  content: string;
  cover_image_url?: string | null;
  published: boolean;
}): Promise<BlogPost> {
  return apiFetch<BlogPost>('/admin/blog', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminBlogPostApi(
  id: string,
  updates: Partial<BlogPost>
): Promise<BlogPost> {
  return apiFetch<BlogPost>(`/admin/blog/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteAdminBlogPostApi(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/admin/blog/${id}`, {
    method: 'DELETE',
  });
}

/* ==================== Sub-Admin & Settings Endpoints ==================== */

export async function getAdminSubAdminsApi(): Promise<AdminRecord[]> {
  return apiFetch<AdminRecord[]>('/admin/settings/admins');
}

export async function createAdminSubAdminApi(payload: {
  email: string;
  password: string;
  role: AdminRole;
}): Promise<AdminRecord> {
  return apiFetch<AdminRecord>('/admin/settings/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSubAdminRoleApi(
  id: string,
  role: AdminRole
): Promise<{ success: boolean; admin: AdminRecord }> {
  return apiFetch<{ success: boolean; admin: AdminRecord }>(`/admin/settings/admins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdminSubAdminApi(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/admin/settings/admins/${id}`, {
    method: 'DELETE',
  });
}

export async function changeAdminPasswordApi(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/admin/settings/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/* ==================== Weddings API Helpers (Phase 1 & 2) ==================== */

export async function getPublicWeddingBySlugApi(
  slug: string,
  token?: string
): Promise<{ wedding: Wedding; events: WeddingEvent[]; event: WeddingEvent | null; guest?: WeddingGuest | null }> {
  const query = token ? `?g=${encodeURIComponent(token)}` : '';
  return apiFetch<{ wedding: Wedding; events: WeddingEvent[]; event: WeddingEvent | null; guest?: WeddingGuest | null }>(
    `/weddings/slug/${slug}${query}`
  );
}

export async function submitWeddingRsvpApi(
  slug: string,
  payload: {
    guest_name: string;
    attending: boolean;
    guest_count?: number;
    plus_one_name?: string;
    dietary_notes?: string;
    message?: string;
    guest_id?: string;
    event_id?: string;
  }
): Promise<{ success: boolean; rsvp: WeddingRSVP }> {
  return apiFetch<{ success: boolean; rsvp: WeddingRSVP }>(`/weddings/${slug}/rsvp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createWeddingPaymentApi(payload: CreateWeddingPayload): Promise<{
  authorization_url: string;
  reference: string;
  weddingId?: string;
  slug?: string;
  amount: number;
}> {
  return apiFetch<{
    authorization_url: string;
    reference: string;
    weddingId?: string;
    slug?: string;
    amount: number;
  }>('/weddings/create-payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function verifyWeddingPaymentApi(
  reference: string
): Promise<{
  success: boolean;
  wedding: Wedding;
  events?: WeddingEvent[];
  event?: WeddingEvent;
  shareUrl: string;
}> {
  return apiFetch<{
    success: boolean;
    wedding: Wedding;
    events?: WeddingEvent[];
    event?: WeddingEvent;
    shareUrl: string;
  }>('/weddings/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  });
}

export async function getCoupleWeddingDashboardApi(weddingId: string): Promise<{
  wedding: Wedding;
  events: WeddingEvent[];
  event: WeddingEvent | null;
  rsvps: WeddingRSVP[];
}> {
  return apiFetch<{
    wedding: Wedding;
    events: WeddingEvent[];
    event: WeddingEvent | null;
    rsvps: WeddingRSVP[];
  }>(`/weddings/dashboard/${weddingId}`);
}

export async function updateCoupleWeddingDetailsApi(
  weddingId: string,
  updates: Partial<WeddingEvent>
): Promise<{ success: boolean; event: WeddingEvent }> {
  return apiFetch<{ success: boolean; event: WeddingEvent }>(`/weddings/dashboard/${weddingId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function updateCoupleWeddingInfoApi(
  weddingId: string,
  updates: Partial<Wedding>
): Promise<{ success: boolean; wedding: Wedding }> {
  return apiFetch<{ success: boolean; wedding: Wedding }>(`/weddings/dashboard/${weddingId}/info`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function getCoupleMyWeddingsApi(): Promise<{
  success: boolean;
  weddings: Array<{
    id: string;
    slug: string;
    bride_first_name?: string;
    bride_other_names?: string;
    groom_first_name?: string;
    groom_other_names?: string;
    couple_names?: string;
    is_paid: boolean;
    created_at: string;
  }>;
}> {
  return apiFetch<{
    success: boolean;
    weddings: Array<{
      id: string;
      slug: string;
      bride_first_name?: string;
      bride_other_names?: string;
      groom_first_name?: string;
      groom_other_names?: string;
      couple_names?: string;
      is_paid: boolean;
      created_at: string;
    }>;
  }>('/weddings/mine');
}

export async function getCoupleMeApi(): Promise<{
  authenticated: boolean;
  couple: CoupleAccount | null;
}> {
  return apiFetch<{ authenticated: boolean; couple: CoupleAccount | null }>('/weddings/me');
}

export async function logoutCoupleApi(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/weddings/logout', {
    method: 'POST',
  });
}

/* ==================== Phase 2 Guest Management API Helpers ==================== */

export async function getCoupleWeddingGuestsApi(weddingId: string): Promise<WeddingGuestWithEvents[]> {
  return apiFetch<WeddingGuestWithEvents[]>(`/weddings/dashboard/${weddingId}/guests`);
}

export async function addCoupleWeddingGuestApi(
  weddingId: string,
  payload: {
    name: string;
    email?: string;
    plus_one_allowed?: boolean;
    dietary_notes?: string;
    event_ids?: string[];
  }
): Promise<{ success: boolean; guest: WeddingGuestWithEvents }> {
  return apiFetch<{ success: boolean; guest: WeddingGuestWithEvents }>(`/weddings/dashboard/${weddingId}/guests`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCoupleWeddingGuestApi(
  weddingId: string,
  guestId: string,
  updates: {
    name?: string;
    email?: string;
    plus_one_allowed?: boolean;
    dietary_notes?: string;
    event_ids?: string[];
  }
): Promise<{ success: boolean; guest: WeddingGuestWithEvents }> {
  return apiFetch<{ success: boolean; guest: WeddingGuestWithEvents }>(`/weddings/dashboard/${weddingId}/guests/${guestId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteCoupleWeddingGuestApi(weddingId: string, guestId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/weddings/dashboard/${weddingId}/guests/${guestId}`, {
    method: 'DELETE',
  });
}

export async function importCoupleWeddingGuestsCsvApi(
  weddingId: string,
  guests: { name: string; email?: string; plus_one_allowed?: boolean; dietary_notes?: string; event_ids?: string[] }[]
): Promise<{ success: boolean; imported_count: number; guests: WeddingGuestWithEvents[] }> {
  return apiFetch<{ success: boolean; imported_count: number; guests: WeddingGuestWithEvents[] }>(
    `/weddings/dashboard/${weddingId}/guests/import`,
    {
      method: 'POST',
      body: JSON.stringify({ guests }),
    }
  );
}

export function exportCoupleWeddingGuestsCsvUrl(weddingId: string): string {
  return `/api/weddings/dashboard/${weddingId}/guests/export`;
}

export async function getAdminWeddingsApi(): Promise<
  {
    id: string;
    bride_first_name?: string;
    bride_other_names?: string;
    groom_first_name?: string;
    groom_other_names?: string;
    couple_names?: string;
    slug: string;
    theme_id: string;
    is_paid: boolean;
    payment_reference?: string;
    created_at: string;
  }[]
> {
  return apiFetch<
    {
      id: string;
      bride_first_name?: string;
      bride_other_names?: string;
      groom_first_name?: string;
      groom_other_names?: string;
      couple_names?: string;
      slug: string;
      theme_id: string;
      is_paid: boolean;
      payment_reference?: string;
      created_at: string;
    }[]
  >('/admin/weddings');
}

export async function deleteAdminWeddingApi(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/admin/weddings/${id}`, {
    method: 'DELETE',
  });
}


