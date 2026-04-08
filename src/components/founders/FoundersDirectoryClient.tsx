'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import {
  FOUNDER_INDUSTRIES,
  FOUNDER_STAGES,
  FOUNDER_REGIONS,
} from '@/lib/foundersConstants';
import apiService from '@/lib/apiService';
import { Input, Button } from '@/components/ui';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

type Item = {
  id: string;
  slug?: string;
  full_name: string;
  startup_name: string;
  one_liner: string;
  region: string;
  industry: string[];
  stage: string;
  profile_photo_url?: string;
  startup_logo_url?: string;
};

const PAGE_SIZE = 24;

function stageLabel(value: string) {
  return FOUNDER_STAGES.find((s) => s.value === value)?.label || value;
}

function FoundersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const q = searchParams.get('q') || '';
  const sort = (searchParams.get('sort') as 'newest' | 'oldest' | 'alphabetical') || 'newest';
  const region = searchParams.get('region') || '';
  const industry = searchParams.get('industry') || '';
  const stage = searchParams.get('stage') || '';
  const funding = searchParams.get('funding') || '';
  const yearMin = searchParams.get('yearMin') || '';
  const yearMax = searchParams.get('yearMax') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getFoundersDirectory({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        sort,
        q: q || undefined,
        region: region || undefined,
        industry: industry || undefined,
        stage: stage || undefined,
        funding: funding || undefined,
        yearMin: yearMin ? parseInt(yearMin, 10) : undefined,
        yearMax: yearMax ? parseInt(yearMax, 10) : undefined,
      });
      setItems((res.items || []) as Item[]);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, sort, q, region, industry, stage, funding, yearMin, yearMax]);

  useEffect(() => {
    load();
  }, [load]);

  const setParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete('page');
    router.push(`/founders?${p.toString()}`);
    setPage(0);
  };

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = (fd.get('q') as string) || '';
    const p = new URLSearchParams(searchParams.toString());
    if (next) p.set('q', next);
    else p.delete('q');
    p.delete('page');
    router.push(`/founders?${p.toString()}`);
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectClass =
    'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

  return (
    <div>
      <Navigation />

      <header className="relative border-b border-stone-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 text-sm text-stone-500">
            <Link href="/" className="hover:text-stone-800 transition-colors">
              Home
            </Link>
            <span aria-hidden className="text-stone-300">
              /
            </span>
            <span className="font-medium text-stone-700">Founder&apos;s Repository</span>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">
                <SparklesIcon className="h-3.5 w-3.5" aria-hidden />
                Curated directory
              </p>
              <h1
                className="text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl [font-family:var(--font-founders-display),Georgia,serif]"
              >
                Who&apos;s building across Nigeria
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-stone-600">
                Discover founders and startups — filter by region, sector, funding, and stage. Profiles are
                reviewed by TechBlit before they go live.
              </p>
            </div>
            <Link
              href="/founders/apply"
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Apply to be listed
              <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-4">
              <div className="flex items-center gap-2 text-stone-700">
                <FunnelIcon className="h-5 w-5 text-stone-400" aria-hidden />
                <span className="text-sm font-semibold">Filters</span>
              </div>

              <form
                onSubmit={onSearch}
                className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm"
              >
                <div className="border-b border-stone-100 p-4">
                  <label htmlFor="founders-q" className="sr-only">
                    Search directory
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                    <input
                      id="founders-q"
                      name="q"
                      defaultValue={q}
                      placeholder="Search name, startup, pitch…"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/80 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="p-3">
                  <Button type="submit" variant="primary" className="w-full rounded-xl" size="sm">
                    Search
                  </Button>
                </div>
              </form>

              <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
                <div className="border-b border-stone-100 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Sort</span>
                </div>
                <div className="p-4">
                  <select
                    value={sort}
                    onChange={(e) => setParam('sort', e.target.value)}
                    className={selectClass}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="alphabetical">Alphabetical (startup)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
                <div className="border-b border-stone-100 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Region</span>
                </div>
                <div className="p-4">
                  <select
                    value={region}
                    onChange={(e) => setParam('region', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All regions</option>
                    {FOUNDER_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
                <div className="border-b border-stone-100 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Industry</span>
                </div>
                <div className="p-4">
                  <select
                    value={industry}
                    onChange={(e) => setParam('industry', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All sectors</option>
                    {FOUNDER_INDUSTRIES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
                <div className="border-b border-stone-100 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Stage</span>
                </div>
                <div className="p-4">
                  <select
                    value={stage}
                    onChange={(e) => setParam('stage', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All stages</option>
                    {FOUNDER_STAGES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
                <div className="border-b border-stone-100 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Funding</span>
                </div>
                <div className="p-4">
                  <select
                    value={funding}
                    onChange={(e) => setParam('funding', e.target.value)}
                    className={selectClass}
                  >
                    <option value="">All</option>
                    <option value="yes">Funded</option>
                    <option value="no">Not funded</option>
                    <option value="bootstrapped">Bootstrapped</option>
                  </select>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
                <div className="border-b border-stone-100 px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Year founded
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <Input
                    label="Min"
                    type="number"
                    key={`ymin-${yearMin}`}
                    defaultValue={yearMin}
                    onBlur={(e) => setParam('yearMin', e.target.value)}
                    variant="filled"
                    size="sm"
                  />
                  <Input
                    label="Max"
                    type="number"
                    key={`ymax-${yearMax}`}
                    defaultValue={yearMax}
                    onBlur={(e) => setParam('yearMax', e.target.value)}
                    variant="filled"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-stone-600">
                <span className="font-semibold text-stone-900">{total}</span> profile
                {total !== 1 ? 's' : ''}
                {q ? (
                  <span className="text-stone-500">
                    {' '}
                    for &ldquo;{q}&rdquo;
                  </span>
                ) : null}
              </p>
            </div>

            {loading ? (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li
                    key={i}
                    className="h-48 animate-pulse rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 ring-1 ring-stone-200/80"
                  />
                ))}
              </ul>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-20 text-center">
                <p className="text-lg font-medium text-stone-800 [font-family:var(--font-founders-display),Georgia,serif]">
                  No profiles match
                </p>
                <p className="mt-2 max-w-md text-stone-600">
                  Try clearing filters or searching with different keywords. New founders are added as applications
                  are approved.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/founders')}
                  className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {items.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/founders/${f.slug}`}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm ring-1 ring-transparent transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-blue-500/20"
                    >
                      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 opacity-90" />
                      <div className="relative p-5 pt-4">
                        {f.startup_logo_url && (
                          <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-stone-100 bg-white shadow-sm">
                            <Image
                              src={f.startup_logo_url}
                              alt=""
                              width={44}
                              height={44}
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div className="flex gap-4 pr-14">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-100 ring-2 ring-white shadow-md">
                            {f.profile_photo_url ? (
                              <Image
                                src={f.profile_photo_url}
                                alt=""
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-stone-400">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-stone-900 group-hover:text-blue-700">
                              {f.startup_name}
                            </p>
                            <p className="truncate text-sm text-stone-500">{f.full_name}</p>
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
                              {f.one_liner}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                                {f.region}
                              </span>
                              {(f.industry || []).slice(0, 2).map((i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-900"
                                >
                                  {i}
                                </span>
                              ))}
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-900">
                                {stageLabel(f.stage)}
                              </span>
                            </div>
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2">
                              View profile
                              <ArrowRightIcon className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && !loading && items.length > 0 && (
              <nav
                className="mt-12 flex items-center justify-center gap-3"
                aria-label="Pagination"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-full border-stone-300 px-5"
                >
                  Previous
                </Button>
                <span className="text-sm tabular-nums text-stone-600">
                  Page <span className="font-semibold text-stone-900">{page + 1}</span> of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-full border-stone-300 px-5"
                >
                  Next
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function FoundersDirectoryFallback() {
  return (
    <div>
      <Navigation />
      <header className="relative border-b border-stone-200/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
          <div className="h-4 w-48 animate-pulse rounded bg-stone-200" />
          <div className="mt-8 h-12 max-w-xl animate-pulse rounded-lg bg-stone-200" />
          <div className="mt-4 h-6 max-w-2xl animate-pulse rounded bg-stone-100" />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 ring-1 ring-stone-200/80"
            />
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
}

export default function FoundersDirectoryClient() {
  return (
    <Suspense fallback={<FoundersDirectoryFallback />}>
      <FoundersDirectoryContent />
    </Suspense>
  );
}
