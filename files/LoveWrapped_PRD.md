# 💖 LoveWrapped — Product Requirements Document

**Type:** PRD · MVP v1.0
**Prepared for:** Horode Design Studio
**Prepared by:** Claude, for Oghenetega Mudiaga
**Date:** July 22, 2026

---

## 1. Product Overview

LoveWrapped is a mobile-first, responsive web application that lets users create beautiful, animated, story-style card experiences to celebrate meaningful life moments — relationship and marriage anniversaries, birthdays, romantic surprises, and "just because" appreciation moments.

> **Core idea:** instead of a plain text message or a static card, users create an animated, Instagram-Stories-style slide experience that recipients tap through — no login required.

---

## 2. Goals & Product Principles

- **Emotion over features** — every decision should serve the emotional impact of the experience.
- **Simplicity wins** — the creation flow must stay fast and frictionless.
- **Fast creation** — a user should go from idea to shareable link in minutes.
- **Mobile-first** — the primary usage context is a phone, for both creator and viewer.

---

## 3. User Roles

### 3.1 Creator (primary user)
- Selects a plan first, before creating an experience.
- Builds the experience (sender, receiver, occasion, message, and — on the Paid plan — up to 5 images).
- Previews the generated slides.
- Pays (if on the paid plan) and shares the resulting link.

### 3.2 Viewer (recipient)
- Opens the shared link — no account or login required.
- Taps through the animated slides on any device.

### 3.3 Admin
- Manages users and their tier (free / paid).
- Manages experiences — view, preview, delete.
- Tracks payments and platform revenue.

---

## 4. Pricing Model

Plan selection is mandatory and must happen **before** an experience is created — this is a critical, non-negotiable product rule.

| Attribute | Free Plan | Paid Plan | Customized Plan |
|---|---|---|---|
| Price | ₦0 | ₦3,000 | Contact us |
| Slides | Max 5 | Max 12 | — |
| Content type | Text only | Text + up to 5 images | — |
| Characters per slide | ~120 | ~200 | — |
| Total characters | ~500 (5 slides × ~120) | Scales with available text slides — up to ~2,400 (12 slides × ~200) if no images are used | — |
| Images | Not available | Up to 5 image uploads, each occupying one slide | — |
| Watermark | Included | None | — |
| Availability | Live | Live | **Coming soon** — not part of MVP |

> **Note on the Customized plan:** for MVP, this is a "Coming soon" card on the Pricing page only — a disabled/greyed-out option with a short description and no live checkout flow. It is not part of the buildable scope for this release (see Section 12).

---

## 5. Core User Flow

1. Land on the homepage.
2. Click "Create Now."
3. Land on the Pricing page and select a plan.
4. Build the experience (sender, receiver, occasion, message).
5. Preview the generated slide story.
6. If on the Paid plan, complete payment via Paystack.
7. Receive the generated shareable link.
8. Recipient opens the link and views the experience.

---

## 6. Landing Page Requirements

### 6.1 Hero Section
- An emotional headline and supporting subtext.
- Primary CTA (bold): **"Create Now"** → routes to `/pricing`.
- Secondary CTA: **"See Example"** → routes to `/w/demo`.

### 6.2 How It Works Section
1. Choose a plan
2. Create your story
3. Share & surprise them

### 6.3 Pricing Section
Displayed on the landing page and enforced as a mandatory step of the flow — a user cannot reach the creation tool without first selecting a plan.

---

## 7. Text & Slide Logic

### 7.1 Rules
- **Free plan:** maximum of 5 slides per experience, text only. Each slide holds exactly one text block.
- **Paid plan:** maximum of 12 slides per experience, shared between text and image slides. Each slide holds exactly one text block **or** one image, never both.
- **Paid plan images:** up to 5 images may be uploaded. Each uploaded image consumes one of the 12 available slide slots.

### 7.2 Slide Budget Logic (Paid Plan)
Because text and images share the same 12-slide budget, the system must compute the available text slides dynamically:

1. `image_slides = number of images the creator uploads` (0–5).
2. `text_slides_available = 12 - image_slides`, with a floor of **1** guaranteed text slide even if 5 images are uploaded (so the experience never has zero words) — meaning the practical image cap is **effectively up to 5**, with `text_slides_available` ranging from 7 (5 images) to 12 (0 images).
3. The per-slide (~200 chars) and total character budget (`text_slides_available × ~200`) are recalculated live in `/create` as the creator adds or removes images, so the UI always reflects how much room is left for text.
4. Image and text slides can be freely ordered by the creator (e.g. image, text, image, text…) — order is a display/sequence property on each slide object, not a fixed layout rule.

