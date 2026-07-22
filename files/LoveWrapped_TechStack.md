# 💖 LoveWrapped — Tech Stack Document

**Type:** Technical Reference · v1.0
**Prepared for:** Horode Design Studio
**Date:** July 22, 2026

---

## 1. Stack Summary

| Layer | Choice |
|---|---|
| Frontend framework | Next.js |
| Backend / Database | Supabase (PostgreSQL) |
| Hosting / Deployment | Vercel |
| Payments | Paystack |
| Design → build handoff | Figma → Antigravity |

This stack mirrors Tega's existing Horode build patterns (Next.js, Vercel), which keeps LoveWrapped consistent with his other projects — EventFlyer and the Flyer Generator codebase — while swapping MongoDB for Supabase/PostgreSQL to get relational data plus built-in auth and row-level security for the admin panel.

---

## 2. Frontend — Next.js

- Framework for all customer-facing and admin routes: `/`, `/pricing`, `/create`, `/preview`, `/pay`, `/w/[slug]`, and the `/admin/*` pages.
- Server-side rendering / static generation for the landing and demo pages for fast first paint on mobile.
- Client-side interactivity for the slide creation form, live preview, and the tap-to-advance viewer.
- Mobile-first responsive layout as the primary design constraint across every page.

---

## 3. Backend & Database — Supabase / PostgreSQL

- Supabase provides the Postgres database, auto-generated APIs, authentication scaffolding for the admin role, and **Storage** for Paid-plan image uploads.
- Two core tables: `users` and `experiences` (see the Information Architecture document for the full schema).
- Slide content is stored as JSON inside the `experiences` table rather than a separate table, since each experience owns a small, tier-bounded set of slides (max 5 for Free, max 12 for Paid).
- **Supabase Storage** holds the actual image files for Paid-plan experiences (up to 5 per experience); the `slides` JSON stores only the public URL, keeping the Postgres row small.
- Row-level security should restrict experience reads to the owning session/slug, restrict image bucket writes to the creator's in-progress session, and restrict admin tables to authenticated admin users only.

---

## 4. Hosting & Deployment — Vercel

- Vercel hosts the Next.js app, matching the deployment pattern already used across Tega's other Horode projects.
- Environment variables hold the Supabase URL/keys and the Paystack secret/public keys.
- Preview deployments per branch support testing the create → preview → pay flow before merging to production.

---

## 5. Payments — Paystack

Paystack was chosen specifically for the Nigerian market:

- Best-fit provider for Nigerian payments.
- Supports cards, bank transfers, and USSD — covering the payment methods Nigerian users actually use.
- Straightforward SDK integration and a fast checkout experience, which matters for an impulse/emotional-gift purchase.

Integration touchpoints:

- Checkout initiated from the Payment page after the user has already previewed their experience.
- Webhook endpoint at `/api/paystack/webhook` verifies each transaction server-side and updates `is_paid` and `payment_reference` on the experience record.

---

## 6. Design Workflow — Figma → Antigravity

- All screens (landing, pricing, create, preview, payment, success, admin dashboard) are designed in Figma first.
- Figma designs are converted into UI via Antigravity, then wired up as real Next.js pages and components.

---

## 7. Why This Stack Fits the MVP

- **Next.js + Vercel:** fastest path to a responsive, production-ready web app with minimal DevOps overhead.
- **Supabase:** relational schema fits the two-table data model cleanly, and ships auth/RLS out of the box for the admin panel without a separate auth service.
- **Paystack:** the standard, trusted payment rail for a Nigerian-facing consumer product.
- The full stack can be built and deployed by a small team without introducing extra infrastructure to manage.
- The Customized plan needs no backend work for this MVP — it's a static, disabled "Coming soon" card on the Pricing page with no checkout, storage, or database implications until it's scoped later.
