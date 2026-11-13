# Site Brief — <Client Name>

Prepared: `<YYYY-MM-DD>` · Prepared by: `<Agency / Author>` [`concept.by`]
Status: **concept** (banner + noindex + Access-protected preview) | **launch** (signed, public production build)

Fill this brief before touching `site.config.ts`. Every business fact must cite a real URL and date. Each item maps to a `site.config.ts` field (shown in `[brackets]`).

---

## 1. Sourced business facts

| Field | Config path | Value | Source URL & date |
|---|---|---|---|
| Name | `[name]`, `[shortName]` | | |
| URL & schema type | `[url]`, `[seo.schemaType]` | | |
| Owner / Story | `[story.heading]`, `[story.body]`, `[story.quote]` | | |
| Address | `[business.street]`, `[business.city]`, `[business.region]`, `[business.postalCode]` | | |
| Phone / Email | `[contact.phone]`, `[contact.email]` | | |
| Hours | `[business.hours]`, `[business.hoursSpec]` | | |
| Areas served | `[seo.areaServed]`, `[business.areasServed]` | | |
| Services | `[services.items]`, `[services.more]`, `[services.features]` | | |
| Offers / Coupons | `[offers.items]` (include exact terms) | | |
| Rating / Review count | `[hero.rating]`, `[proof.stats]`, `[proof.source]` | | |
| Published testimonials | `[proof.quotes]` (verbatim + author name) | | |

---

## 2. Verify with owner

Check public listings (Google Business Profile, Yelp, BBB, Facebook) against the website. Flag any unverified, missing, or conflicting facts before launch:

- [ ] Review count / rating mismatch across sources (e.g., Google vs. Yelp): confirm primary link [`business.reviewUrl`]
- [ ] Service pricing, warranty terms, or maintenance plan details
- [ ] Hours of operation / after-hours or emergency policy
- [ ] Written permission to feature selected customer testimonials [`proof.quotes`]
- [ ] High-resolution logo files [`logo`] and authentic team/location photos
- [ ] Where form submissions and booking requests should route [`contact.formEndpoint]`, [`contact.bookingUrl`]

---

## 3. Current-site audit

- **Platform / stack:** (CMS/page builder, plugins, chat widgets, trackers from `probe.json`)
- **Requests & weight:** (total requests, transfer size, third-party scripts)
- **First mobile screen (390px):** (what is visible above the fold? Is tap-to-call, primary CTA, address/hours, or trust proof missing?)
- **H1 & headings:** (exact H1 text; whether service and city appear in headings; `<title>` and meta description quality)
- **Booking / conversion flow:** (current form fields, click depth, friction, mobile sticky bar presence)
- **Buried info:** (hours, coupons, emergency info, or differentiators hidden in footers or subpages)
- **Indexed service / city pages to preserve:** (count and list key URLs that rank and require a 301 redirect map at launch)

---

## 4. Problem → Fix (or Borrow / Beat)

| Current problem / gap | Concept fix |
|---|---|
| No call or booking CTA on first mobile screen | Hero primary/secondary CTAs [`hero.primary`] + sticky mobile Call / Book bar [`mobileBar`] |
| Generic H1 ("Welcome!") without service or city | `<Service> in <City, ST>` [`seo.title`] + 2-line outcome/pain headline [`hero.headline`] |
| Generic contact form (name/email/message only) | Vertical-specific booking fields (service type, urgency, preferred day) [`closing.fields`] |
| Specials or guarantees buried clicks deep | Dedicated Offers section [`offers.items`] and Service features strip [`services.features`] |
| | |

---

## 5. Copy & brand plan

### Hero (`[hero]`)
- **Eyebrow `[hero.eyebrow]`:** (2–4 core offerings separated by `·`)
- **H1 Line 1 (Outcome) `[hero.headline[0]]`:**
- **H1 Line 2 (Pain removed / Place) `[hero.headline[1]]`:**
- **Support (1 sentence: who you help + how) `[hero.support]`:**
- **Primary CTA `[hero.primary]` & Secondary CTA `[hero.secondary]`:**
- **Trust chips `[hero.chips]`:**
- **Journey stack `[hero.journey]`:** (3–6 illustrative customer journey cards)

### Positioning band (`[band]`)
- **Heading `[band.heading]`:** ("[Thing A] when you need [X]. [Thing B] when you need [Y].")
- **Tagline `[band.tagline]`:**

### Process (`[process.steps]`)
- **Steps (4–6 steps from first contact to completed work):**
  1.
  2.
  3.
  4.

### FAQ (`[faq.items]`)
- **6–10 buyer questions** (Who is it for? / Do I need everything? / Works with what I have? / Who owns it? / Cost or budget? / Warranty or guarantee? / + client-specific):
  1.
  2.
  3.
  4.
  5.
  6.

### Theme (`[theme]`)
- **Mode `[theme.mode]` & Texture `[theme.texture]`:** (`light` or `dark`; `grid`, `dots`, `carbon`, or `none`)
- **Colors:** `bg`, `surface`, `text`, `muted`, `accent`, `accentInk`, `accent2` (verify WCAG AA ≥ 4.5:1 contrast via `npm run validate`)
- **Fonts `[theme.fontSource]`, `[theme.fontSans]`, `[theme.fontDisplay]`, `[theme.fontMono]`:**

---

## 6. Launch & 301 redirect plan

1. **301 redirect map:** Crawl the legacy site and map every indexed service, location, and resource URL to its new destination so search rankings are preserved.
2. **Production config:** Remove `concept` from `site.config.ts`, swap in verified owner facts, real logo/photos, and set `url` to the production domain.
3. **Forms & booking:** Wire `contact.formEndpoint` (`worker/index.ts` + Resend, Formspree, or Web3Forms) and `contact.bookingUrl`; send a live test submission.
4. **Domain, DNS & analytics:** Attach custom domain on Cloudflare Workers (keeping existing MX/email DNS intact), configure `analytics`, submit `sitemap-index.xml` in Google Search Console, and update Google Business Profile links.
