import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import WritersHero from '@/components/ui/WritersHero';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a TechBlit Contributor - Write, Learn, Grow | TechBlit',
  description: 'Join TechBlit as a writer, contributor, or researcher. Build your portfolio, get published, and document the tech ecosystem in South-South & South-East Nigeria. Apply now!',
  keywords: ['tech writing', 'tech journalism', 'Nigeria tech writers', 'tech contributors', 'writing internship', 'tech blog writers', 'startup journalism', 'tech content writers'],
  openGraph: {
    title: 'Become a TechBlit Contributor - Write, Learn, Grow',
    description: 'Join TechBlit as a writer and build your portfolio while documenting the tech ecosystem in Nigeria.',
    type: 'website',
    url: 'https://techblit.com/writers',
  },
  alternates: {
    canonical: 'https://techblit.com/writers',
  },
};

export default function WritersPage() {
  const googleFormUrl = 'https://forms.gle/2pEhnV6gdGXomdDX6'; // Replace with actual Google Form URL

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: 'TechBlit Contributor - Writer, Researcher, Intern',
    description: 'Join TechBlit as a writer, contributor, or researcher. Build your portfolio, get published, and document the tech ecosystem in South-South & South-East Nigeria.',
    identifier: {
      '@type': 'PropertyValue',
      name: 'TechBlit',
      value: 'writers-application',
    },
    datePosted: new Date().toISOString(),
    employmentType: 'INTERN',
    hiringOrganization: {
      '@type': 'Organization',
      name: 'TechBlit',
      sameAs: 'https://techblit.com',
      logo: 'https://techblit.com/logo.png',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'South-South & South-East Nigeria',
        addressCountry: 'NG',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'NGN',
      value: {
        '@type': 'QuantitativeValue',
        value: 0,
        unitText: 'Unpaid internship with portfolio building and mentorship opportunities',
      },
    },
    qualifications: 'Basic writing skills, interest in tech/startups, willingness to learn, active on WhatsApp, 3-5 hours weekly commitment',
    responsibilities: 'Write 1 article per week or bi-weekly, attend virtual onboarding, follow editorial guidelines, participate in research assignments, engage in community group',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navigation />
      
      {/* Hero Section */}
      <WritersHero googleFormUrl={googleFormUrl} />

      {/* About TechBlit Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            About TechBlit
          </h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              TechBlit is a leading tech media platform dedicated to documenting the tech ecosystem, 
              startups, talents, founders, and innovation stories in <strong>South–South & South–East Nigeria</strong>.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              Our mission is to <strong>document the tech ecosystem, startups, talents, founders, and innovation stories</strong> in the region. 
              We cover everything from early-stage startups to established tech companies, funding rounds, 
              founder interviews, and ecosystem events.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Through our media house, events, partnerships, and extensive outreach, we've built a platform 
              that reaches thousands of readers across Nigeria and beyond. When you write for TechBlit, 
              your work reaches real industry stakeholders, founders, investors, and tech enthusiasts.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Are Looking For Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Who We Are Looking For
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">
                Contributors
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Occasional article writers who want to share their insights and build their writing portfolio.
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-3">
                Intern Writers
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                90-day structured learning & writing program for those serious about tech journalism.
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
                Research Assistants
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Focus on tech, startup, and ecosystem research to support our editorial team.
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-300 mb-3">
                Campus/Community Correspondents
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Local tech reporting from universities and communities across the region.
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 md:col-span-2">
              <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-300 mb-3">
                Editors-in-Training
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                For those who show exceptional promise during the internship period. 
                Top performers get the opportunity to take on editorial responsibilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What They Will Get Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What You Will Get
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Build a Verified Writing Portfolio</h3>
                <p className="text-gray-700 dark:text-gray-300">Get real bylines on published articles that showcase your work to future employers and clients.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Get Published on TechBlit Authors Portal</h3>
                <p className="text-gray-700 dark:text-gray-300">Your articles will be featured on our dedicated authors portal, giving you professional visibility.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Work with a Structured Editorial Team</h3>
                <p className="text-gray-700 dark:text-gray-300">Learn from experienced editors and receive constructive feedback to improve your writing.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Improve Writing, Storytelling, and Research Skills</h3>
                <p className="text-gray-700 dark:text-gray-300">Develop professional-grade skills through hands-on experience and mentorship.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Join Private Workshops & Masterclasses</h3>
                <p className="text-gray-700 dark:text-gray-300">Access exclusive training sessions on writing, journalism, and tech ecosystem knowledge.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Priority Access to TechBlit Events & Founder Interviews</h3>
                <p className="text-gray-700 dark:text-gray-300">Get exclusive access to industry events and opportunities to interview founders and tech leaders.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Top Performers Get Official Roles & Recommendation Letters</h3>
                <p className="text-gray-700 dark:text-gray-300">Outstanding contributors receive official positions and professional recommendation letters for future opportunities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Apply Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            How to Apply
          </h2>
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-8 md:p-12 rounded-lg shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-center">Ready to Join Us?</h3>
            <p className="text-lg mb-6 text-center text-blue-100">
              Before you apply, please ensure you meet these requirements:
            </p>
            <ul className="space-y-3 mb-8 max-w-2xl mx-auto">
              <li className="flex items-start">
                <span className="text-yellow-300 mr-3 font-bold">✓</span>
                <span>Must be active on <strong>WhatsApp</strong> for team communication</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-3 font-bold">✓</span>
                <span>Must be willing to <strong>learn and receive editorial corrections</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-3 font-bold">✓</span>
                <span>Must have <strong>basic writing skills</strong> (perfect English not required, but willingness to improve is essential)</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-3 font-bold">✓</span>
                <span>Should be <strong>interested in tech, startups, or storytelling</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-300 mr-3 font-bold">✓</span>
                <span>Should commit at least <strong>3–5 hours weekly</strong> to writing and research</span>
              </li>
            </ul>
            <div className="text-center">
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-yellow-400 text-blue-900 px-10 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Apply as a Writer / Contributor / Researcher
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <summary className="font-bold text-lg text-gray-900 dark:text-white cursor-pointer">
                Is this paid?
              </summary>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                This is an unpaid internship/contribution opportunity focused on building your portfolio and skills. 
                However, top performers receive official roles, recommendation letters, and priority access to paid opportunities 
                and events. The value is in the portfolio, bylines, mentorship, and networking opportunities.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <summary className="font-bold text-lg text-gray-900 dark:text-white cursor-pointer">
                What happens after 90 days?
              </summary>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                After the 90-day period, we conduct a performance review. The top 5–10 performers are retained 
                with official roles, recommendation letters, and continued writing opportunities. Others may continue 
                as occasional contributors or use their portfolio and experience for other opportunities.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <summary className="font-bold text-lg text-gray-900 dark:text-white cursor-pointer">
                Will I get bylines?
              </summary>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                Yes! All published articles include your byline, and you'll be featured on the TechBlit Authors Portal. 
                This gives you verified, professional writing credits for your portfolio.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <summary className="font-bold text-lg text-gray-900 dark:text-white cursor-pointer">
                Do I need experience?
              </summary>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                No prior professional writing experience is required. We're looking for people with basic writing skills, 
                a willingness to learn, and an interest in tech, startups, or storytelling. Our editorial team will 
                provide guidance and feedback to help you improve.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <summary className="font-bold text-lg text-gray-900 dark:text-white cursor-pointer">
                Is there training?
              </summary>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                Yes! We provide virtual onboarding, regular feedback sessions, private workshops, and masterclasses 
                on writing, journalism, and the tech ecosystem. You'll work closely with our editorial team who will 
                mentor you throughout the process.
              </p>
            </details>
            <details className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <summary className="font-bold text-lg text-gray-900 dark:text-white cursor-pointer">
                Can I write remotely?
              </summary>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                Yes, this is a fully remote opportunity. All communication happens via WhatsApp/Slack, and you can 
                work from anywhere. However, priority access to events and founder interviews may require occasional 
                in-person attendance (when applicable).
              </p>
            </details>
            <details className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <summary className="font-bold text-lg text-gray-900 dark:text-white cursor-pointer">
                Are there age limits?
              </summary>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                No, there are no age limits. We welcome students, recent graduates, career changers, and anyone 
                passionate about tech journalism and storytelling, regardless of age.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Ending Section - Community + Soft CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join a Community of Passionate Writers
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Documenting technology and innovation in Nigeria. Your voice matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Apply Now
            </a>
            <Link
              href="/"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Learn More About TechBlit
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