### 7.3 Smart Text Distribution
When a user enters their message, the system must:
1. Split the text into chunks.
2. Preserve sentence structure while splitting.
3. Distribute the chunks across the available **text** slides for their tier (5 fixed for Free; dynamically computed per Section 7.2 for Paid).
4. Enforce the per-slide and total character limits for the user's tier and current image count.

### 7.4 Overflow Handling

| Plan | Behavior on overflow |
|---|---|
| Free | Prompt the user to upgrade to the Paid plan. |
| Paid | Truncate the text and show a warning. The warning should also suggest removing an image to free up an extra text slide, since the paid limit is directly tied to how many images are in use. |

If the entered text is too long for a beautiful slide, the UI should surface a warm, on-brand message rather than a generic error, e.g. a line to the effect of *"this is too long for a beautiful slide."*

### 7.5 Image Rules (Paid Plan Only)
- Maximum 5 images per experience.
- Recommended: enforce a reasonable per-image file size cap (e.g. 5MB) and accept standard formats (JPEG, PNG, WebP) to keep viewer load times fast on mobile.
- Images are stored in object storage (see the Tech Stack and System Design documents) and referenced by URL in the slide data, not embedded as base64.

---

## 8. Experience (Viewer) Requirements

- Fullscreen slides, tap to advance.
- Smooth fade/slide transitions between slides.
- Centered, auto-resizing typography so long and short messages both look intentional.
- A progress indicator showing position within the story.
- Mobile-first layout that scales cleanly to tablet and desktop.

---

## 9. Content Inputs & Output

### 9.1 Inputs collected from the Creator
- Sender name
- Receiver name
- Occasion
- Message (main text)

### 9.2 Output
- **Free plan:** the system auto-generates up to 5 text slides from the inputs above, respecting the tier's character limits.
- **Paid plan:** the system auto-generates up to 12 slides total — a mix of text slides (from the message) and up to 5 image slides (from creator uploads) — respecting the dynamic character budget described in Section 7.2.

---

## 10. Payment Requirements

- Payment provider: **Paystack** (cards, bank transfers, USSD — the best fit for Nigerian users).
- The experience preview is available before payment; the shareable link stays locked until payment succeeds.
- On successful payment, the system sets `is_paid = true` and activates the link.
- A webhook at `/api/paystack/webhook` verifies each transaction and updates the database.

---

## 11. Admin Requirements

### 11.1 Dashboard metrics
- Total users
- Total experiences
- Paid users
- Revenue

### 11.2 User management
- View the full user list with their tier (free / paid).

### 11.3 Experience management
- View, preview, and delete any experience.

---

## 12. MVP Scope

### 12.1 In scope
- Fully responsive design (mobile, tablet, desktop).
- Mandatory plan selection before creation, including a "Coming soon" placeholder card for the Customized plan.
- Text-only slides for the Free plan (max 5 slides), with slide-limit logic.
- Text + image slides for the Paid plan (max 12 slides total, up to 5 images), with dynamic slide-limit logic.
- Preview flow.
- Paystack payment integration (₦3,000 flat for the Paid plan).
- Shareable public link.
- Admin panel.

### 12.2 Out of scope (MVP)
- A live, buildable Customized plan (contact-us flow, custom pricing/negotiation, fulfillment) — shown only as "Coming soon" on the Pricing page.
- Voice
- Video
- AI-assisted writing
- Selectable visual themes

---

## 13. Critical Product Notes

> Plan selection must always come first, before the create flow. Free = max 5 text-only slides. Paid = max 12 slides shared between text and up to 5 images, with character limits recalculated dynamically as images are added or removed. The Customized plan is contact-us only and shown as "Coming soon" — no live flow in this MVP. Preview is the primary conversion driver. Payment happens strictly after preview, never before.

---

## 14. Summary

LoveWrapped is a text-based, emotional storytelling product: a mobile-first, animated experience, a simple and fast creation tool, and a shareable digital memory that recipients can revisit through a single link.
