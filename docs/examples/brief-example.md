# Brief: Northgate Comfort Heating & Air (fictional example)

> **Fictional.** This business, its people, and every source below are invented to show the brief format. Real briefs cite real URLs and dates.

Prepared 2026-01-15 · Status: **concept** (banner + noindex + Access-protected preview)

## Business facts used

| Field | Value | Source |
|---|---|---|
| Name | Northgate Comfort Heating & Air | Homepage header |
| Owner | Dana Ruiz, owner since 2019 (bought from founder) | About page |
| Address | 120 Example Ave, Springfield, ST 00000 | Footer |
| Phone / email | (000) 000-0000 · office@example.test | Footer |
| Hours | Mon–Fri 7:00 AM–6:00 PM; Sat 8:00 AM–noon; 24/7 emergency line | Footer, Contact page |
| Areas served | Springfield, Shelby, Oak Grove | Service-areas page |
| Services | AC repair & install, furnace repair & install, heat pumps, maintenance plans, indoor air quality | Services menu |
| Offers | $79 AC tune-up (through Jun 30, one per household) | Coupons page |
| Proof | 4.8 average, 312 reviews | Google Business Profile, captured 2026-01-14 |
| Testimonial | "Same-day fix in July heat…" — J. Patel | Homepage review strip |

## Verify with owner
- [ ] Review count differs by source (Google 312, Yelp 41): use Google and link to it
- [ ] Maintenance-plan price and what it includes
- [ ] Emergency line: real 24/7 or after-hours answering service?
- [ ] Permission to quote J. Patel; 2–3 more recent reviews
- [ ] Logo files and truck/team photos
- [ ] Where booking requests should go (inbox, SMS, or field-service software)

## Current-site audit
- **Platform:** page builder theme, 90+ requests, two chat widgets, slider plugin
- **First mobile screen:** stock photo slider; phone number in 12px text; no booking button
- **Headings:** H1 is "Welcome!"; no service or city in any heading
- **Booking:** a contact form with name, email and message only. It doesn't ask for the system type, the problem, urgency or a preferred time
- **Buried info:** emergency line only in the footer; coupon two clicks deep
- **Keep:** 14 indexed service + city pages (redirect map needed at launch)

## Problem → fix
| Problem | Concept |
|---|---|
| No call or booking on mobile first screen | Hero CTAs + sticky Call / Book bar |
| "Welcome!" H1 | "Heating & AC repair in Springfield, ST" + 2-line headline |
| Hidden emergency line | Hero chip + FAQ + Location section |
| Generic form | System type, problem, urgency, preferred day fields |
| Coupon buried | Offers section with the terms visible |

## Launch plan (if signed)
1. Crawl the old site and build a 301 map for all 14 service and city pages.
2. Swap in the real logo, photos and verified rating; remove `concept`.
3. Form → `worker/index.ts` + Resend, or their field-service software.
4. Custom domain, analytics, Search Console, Google Business Profile links.
