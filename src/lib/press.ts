/**
 * Config for techblit.com/press — the paid "Brand Press" placement landing page.
 *
 * Pricing is date-driven on purpose (spec §7): the launch promo has to revert to
 * the normal price on its own once the window closes, with nobody editing code on
 * the day. Everything that a launch decision still hangs on is a single constant
 * here so it can be changed without touching the page.
 */

/**
 * End of the launch-promo window, in West Africa Time (UTC+1, no DST).
 * `2026-10-31T23:59:59+01:00` — the promo is live through Oct 31, gone Nov 1.
 */
export const PROMO_END = new Date('2026-10-31T23:59:59+01:00');

/** Human-facing promo deadline, reused in copy and the FAQ so it stays in sync. */
export const PROMO_END_LABEL = 'October 31, 2026';

export const PRESS_NORMAL_PRICE = 120_000;
export const PRESS_PROMO_PRICE = 70_000;

export interface PressPricing {
  currency: 'NGN';
  /** Undiscounted price — shown struck through only while the promo is live. */
  normal: number;
  /** What the buyer actually pays right now. */
  current: number;
  isPromo: boolean;
  /** ISO string so it can cross the server → client boundary as a prop. */
  promoEndsIso: string;
  promoEndLabel: string;
}

export function getPressPricing(now: Date = new Date()): PressPricing {
  const isPromo = now.getTime() <= PROMO_END.getTime();
  return {
    currency: 'NGN',
    normal: PRESS_NORMAL_PRICE,
    current: isPromo ? PRESS_PROMO_PRICE : PRESS_NORMAL_PRICE,
    isPromo,
    promoEndsIso: PROMO_END.toISOString(),
    promoEndLabel: PROMO_END_LABEL,
  };
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

/**
 * Credibility strip (spec §4). Exact figures — not rounded further, nothing added.
 */
export const PRESS_STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '500+', label: 'Articles published' },
  { value: '900K+', label: 'Social views' },
  { value: '5', label: 'Nigerian regions covered' },
  { value: '30+', label: 'Contributors' },
];

/**
 * "How it works" — copy is validated against the ad campaign and must not drift
 * (spec §6).
 */
export const PRESS_STEPS: ReadonlyArray<{ title: string; detail: string }> = [
  { title: 'Pick a package', detail: 'One live package today — TechBlit Feature. More on the way.' },
  { title: 'Submit your story', detail: 'Your announcement, release, or write-up, in your own words.' },
  { title: 'Go live in 24–48 hours', detail: 'Published on techblit.com under the Brand Press label.' },
];

export const PRESS_STORY_TYPES = [
  'Announcement',
  'Product Launch',
  'Funding',
  'Milestone',
  'Other',
] as const;

export type PressStoryType = (typeof PRESS_STORY_TYPES)[number];

/**
 * Phase 2 catalog (spec §7). Concept only — NO prices. Rendered as a "coming
 * soon" teaser per the spec's own recommendation; do not attach numbers.
 */
export const PRESS_COMING_SOON: ReadonlyArray<{ name: string; blurb: string }> = [
  {
    name: 'Founder Spotlight',
    blurb: "A profile built around the founder's story, with social amplification.",
  },
  {
    name: 'Funding Announcement Feature',
    blurb: 'Fast-turnaround feature timed to a funding round.',
  },
  {
    name: 'Weekend Flash Feature',
    blurb: 'Discounted slots when editorial capacity opens up on weekends.',
  },
  {
    name: 'Feature Writing Add-on',
    blurb: "No polished brief? We write it for you. Pairs with any package.",
  },
];

/**
 * Secondary "not sure which package?" CTA (spec §5). Confirmed business line;
 * `NEXT_PUBLIC_PRESS_WHATSAPP_NUMBER` can override it without a code change.
 * An empty value falls the page back to the email CTA rather than a dead link.
 */
export const PRESS_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_PRESS_WHATSAPP_NUMBER || '+2348118633277';
export const PRESS_CONTACT_EMAIL = 'info@techblit.com';

export function pressWhatsappLink(message: string): string | null {
  if (!PRESS_WHATSAPP_NUMBER) return null;
  const digits = PRESS_WHATSAPP_NUMBER.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const PRESS_FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'Who can submit?',
    a: "Anyone with something real and tech-related — a company, a product, a personal project, a funding announcement. You don't need to be a company to publish.",
  },
  {
    q: 'What happens after I submit?',
    a: 'A light editorial review, then publication within 24–48 hours under the TechBlit Brand Press label.',
  },
  {
    q: "Is this the same as TechBlit's regular editorial coverage?",
    a: "No — this is buyer-submitted content, clearly labeled as Brand Press, separate from TechBlit's independent journalism.",
  },
  {
    q: `How long does the ${formatNaira(PRESS_PROMO_PRICE)} price last?`,
    a: `Through ${PROMO_END_LABEL}. After that, the price is ${formatNaira(PRESS_NORMAL_PRICE)}.`,
  },
];

/** UTM / referrer keys captured with each submission for campaign attribution (spec §12). */
export const PRESS_UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;
