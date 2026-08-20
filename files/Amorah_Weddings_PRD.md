# Weddings by Amorah — Product Requirements Document

**Status:** Draft for scoping
**Owner:** Oghenetega Mudiaga
**Parent product:** Amorah (amorah.xyz)

---

## 1. Vision & Positioning

Amorah currently helps individuals turn personal memories into a cinematic, shareable love story for one recipient, using a tap-through slideshow format. **Weddings by Amorah** extends the same emotional core — turning something personal into something beautifully presented — toward a couple's wedding, but via a **different interaction model**: a scene-based cinematic invitation (cover reveal → an opening ritual → a staged reveal moment) that hands off into a clean, practical information/RSVP page. Plus the guest-management tooling (RSVP, guest list, events, registry) couples currently have to piece together across multiple tools (paper invites, WhatsApp broadcasts, spreadsheets).

**Positioning statement:** *Amorah helps you tell one person how you feel. Weddings by Amorah helps you tell everyone you love that you're getting married — with an invitation that feels like an occasion to open, and a dashboard that keeps track of who's coming.*

This is a distinct product surface (own landing page, own pricing, own dashboard, own account/login system) under the same brand umbrella. It is a **new, purpose-built interaction engine** — not a reskin of the existing `StoryViewer` slideshow component — though it can reuse existing infrastructure where genuinely shared (photo upload/compression pipeline, Paystack integration pattern, admin dashboard patterns, Supabase conventions).

### 1.1 Reference & Interaction Model (informed by usewedx.com)

Reviewed usewedx.com directly as the design reference. Its experience has four distinct beats:

