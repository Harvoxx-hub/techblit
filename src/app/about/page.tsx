import Link from 'next/link';
import Navigation from '@/components/ui/Navigation';
import Footer from '@/components/ui/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - TechBlit | African Tech News Platform',
  description: 'TechBlit is Africa\'s leading tech news platform, covering startups, innovation, funding, and technology developments across the continent. Discover our mission to ignite Africa\'s tech conversation.',
  keywords: ['African tech', 'tech news platform', 'Nigeria tech', 'startup news', 'African innovation', 'tech journalism'],
  openGraph: {
    title: 'About Us - TechBlit',
    description: 'TechBlit is Africa\'s leading tech news platform, covering startups, innovation, funding, and technology developments.',
    type: 'website',
    url: 'https://techblit.com/about',
  },
  alternates: {
    canonical: 'https://techblit.com/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* About Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About TechBlit</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Welcome to TechBlit, your go-to destination for the latest in technology, 
              programming, and digital innovation. We're passionate about sharing knowledge 
              and insights that help developers and tech enthusiasts stay ahead of the curve.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-6">
              At TechBlit, we believe in making technology accessible to everyone. Our mission 
              is to provide high-quality, practical content that bridges the gap between complex 
              technical concepts and real-world applications.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What We Cover</h2>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Web Development & Frameworks</li>
              <li>Mobile App Development</li>
              <li>Cloud Computing & DevOps</li>
              <li>AI & Machine Learning</li>
              <li>Cybersecurity Best Practices</li>
              <li>Programming Languages & Tools</li>
              <li>Tech Industry News & Trends</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Built with Modern Tech</h2>
            <p className="text-gray-700 mb-6">
              TechBlit is built using cutting-edge technologies including Next.js, Firebase, 
              and Tailwind CSS. We practice what we preach by using the latest tools and 
              frameworks to deliver a fast, responsive, and modern user experience.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Get in Touch</h3>
              <p className="text-blue-800">
                Have questions, suggestions, or want to contribute? We'd love to hear from you! 
                Reach out to us through our contact channels or follow us on social media.
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link 
              href="/" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
