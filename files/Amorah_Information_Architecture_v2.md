# 💗 Amorah — Information Architecture Document

**Type:** Architecture Reference · Redesign v2.0
**Date:** September 2026

---

## 1. Site Map

### 1.1 Public routes (no auth required)

| Route | Purpose |
|---|---|
| `/` | Homepage — hero carousel, About Us, product cards, community, reviews, FAQ, final CTA |
| `/wedding` | Weddings marketing page — features, how-it-works, FAQ, live demo preview |
| `/moments` | Moments marketing page — equivalent structure to `/wedding` (`OPEN`: confirm parity build) |
| `/pricing` | Standalone pricing page, if one still exists alongside per-product pricing (`OPEN` — see PRD Section 13) |
| `/blog` | Blog/content pages, if planned (`OPEN` — dependent on footer decision) |
| `/sitemap.xml`, `/robots.txt` | SEO files |

### 1.2 Auth routes

| Route | Purpose |
|---|---|
| `/login` | Sign in |
| `/signup` | Sign up |

Both must support **intent-resume**: if the user arrived here via a product-specific CTA, a redirect target (query param, session token, or similar) must carry that intent through to the correct post-auth destination.

### 1.3 Authenticated routes

| Route | Purpose |
|---|---|
| `/start` or `/hub` (`OPEN`: exact naming) | Product-choice hub — reached from the generic "Get Started" nav pill after auth |
| `/create` (Moments) | Moments creation flow |
| `/create` (Weddings) | Weddings creation flow — package selection, experience builder, guest list |
| `/preview` | Preview before payment/sharing |
| `/pay` | Paystack checkout |

### 1.4 Guest-facing routes (public, unguessable slug, no login)

| Route | Purpose |
|---|---|
| `/w/[slug]` | Moments viewer |
| `/w/wedding/[slug]` | Wedding sealed screen → full-bleed photo screen → detail/RSVP/download flow |

### 1.5 Admin routes (gated, admin auth required)

| Route | Purpose |
|---|---|
| `/admin` | Admin login |
| `/admin/dashboard` | Metrics: total users, experiences, paid users, revenue |
| `/admin/users` | User list with tier |
| `/admin/experiences` | Experience list — view, preview, delete (real users; edit is explicitly **not** available here — see Section 4) |
| `/admin/templates` | Template upload + text-field config, including the Wedding Invitation Preset |
| `/admin/demo-content` | Unified demo editor — Moments Demo and Wedding Demo sub-sections, guarded to demo records only |

## 2. Navigation Structure

Public nav is: **Weddings · Moments · Blog · Our Community · Get Started**

Entry-point routing logic is fully specified in the PRD, Section 4. Summary for reference:

```
Nav "Weddings"/"Moments"  →  public marketing page (no auth)
Nav "Get Started" pill    →  auth  →  product-choice hub
Hero slide CTA            →  auth  →  that product's package step (intent-resume)
Product card "Create Now" →  auth  →  that product's package step (intent-resume)
Final section CTA         →  auth  →  product-choice hub
```

The admin area (`/admin/*`) is a separate, gated section, not linked from public nav.

## 3. Database Schema

### 3.1 `users`
| Field | Type | Notes |
|---|---|---|
| id | UUID / PK | |
| email | string | Required now under unified account model (`OPEN`: confirm — previously optional) |
| tier | enum | free \| paid — likely needs to become per-product now (`OPEN`: a user could be paid on Moments and free on Weddings) |
| created_at | timestamp | |

**Open schema question:** under the unified account model, does `tier` need to move from `users` to a per-product junction (e.g. a `user_products` table tracking tier independently per product line), since one account can now hold different standings on Moments vs Weddings? Flagging for System Design review.

### 3.2 `experiences`
Unchanged from prior spec — see System Design for full detail. Key fields: `id`, `slug`, `sender_name`, `receiver_name`, `occasion`, `slides` (JSON), `tier`, `image_count`, `is_paid`, `payment_reference`, `created_at`, plus wedding-specific fields (`registry_url`, event schedule) and a `template_id` reference into `templates`.

### 3.3 `guests`
| Field | Type | Notes |
|---|---|---|
| id | UUID / PK | |
| experience_id | FK → experiences | |
| name | string | |
| slug | string, unique, unguessable | Individual guest link |
| rsvp_status | enum | attending \| declining \| pending |
| rsvp_message | string, nullable | |
| viewed_at | timestamp, nullable | |
| created_at | timestamp | |

### 3.4 `templates`
| Field | Type | Notes |
|---|---|---|
| id | UUID / PK | |
| name | string | Admin-facing label |
| image_url | string | Template artwork in Supabase Storage |
| orientation, width, height | — | Preserve native export dimensions |
| text_fields | JSON | Array of field configs (position, size, color, type) |
| is_active | boolean | |
| created_at | timestamp | |

### 3.5 Community signup (`OPEN` — not yet built)
If "Our Community" includes a newsletter capture, a `community_signups` table (email, source, created_at) would be needed. If it's purely external (Discord/Instagram links), no new table is required.

## 4. Access Model

| Route group | Auth required? | Notes |
|---|---|---|
| Public marketing (`/`, `/wedding`, `/moments`) | No | Fully open, browsable while logged in or out |
| Auth (`/login`, `/signup`) | N/A | Must support intent-resume via redirect target |
| Authenticated hub, creation flow | Yes | Session-based, unified across both products |
| Guest/viewer (`/w/[slug]`, `/w/wedding/[slug]`) | No | Open to anyone with the unguessable link |
| Admin (`/admin/*`) | Yes (admin role) | Gated behind admin authentication |
| Demo Content editor (`/admin/demo-content`) | Yes (admin role) + record-level guardrail | Server-side check restricts writes to the two demo records only, regardless of admin authentication |

## 5. Slide / Template Data Structure

Unchanged from the existing implementation — see System Design, Section 4, for the full rendering engine spec and the 9-field Wedding Invitation Preset structure.
