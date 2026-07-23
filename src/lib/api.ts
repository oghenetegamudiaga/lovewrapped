import { AdminMetrics, CreateExperiencePayload, Experience, UserRecord } from '../types.js';

const API_BASE = '/api';

/**
 * Helper to fetch JSON with error handling.
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
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

export async function getAdminMetricsApi(passcode: string): Promise<AdminMetrics> {
  return apiFetch<AdminMetrics>('/admin/metrics', {
    headers: { 'x-admin-passcode': passcode },
  });
}

export async function getAdminUsersApi(passcode: string): Promise<UserRecord[]> {
  return apiFetch<UserRecord[]>('/admin/users', {
    headers: { 'x-admin-passcode': passcode },
  });
}

export async function getAdminExperiencesApi(passcode: string): Promise<Experience[]> {
  return apiFetch<Experience[]>('/admin/experiences', {
    headers: { 'x-admin-passcode': passcode },
  });
}

export async function deleteAdminExperienceApi(passcode: string, id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/admin/experiences/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-passcode': passcode },
  });
}
