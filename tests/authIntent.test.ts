import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRedirectTarget,
  getPostAuthRedirect,
  buildAuthUrl,
  DEFAULT_AUTH_FALLBACK,
} from '../src/lib/authIntent.js';
import {
  getEntryPointPath,
  ENTRY_POINT_ROUTING_TABLE,
  EntryPointKey,
} from '../src/config/entryPointRouting.js';

describe('Unified Auth Intent & Security Validator', () => {
  describe('validateRedirectTarget (Open-Redirect Security Check)', () => {
    it('rejects external domain URLs', () => {
      assert.equal(validateRedirectTarget('https://evil.com'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('http://phishing.site/login'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('https://amorah.xyz.evil.com'), DEFAULT_AUTH_FALLBACK);
    });

    it('rejects protocol-relative URLs', () => {
      assert.equal(validateRedirectTarget('//evil.com'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('//evil.com/weddings/create'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('/\\evil.com'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('\\\\evil.com'), DEFAULT_AUTH_FALLBACK);
    });

    it('rejects malicious URI schemes (javascript:, data:, vbscript:)', () => {
      assert.equal(validateRedirectTarget('javascript:alert(document.cookie)'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('data:text/html,<script>alert(1)</script>'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('vbscript:msgbox("hacked")'), DEFAULT_AUTH_FALLBACK);
    });

    it('rejects control characters and CRLF injection attempts', () => {
      assert.equal(validateRedirectTarget('/weddings/create\r\nSet-Cookie:admin=true'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('/weddings/mine\0'), DEFAULT_AUTH_FALLBACK);
    });

    it('rejects unallowlisted route paths', () => {
      assert.equal(validateRedirectTarget('/unknown/unauthorized/path'), DEFAULT_AUTH_FALLBACK);
      assert.equal(validateRedirectTarget('/admin/secret/delete'), DEFAULT_AUTH_FALLBACK);
    });

    it('accepts legitimate internal Wedding product destinations', () => {
      assert.equal(validateRedirectTarget('/weddings/create'), '/weddings/create');
      assert.equal(validateRedirectTarget('/weddings/mine'), '/weddings/mine');
      assert.equal(validateRedirectTarget('/weddings/dashboard/wedding-123'), '/weddings/dashboard/wedding-123');
      assert.equal(validateRedirectTarget('/weddings'), '/weddings');
    });

    it('accepts legitimate internal Moments product destinations', () => {
      assert.equal(validateRedirectTarget('/create'), '/create');
      assert.equal(validateRedirectTarget('/pricing'), '/pricing');
      assert.equal(validateRedirectTarget('/preview'), '/preview');
    });

    it('preserves valid query string parameters', () => {
      assert.equal(validateRedirectTarget('/create?plan=paid'), '/create?plan=paid');
      assert.equal(validateRedirectTarget('/weddings/create?theme=rose'), '/weddings/create?theme=rose');
    });

    it('returns custom fallback when provided for invalid inputs', () => {
      assert.equal(validateRedirectTarget('https://evil.com', '/create'), '/create');
      assert.equal(validateRedirectTarget(null, '/weddings/create'), '/weddings/create');
    });
  });

  describe('getPostAuthRedirect (Intent Resume Logic)', () => {
    it('resumes explicit Wedding product intent after auth', () => {
      assert.equal(getPostAuthRedirect('/weddings/create'), '/weddings/create');
      assert.equal(getPostAuthRedirect('/weddings/mine'), '/weddings/mine');
    });

    it('resumes explicit Moments product intent after auth', () => {
      assert.equal(getPostAuthRedirect('/create'), '/create');
      assert.equal(getPostAuthRedirect('/pricing'), '/pricing');
    });

    it('ignores auth loop targets (login/signup) and falls back cleanly', () => {
      assert.equal(getPostAuthRedirect('/login', 0), '/weddings/create');
      assert.equal(getPostAuthRedirect('/signup', 2), DEFAULT_AUTH_FALLBACK);
    });

    it('falls back to single wedding dashboard when no intent provided and user has 1 wedding', () => {
      assert.equal(getPostAuthRedirect(null, 1, 'w-999'), '/weddings/dashboard/w-999');
    });

    it('falls back to create page when no intent provided and user has 0 weddings', () => {
      assert.equal(getPostAuthRedirect(null, 0), '/weddings/create');
    });

    it('falls back to portfolio view when no intent provided and user has multiple weddings', () => {
      assert.equal(getPostAuthRedirect(null, 3), DEFAULT_AUTH_FALLBACK);
    });
  });

  describe('buildAuthUrl', () => {
    it('constructs login URL with encoded redirect query parameter', () => {
      assert.equal(buildAuthUrl('/weddings/create'), '/login?redirect=%2Fweddings%2Fcreate');
      assert.equal(buildAuthUrl('/create'), '/login?redirect=%2Fcreate');
    });

    it('constructs signup URL with encoded redirect query parameter', () => {
      assert.equal(buildAuthUrl('/weddings/create', true), '/signup?redirect=%2Fweddings%2Fcreate');
      assert.equal(buildAuthUrl('/create', true), '/signup?redirect=%2Fcreate');
    });

    it('sanitizes malicious target URLs when building auth URL', () => {
      assert.equal(
        buildAuthUrl('https://evil.com'),
        `/login?redirect=${encodeURIComponent(DEFAULT_AUTH_FALLBACK)}`
      );
    });
  });

  describe('Entry-Point Routing Table (Exact Specification Verification)', () => {
    it('verifies Nav "Weddings" entry point', () => {
      assert.equal(getEntryPointPath('NAV_WEDDINGS', false), '/weddings');
      assert.equal(getEntryPointPath('NAV_WEDDINGS', true), '/weddings');
    });

    it('verifies Nav "Moments" entry point', () => {
      assert.equal(getEntryPointPath('NAV_MOMENTS', false), '/love-stories');
      assert.equal(getEntryPointPath('NAV_MOMENTS', true), '/love-stories');
    });

    it('verifies Nav "Get Started" Pill entry point', () => {
      assert.equal(getEntryPointPath('NAV_GET_STARTED', false), '/login?redirect=%2Fhub');
      assert.equal(getEntryPointPath('NAV_GET_STARTED', true), '/hub');
    });

    it('verifies Hero CTA (Weddings Slide) entry point', () => {
      assert.equal(getEntryPointPath('HERO_WEDDINGS', false), '/login?redirect=%2Fweddings%2Fcreate');
      assert.equal(getEntryPointPath('HERO_WEDDINGS', true), '/weddings/create');
    });

    it('verifies Hero CTA (Moments Slide) entry point', () => {
      assert.equal(getEntryPointPath('HERO_MOMENTS', false), '/login?redirect=%2Fpricing');
      assert.equal(getEntryPointPath('HERO_MOMENTS', true), '/pricing');
    });

    it('verifies Product Card "Create Now" (Weddings) entry point', () => {
      assert.equal(getEntryPointPath('PRODUCT_CARD_WEDDINGS', false), '/login?redirect=%2Fweddings%2Fcreate');
      assert.equal(getEntryPointPath('PRODUCT_CARD_WEDDINGS', true), '/weddings/create');
    });

    it('verifies Product Card "Create Now" (Moments) entry point', () => {
      assert.equal(getEntryPointPath('PRODUCT_CARD_MOMENTS', false), '/login?redirect=%2Fpricing');
      assert.equal(getEntryPointPath('PRODUCT_CARD_MOMENTS', true), '/pricing');
    });

    it('verifies Final CTA Section "Get Started" entry point', () => {
      assert.equal(getEntryPointPath('FINAL_CTA', false), '/login?redirect=%2Fhub');
      assert.equal(getEntryPointPath('FINAL_CTA', true), '/hub');
    });

    it('ensures every table entry key is mapped in ENTRY_POINT_ROUTING_TABLE', () => {
      const keys: EntryPointKey[] = [
        'NAV_WEDDINGS',
        'NAV_MOMENTS',
        'NAV_GET_STARTED',
        'HERO_WEDDINGS',
        'HERO_MOMENTS',
        'PRODUCT_CARD_WEDDINGS',
        'PRODUCT_CARD_MOMENTS',
        'FINAL_CTA',
      ];

      keys.forEach((key) => {
        assert.ok(ENTRY_POINT_ROUTING_TABLE[key], `Missing entry for key ${key}`);
      });
    });
  });
});
