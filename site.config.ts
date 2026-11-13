import type { SiteConfig } from './src/config/types';

// ─────────────────────────────────────────────────────────────────────────────
// THE ONLY FILE MOST NEW SITES NEED TO CHANGE.
// Example content: a fictional growth + automation studio for local service
// businesses. Replace every string; keep the shape.
// ─────────────────────────────────────────────────────────────────────────────

const config: SiteConfig = {
  url: 'https://example.com',
  name: 'Brightline',
  lang: 'en',

  seo: {
    title: 'Websites, Ads & Automation for Local Service Businesses | Brightline',
    description:
      'Brightline builds websites, runs Google and Meta ads, and sets up AI-assisted follow-up so local service businesses book more jobs with less admin.',
    schemaType: 'ProfessionalService',
    areaServed: 'United States',
  },

  theme: {
    bg: '#06080c',
    surface: '#0d1118',
    text: '#f4f4f5',
    muted: '#a1a1aa',
    accent: '#ffe100',
    accentInk: '#0a0a0a',
    fontSans: 'Geist Variable',
    fontMono: 'Geist Mono Variable',
    texture: 'carbon',
    mode: 'dark',
  },

  contact: {
    email: 'hello@example.com',
    phone: '(555) 010-2030',
    formEndpoint: '', // e.g. 'https://formspree.io/f/xxxx' or '/api/contact'
    bookingUrl: '',
  },

  analytics: {
    cloudflareToken: '',
  },

  nav: [
    { label: 'Services', href: '#services' },
    { label: 'Process', href: '#process' },
    { label: 'FAQ', href: '#faq' },
  ],
  headerCta: { label: 'Get in touch', href: '#contact' },

  sections: ['hero', 'services', 'band', 'process', 'proof', 'faq', 'contact'],

  hero: {
    eyebrow: 'Websites · Paid ads · Automated follow-up',
    headline: ['More booked jobs.', 'Less admin.'],
    support:
      'We build the site, run the ads, and wire up the follow-up so every inquiry gets an answer in minutes — not tomorrow.',
    primary: { label: 'Book a 20-minute call', href: '#contact' },
    secondary: { label: 'See what we do', href: '#services' },
    chips: ['Websites', 'Google Ads', 'Meta Ads', 'Local SEO', 'Automations', 'Reporting'],
    journeyLabel:
      'Illustrated journey: a local search leads to a website inquiry, an instant text reply, a booked job, and a monthly report.',
    journey: [
      {
        kind: 'search',
        tag: 'Search',
        title: 'emergency plumber near me',
        lines: ['Sponsored · harborplumbing.co', 'Same-day repairs — 4.9★ (212)', 'Harbor Plumbing · Open now'],
        light: true,
      },
      { kind: 'form', tag: 'Landing page', title: 'Get a same-day quote', lines: ['Name', 'Phone'], cta: 'Request my quote', light: true },
      { kind: 'message', tag: 'Instant reply', lines: ['Thanks Dana! We can be there at 2:30 or 4:00 today. Which works?', '2:30 please'] },
      { kind: 'pipeline', tag: 'Job board', columns: [
        { name: 'New', items: ['Dana R.'] },
        { name: 'Quoted', items: ['M. Ortiz', 'K. Lee'] },
        { name: 'Booked', items: ['J. Park'] },
      ] },
      { kind: 'metric', tag: 'Monthly report', title: 'Booked jobs', value: '63', delta: '+18% vs last month' },
    ],
  },

  services: {
    kicker: 'What we do',
    heading: ['Get found.', 'Answer fast.', 'Book the job.'],
    intro: 'Pick one service or the whole stack. Each piece works on its own and gets better when connected.',
    items: [
      {
        title: 'Websites & landing pages',
        body: 'Fast, focused pages that say what you do, where you do it, and how to book — on every screen size.',
        art: { kind: 'browser', title: 'harborplumbing.co', lines: ['Same-day plumbing repairs', 'Licensed · Insured · 4.9★'], cta: 'Book now', light: true },
      },
      {
        title: 'Google & Meta ads',
        body: 'Campaigns built around the jobs you want more of, with spend and cost-per-lead reported in plain numbers.',
        art: { kind: 'chart', tag: 'Cost per lead', lines: ['42', '38', '35', '31', '29', '27'] },
      },
      {
        title: 'Local SEO',
        body: 'Service-area pages, Google Business Profile, reviews, and the technical fixes that help you show up nearby.',
        art: { kind: 'search', title: 'water heater repair', lines: ['Harbor Plumbing · 4.9★', 'Open now · 2.1 mi'], light: true },
      },
      {
        title: 'Lead capture & qualification',
        body: 'Short forms, click-to-call, and the right questions up front so you only chase real work.',
        art: { kind: 'form', title: 'What do you need?', lines: ['Service', 'ZIP code', 'Best time to call'], cta: 'Continue', light: true },
      },
      {
        title: 'AI-assisted follow-up',
        body: 'Instant text and email replies, reminders, and review requests — with a human in the loop where it matters.',
        art: { kind: 'steps', tag: 'New lead workflow', lines: ['Form submitted', 'Text sent in 30s', 'Owner alerted', 'Reminder at 24h'] },
      },
      {
        title: 'Custom tools',
        body: 'Small internal apps for quoting, scheduling, or reporting when off-the-shelf software fights your process.',
        art: { kind: 'pipeline', columns: [
          { name: 'Quote', items: ['#1042', '#1043'] },
          { name: 'Scheduled', items: ['#1039'] },
          { name: 'Done', items: ['#1031', '#1035'] },
        ] },
      },
    ],
    note: 'Visuals are illustrative, not client work.',
  },

  band: {
    heading: 'Marketing to fill the calendar. Systems to keep up with it.',
    tagline: 'Grow · Run better',
  },

  process: {
    kicker: 'How we work',
    heading: 'Five steps, no surprises.',
    steps: [
      { title: 'Listen', body: 'A short call on what is working, what is not, and what a good month looks like.' },
      { title: 'Plan', body: 'A written scope with priorities, timeline, and budget agreed before work starts.' },
      { title: 'Build', body: 'We ship in small pieces you can review, not one big reveal.' },
      { title: 'Launch', body: 'Tracking checked, forms tested, and handoff docs written.' },
      { title: 'Improve', body: 'Monthly reporting and tuning if ongoing support is part of the plan.' },
    ],
  },

  proof: {
    kicker: 'Results',
    heading: 'What changes when it is all connected.',
    stats: [
      { value: '< 1 min', label: 'Typical first response to a new lead' },
      { value: '100%', label: 'Of accounts and assets owned by you' },
      { value: '30 days', label: 'Typical launch window for a new site' },
    ],
    quotes: [],
  },

  faq: {
    kicker: 'FAQ',
    heading: 'Questions, answered.',
    items: [
      { q: 'Who do you work with?', a: 'Owner-led service businesses — trades, clinics, studios, and local retail — that want more inquiries and less manual follow-up.' },
      { q: 'Do I need every service?', a: 'No. Most clients start with one piece, usually the website or ads, and add more once it is paying for itself.' },
      { q: 'Can you work with my current site and tools?', a: 'Usually, yes. We review what you have first and only rebuild what is holding you back.' },
      { q: 'Who owns the accounts?', a: 'You do. Domains, ad accounts, analytics, and code are set up in your name; we get access, not ownership.' },
      { q: 'How much ad budget do I need?', a: 'It depends on your market and goals. We recommend a starting budget during planning and adjust it from real results.' },
      { q: 'Do you guarantee results?', a: 'No one can honestly guarantee leads or rankings. We commit to clear goals, transparent reporting, and steady improvement.' },
    ],
  },

  closing: {
    heading: ['Something in your business', 'should work better?'],
    body: 'Tell us what is slowing you down. We reply within one business day.',
    submitLabel: 'Send message',
    success: 'Thanks — we got it and will reply within one business day.',
  },

  footer: {
    blurb: 'Websites, ads, and automation for local service businesses.',
  },
};

export default config;
