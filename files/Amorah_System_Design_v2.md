# 💗 Amorah — System Design Document

**Type:** Technical Reference · Redesign v2.0
**Date:** September 2026

---

## 1. High-Level Architecture

Amorah runs on a Vite + Bun application (`server.ts` as the backend layer) deployed on Vercel, backed by Supabase (PostgreSQL + Storage) for data and Paystack for payments.

```
[Browser: Creator]                [Browser: Guest]
        |                                  |
        v                                  v
  +---------------------------------------------+
  |     Vite/Bun App (Vercel)                     |
  |  Public: / /wedding /moments                   |
  |  Auth:   /login /signup                        |
  |  Authed: /create /preview /pay hub              |
  |  Guest:  /w/[slug] /w/wedding/[slug]             |
  |  Admin:  /admin/* /admin/demo-content             |
  |  server.ts: API routes, Paystack webhook           |
  +---------------------------------------------+
        |                          |
        v                          v
  +--------------------+    +--------------+
  |  Supabase          |    |  Paystack    |
  |  (Postgres+Storage)|    |  (payments)  |
  +--------------------+    +--------------+
```

**Note on stack accuracy:** earlier planning documents specified Next.js. The actual live codebase uses Vite + Bun. This document reflects the real stack. Any future planning should reference this document, not the original Next.js-based Tech Stack doc.

## 2. Core Components

### 2.1 Frontend (Vite)
Renders all public, authenticated, guest, and admin views, mobile-first throughout.

### 2.2 Unified Auth System
**Status: `OPEN` — this is the central new piece of infrastructure for this redesign.**

Requirements:
- Single account spans both product lines (Moments, Weddings).
- Every "Get Started" surface routes through this system — no exceptions.
- **Intent-resume:** the auth flow must accept a redirect target (e.g. `?redirect=/create?product=weddings&package=paid`) and, on successful login/signup, forward the user directly to that target rather than a generic landing page.
- The one exception is the *generic* "Get Started" nav pill, which has no product intent attached and should resume to a product-choice hub.

**Implementation approach (recommended):** encode intent as a signed, short-lived token or a simple query parameter validated server-side before honoring the redirect (to prevent open-redirect abuse — see Security, Section 6).

### 2.3 Template Rendering Engine
**Status: Implemented. This is the single most important piece of shared infrastructure in the product — multiple past bugs traced directly back to divergence from this principle.**

One rendering function takes `(template_config, experience_data, guest_data)` and produces the final visual card. It is used, unmodified, in exactly three places:
1. Admin template preview (`/admin/templates`)
2. Live guest-facing card (`/w/wedding/[slug]`)
3. RSVP-success download export

**Rule going forward:** any new surface that needs to render an invitation card must call this same function. A second, parallel implementation must never be created — this was the root cause of the admin/invitee rendering-parity bugs encountered during initial build.

### 2.4 Wedding Invitation Preset
A named, reusable 9-field configuration an admin can apply to any newly uploaded template:

1. `invitation_badge` — static, e.g. "OFFICIAL INVITATION"
2. `family_line` — static, e.g. "TOGETHER WITH THEIR FAMILIES"
3. `couple_names` — dynamic, stacked with heart divider
4. `invitee_prefix` — static, e.g. "REQUEST THE PRESENCE OF"
5. `invitee_name` — dynamic, personalized per guest
6. `monogram_seal` — circular seal, initials derived from couple names, reuses the sealed-screen seal component
7. `marriage_date_line` — static prefix + dynamic date (split month/day/year format)
8. `venue` — dynamic, with location-pin icon
9. ~~`footer_note`~~ — **removed** (was causing duplicate rendering; see build history)

Applying the preset pre-fills field type/order/labels; the admin still sets position, size, and color per field to match the specific template's artwork.

### 2.5 Guest Personalization System
`guests` table (see Information Architecture, Section 3.3) — each guest has an unguessable slug, an independent RSVP status, and receives a card identical to every other guest except for their own name in the `invitee_name` field.

