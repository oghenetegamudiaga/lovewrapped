import { AdminMetrics, CreateExperiencePayload, Experience, UserRecord, CRMContact, SiteContentMap } from '../types.js';

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

/* ==================== Admin API Calls (Cookie Auth) ==================== */

export async function adminLoginApi(credentials: { email: string; password: string }): Promise<{ success: boolean; email: string }> {
  return apiFetch<{ success: boolean; email: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function adminLogoutApi(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/admin/logout', {
    method: 'POST',
  });
}

export async function getAdminMeApi(): Promise<{ authenticated: boolean; email: string }> {
  return apiFetch<{ authenticated: boolean; email: string }>('/admin/me');
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

export async function updateAdminExperiencePaymentStatusApi(id: string, isPaid: boolean): Promise<{ success: boolean; experience: Experience }> {
  return apiFetch<{ success: boolean; experience: Experience }>(`/admin/experiences/${id}/payment-status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_paid: isPaid }),
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

export async function createAdminCrmContactApi(contact: Partial<CRMContact>): Promise<CRMContact> {
  return apiFetch<CRMContact>('/admin/crm', {
    method: 'POST',
    body: JSON.stringify(contact),
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