1. **Cover Scene** — a full-bleed backdrop with the couple's names in animated script typography, and a "click to open" wax-seal element. Functions as a ceremonial threshold, not a simple "start" button.
2. **Opening Ritual** — clicking the seal triggers a transition animation (a seal/ribbon-splitting effect) that signals "this is being opened," building anticipation before content appears.
3. **Reveal Scene** — a second staged moment (in WedX's case, a tabletop still-life with an envelope and Save-the-Date card), with a "hold for closer view" interaction and icon shortcuts (Gift Registry / RSVP / Gallery).
4. **Information Page** — the experience resolves into a clean, conventional, scrollable page: event details, RSVP form, standard web layout, serif typography, no more cinematic animation.

**Key design constraint:** WedX's visual richness (Scenes 1 and 3 especially) relies on bespoke staged/composited photography per couple, which is not compatible with "customize everything themselves." Amorah's version needs to achieve the same *emotional beats* (ceremonial open → anticipation → reveal → practical info) using **template-driven graphic design** (illustrated frames, animated typography, decorative motifs, seal/ribbon animation built as reusable assets) composed around **the couple's own uploaded photo(s)** — so every couple gets a premium-feeling result without needing custom photography.

---

## 2. Problem Statement

Couples currently juggle:
- A paper or generic digital invitation (impersonal, static)
- A separate RSVP mechanism (WhatsApp replies, phone calls, a Google Form)
- A manual guest list, usually a spreadsheet, prone to errors and out-of-sync data
- Multiple related events (engagement/traditional, white wedding, reception — especially common in Nigerian weddings) each needing separate tracking
- No easy way to share gift/registry details without it feeling transactional

**Goal:** One link, sent to every guest, that is simultaneously a beautiful invitation *and* the single source of truth for RSVP status, guest details, and event logistics — fully self-service for the couple to build and manage.

---

## 3. Users & Personas

| Persona | Description | Core need |
|---|---|---|
| **The Couple (Host)** | Creates an Amorah account, builds the invitation, manages events, tracks guests | Build something beautiful fast, without needing a designer; know who's coming; return anytime to manage guests via login |
| **The Guest** | Receives a link, views the invitation, RSVPs | Understand event details instantly; RSVP in one tap, no account needed |
| **Amorah Admin** (existing role) | Platform operator | Support couples, monitor usage, handle payment issues — same admin patterns already built for the core product |

---

## 4. Goals & Success Metrics

- **Adoption:** # of wedding invitations created per month
- **Completion:** % of started invitations that are finished and shared (funnel health)
- **Guest engagement:** average RSVP response rate per invitation (target: meaningfully higher than typical WhatsApp-broadcast response rates, since one-tap RSVP removes friction)
- **Revenue:** average revenue per wedding invitation (this is a materially higher-value transaction than the ₦2,000 gift-message tier — price accordingly, see §8)
- **Retention/expansion signal:** % of couples who add a second event (traditional + white wedding) — indicates the multi-event feature is pulling its weight

---

## 5. Feature Requirements

### 5.1 Cinematic Invitation — Scene-Based Experience (new engine, distinct from `StoryViewer`)

A guest-facing sequence of four beats, all built as a **new component** purpose-designed for this format:

- **Scene 1 — Cover:** Couple's uploaded photo (or a themed graphic backdrop if no photo provided) composited within a decorative template frame (curtain vignette, floral border, etc. — theme-dependent), with animated gradient/script typography rendering the couple's names. A tappable seal/monogram element with "Tap to Open" prompt.
- **Scene 2 — Opening Ritual:** A short, polished transition animation (seal cracking open, ribbon untying, envelope flap lifting — theme-dependent asset) triggered on tap. Built once per theme as a reusable animated asset (Lottie or CSS/SVG-based — see §12 Technical Notes), not generated per couple.
- **Scene 3 — Reveal:** A second themed graphic composition (an illustrated tabletop/card-stack motif, or similar theme-appropriate moment) presenting a "Save the Date"-style summary card, with icon shortcuts to Gift Registry / RSVP / Gallery, mirroring WedX's pattern.
- **Scene 4 — Information Page:** Resolves into a clean, standard scrollable page — event details (date/time/venue/map), countdown, RSVP form, gallery, registry — matching the practical, non-animated pattern already scoped in §5.2–5.7. This part is straightforward to build and guest-friendly on any device.
- Guests need **no account** to view or RSVP — same open-link philosophy as the core Amorah product.
- Couples pick a **theme** (bundles Scene 1–3 visual treatment + fonts + colors) and fill in their own content (names, photo, event details) — see §7.

### 5.2 RSVP Collection
- Simple RSVP form embedded at the end of the invitation story (same pattern as the existing end-card in `StoryViewer`)
- Fields: attending (yes/no), guest name, number of guests (if plus-ones allowed), dietary requirements (free text or preset options), optional message to the couple
- Per-guest unique links (Phase 2) so the couple knows *who specifically* has viewed/responded, not just an anonymous count

### 5.3 Guest List & Management Dashboard
- New dashboard (separate from, but visually consistent with, the existing admin dashboard) scoped per-wedding, accessible to the couple only
- Table of all guests: name, invited events, RSVP status, plus-one count, dietary notes, last updated
- Manual guest add/edit/delete (for guests added before send, or corrections)
- Search/filter by status (attending / not attending / no response yet)
- Export guest list (CSV) — useful for caterers/venues

### 5.4 Event Details
- Date, time, venue name, address
- Google Maps embed/link
- "Add to Calendar" button (Google/Apple/Outlook — standard `.ics` generation)

### 5.5 Countdown Timer
- Simple live countdown to the (primary) event date, shown on the invitation

### 5.6 Multiple Events
- A single wedding invitation can have 2+ associated events (e.g. Traditional/Engagement, White Wedding, Reception), each with its own date/time/venue
- Guests can be invited to a subset of events (not everyone invited to the traditional ceremony is necessarily invited to the reception, and vice versa)
- RSVP is per-event, per-guest

### 5.7 Gift Registry / Account Details
- Simple section where couple can add bank account details or a registry link/description for cash gifts — framed thoughtfully, not transactionally (borrow tone patterns from existing Amorah copy)

### 5.8 Customization
- **Phase 1 approach:** curated themes (color palette + font pairing bundled together), couple swaps in their own photos/names/text within the theme — not a freeform builder (see §7 for reasoning)
- **Later phase:** more theme options, possibly independent font/color selection within guardrails

---

## 6. Out of Scope (for now)

- Freeform drag-and-drop layout editor
- Seating chart builder (competitors have this; significant scope on its own — revisit post-launch based on demand)
- Physical invitation printing/fulfillment
- Payment collection *for* the wedding itself (e.g. registry checkout) — start with couples simply *displaying* account details, not processing registry payments through Amorah
- SMS/WhatsApp-based RSVP reminders (email-only reminders to start, if reminders are built at all in Phase 1)

---

## 7. Key Product Decision: Customization Approach

"Let users customize everything" is the long-term ambition, but a full freeform editor (fonts, layout, positioning) is a large, slow build and risks shipping something half-finished that produces ugly results in untrained hands — the opposite of what makes Amorah's existing product feel premium.

**Recommendation:** Ship curated, professionally-designed themes first. Each theme bundles a color palette, font pairing, and slide layout — the couple's customization is *content* (their names, photos, story, event details), not *design*. This mirrors how the core Amorah product already works (one polished visual language, personalized content) and ships faster. Expand theme *count* over time based on demand, before ever considering a freeform builder.

---

## 8. Pricing Thought (for discussion, not final)

This is a fundamentally different purchase than the ₦2,000 casual gift tier — it replaces a paper invitation budget *and* a guest-management tool, and has ongoing utility through the RSVP window (weeks/months), not a single moment. Recommend pricing as a distinct package, materially higher than the core gift tier, positioned against what couples currently spend on paper invitations + a separate RSVP tool. Suggest a single package price (not free/paid split like the core product) that includes the invitation + RSVP + guest dashboard together, since splitting these apart would recreate the exact fragmentation problem this product solves.

*(Exact price point is a business decision outside this document's scope — flag for a separate pricing discussion once Phase 1 is built and you can gauge willingness-to-pay from early users.)*

---

## 9. Information Architecture

### 9.1 New Routes (extending the existing path-based router in `src/App.tsx`)

| Route | Purpose | Auth |
|---|---|---|
| `/weddings` | Marketing landing page for the wedding product | Public |
| `/weddings/pricing` | Wedding-specific pricing page | Public |
| `/weddings/signup`, `/weddings/login` | Couple account creation / login | Public |
| `/weddings/create` | Wedding invitation builder flow (theme select → content → events → review) | Logged-in couple account (draft saved to their account, not just session storage) |
| `/w/wedding/:slug` | Public-facing invitation view (guest-facing) — new scene-based component, see §5.1 | Public, no account needed |
| Embedded RSVP step within Scene 4 | RSVP submission | Public |
| `/weddings/dashboard/:weddingId` | Couple's private guest-management dashboard | Logged-in couple account (real email+password authentication, not an access code) |
| `/admin` (existing) | Extend existing admin dashboard with a "Weddings" tab, mirroring the existing Experiences tab pattern | Existing admin auth |

### 9.2 Data Model (new Supabase tables)

**`couple_accounts`** (new — real authenticated accounts, distinct from the admin/sub-admin `admins` table)
```
id (uuid, pk)
email (text, unique)
password_hash (text)  -- bcrypt, same pattern as existing admin auth
full_name (text, nullable)
created_at (timestamptz)
```

**`weddings`**
```
id (uuid, pk)
couple_account_id (uuid, fk -> couple_accounts.id)
slug (text, unique)
couple_name_1 (text)
couple_name_2 (text)
theme_id (text)
cover_photo_url (text, nullable)
love_story_text (text, nullable)  -- shorter than the core product's slide array; this format is scene-based, not multi-slide
music_track (text, nullable)
voice_message_url (text, nullable)
registry_details (text, nullable)
tier (text)  -- package selected
is_paid (boolean)
payment_reference (text, nullable)
created_at (timestamptz)
```

**`wedding_events`**
```
id (uuid, pk)
wedding_id (uuid, fk -> weddings.id)
name (text)  -- e.g. "Traditional Wedding", "White Wedding", "Reception"
event_date (timestamptz)
venue_name (text)
venue_address (text)
maps_url (text, nullable)
created_at (timestamptz)
```

**`wedding_guests`**
```
id (uuid, pk)
wedding_id (uuid, fk -> weddings.id)
name (text)
unique_link_token (text, unique)  -- for per-guest tracking, Phase 2
email (text, nullable)
plus_one_allowed (boolean)
dietary_notes (text, nullable)
added_by (text)  -- 'couple' | 'self' (self-added via general link, if allowed)
created_at (timestamptz)
```

**`wedding_rsvps`**
```
id (uuid, pk)
wedding_id (uuid, fk)
event_id (uuid, fk -> wedding_events.id)
guest_id (uuid, fk -> wedding_guests.id, nullable)  -- nullable if RSVP came from general link, not a pre-added guest
guest_name (text)  -- captured even if guest_id is null
attending (boolean)
guest_count (integer)
dietary_notes (text, nullable)
message_to_couple (text, nullable)
submitted_at (timestamptz)
```

### 9.3 Navigation Flow (guest-facing)

```
Guest receives link
   → /w/wedding/:slug (or personalized /w/wedding/:slug?g=token for tracked guests)
   → Views cinematic invitation (existing StoryViewer, wedding slide types)
   → Reaches Event Details slide(s) — sees date/venue/countdown/add-to-calendar
   → Reaches RSVP end-card
   → Submits attendance per invited event
   → Confirmation screen (thank you + calendar add prompt if not already done)
```

### 9.4 Navigation Flow (couple-facing)

```
/weddings → learn about product → /weddings/signup (or /weddings/login if returning)
   → /weddings/create
   → Step 1: Choose theme
   → Step 2: Enter couple names, love story text, cover photo, music, voice message
   → Step 3: Add event(s) — date, time, venue
   → Step 4: Registry/account details (optional)
   → Step 5: Review + Pay
   → Receive shareable invitation link (dashboard access is simply logging back into their account)
   → /weddings/dashboard/:weddingId (ongoing access via login)
      → Guest list tab (add/import/edit guests)
      → RSVP tracking tab (who's responded, filter by status)
      → Events tab (edit event details post-creation)
      → Settings (theme swap if allowed, registry edit)
```

---

## 10. Milestones

See the companion document **`Amorah_Weddings_Milestones.md`** for the full phased build plan, task breakdown, and technical checklist.

---

## 11. Open Questions for Discussion

1. ~~Dashboard auth model~~ — **Resolved:** real email+password account system for couples (`couple_accounts` table), not an access code. Reuses the existing bcrypt-hashing pattern already proven in the admin auth system.
2. **Guest self-RSVP without a pre-added guest record:** should the general invitation link allow *anyone* with the link to RSVP (simpler, less controlled), or only guests explicitly added by the couple beforehand (more controlled, requires the couple to build their guest list before sharing)? This materially affects the Phase 1 vs Phase 2 split above.
3. **Pricing model:** single flat package vs tiered (e.g. basic invitation vs invitation+dashboard+multi-event) — needs a business decision before Phase 1 payment integration is finalized.
4. **Theme design & production:** the Scene 1–3 experience depends on well-produced animated/graphic theme assets (frames, typography treatments, seal/ribbon opening animation, reveal-scene illustration). Who is producing these — an existing designer relationship, a contracted motion designer, or should Phase 1 ship with one simpler, in-house-buildable theme first (e.g. elegant CSS/SVG animation, no Lottie dependency) before investing in more elaborate themes? See §12 for technical framing of this tradeoff.
5. **Love story format:** the core Amorah product's multi-slide story format doesn't map directly onto the Scene 1–4 structure — confirm whether the wedding invitation needs a "love story" section at all in Phase 1, or whether Scene 4's info page is sufficient without it (simpler build) and a story section is a Phase 3+ addition.

---

## 12. Technical Notes — Building the Scene-Based Experience

- **Animation approach:** the Scene 1–3 sequence is best built with a proper animation library rather than ad-hoc CSS, since it involves coordinated multi-element transitions (typography reveal, seal tap-response, scene crossfade). Recommend **Framer Motion** (React-native, works cleanly with the existing Vite/React stack) for scene transitions and element animation, and consider **Lottie** (via `lottie-react`) specifically for the seal/ribbon "opening ritual" asset if a motion designer produces it in After Effects — Lottie files are lightweight, themeable via color overrides, and render consistently across devices.
- **Fallback for lower-end devices/slow connections:** Scene 1–3 should degrade gracefully — e.g. a simpler crossfade if the full animation asset fails to load, so guests on weak connections aren't blocked from reaching the actual invitation info.
- **This is a new component**, e.g. `src/components/WeddingInvitationViewer.tsx`, not an extension of `StoryViewer.tsx` — attempting to force the scene-based model into the existing slideshow component would fight its architecture (segmented progress bar, tap-to-advance slides) rather than benefit from it. Shared utilities (image compression, upload handling, audio playback patterns) can still be extracted/reused where genuinely common.
- **Theme system:** structure each theme as a config object (colors, fonts, asset URLs for frame/seal/reveal-scene graphics) rather than hardcoding per-theme JSX, so adding Theme #4, #5, etc. later is a content addition, not a code change.

---

*This document is intended as a working scope reference — treat Phase 1 as the actionable near-term target, and Phases 2–4 as directional rather than committed.*