### 2.6 Data Layer (Supabase / PostgreSQL)
`users`, `experiences`, `guests`, `templates` tables. RLS scopes: experience reads by slug; guest writes to their own record only; admin tables to authenticated admins; demo-content writes additionally guarded by a record-ID check (see 2.9).

### 2.7 Storage Layer (Supabase Storage)
Holds Moments/wedding photo uploads and template artwork. Uploads use a direct client-to-storage signed-URL flow (not routed through a serverless function body), avoiding payload-size limits. Public-read for guest-facing assets; writes scoped to the owning session.

### 2.8 Payment Layer (Paystack)
Checkout for both product lines' paid tiers (₦980 Moments, ₦7,500 Weddings). Webhook at `/api/paystack/webhook` verifies transactions server-side and updates `is_paid`/`payment_reference`. Checkout amount is always read from a server-side constant, never trusted from client input.

### 2.9 Demo Content System
Two dedicated admin editors (Moments Demo, Wedding Demo), unified under `/admin/demo-content`. Each editor:
- References its target demo record by a named constant (not a duplicated magic string).
- Validates server-side that the record being written to matches that constant, rejecting any other experience ID even if crafted directly.
- Reuses the same upload and rendering components as the rest of the product.

### 2.10 Live Preview Embed Component
A shared, reusable iPhone-17-mockup + live-iframe-embed component, parameterized by a demo URL. Used on the homepage (Moments, Weddings) and `/wedding`. Lazy-loaded, idle-until-tap, sandboxed iframe permissions, static-image fallback on load failure.

### 2.11 Admin Panel
Authenticated routes under `/admin/*`: dashboard metrics, user list, experience list (view/preview/delete only — no general edit, by design), template management, demo content management.

## 3. Primary Flow — Account & Creation

```
Public marketing page (browse, no auth)
        OR
Product-specific CTA (hero slide / product card)
        |
        v
Auth gate (login/signup) — intent captured
        |
        v
   +---------+                    +------------------+
   | Generic |                    | Product-specific  |
   |  entry  |                    |  entry (resume)   |
   +---------+                    +------------------+
        |                                  |
        v                                  v
Product-choice hub                 Package selection for
        |                          that product directly
        v                                  |
Package selection  ---------------------->-+
        |
        v
Build experience → Preview → Pay (if paid tier) → Share link
```

## 4. Payment Flow & Webhook Design

Unchanged from prior implementation:

```
1. Creator on paid tier → builds experience → previews
2. Redirected to /pay
3. Paystack Checkout collects payment
4. Paystack calls POST /api/paystack/webhook
5. Webhook verifies signature/reference
6. On verified success: is_paid = true, payment_reference set
7. Guest link becomes publicly accessible
```

## 5. Non-Functional Considerations

- **Responsiveness:** every screen — including the new hero carousel, About Us, Community, and FAQ sections — must work correctly at mobile, tablet, and desktop breakpoints.
- **Performance:** live preview embeds are lazy-loaded; ambient card animations use `transform`/`opacity` only (GPU-accelerated); minimum-duration loading states hold correctly under variable network conditions.
- **Security:**
  - Guest slugs are unguessable (not sequential).
  - Auth intent-resume redirect targets must be validated server-side to prevent open-redirect vulnerabilities.
  - Demo-content editors enforce their record-scoping server-side, not just in the UI.
  - Paystack checkout amounts are server-side constants, never client-supplied.
  - Signed upload URLs are session-scoped and time-limited.
- **Data integrity:** slug generation guarantees uniqueness across both `experiences` and `guests`.
- **Deployment:** canonical domain is `amorah.xyz` (no `www`), single redirect direction enforced at the DNS/hosting level; Vercel Deployment Protection must remain **disabled** on Production (previously caused a full site outage for anonymous visitors and search crawlers).

## 6. Open Technical Questions

1. Does `tier` need to move from a single `users` field to a per-product structure, given one account can now hold different standings on Moments vs Weddings? (See Information Architecture, Section 3.1.)
2. What signed-in-state UX exists on public marketing pages — does the nav change, and does any session state need to be reflected there?
3. Exact mechanism for intent-resume token (signed query param vs. session-stored redirect target) — needs a decision before auth work begins.
