# 💗 Amorah — Product Requirements Document

**Type:** PRD · Redesign v2.0
**Product:** Amorah (formerly LoveWrapped)
**Date:** September 2026
**Status:** Living document — several items below are marked `OPEN` and still need decisions before build.

---

## 1. Product Overview

Amorah is a mobile-first platform for creating interactive, shareable digital experiences for meaningful life moments. It has two product lines under one account system:

- **Amorah Moments** — personalized, animated multi-slide digital cards for anniversaries, birthdays, proposals, and "just because" surprises.
- **Weddings by Amorah** — cinematic digital wedding invitations with multi-event schedules, guest personalization, RSVP tracking, and real-time dashboards.

Both are no-login-required for the *recipient* — a guest opens a shared link and taps through the experience without creating an account. The *creator* now operates under a single, unified Amorah account that spans both product lines.

## 2. Goals & Product Principles

- **One account, two products** — a creator shouldn't have to think of Moments and Weddings as separate services.
- **Emotion over features** — every decision serves the emotional impact of the experience.
- **Fast creation** — idea to shareable link in minutes.
- **Mobile-first** — primary usage context is a phone, for both creator and recipient.
- **Consistent voice** — one tone across the whole site. (See Style Guide for the specific voice direction and the inconsistency this redesign corrects.)

## 3. User Roles

### 3.1 Creator (primary user)
Holds one Amorah account, usable across both Moments and Weddings. Selects a product and package, builds the experience, previews it, pays (if on a paid tier), and shares the resulting link. For Weddings, can also build a guest list for per-guest personalization.

### 3.2 Guest / Viewer (recipient)
Opens a shared link — no account or login required. Taps through the experience on any device. For Weddings, may RSVP, view the gift registry, browse the gallery, and download a personalized invitation card.

### 3.3 Admin
Manages users, experiences, templates, demo content, and platform metrics via the admin dashboard.

## 4. Account Model — Unified, Zoho-Style

**Status: `OPEN` — architecture agreed, implementation not yet built.**

This is the core structural change in this redesign. Previously, product access was fragmented; now there is one account gate for the entire platform.

