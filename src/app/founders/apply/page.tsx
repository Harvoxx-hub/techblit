'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import {
  FOUNDER_INDUSTRIES,
  FOUNDER_STAGES,
  FOUNDER_REGIONS,
  FOUNDER_STATES_BY_REGION,
  FOUNDER_FUNDING_STAGES,
} from '@/lib/foundersConstants';
import apiService from '@/lib/apiService';
import { Button, Input, Alert } from '@/components/ui';
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

const fieldClass =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-stone-700';

export default function FoundersApplyPage() {
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const startupLogoRef = useRef<HTMLInputElement>(null);

  const [region, setRegion] = useState('');
  const states = useMemo(
    () => (region && FOUNDER_STATES_BY_REGION[region]) || [],
    [region]
  );

  const [industrySelected, setIndustrySelected] = useState<string[]>([]);
  const [funded, setFunded] = useState<'yes' | 'no' | 'bootstrapped'>('no');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  /** Local preview URLs (blob:) — must revoke on replace/unmount */
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileFileLabel, setProfileFileLabel] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileLabel, setLogoFileLabel] = useState('');

  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [profilePreview, logoPreview]);

  const clearProfilePhoto = () => {
    setProfilePreview(null);
    setProfileFileLabel('');
    if (profilePhotoRef.current) profilePhotoRef.current.value = '';
  };

  const clearStartupLogo = () => {
    setLogoPreview(null);
    setLogoFileLabel('');
    if (startupLogoRef.current) startupLogoRef.current.value = '';
  };

  const onProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.size > 0) {
      setProfilePreview(URL.createObjectURL(f));
      setProfileFileLabel(f.name);
    } else {
      setProfilePreview(null);
      setProfileFileLabel('');
    }
  };

  const onStartupLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.size > 0) {
      setLogoPreview(URL.createObjectURL(f));
      setLogoFileLabel(f.name);
    } else {
      setLogoPreview(null);
      setLogoFileLabel('');
    }
  };

  const toggleIndustry = (label: string) => {
    setIndustrySelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = e.currentTarget;
    const fd = new FormData(form);

    const profile = fd.get('profile_photo');
    if (!profile || !(profile instanceof File) || profile.size === 0) {
      setError('Profile photo is required.');
      return;
    }

    if (industrySelected.length === 0) {
      setError('Select at least one industry.');
      return;
    }

    fd.delete('industry');
    fd.append('industry', JSON.stringify(industrySelected));

    setLoading(true);
    try {
      await apiService.submitFounderApplication(fd);
      setDone(true);
      form.reset();
      clearProfilePhoto();
      clearStartupLogo();
      setIndustrySelected([]);
      setRegion('');
      setFunded('no');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div>
        <Navigation />
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:py-32">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircleIcon className="h-9 w-9" aria-hidden />
          </div>
          <h1 className="mt-8 text-3xl font-semibold text-stone-900 [font-family:var(--font-founders-display),Georgia,serif]">
            Application received
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-stone-600">
            We&apos;ve sent a confirmation email. Our team typically reviews applications within a few business
            days.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/founders"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Browse the directory
            </Link>
            <Link href="/" className="text-sm font-semibold text-stone-600 underline-offset-4 hover:underline">
              Back to TechBlit home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <Link
          href="/founders"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Founder&apos;s Repository
        </Link>

        <header className="mt-8">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 [font-family:var(--font-founders-display),Georgia,serif] sm:text-[2.5rem]">
            Apply to be listed
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
            Tell us about you and your startup. Listings are curated — we&apos;ll email you when your profile is
            approved or if we need more detail.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">
          {error && (
            <Alert variant="danger" className="rounded-xl border-red-200">
              {error}
            </Alert>
          )}

          <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <UserIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-stone-900">About you</h2>
                <p className="text-sm text-stone-500">Contact and photo for your public profile</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input name="full_name" label="Full name" isRequired variant="filled" />
              <Input name="email" type="email" label="Email" isRequired variant="filled" />
            </div>
            <div className="mt-5">
              <Input name="phone" label="Phone (optional)" variant="filled" />
            </div>
            <div className="mt-6">
              <span className={labelClass} id="profile-photo-label">
                Profile photo <span className="text-red-500">*</span>
              </span>
              <div className="mt-2 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/50 px-4 py-6 transition hover:border-blue-400/80 sm:py-8">
                <input
                  ref={profilePhotoRef}
                  id="founders-profile-photo"
                  name="profile_photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  required
                  aria-labelledby="profile-photo-label"
                  onChange={onProfilePhotoChange}
                />
                {profilePreview ? (
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview */}
                    <img
                      src={profilePreview}
                      alt=""
                      className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-md ring-2 ring-stone-200 sm:h-32 sm:w-32"
                    />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="truncate text-sm font-medium text-stone-800" title={profileFileLabel}>
                        {profileFileLabel}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">This is how it will appear on your profile.</p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <button
                          type="button"
                          onClick={() => profilePhotoRef.current?.click()}
                          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
                        >
                          Change photo
                        </button>
                        <button
                          type="button"
                          onClick={clearProfilePhoto}
                          className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 underline-offset-4 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="founders-profile-photo"
                    className="flex cursor-pointer flex-col items-center justify-center py-4"
                  >
                    <span className="text-sm font-medium text-stone-700">Drop an image or click to upload</span>
                    <span className="mt-1 text-xs text-stone-500">JPG, PNG, or WebP · max 5MB</span>
                  </label>
                )}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input name="linkedin_url" label="LinkedIn (optional)" variant="filled" />
              <Input name="twitter_handle" label="X / Twitter (optional)" variant="filled" />
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                <BuildingOffice2Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Your startup</h2>
                <p className="text-sm text-stone-500">Name, branding, and sector</p>
              </div>
            </div>
            <Input name="startup_name" label="Startup name" isRequired variant="filled" />
            <div className="mt-5">
              <Input name="startup_website" label="Website (optional)" variant="filled" />
            </div>
            <div className="mt-6">
              <span className={labelClass} id="startup-logo-label">
                Startup logo (optional)
              </span>
              <div className="mt-2 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/30 px-4 py-6 transition hover:border-amber-300/80 hover:bg-amber-50/20">
                <input
                  ref={startupLogoRef}
                  id="founders-startup-logo"
                  name="startup_logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-labelledby="startup-logo-label"
                  onChange={onStartupLogoChange}
                />
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob: preview */}
                    <img
                      src={logoPreview}
                      alt=""
                      className="h-20 w-20 rounded-2xl border border-stone-200 bg-white object-contain p-2 shadow-sm sm:h-24 sm:w-24"
                    />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="truncate text-sm font-medium text-stone-800" title={logoFileLabel}>
                        {logoFileLabel}
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <button
                          type="button"
                          onClick={() => startupLogoRef.current?.click()}
                          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50"
                        >
                          Change logo
                        </button>
                        <button
                          type="button"
                          onClick={clearStartupLogo}
                          className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 underline-offset-4 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="founders-startup-logo"
                    className="flex cursor-pointer flex-col items-center justify-center py-2"
                  >
                    <span className="text-sm text-stone-600">Optional logo for cards and profile</span>
                    <span className="mt-1 text-xs text-stone-500">Click to upload · JPG, PNG, or WebP</span>
                  </label>
                )}
              </div>
            </div>
            <div className="mt-8">
              <span className={labelClass}>
                Industry / sector <span className="text-red-500">*</span>
                <span className="ml-1 font-normal text-stone-500">(select all that apply)</span>
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {FOUNDER_INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleIndustry(ind)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      industrySelected.includes(ind)
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-800">
                <DocumentTextIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Details & traction</h2>
                <p className="text-sm text-stone-500">Stage, location, and story</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="stage" className={labelClass}>
                  Startup stage <span className="text-red-500">*</span>
                </label>
                <select id="stage" name="stage" required className={fieldClass}>
                  <option value="">Select…</option>
                  {FOUNDER_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="region" className={labelClass}>
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="region"
                    name="region"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="">Select…</option>
                    {FOUNDER_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="state" className={labelClass}>
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    required
                    disabled={!region}
                    className={`${fieldClass} disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400`}
                  >
                    <option value="">Select…</option>
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                name="year_founded"
                type="number"
                label="Year founded"
                isRequired
                variant="filled"
                min={1900}
                max={2100}
              />

              <div>
                <label htmlFor="one_liner" className={labelClass}>
                  One-line description <span className="text-red-500">*</span>{' '}
                  <span className="font-normal text-stone-500">(max 100 characters)</span>
                </label>
                <textarea
                  id="one_liner"
                  name="one_liner"
                  required
                  maxLength={100}
                  rows={2}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="what_building" className={labelClass}>
                  What are you building? <span className="text-red-500">*</span>{' '}
                  <span className="font-normal text-stone-500">(max 500)</span>
                </label>
                <textarea
                  id="what_building"
                  name="what_building"
                  required
                  maxLength={500}
                  rows={4}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="problem_solving" className={labelClass}>
                  Problem you&apos;re solving <span className="text-red-500">*</span>{' '}
                  <span className="font-normal text-stone-500">(max 300)</span>
                </label>
                <textarea
                  id="problem_solving"
                  name="problem_solving"
                  required
                  maxLength={300}
                  rows={3}
                  className={fieldClass}
                />
              </div>

              <div>
                <span className={labelClass}>Funding <span className="text-red-500">*</span></span>
                <div className="mt-2 flex flex-wrap gap-4">
                  {(['yes', 'no', 'bootstrapped'] as const).map((v) => (
                    <label
                      key={v}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                        funded === v
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="is_funded"
                        value={v}
                        checked={funded === v}
                        onChange={() => setFunded(v)}
                        className="border-stone-300 text-blue-600 focus:ring-blue-500"
                      />
                      {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Bootstrapped'}
                    </label>
                  ))}
                </div>
              </div>

              {funded === 'yes' && (
                <div>
                  <label htmlFor="funding_stage" className={labelClass}>
                    Funding stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="funding_stage"
                    name="funding_stage"
                    required={funded === 'yes'}
                    className={fieldClass}
                  >
                    <option value="">Select…</option>
                    {FOUNDER_FUNDING_STAGES.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          <div className="flex flex-col gap-4 border-t border-stone-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-stone-500">
              By submitting, you agree that information may be shown publicly after approval.
            </p>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full shrink-0 rounded-2xl px-8 py-3 text-base font-semibold shadow-lg shadow-blue-600/20 sm:w-auto"
            >
              Submit application
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
