# 💖 LoveWrapped — Information Architecture Document

**Type:** Architecture Reference · v1.0
**Prepared for:** Horode Design Studio
**Date:** July 22, 2026

---

## 1. Site Map

### 1.1 Public routes

| Route | Purpose |
|---|---|
| `/` | Landing page — hero, how-it-works, pricing preview. |
| `/pricing` | Plan selection (Free vs Paid) — mandatory before creation. Also displays a disabled "Customized — Coming soon" card (contact-us plan, not yet buildable). |
| `/create` | Experience creation form (sender, receiver, occasion, message). |
| `/preview` | Preview of the generated slide story before payment/sharing. |
| `/pay` | Paystack checkout for the Paid plan. |
| `/w/[slug]` | Public viewer — the recipient-facing slide experience. |

### 1.2 Admin routes

| Route | Purpose |
|---|---|
| `/admin` | Admin login. |
| `/admin/dashboard` | Metrics: total users, total experiences, paid users, revenue. |
| `/admin/users` | User list with tier (free / paid). |
| `/admin/experiences` | Experience list — view, preview, delete. |

---

## 2. Navigation Structure

Public navigation is intentionally linear and funnel-shaped rather than a free-roaming menu, since the product's job is to move a Creator through one specific path:

1. `/` (Landing) → `/pricing`
2. `/pricing` → `/create`
3. `/create` → `/preview`
4. `/preview` → `/pay` (Paid plan only)
5. `/pay` → `/w/[slug]` (generated link, shared externally)

The admin area is a separate, gated section (`/admin/*`) not linked from the public navigation.

---

## 3. Database Schema

### 3.1 `users`

| Field | Type | Notes |
|---|---|---|
| id | UUID / PK | Primary key. |
| email | string (optional) | Not required to view an experience; used for creator records. |
| tier | enum | `free` \| `paid`. |
| created_at | timestamp | Record creation time. |

### 3.2 `experiences`

| Field | Type | Notes |
|---|---|---|
| id | UUID / PK | Primary key. |
| slug | string, unique | Used to build the public `/w/[slug]` URL. |
| sender_name | string | Creator-provided. |
| receiver_name | string | Creator-provided. |
| occasion | string | Creator-provided. |
| slides | JSON | Array of generated slides — text and/or image objects. Up to 5 for Free (text only); up to 12 for Paid (text + up to 5 images, see Section 4). |
| tier | enum | `free` \| `paid` — locked in at creation time. |
| image_count | integer | Number of image slides in use (0–5). Paid plan only; always 0 for Free. Kept as a denormalized field so the text-slide budget can be recalculated without re-parsing the `slides` JSON. |
| is_paid | boolean | Set true once Paystack confirms payment. |
| payment_reference | string | Paystack transaction reference. |
| created_at | timestamp | Record creation time. |

---

## 4. Slide Data Structure

Each experience stores its slides as a simple JSON array, with one object per slide:

```json
[
  { "type": "text", "content": "Slide 1...", "order": 1 },
  { "type": "image", "url": "https://.../storage/v1/object/public/experience-images/xyz.jpg", "order": 2 },
  { "type": "text", "content": "Slide 3...", "order": 3 }
]
```

- **Free plan:** only `"type": "text"` objects are used, max 5 in the array.
- **Paid plan:** the array can mix `"text"` and `"image"` objects, max 12 total, with at most 5 `"image"` objects. Image objects store a URL into Supabase Storage rather than embedding the file. The `order` field controls slide sequence, so a creator can interleave images and text freely.
- Voice and video slide types remain out of scope for this MVP but the `type` field is intentionally left open so they can be added post-MVP without a schema migration.

---

## 5. Content Model

### 5.1 Inputs (Creator-provided)
- Sender name
- Receiver name
- Occasion
- Message (main text)

### 5.2 Output
The four inputs above (plus, on the Paid plan, up to 5 uploaded images) are transformed by the slide engine into an array of auto-generated slides — up to 5 text slides (Free) or up to 12 mixed text/image slides (Paid) — stored in the `slides` JSON field of the `experiences` record.

---

## 6. Access Model

| Route group | Auth required? | Notes |
|---|---|---|
| Public marketing (`/`, `/pricing`) | No | Fully open. |
| Creation flow (`/create`, `/preview`, `/pay`) | No login, session-based | Tied to the in-progress experience, not a user account. |
| Viewer (`/w/[slug]`) | No | Open to anyone with the link. |
| Admin (`/admin/*`) | Yes | Gated behind admin authentication. |
