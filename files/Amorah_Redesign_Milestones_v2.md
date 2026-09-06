# 💗 Amorah — Redesign Milestones & Timeline

**Type:** Project Plan · Redesign v2.0
**Date:** September 2026

---

## 1. Scope of This Plan

This covers the redesign work discussed and agreed in this planning cycle: the unified account model, homepage restructure, hero carousel, and supporting content work. It does **not** re-cover already-shipped foundational work (template rendering engine, demo content system, live preview embeds, pricing update, SEO/sitemap fixes) — those are treated as complete and referenced, not re-planned.

Dates below are planning placeholders — insert real target windows once a kickoff date is set.

## 2. Milestone Schedule

| # | Milestone | Key Deliverables | Depends On |
|---|---|---|---|
| 1 | Resolve Open Items | About Us copy direction, Our Community channel(s), footer link targets, pricing-nav placement, signed-in marketing-page UX | None — blocks Milestone 3+ |
| 2 | Unified Auth Architecture | Single account spanning both products; intent-resume mechanism; entry-point routing table implemented and tested | None — can run parallel to Milestone 1 |
| 3 | Homepage Restructure | New section order live: Nav → Hero Carousel → About Us → Explore Our Products → Our Community → Reviews → FAQ → Final CTA → Footer | Milestones 1, 2 |
| 4 | Hero Carousel Build | Two-slide carousel (Weddings, Moments), per-slide CTA wired to intent-resume auth flow | Milestone 2 |
| 5 | Content & Copy Pass | Full-site copy rewrite per Style Guide voice direction; em-dash removal (already completed as a prior pass — verify no regressions); FAQ deduplication; testimonial placeholder → real content swap-in | Milestone 1 |
| 6 | Our Community Integration | Real, working join mechanism (Discord invite / Instagram link / newsletter capture, per Milestone 1 decision) | Milestone 1 |
| 7 | QA & Cross-Device Testing | Full flow test: every entry point in the routing table, on mobile/tablet/desktop, signed-in and signed-out states | Milestones 2–6 |
| 8 | Launch | Deploy restructured homepage and auth flow to production | Milestone 7 |

## 3. Milestone Detail

### Milestone 1 — Resolve Open Items
Before build starts, the following must be decided (tracked in PRD Section 13):
- About Us: actual mission/story copy direction.
- Our Community: which channel(s) — Discord, Instagram, newsletter, or combination.
- Footer: real link targets (confirm whether a Blog/Journal is genuinely planned, or footer should link to existing site sections only).
- Pricing: confirm placement stays within each product's marketing page.
- Signed-in state: does the nav or any marketing page change when a visitor is authenticated?

### Milestone 2 — Unified Auth Architecture
This is the highest-risk, highest-priority technical piece. Build the entry-point routing table exactly as specified in the PRD and System Design docs, with particular attention to intent-resume (a user who clicks a product-specific CTA must land in that product after signup, not a generic hub) and to redirect-target validation (preventing open-redirect abuse).

### Milestone 3 — Homepage Restructure
Rebuild the homepage in the new section order. Fix the specific structural bugs identified in the design review: the duplicated "Curate Amorah Moments" block, the About Us / Our Community content duplication, and the FAQ's repeated placeholder question.

### Milestone 4 — Hero Carousel Build
Weddings slide first, Moments slide second. Each slide's CTA must route through the same intent-resume logic as its corresponding product card — the two entry points should feel identical in behavior, just differently placed.

### Milestone 5 — Content & Copy Pass
Apply the Style Guide's voice direction across every section. Specifically resolve the tonal split identified during design review (SaaS-product voice in the hero vs. boutique-photographer voice in the footer/final CTA) so the whole page reads as one consistent brand.

### Milestone 6 — Our Community Integration
Once Milestone 1 determines the actual channel(s), build the real join mechanism — this section must not ship with a "Join Community" button that goes nowhere.

### Milestone 7 — QA & Cross-Device Testing
Explicitly test every row of the entry-point routing table (PRD Section 4 / System Design Section 3) in both signed-in and signed-out states, on mobile, tablet, and desktop. Given how many past bugs in this build traced back to divergent/duplicated logic across similar-looking flows, this milestone should be treated as mandatory, not optional.

### Milestone 8 — Launch
Deploy to production. Confirm sitemap/robots/canonical-domain health is unaffected by the homepage restructure (quick regression check, since these were previously broken and fixed).

## 4. Risks & Buffer

- **Milestone 1 (Open Items) is a hard blocker** for most downstream work — treat resolving these as urgent, not a background task.
- **Intent-resume (Milestone 2)** is the single most failure-prone piece of this redesign, based on the pattern of bugs seen in template rendering and demo-content work earlier in this build (divergent implementations causing silent regressions). Recommend explicit, documented test cases for every entry point before calling this milestone done.
- **No buffer currently built in** — given the volume of rework this codebase has needed historically (repeated regressions on previously "fixed" features), consider padding Milestone 7 (QA) more generously than a typical project.
