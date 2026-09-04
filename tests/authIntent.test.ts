import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRedirectTarget,
  getPostAuthRedirect,
  buildAuthUrl,
  DEFAULT_AUTH_FALLBACK,
} from '../src/lib/authIntent.js';

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
});
