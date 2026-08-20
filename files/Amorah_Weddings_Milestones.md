# Weddings by Amorah — Build Milestones

**Companion to:** `Amorah_Weddings_PRD.md`
**Format:** Each phase is independently shippable — Phase 1 alone should be a usable, sellable product before Phase 2 begins.

---

## Phase 0 — Foundations (prerequisite for everything else)

Before any wedding-specific feature work, these shared building blocks need to exist:

- [ ] `couple_accounts` table in Supabase (email, bcrypt password_hash, full_name, created_at)
- [ ] Real signup/login flow: `/weddings/signup`, `/weddings/login`, session auth (reuse the `iron-session` + bcrypt pattern already proven in the core product's admin auth — same libraries, same security posture, new table)
- [ ] `requireCoupleAuth` middleware (parallel to existing `requireAdmin`) gating all couple-dashboard routes
- [ ] `/weddings` marketing landing page (static content, no dynamic data needed yet)
- [ ] Decide & document theme config schema (colors, fonts, asset URLs) — even before the first theme's assets exist, agree the shape so Phase 1 build isn't blocked on design delivery

**Exit criteria:** a couple can create an account and log back in. Nothing wedding-specific works yet — this phase is pure plumbing.

---

## Phase 1 — MVP: One Beautiful Invitation, One Event, Basic RSVP

**Goal:** a couple can sign up, build a scene-based invitation with one theme, add one event, share the link, and see RSVP responses come in.

### Data layer
- [ ] `weddings` table (see PRD §9.2)
- [ ] `wedding_events` table — single event only for Phase 1 (build the schema to support multiple, but UI only exposes one)
- [ ] `wedding_rsvps` table
- [ ] Supabase Storage bucket for wedding cover photos (separate from existing `experience-images`/`voice-messages` buckets, same RLS-locked-down pattern already established for the core product)

### Theme & Scene Engine (the biggest net-new lift)
- [ ] Build **one** theme fully (not three) to prove the engine before multiplying themes — pick the simpler, in-house-buildable direction (CSS/SVG-based animation) unless a motion designer is already engaged for Lottie assets (see PRD §12 open question)
- [ ] New component `WeddingInvitationViewer.tsx` (or similar), built fresh — not extending `StoryViewer.tsx`
- [ ] **Scene 1 (Cover):** couple photo + decorative frame + animated name typography + tap-to-open seal element, built with Framer Motion
- [ ] **Scene 2 (Opening Ritual):** transition animation on tap (seal/ribbon/envelope motion — theme asset #1)
- [ ] **Scene 3 (Reveal):** themed graphic composition + Save-the-Date summary card + icon shortcuts (Gift Registry / RSVP / Gallery)
- [ ] **Scene 4 (Info page):** standard scrollable layout — event details, RSVP form, embedded (no separate route needed)
- [ ] Graceful fallback if animation assets fail to load or on low-end devices (simple crossfade instead of full animation)

### Builder flow (couple-facing)
- [ ] `/weddings/create` — Step 1: theme selection (only 1 theme exists yet, but build the picker UI to scale)
- [ ] Step 2: couple names, cover photo upload (reuse existing image compression pipeline from the core product), optional love-story text, music track selection
- [ ] Step 3: single event — date, time, venue name, address
- [ ] Step 4: registry/account details (optional text field)
- [ ] Step 5: review + Paystack payment (reuse existing Paystack integration pattern — new price point, same verification/webhook logic)
- [ ] On success: generate slug, show shareable link

### Guest-facing
- [ ] `/w/wedding/:slug` renders the full Scene 1–4 experience
- [ ] RSVP submission (attending y/n, name, guest count, dietary notes, message) writes to `wedding_rsvps`

### Dashboard (minimal for Phase 1)
- [ ] `/weddings/dashboard/:weddingId` — simple list of RSVP responses as they arrive (no guest pre-list yet — that's Phase 2)
- [ ] Basic event details edit (fix a typo in venue/date post-creation)

### Admin
- [ ] "Weddings" tab in existing `AdminView.tsx`, mirroring the Experiences tab: list, view non-sensitive metadata, payment status, delete — same privacy pattern already established (admin does not get full guest/RSVP content by default, mirroring the earlier fix that restricted admin access to core-product experience content)

**Exit criteria:** a real couple could use this end-to-end today — pay, get a link, share it, watch RSVPs come in. Ship this before starting Phase 2.

---

## Phase 2 — Guest Management & Multi-Event

**Goal:** couples manage a real guest list proactively, not just react to inbound RSVPs; support Nigerian multi-event wedding structures.

- [ ] `wedding_guests` table + full CRUD in dashboard (add manually, edit, delete)
- [ ] CSV import for guest lists
- [ ] Per-guest unique link tokens (`unique_link_token`) — generate on guest creation, track link opens
- [ ] Multiple events: extend Step 3 of the builder to add 2+ events (Traditional/Engagement, White Wedding, Reception)
- [ ] Per-event guest assignment (which guests are invited to which events)
- [ ] RSVP becomes per-event, per-guest (schema already supports this from Phase 1 — Phase 2 exposes it in the UI)
- [ ] Plus-one handling (allow/disallow per guest, capture plus-one name)
- [ ] CSV export (guest list + RSVP status, useful for caterers/venues)
- [ ] Dashboard: filter/search by RSVP status, per-event breakdown view

**Exit criteria:** a couple with a traditional + white wedding + reception can manage all three from one dashboard, with guests tracked individually.

---

## Phase 3 — Practical Polish

**Goal:** round out the logistics couples actually need day-to-day.

- [ ] Live countdown timer refinement on Scene 4
- [ ] `.ics` "Add to Calendar" generation, per event (Google/Apple/Outlook compatible)
- [ ] Google Maps embed (not just a link) on the event details section
- [ ] Registry section becomes couple-editable post-launch from the dashboard (not just set-once at creation)
- [ ] Evaluate need for email reminders to non-responders, based on real Phase 1–2 usage data — only build if the data supports it

**Exit criteria:** the product covers the full practical logistics loop a couple needs, not just the invitation moment.

---

## Phase 4 — Expanded Customization

**Goal:** grow "customize everything" incrementally, based on real demand rather than upfront speculation.

- [ ] Theme #2, #3 (expand beyond the single Phase 1 theme, informed by what couples actually asked for)
- [ ] Independent font/color selection within design guardrails (not fully freeform)
- [ ] Optional/reorderable info-page sections
- [ ] (Only if clearly demanded) seating chart tool — scope as its own project, not bundled in casually

---

## Cross-Cutting: What NOT to Build Yet

Explicitly deferred, per PRD §6 — resist scope creep into these during Phases 1–3:
- Freeform drag-and-drop layout editor
- Seating chart builder
- Physical invitation printing/fulfillment
- In-platform registry payment processing (display details only, for now)
- SMS/WhatsApp RSVP reminders

---

## Suggested Sequencing Note

Phase 1's theme/scene engine is the highest-risk, highest-effort item in the entire roadmap — it's genuinely new UI/animation work, not a data-model or CRUD task like most of Phases 2–3. Consider building and validating **just Scenes 1–2** (cover + opening ritual) as an early spike before committing to the full builder flow, to de-risk the animation approach (Framer Motion vs Lottie vs simpler CSS) before the rest of Phase 1 is built around it.
