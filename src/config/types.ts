// Schema for site.config.ts. Every section component reads from this shape,
// so a new site is (almost always) a new config file, not new components.

/** Mock-UI card kinds used by the hero journey and the service scenes. */
export type ArtKind = 'search' | 'steps' | 'pipeline' | 'form' | 'message' | 'metric' | 'browser' | 'chart';

export interface ArtCard {
  kind: ArtKind;
  /** Small label pinned to the card, e.g. "Search & Ads". */
  tag?: string;
  title?: string;
  /** Meaning depends on kind: result lines, checklist steps, form fields, chat text, etc. */
  lines?: string[];
  /** pipeline only: column name -> chips */
  columns?: { name: string; items: string[] }[];
  /** metric only */
  value?: string;
  delta?: string;
  /** form/browser only: button label */
  cta?: string;
  /** Light card on dark page (default false = glass/dark). */
  light?: boolean;
}

export interface Cta {
  label: string;
  /** '#contact', 'mailto:', 'tel:', or full URL (Calendly etc.) */
  href: string;
}

export interface Service {
  title: string;
  body: string;
  art?: ArtCard;
  icon?: IconName;
}

export interface Step {
  title: string;
  body: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Proof {
  quote: string;
  name: string;
  role?: string;
  /** Show 5 stars above the quote. */
  stars?: boolean;
}

export interface Stat {
  value: string;
  label: string;
}

export type SectionId =
  | 'hero' | 'offers' | 'services' | 'band' | 'story' | 'process' | 'proof' | 'faq' | 'location' | 'contact';

/** Built-in line icons for the services grid and feature lists. */
export type IconName =
  | 'wrench' | 'engine' | 'brake' | 'suspension' | 'tire' | 'exhaust' | 'oil' | 'scan' | 'battery' | 'ac'
  | 'shield' | 'shuttle' | 'coffee' | 'clock' | 'star' | 'family' | 'badge' | 'map' | 'phone' | 'check' | 'tag';

export interface Feature { icon?: IconName; title: string; body?: string }

export interface Offer {
  title: string;
  body: string;
  /** Small print shown under the offer. */
  terms?: string;
  cta?: Cta;
  /** Short label, e.g. "Coupon", "Discount". */
  tag?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'select' | 'date' | 'textarea';
  required?: boolean;
  options?: string[];
  autocomplete?: string;
  placeholder?: string;
  /** Half width on ≥ sm screens. */
  half?: boolean;
}

export interface Hours { days: string; time: string }

export interface SiteConfig {
  /** Canonical origin, no trailing slash. Drives canonical URLs, sitemap, OG. */
  url: string;
  name: string;
  /** Wordmark ornament when no logo: accent dot (default), five stars, or none. */
  brandMark?: 'dot' | 'stars' | 'none';
  /** Shorter display name for header/footer when name is long. */
  shortName?: string;
  /** Path under /public, or omit to render the wordmark as text. */
  logo?: string;
  lang?: string;

  seo: {
    title: string;
    description: string;
    /** Path under /public, 1200x630. */
    ogImage?: string;
    /** schema.org type for JSON-LD: ProfessionalService, LocalBusiness, DanceSchool, AutoRepair, ... */
    schemaType?: string;
    areaServed?: string;
  };

  theme: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    /** Text color on top of accent (buttons). */
    accentInk: string;
    /** Font family names (as declared by the @fontsource package, or Google Fonts names). */
    fontSans: string;
    fontMono?: string;
    /** Background texture behind the hero. */
    texture?: 'carbon' | 'grid' | 'dots' | 'none';
    /** 'dark' or 'light' — sets color-scheme and card defaults. */
    mode?: 'dark' | 'light';
    /** Optional second brand color (stars, offer tags). Defaults to accent. */
    accent2?: string;
    /**
     * 'self' (default): fonts are self-hosted via @fontsource packages imported in src/styles/fonts.css
     * (faster, no third-party request). 'google': loads the named families from Google Fonts.
     */
    fontSource?: 'self' | 'google';
    /** Heading font. Defaults to fontSans. */
    fontDisplay?: string;
    /** Uppercase display headings (good with condensed faces). */
    displayUppercase?: boolean;
  };

