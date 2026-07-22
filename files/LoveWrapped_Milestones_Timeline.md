# 💖 LoveWrapped — Project Milestones & Timeline

**Type:** Project Plan · v1.0
**Prepared for:** Horode Design Studio
**Date:** July 22, 2026

---

## 1. Timeline Assumptions

- Kickoff date: **Wednesday, July 22, 2026**.
- Single-builder pace (matching Tega's usual solo build pattern across Horode projects), roughly 1 week per major build step.
- Dates below are planning targets, not contractual deadlines — shift the whole plan if kickoff slips.

---

## 2. Milestone Schedule

| # | Milestone | Key Deliverables | Target Window |
|---|---|---|---|
| 1 | Define UX | Flow locked: Create → Preview → Share | Jul 22 – Jul 26, 2026 |
| 2 | Design in Figma | Landing, pricing, create, preview, payment, success, admin screens | Jul 27 – Aug 2, 2026 |
| 3 | Figma → Antigravity | Figma designs converted to working UI | Aug 3 – Aug 5, 2026 |
| 4 | Build Frontend | `/`, `/pricing`, `/create`, `/preview`, `/pay`, `/w/[slug]` pages live | Aug 6 – Aug 12, 2026 |
| 5 | Build Slide Engine | Text-splitting logic + slide rendering complete | Aug 13 – Aug 16, 2026 |
| 6 | Backend Setup | Supabase configured; users & experiences tables live | Aug 17 – Aug 19, 2026 |
| 7 | Payment Integration | Paystack checkout + webhook verification working | Aug 20 – Aug 23, 2026 |
| 8 | Share System | Slug generation + public `/w/[slug]` access | Aug 24 – Aug 25, 2026 |
| 9 | Admin Panel | Dashboard, users, experiences management | Aug 26 – Aug 29, 2026 |
| 10 | Testing | Full flow QA: create → preview → pay → share → view | Aug 30 – Sep 2, 2026 |
| 11 | Deploy | Vercel production deploy + mobile optimization pass | Sep 3 – Sep 4, 2026 |

> **Target launch: Friday, September 4, 2026** — roughly 6 weeks from kickoff.

---

## 3. Milestone Detail

### Milestone 1 — Define UX (Jul 22–26)
- Lock the single core flow: Create → Preview → Share.
- Confirm mandatory plan-selection-first rule is reflected in the flow.
- Sign off on MVP scope (text-only slides, 5-slide cap, no images/voice/video/AI/themes).

### Milestone 2 — Design in Figma (Jul 27–Aug 2)
- Design all core screens: landing, pricing, create, preview slides, payment, success, admin dashboard.
- Include a disabled "Customized — Coming soon" plan card on the pricing screen alongside Free and Paid.
- Design mobile-first, then validate tablet and desktop breakpoints.

### Milestone 3 — Send to Antigravity (Aug 3–5)
- Convert finalized Figma frames into base UI components.

### Milestone 4 — Build Frontend (Aug 6–12)
- Implement all six public routes as Next.js pages.
- Wire up responsive layout and animation groundwork.

### Milestone 5 — Build Slide Engine (Aug 13–16)
- Implement smart text distribution: split, preserve sentence structure, distribute, enforce limits.
- Implement the dynamic Paid-plan slide budget (up to 12 slides shared between up to 5 images and remaining text slides), recalculating the text character limit live as images are added/removed.
- Implement image upload UI and Supabase Storage integration for up to 5 images (Paid plan only).
- Implement overflow handling per tier (upgrade prompt for Free, truncate + warning for Paid, with a nudge to remove an image to free up text room).

### Milestone 6 — Backend (Aug 17–19)
- Stand up Supabase project and schema for `users` and `experiences`.
- Set up Supabase Storage bucket for Paid-plan image uploads, with RLS scoped to the creator's in-progress session.
- Connect frontend create/preview flow to persisted data.

### Milestone 7 — Payment Integration (Aug 20–23)
- Integrate Paystack checkout on the `/pay` page.
- Implement and test the `/api/paystack/webhook` verification handler.
- Confirm `is_paid` and `payment_reference` update correctly on success.

### Milestone 8 — Share System (Aug 24–25)
- Generate unique slugs per experience.
- Confirm public, no-login access at `/w/[slug]`.

### Milestone 9 — Admin Panel (Aug 26–29)
- Build the dashboard metrics view (users, experiences, paid users, revenue).
- Build user list and experience management (view / preview / delete).

### Milestone 10 — Testing (Aug 30–Sep 2)
- Full end-to-end QA across the entire flow on mobile, tablet, and desktop.
- Verify Free (5 text slides) vs Paid (12-slide budget shared with up to 5 images) limits, overflow messaging, and payment edge cases.
- Verify the dynamic text budget recalculates correctly as images are added/removed on the Paid plan.

### Milestone 11 — Deploy (Sep 3–4)
- Production deploy to Vercel.
- Final mobile optimization pass and launch readiness check.

---

## 4. Risks & Buffer

- Payment webhook testing (Milestone 7) is the most likely place for delay — leave slack before Milestone 8 if possible.
- Design sign-off (Milestone 2) is a dependency for every downstream step — avoid re-opening design decisions once Milestone 3 begins.
- No buffer week is currently built in; consider adding 3–5 days before the Sep 4 launch target if scope grows.
