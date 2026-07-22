# 💖 LoveWrapped — System Design Document

**Type:** Technical Reference · v1.0
**Prepared for:** Horode Design Studio
**Date:** July 22, 2026

---

## 1. High-Level Architecture

LoveWrapped is a single Next.js application deployed on Vercel, backed by Supabase (PostgreSQL) for data and Paystack for payments. There is no separate backend service — Next.js API routes serve as the application's backend layer.

```
  [Browser: Creator]                [Browser: Viewer]
        |                                  |
        v                                  v
  +---------------------------------------------+
  |          Next.js App (Vercel)                 |
  |  Pages: / /pricing /create /preview            |
  |         /pay /w/[slug] /admin/*                 |
  |  API routes: /api/paystack/webhook, etc.         |
  +---------------------------------------------+
        |                          |
        v                          v
  +--------------------+    +--------------+
  |  Supabase          |    |  Paystack    |
  |  (Postgres + Storage)|  |  (payments)  |
  +--------------------+    +--------------+
```

---

## 2. Core Components

### 2.1 Frontend (Next.js)
- Renders all public and admin pages, mobile-first and fully responsive.
- Owns the client-side slide preview/viewer rendering and tap-to-advance interaction.

### 2.2 Slide Engine
- Takes sender name, receiver name, occasion, message, and (Paid plan only) up to 5 uploaded images as input.
- **Free plan:** splits and distributes text across up to 5 slides while preserving sentence structure and enforcing the free-tier character limits.
- **Paid plan:** shares a 12-slide budget between image slides (one per uploaded image, up to 5) and text slides (the remainder), recalculating the text character budget dynamically as images are added/removed. See Section 5 for the detailed algorithm.
- Runs on text entry / edit and on image add/remove in `/create`, and its output populates the preview in `/preview`.

### 2.3 Data Layer (Supabase / PostgreSQL)
- Stores `users` and `experiences` tables (see the Information Architecture document for full schema).
- Row-level security scopes admin-only tables to authenticated admins and scopes experience reads by slug.

### 2.4 Storage Layer (Supabase Storage)
- Stores the up-to-5 images uploaded by Paid-plan creators in a dedicated storage bucket.
- `experiences.slides` references uploaded images by URL rather than embedding binary/base64 data.
- Access to uploaded images is public-read (needed for the no-login `/w/[slug]` viewer) but writes are scoped to the creator's in-progress session.

### 2.5 Payment Layer (Paystack)
- Handles checkout for the Paid plan (flat ₦3,000) and confirms transactions via webhook.

### 2.6 Admin Panel
- Authenticated Next.js routes under `/admin/*` reading aggregate metrics and record lists from Supabase.

---

## 3. Primary Flow — Experience Creation

```
Landing Page
   -> Click "Create Now"
   -> Pricing Page (select plan: Free / Paid)
   -> Create Experience (sender, receiver, occasion, message)
   -> Slide Engine splits + distributes text (per-tier limits enforced)
   -> Preview
   -> Payment (Paid plan only)
   -> Generate Link (slug)
   -> Recipient Views Experience at /w/[slug]
```

---

## 4. Payment Flow & Webhook Design

```
1. Creator selects Paid plan -> creates experience -> previews it
2. Creator clicks "Complete Your Story" -> redirected to /pay
3. Paystack Checkout collects payment
4. On success, Paystack calls POST /api/paystack/webhook
5. Webhook handler verifies the transaction signature/reference
6. On verified success:
     experiences.is_paid = true
     experiences.payment_reference = <reference>
7. Link at /w/[slug] becomes publicly accessible
```

### 4.1 Payment state rules

| State | is_paid | Link status |
|---|---|---|
| Before payment | `false` | Locked — preview only |
| After verified payment | `true` | Active — publicly shareable |

---

## 5. Slide Engine Logic (Detail)

1. Receive raw message text, the creator's tier (free/paid), and — for Paid — the current set of uploaded images (0–5).
2. **Determine slide budget:**
   - Free: fixed 5 slides, all text, ~120 chars/slide & ~500 total.
   - Paid: fixed 12-slide ceiling. `image_slides = min(uploaded_images, 5)`. `text_slides = 12 - image_slides` (floored so at least 1 text slide always remains). Per-slide cap ~200 chars; total text budget = `text_slides × ~200`.
3. Split the message text into candidate chunks, breaking on sentence boundaries where possible.
4. Distribute chunks across the available **text** slides, respecting the per-slide character cap for the tier.
5. For Paid, merge the text-slide array with the image-slide array (one slide object per uploaded image) into a single ordered slide list, using the creator's chosen ordering (default: append images after text, or interleaved if the creator manually reorders in `/create`).
6. If total text content exceeds the available text budget: Free → prompt upgrade; Paid → truncate and show a warning that also suggests removing an image to free up more text room.
7. Persist the resulting array of slide objects (`{ type: "text", content }` or `{ type: "image", url, order }`) to `experiences.slides`.
8. Recompute steps 2–7 live whenever the creator edits the message or adds/removes an image, so the preview always reflects the current budget.

---

## 6. Viewer Rendering Behavior

- Fullscreen, one slide at a time, tap-to-advance navigation.
- Text slides: centered, auto-resizing typography so both short and near-limit messages read well.
- Image slides (Paid plan): fullscreen or contained image display, optimized for mobile load times.
- Fade/slide transition between slides, consistent whether the slide is text or image.
- Progress indicator reflecting current slide position out of the total (up to 5 for Free, up to 12 for Paid).
- No authentication required — access is controlled purely by knowledge of the slug.

---

## 7. Admin System Design

```
Admin Login
   -> Dashboard (Total Users, Total Experiences, Paid Users, Revenue)
   -> Manage Users (list, tier)
   -> Manage Experiences (view, preview, delete)
```

Dashboard metrics are aggregate queries against the `users` and `experiences` tables (e.g. count of experiences where `is_paid = true`, sum of associated payment amounts for revenue).

---

## 8. Non-Functional Considerations

- **Responsiveness:** every screen must work correctly at mobile, tablet, and desktop breakpoints — treated as a launch blocker, not a nice-to-have.
- **Performance:** slide transitions and typography auto-resize must stay smooth on mid-range mobile devices, the primary viewer context. Uploaded images (Paid plan) should be reasonably compressed/optimized on upload so image slides load quickly on mobile networks.
- **Security:** webhook requests must be verified (signature/reference check) before mutating payment state; admin routes must be authenticated.
- **Data integrity:** slug generation must guarantee uniqueness to avoid collisions between experiences.
