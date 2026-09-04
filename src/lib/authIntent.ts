/**
 * Unified Auth Intent & Open-Redirect Security Validator
 * Single Source of Truth for Amorah Authentication Routing & Intent Resume
 */

export const DEFAULT_AUTH_FALLBACK = '/weddings/mine';
export const DEFAULT_CREATE_FALLBACK = '/weddings/create';

// List of allowed internal route prefixes / exact routes
const ALLOWED_ROUTE_PREFIXES = [
  '/',
  '/weddings',
  '/weddings/create',
  '/weddings/mine',
  '/weddings/dashboard',
  '/weddings/login',
  '/weddings/signup',
  '/login',
  '/signup',
  '/create',
  '/pricing',
  '/preview',
  '/pay',
  '/love-stories',
  '/blog',
  '/hub',
  '/w/',
];

/**
 * Validates a redirect target URL string to prevent open-redirect vulnerabilities.
 * Rejects external URLs, protocol-relative URLs, javascript: URIs, data: URIs,
 * control characters, and unallowlisted routes.
 *
 * @param target Raw redirect target string from query parameter or user input
 * @param fallback Optional safe fallback path if validation fails
 * @returns Safe normalized internal path
 */
export function validateRedirectTarget(
  target: string | null | undefined,
  fallback: string = DEFAULT_AUTH_FALLBACK
): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();

  // Rejection 1: Empty string
  if (!trimmed) {
    return fallback;
  }

  // Rejection 2: Control characters, newlines, carriage returns, null bytes
  if (/[\r\n\0\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // Rejection 3: Protocol-relative URLs (e.g. //evil.com, /\\evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\\\')) {
    return fallback;
  }

  // Rejection 4: Absolute URLs with schemes (e.g. http://, https://, javascript:, data:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // Rejection 5: Path must start with a single forward slash '/'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Parse path without search/hash to test against allowlist
  try {
    const relativeUrl = new URL(trimmed, 'https://amorah.local');
    const pathname = relativeUrl.pathname;

    // Verify pathname matches an allowed internal route prefix
    const isAllowed = ALLOWED_ROUTE_PREFIXES.some((prefix) => {
      if (prefix === '/') return pathname === '/';
      return pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');
    });

    if (!isAllowed) {
      return fallback;
    }

    // Return the safe normalized path (pathname + search + hash)
    return relativeUrl.pathname + relativeUrl.search + relativeUrl.hash;
  } catch (err) {
    return fallback;
  }
}

/**
 * Resolves the final destination after authentication succeeds.
 * Prioritizes validated explicit intent (`?redirect=...`), or falls back
 * to user's wedding portfolio status.
 *
 * @param queryRedirect Value of ?redirect= query param
 * @param weddingCount Number of weddings owned by user (if known)
 * @param singleWeddingId ID of wedding if user owns exactly 1 wedding
 * @returns Validated post-auth destination path
 */
export function getPostAuthRedirect(
  queryRedirect: string | null | undefined,
  weddingCount?: number,
  singleWeddingId?: string
): string {
  if (queryRedirect) {
    const validated = validateRedirectTarget(queryRedirect, '');
    // Ignore if target resolves to auth pages to prevent auth redirect loops
    if (
      validated &&
      validated !== '/login' &&
      validated !== '/signup' &&
      validated !== '/weddings/login' &&
      validated !== '/weddings/signup'
    ) {
      return validated;
    }
  }

  // Smart fallback based on portfolio if no valid explicit intent
  if (weddingCount === 0) {
    return '/weddings/create';
  }
  if (weddingCount === 1 && singleWeddingId) {
    return `/weddings/dashboard/${singleWeddingId}`;
  }
  return DEFAULT_AUTH_FALLBACK;
}

/**
 * Builds a login/signup URL preserving the intended target path as a ?redirect= query parameter.
 *
 * @param targetPath Intended destination path after authentication
 * @param isSignup Whether to build a signup or login URL
 * @returns Fully constructed auth path (e.g. /login?redirect=%2Fweddings%2Fcreate)
 */
export function buildAuthUrl(targetPath: string, isSignup = false): string {
  const validatedTarget = validateRedirectTarget(targetPath, DEFAULT_AUTH_FALLBACK);
  const basePath = isSignup ? '/signup' : '/login';
  return `${basePath}?redirect=${encodeURIComponent(validatedTarget)}`;
}

/**
 * Session storage intent persistence helpers
 */
const INTENT_STORAGE_KEY = 'amorah_auth_intent';

export function setStoredIntent(targetPath: string): void {
  try {
    const validated = validateRedirectTarget(targetPath, '');
    if (validated) {
      sessionStorage.setItem(INTENT_STORAGE_KEY, validated);
    }
  } catch (err) {
    // Ignore storage errors
  }
}

export function getStoredIntent(): string | null {
  try {
    const val = sessionStorage.getItem(INTENT_STORAGE_KEY);
    return val ? validateRedirectTarget(val, '') || null : null;
  } catch (err) {
    return null;
  }
}

export function clearStoredIntent(): void {
  try {
    sessionStorage.removeItem(INTENT_STORAGE_KEY);
  } catch (err) {
    // Ignore storage errors
  }
}
