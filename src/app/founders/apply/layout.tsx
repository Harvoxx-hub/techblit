import type { Metadata } from 'next';

const SITE = process.env.SITE_URL || 'https://www.techblit.com';

export const metadata: Metadata = {
  title: "Apply to be listed | Founder's Repository",
  description:
    'Submit your startup for review to appear in the TechBlit Founder’s Repository — a curated directory of founders building across Nigeria.',
  openGraph: {
    title: "Apply to be listed | TechBlit Founder's Repository",
    description: 'Tell us about your startup. We review every application.',
    url: `${SITE}/founders/apply`,
    type: 'website',
  },
  alternates: {
    canonical: `${SITE}/founders/apply`,
  },
};

export default function FoundersApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
