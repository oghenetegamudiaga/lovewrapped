# 💗 Amorah — Style Guide

**Type:** Brand & UX Reference · v2.0
**Date:** September 2026

---

## 1. Brand Voice

Amorah's voice is **warm but plain-spoken**. Concrete over poetic. Short sentences. Write like a thoughtful friend explaining a genuinely nice thing you can make in ten minutes — not like a wedding magazine, and not like a boutique service taking limited bookings.

### Principles
- **Say what happens, plainly.** Prefer "Create your invitation and share the link" over abstract phrases like "write your next visual legacy."
- **No em dashes, anywhere, in user-facing copy.** Restructure the sentence instead of reaching for one — split into two sentences, use a colon, or use "and"/"or."
- **One voice, top to bottom.** A visitor should not be able to tell that different sections were written at different times or by different people. This redesign specifically corrects a prior bug where the hero read like a product ("Make Every Moment Memorable") and the footer/final-CTA read like a wedding photographer's portfolio ("Documenting authentic human experiences... Check Our Availability"). Every section, from hero to footer, uses the same product voice.
- **No invented urgency.** Amorah is self-serve — anyone can start anytime. Avoid booking/scarcity language ("dates are filling quickly," "check our availability") unless a feature genuinely is time-limited.
- **Name the action, not the feeling, in CTAs.** "Get Started," "Create Now" — not "Check Our Availability" or "Write Your Legacy."

### Before / After (from actual copy found during this redesign)
| Before (mixed voice) | After (consistent voice) |
|---|---|
| "Let's Write Your Next Visual Legacy" | "Ready to create something they'll remember?" |
| "Dates for the upcoming wedding season are filling quickly. Let's connect over a virtual espresso..." | "Start free, or go premium for guest RSVPs and a personalized invitation card." |
| "Check Our Availability" | "Get Started" |
| "Documenting authentic human experiences, wedding milestones, and editorial love stories worldwide." | A plain one-line description of what Amorah actually does — no photographer-portfolio framing. |

*(Exact final copy for each section is still being written — this table shows the direction, not final strings.)*

## 2. Visual Identity

### 2.1 Color palette (as observed in current build — confirm hex values against live design tokens before implementation)
- **Deep burgundy / plum** — primary dark surface (hero background, nav, footer, solid button fill)
- **Cream / blush** — primary light surface (page background)
- **Coral / rose pink** — accent (headline highlight word, star ratings, small UI accents)
- **White / off-white** — text on dark surfaces

### 2.2 Typography
- **Display/serif** — used for the "amorah" wordmark, section headlines ("Where Emotions Keep Replayed," card titles), and couple names on invitation cards. Carries the brand's editorial, warm character.
- **Sans-serif** — used for body copy, form labels, buttons, and small UI text. Carries clarity and legibility.
- Headlines may mix weight/style within one line (e.g. serif regular + italic accent color for emphasis, as seen in "Turn Every Special Moment Into an *Unforgettable Digital Experience*").

## 3. Iconography Rules

**Default: no icon, unless it's functional.** This has been an explicit, repeated instruction throughout this build — icons are not decorative accents in Amorah's UI.

Acceptable icon use:
- One small, minimal glyph per product card to identify it at a glance (e.g. envelope-heart for Moments, rings for Weddings) — never a large illustrative icon set.
- Functional icons only: calendar (date), pin (location), expand/collapse chevron (FAQ accordion), mute/unmute toggle.
- Icons reused from existing components rather than a new icon library introduced for a single use case.

Unacceptable icon use:
- Generic stock icon sets (gift/calendar/camera-style grids) on feature lists — features should read as confident copy, typography doing the visual work, not icon grids.
- Decorative icons with no functional meaning (e.g. a large outlined heart graphic sitting next to a card for no reason beyond decoration).

## 4. Component Patterns

### 4.1 Buttons
- **Primary** — solid dark (burgundy/plum) fill, white text, pill-shaped, optional trailing arrow icon.
- **Secondary** — light/outline fill matching the page background, dark text, pill-shaped, no icon.
- Primary and secondary buttons of the same semantic weight (e.g. two CTAs side by side) must match in height, padding, and radius — differ only in fill/label.

### 4.2 Cards
- Rounded corners, generous internal padding, consistent shadow/border treatment.
- Product cards: small functional icon → eyebrow label → title → description → 3 bullet points → CTA link with arrow.
- Testimonial cards: star rating → quote → name → role/context.

### 4.3 Accordion (FAQ)
- Question row with a plain +/− or chevron indicator (the one acceptable purely-functional icon here).
- Smooth height transition on expand/collapse.
- Consistent styling wherever reused (homepage FAQ, `/wedding` FAQ).

### 4.4 Invitation Card / Seal Components
- Monogram seal: circular, embossed/dimensional treatment (layered box-shadow, not a flat single-border circle), reused identically between the sealed opening screen and the `monogram_seal` template field.
- Action button row: circular white-outline icon badges with a short label underneath, evenly spaced, sitting directly on full-bleed imagery with no background panel behind the row.

### 4.5 Hero Carousel
- Two slides (Weddings, Moments), each with its own headline, subtext, and CTA.
- CTA per slide follows the entry-point/intent-resume logic defined in the PRD and System Design docs — this is a functional requirement, not just a visual one.

## 5. Copy Patterns Per Section Type

| Section | Copy job |
|---|---|
| Hero | State what Amorah does and for whom, in one sentence. CTA names the action. |
| About Us | Company mission/story — **not** feature description. Must not duplicate content from any feature-focused section. |
| Product cards | What it is → 3 concrete things it does → CTA. |
| Our Community | What the community actually is and how to join it — must correspond to a real, working destination. |
| FAQ | Real, distinct questions with accurate, specific answers — no repeated placeholder questions. |
| Final CTA | Plain restatement of the offer + "Get Started." No scarcity or booking language. |
| Footer | Real links to real pages only. |

## 6. Accessibility & Responsiveness Baseline

- All interactive elements (buttons, accordion triggers, carousel controls) must be reachable and operable via touch and keyboard.
- Text contrast against both dark (burgundy) and light (cream/floral template) backgrounds must meet legibility standards — no text relying on a full-card dimming overlay to be readable (see build history: this was explicitly corrected once already and must not regress).
- All new sections (hero carousel, About Us, Community, FAQ) must be fully responsive: single-column, comfortably readable on mobile; no horizontal scrolling; no cramped text.
- `prefers-reduced-motion` must be respected anywhere ambient motion is used (invitation card ambient scale, carousel autoplay if implemented).
