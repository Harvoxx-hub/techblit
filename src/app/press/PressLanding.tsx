'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import apiService from '@/lib/apiService';
import {
  formatNaira,
  PRESS_COMING_SOON,
  PRESS_CONTACT_EMAIL,
  PRESS_FAQ,
  PRESS_STATS,
  PRESS_STEPS,
  PRESS_STORY_TYPES,
  PRESS_UTM_KEYS,
  pressWhatsappLink,
  type PressPricing,
} from '@/lib/press';

const NAVY = '#00102B';
const GOLD = '#F2C200';

const inputClass =
  'w-full rounded-lg border border-[#00102B]/15 bg-white px-3.5 py-2.5 text-[15px] text-[#00102B] outline-none transition placeholder:text-[#00102B]/35 focus:border-[#00102B] focus:ring-2 focus:ring-[#F2C200]/40';
const labelClass = 'mb-1.5 block text-sm font-medium text-[#00102B]/80';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'error'; message: string }
  | { status: 'done' };

export default function PressLanding({ pricing }: { pricing: PressPricing }) {
  const quotedPrice = pricing.current;
  const [state, setState] = useState<SubmitState>({ status: 'idle' });
  const referrer = useRef('');
  // Captured after mount rather than via useSearchParams(), which would force
  // this whole (statically rendered) page to client-render and keep the copy
  // out of the initial HTML — bad for an ad landing page.
  const utm = useRef<Record<string, string>>({});

  useEffect(() => {
    referrer.current = document.referrer || '';
    const params = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const key of PRESS_UTM_KEYS) {
      const v = params.get(key);
      if (v) out[key] = v;
    }
    utm.current = out;
  }, []);

  const whatsappHref = pressWhatsappLink(
    "Hi TechBlit — I'd like to publish a story and I'm not sure which package fits.",
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);

      if (fd.get('consent') !== 'on') {
        setState({ status: 'error', message: 'Please tick the box to continue.' });
        return;
      }

      setState({ status: 'sending' });
      try {
        await apiService.submitPressStory({
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          company: fd.get('company'),
          storyType: fd.get('storyType'),
          storyText: fd.get('storyText'),
          docUrl: fd.get('docUrl'),
          links: fd.get('links'),
          notes: fd.get('notes'),
          consent: true,
          quotedPrice,
          utm: utm.current,
          referrer: referrer.current,
          pagePath: '/press',
        });
        setState({ status: 'done' });
        form.reset();
        scrollToId('order');
      } catch (err) {
        setState({
          status: 'error',
          message:
            err instanceof Error && err.message
              ? err.message
              : 'Something went wrong. Please try again.',
        });
      }
    },
    [quotedPrice],
  );

  return (
    <main className="text-[#00102B]">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-[#00102B] text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: GOLD }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#F2C200]">
            TechBlit Brand Press
          </p>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Publish Your Story
            <br className="hidden sm:block" /> on TechBlit
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
            For founders, builders, and developers — anyone with something real happening in tech.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToId('packages')}
              className="w-full rounded-full bg-[#F2C200] px-8 py-3.5 text-base font-semibold text-[#00102B] transition hover:brightness-95 sm:w-auto"
            >
              Order Now
            </button>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white/70 underline-offset-4 transition hover:text-white hover:underline"
              >
                Not sure which package fits? Message us on WhatsApp
              </a>
            ) : (
              <a
                href={`mailto:${PRESS_CONTACT_EMAIL}?subject=TechBlit%20Brand%20Press%20enquiry`}
                className="text-sm font-medium text-white/70 underline-offset-4 transition hover:text-white hover:underline"
              >
                Not sure which package fits? Email {PRESS_CONTACT_EMAIL}
              </a>
            )}
          </div>
        </div>

        {/* Credibility strip */}
        <div className="relative border-t border-white/10 bg-white/[0.03]">
          <dl className="mx-auto grid max-w-4xl grid-cols-2 gap-y-8 px-6 py-10 sm:grid-cols-4">
            {PRESS_STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse text-center">
                <dt className="mt-1 text-xs uppercase tracking-wide text-white/55">{s.label}</dt>
                <dd className="text-3xl font-bold text-[#F2C200]">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
        <ol className="mt-12 grid gap-8 sm:grid-cols-3">
          {PRESS_STEPS.map((step, i) => (
            <li key={step.title} className="text-center sm:text-left">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: NAVY, color: GOLD }}
              >
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-[#00102B]/60">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Packages ---------- */}
      <section id="packages" className="scroll-mt-8 bg-[#FBF8F0] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Choose your package
          </h2>

          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-[#00102B]/10 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold">TechBlit Feature</h3>
              {pricing.isPromo && (
                <span className="rounded-full bg-[#F2C200] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#00102B]">
                  Launch promo
                </span>
              )}
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              {pricing.isPromo && (
                <span className="text-lg text-[#00102B]/40 line-through">
                  {formatNaira(pricing.normal)}
                </span>
              )}
              <span className="text-4xl font-bold">{formatNaira(pricing.current)}</span>
            </div>
            {pricing.isPromo && (
              <p className="mt-2 text-sm text-[#00102B]/60">
                Promo price through {pricing.promoEndLabel}. Reverts to {formatNaira(pricing.normal)}{' '}
                after that.
              </p>
            )}

            <ul className="mt-7 space-y-3 text-[15px]">
              {[
                'One editorial-style feature published on techblit.com',
                'Runs under the clearly labeled “TechBlit Brand Press” section',
                'Light editorial review before it goes live',
                'Live within 24–48 hours of submission',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-1 text-[#F2C200]">
                    ✓
                  </span>
                  <span className="text-[#00102B]/80">{item}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => scrollToId('order')}
              className="mt-8 w-full rounded-full bg-[#00102B] px-8 py-3.5 text-base font-semibold text-white transition hover:bg-[#00102B]/90"
            >
              Continue to submission
            </button>
            <p className="mt-3 text-center text-xs text-[#00102B]/50">
              Submit your story first — we&apos;ll send a secure payment link to confirm.
            </p>
          </div>

          {/* Phase 2 — coming soon, no prices */}
          <div className="mx-auto mt-14 max-w-2xl">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#00102B]/40">
              Coming soon
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {PRESS_COMING_SOON.map((p) => (
                <div
                  key={p.name}
                  className="rounded-xl border border-dashed border-[#00102B]/15 bg-white/50 p-4"
                >
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="mt-1 text-xs text-[#00102B]/55">{p.blurb}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Intake form ---------- */}
      <section id="order" className="scroll-mt-8 mx-auto max-w-2xl px-6 py-20">
        {state.status === 'done' ? (
          <div className="rounded-2xl border border-[#00102B]/10 bg-[#FBF8F0] p-8 text-center sm:p-12">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl"
              style={{ background: NAVY, color: GOLD }}
            >
              ✓
            </span>
            <h2 className="mt-6 text-2xl font-bold">Story received</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] text-[#00102B]/70">
              Thanks — we&apos;ve got your submission. Our team will review it and email you a secure
              payment link (expect {formatNaira(pricing.current)}). Once payment clears, your feature
              goes live within 24–48 hours. We&apos;ll follow up first if anything needs clarifying.
            </p>
            <Link
              href="/blog"
              className="mt-8 inline-block rounded-full bg-[#00102B] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#00102B]/90"
            >
              Read TechBlit
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Submit your story</h2>
            <p className="mt-3 text-[15px] text-[#00102B]/65">
              Tell us what you want to publish. No payment yet — we&apos;ll review your story and send
              a payment link to confirm your {formatNaira(pricing.current)} TechBlit Feature.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="p-name" className={labelClass}>
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input id="p-name" name="name" required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="p-email" className={labelClass}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input id="p-email" name="email" type="email" required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="p-phone" className={labelClass}>
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input id="p-phone" name="phone" required className={inputClass} />
                </div>
                <div>
                  <label htmlFor="p-company" className={labelClass}>
                    Company or project{' '}
                    <span className="font-normal text-[#00102B]/45">(optional)</span>
                  </label>
                  <input id="p-company" name="company" className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="p-type" className={labelClass}>
                  Story type <span className="text-red-500">*</span>
                </label>
                <select id="p-type" name="storyType" required defaultValue="" className={inputClass}>
                  <option value="" disabled>
                    Select…
                  </option>
                  {PRESS_STORY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="p-story" className={labelClass}>
                  Your story <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="p-story"
                  name="storyText"
                  required
                  rows={7}
                  placeholder="Paste your announcement, press release, or write-up. A draft is fine — we review lightly before publishing."
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="p-doc" className={labelClass}>
                  Link to a fuller doc{' '}
                  <span className="font-normal text-[#00102B]/45">(optional — Google Docs, Drive, Dropbox)</span>
                </label>
                <input
                  id="p-doc"
                  name="docUrl"
                  type="url"
                  placeholder="https://"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="p-links" className={labelClass}>
                  Links{' '}
                  <span className="font-normal text-[#00102B]/45">
                    (optional — website, socials, logo/headshot)
                  </span>
                </label>
                <textarea id="p-links" name="links" rows={2} className={inputClass} />
              </div>

              <div>
                <label htmlFor="p-notes" className={labelClass}>
                  Anything else for the editor{' '}
                  <span className="font-normal text-[#00102B]/45">(optional)</span>
                </label>
                <textarea id="p-notes" name="notes" rows={2} className={inputClass} />
              </div>

              <label className="flex items-start gap-3 text-sm text-[#00102B]/70">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-0.5 h-4 w-4 rounded border-[#00102B]/30 text-[#00102B] focus:ring-[#F2C200]"
                />
                <span>
                  I understand this is paid Brand Press placement — clearly labeled as such on the
                  published article — and subject to light editorial review (no scam or misleading
                  claims, no plagiarism).
                </span>
              </label>

              {state.status === 'error' && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p>
              )}

              <button
                type="submit"
                disabled={state.status === 'sending'}
                className="w-full rounded-full bg-[#F2C200] px-8 py-3.5 text-base font-semibold text-[#00102B] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.status === 'sending' ? 'Sending…' : 'Submit story'}
              </button>
              <p className="text-center text-xs text-[#00102B]/50">
                We&apos;ll reply by email. Payment is handled separately via a secure link.
              </p>
            </form>
          </>
        )}
      </section>

      {/* ---------- Guarantee / trust ---------- */}
      <section className="border-y border-[#00102B]/10 bg-[#FBF8F0]">
        <div className="mx-auto max-w-2xl px-6 py-12 text-center">
          <p className="text-lg font-semibold">We&apos;ll work with you until it&apos;s ready to publish.</p>
          <p className="mt-2 text-sm text-[#00102B]/60">
            Every TechBlit Feature carries a visible “Brand Press” label. It is separate from
            TechBlit&apos;s independent journalism — and we&apos;re upfront about that with readers.
          </p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="mx-auto max-w-2xl px-6 py-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Questions</h2>
        <dl className="mt-8 divide-y divide-[#00102B]/10">
          {PRESS_FAQ.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1.5 text-[15px] text-[#00102B]/70">{item.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => scrollToId('packages')}
            className="rounded-full bg-[#00102B] px-8 py-3.5 text-base font-semibold text-white transition hover:bg-[#00102B]/90"
          >
            Order Now
          </button>
        </div>
      </section>
    </main>
  );
}