  /**
   * Spec / concept builds for prospects: shows a banner naming who made the concept
   * and sets noindex so it never competes with the real business in search.
   */
  concept?: { by: string; note: string; href?: string };

  /** Local-business details: rendered by the 'location' section and merged into JSON-LD. */
  business?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country?: string;
    hours: Hours[];
    /** schema.org openingHoursSpecification, e.g. [{ days: ['Monday',...], opens: '07:30', closes: '17:00' }] */
    hoursSpec?: { days: string[]; opens: string; closes: string }[];
    mapUrl?: string;
    areasServed?: string[];
    payment?: string[];
    sameAs?: string[];
    reviewUrl?: string;
  };

  /** Sticky bottom bar on phones: tap-to-call + primary action. */
  mobileBar?: { call?: boolean; action?: Cta };

  contact: {
    email: string;
    phone?: string;
    /**
     * POST endpoint for the contact form (Formspree, Web3Forms, Basin, or your own
     * DeployKit Worker at /api/contact — see worker/index.ts). Leave empty to fall back to mailto.
     */
    formEndpoint?: string;
    /** Extra hidden fields the provider needs, e.g. { access_key: '...' } for Web3Forms. */
    formHidden?: Record<string, string>;
    /** Optional booking link (Cal.com, Calendly). Shown as a secondary CTA. */
    bookingUrl?: string;
  };

  analytics?: {
    cloudflareToken?: string;
    plausibleDomain?: string;
    ga4Id?: string;
  };

  nav: { label: string; href: string }[];
  headerCta: Cta;

  /** Render order. Drop an id to hide the section. */
  sections: SectionId[];

  hero: {
    eyebrow: string;
    /** Each string is one line of the H1. Two short lines read best. */
    headline: string[];
    support: string;
    primary: Cta;
    secondary?: Cta;
    /** Chips under the CTAs (service names, trust markers). */
    chips?: string[];
    /** Review badge under the CTAs, e.g. { value: '4.7', label: '580+ reviews', href } */
    rating?: { value: string; label: string; href?: string };
    /** Animated "customer journey" stack. 3–6 cards. */
    journey?: ArtCard[];
    journeyLabel?: string;
  };

  services: {
    kicker: string;
    heading: string[];
    intro: string;
    items: Service[];
    note?: string;
    /** 'scenes' = numbered rows with mock-UI art (agency style); 'grid' = icon cards (local business). */
    layout?: 'scenes' | 'grid';
    /** Extra services listed as chips under the grid. */
    more?: string[];
    /** Feature strip under services (warranty, shuttle, …). */
    features?: Feature[];
  };

  offers?: {
    kicker: string;
    heading: string;
    items: Offer[];
  };

  story?: {
    kicker: string;
    heading: string;
    body: string[];
    quote?: { text: string; name: string; role?: string };
    facts?: Feature[];
  };

  location?: {
    kicker: string;
    heading: string;
    note?: string;
  };

  band?: {
    heading: string;
    tagline?: string;
  };

  process?: {
    kicker: string;
    heading: string;
    steps: Step[];
  };

  proof?: {
    kicker: string;
    heading: string;
    stats?: Stat[];
    quotes?: Proof[];
    cta?: Cta;
    /** Where the numbers come from; shown as small print. */
    source?: string;
  };

  faq?: {
    kicker: string;
    heading: string;
    items: Faq[];
  };

  closing: {
    heading: string[];
    body?: string;
    submitLabel?: string;
    /** Message shown after a successful form submit. */
    success?: string;
    /** Custom form fields. Default: name, phone, email, message. */
    fields?: FormField[];
    formTitle?: string;
  };

  footer: {
    blurb: string;
    legal?: string;
  };
}