**Rules:**
1. **Every "Get Started"-style call to action leads to sign-in/sign-up, with no exceptions.** There is no path to product creation that bypasses authentication.
2. **Intent survives authentication.** If a visitor clicks a product-specific entry point (e.g. the Weddings product card, or the Weddings slide's CTA in the hero carousel) while signed out, completing sign-up drops them directly into that product's package-selection step — not a generic hub. This is a deep-link-style resume, not a restart.
3. **The one generic entry point** — the nav bar's standalone "Get Started" pill (not tied to a specific product) — leads to sign-in/sign-up, and afterward lands the user in a **product-choice hub**, where they pick Moments or Weddings and proceed.
4. **Marketing pages remain public.** Nav links for "Weddings" and "Moments" go to browsable marketing pages (no auth required), consistent with today's `/wedding`. Being signed in does not gate these pages — a logged-in visitor can still browse them, ideally with some account-aware continuity (see Open Items).

**Entry-point behavior table:**

| Entry point | Destination (signed out) | Destination (signed in) |
|---|---|---|
| Nav "Weddings" | `/wedding` marketing page, no auth | Same marketing page |
| Nav "Moments" | `/moments` marketing page, no auth | Same marketing page |
| Nav "Get Started" pill (generic) | Auth → product-choice hub | Product-choice hub directly |
| Hero carousel CTA (Weddings slide) | Auth → Weddings package step | Weddings package step directly |
| Hero carousel CTA (Moments slide) | Auth → Moments package step | Moments package step directly |
| Product card "Create Now" (Weddings) | Auth → Weddings package step | Weddings package step directly |
| Product card "Create Now" (Moments) | Auth → Moments package step | Moments package step directly |
| Final CTA section "Get Started" | Auth → product-choice hub | Product-choice hub directly |

**Open item:** exact UX for a signed-in visitor browsing a public marketing page (e.g. does the nav change to show "My Experiences" instead of "Get Started"? Is there a persistent account menu?). Not yet decided.

## 5. Product Lines & Pricing

### 5.1 Amorah Moments

| Attribute | Free | Paid |
|---|---|---|
| Price | ₦0 | ₦980 |
| Slides | Max 5 | Higher cap (per existing product spec) |
| Content | Text only | Text + photos/voice per existing spec |
| Watermark | Included | None |

### 5.2 Weddings by Amorah

| Attribute | Free | Paid |
|---|---|---|
| Price | ₦0 | ₦7,500 |
| Slides | Max 5 (text) | Max 12 (text + up to 5 images) |
| Guest personalization | — | Per-guest names, unique links |
| RSVP tracking | — | Real-time, per-guest |
| Gift registry | — | Optional URL field |

**Note:** Pricing was updated from ₦2,000 → ₦980 (Moments) and ₦10,000 → ₦7,500 (Weddings) as of this redesign cycle. Historical transactions at old prices are unaffected.

## 6. Homepage / Landing Page Structure

This redesign replaces the previous fragmented/duplicated homepage with the following section order:

1. **Nav** — Logo, "Weddings," "Moments," "Blog," "Our Community," "Get Started" pill.
2. **Hero** — Carousel, two slides: Weddings first, Moments second. Each slide's CTA behaves per the entry-point table above (Section 4).
3. **About Us** — Company mission/story. `OPEN`: actual copy not yet written; must not duplicate RSVP feature copy (see Style Guide, Section 6, for the bug this corrects).
4. **Explore Our Products** — Two cards (Moments, Weddings), each with a short description, 3 feature bullets, and a "Create Now" CTA. Minimal per-card icon only (envelope-heart, rings) — no decorative icon sets.
5. **Our Community** — A genuine, joinable community (Discord, Instagram, and/or newsletter — `OPEN`: specific channel(s) not yet chosen), not a decorative section with no real action behind it.
6. **Reviews** — Testimonial cards, real content pending (currently placeholder, clearly marked for replacement).
7. **FAQ** — Accordion, covering both product lines, real distinct Q&A (not the placeholder-repeated question seen in the design mock).
8. **Final CTA** — Reiterates the product; CTA reads "Get Started" (not "Check Our Availability" — that language implied a boutique/booking-slot business model, which doesn't match Amorah's self-serve product).
9. **Footer** — `OPEN`: links currently reference "Portfolio" and "Journal," which don't correspond to real pages. Needs to link to actual site sections (Weddings, Moments, Pricing, FAQ) unless a Blog/Journal is genuinely planned.

## 7. Wedding Invitation Template System

**Status: Implemented (admin-managed, config-driven).**

- Admin uploads a template image and defines text field positions/colors/sizes via `/admin/templates`.
- A reusable **Wedding Invitation Preset** (9 fields: invitation badge, family line, couple names, invitee prefix, invitee name, monogram seal, marriage date line, venue, footer note — see System Design for full spec) can be applied to any new template in one action.
- Per-guest personalization: each invitee gets a unique link showing their own name on an otherwise identical card.
- A single shared rendering engine guarantees parity across the admin preview, the live guest-facing card, and the RSVP-success download.

## 8. Demo Content Management

**Status: Implemented, scoped intentionally narrow.**

- Admin can edit the seeded demo experiences for both Moments and Weddings from a unified "Demo Content" area in the admin dashboard.
- This capability is **restricted to the two demo records only**, enforced server-side — it does not extend to real users' experiences.
- Edits to demo content automatically propagate to the live iPhone-mockup preview embeds on the homepage and `/wedding` page, since those embeds render the real demo experiences live.

## 9. Live Product Previews

**Status: Implemented.**

- A shared, reusable iPhone-17-mockup component embeds the real, live demo experience (not a static image or recorded video) on the homepage (Moments and Weddings sections) and on `/wedding`.
- Idle state shows the resting/sealed state; tapping plays the real product flow inside the frame.

## 10. SEO & Discoverability

**Status: Implemented.**

- `sitemap.xml` and `robots.txt` are live at the site root, listing only public marketing pages and excluding private/admin/guest routes.
- Canonical domain is `amorah.xyz` (no `www`); redirect and Vercel Deployment Protection issues that previously blocked Google's crawler have been resolved.

## 11. MVP Scope for This Redesign Phase

**In scope:**
- Unified account/auth model with intent-resume.
- Homepage restructure per Section 6.
- Hero carousel (Weddings, Moments).
- Real, distinct copy for About Us and Our Community (no duplication).
- Functional Our Community destination.
- Updated pricing display (already live in backend).

**Out of scope (this phase):**
- Any new product features beyond what's already specified in the existing Moments/Weddings product specs.
- Redesign of the in-product creation flow (`/create`, `/preview`, admin panel internals) — this phase is landing/marketing site + account architecture only.

## 12. Critical Product Notes

- Every "Get Started" surface must route through authentication — no silent exceptions.
- Intent must survive the auth step — this is a hard product requirement, not a nice-to-have, since it's the difference between a smooth funnel and a frustrating restart.
- Voice must stay consistent site-wide — no mixing of SaaS-product tone and boutique-service tone (see Style Guide).
- No unnecessary decorative icons anywhere in this redesign.
- No em dashes in any user-facing copy.

## 13. Open Items (Tracked, Not Yet Resolved)

1. About Us — actual mission/story copy.
2. Our Community — which specific channel(s): Discord, Instagram, newsletter, or a combination.
3. Footer — real link targets to replace "Portfolio"/"Journal."
4. Pricing — confirm it stays embedded in each product's marketing page rather than becoming a standalone nav item.
5. Signed-in visitor experience on public marketing pages — does the nav/account state change?
