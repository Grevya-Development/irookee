import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 max-w-4xl prose prose-gray dark:prose-invert">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: 19 April 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Introduction</h2>
          <p>
            irookee ("we," "us," or "our") is committed to protecting the privacy of our users (Help-Seekers)
            and Experts. This policy explains how we collect, use, and safeguard your information across our
            web and mobile applications.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
          <ul className="space-y-3 list-none pl-0">
            <li className="p-3 bg-muted/50 rounded-lg">
              <strong>Identity Data:</strong> Full name, government-issued IDs for KYC, and professional
              credentials for Experts.
            </li>
            <li className="p-3 bg-muted/50 rounded-lg">
              <strong>Contact Data:</strong> Email address, phone number, and physical address.
            </li>
            <li className="p-3 bg-muted/50 rounded-lg">
              <strong>Professional Data:</strong> Work history, professional certifications, and introductory
              videos for Experts.
            </li>
            <li className="p-3 bg-muted/50 rounded-lg">
              <strong>Session Data:</strong> Session recordings (with consent), notes, and AI-generated
              transcripts.
            </li>
            <li className="p-3 bg-muted/50 rounded-lg">
              <strong>Technical Data:</strong> IP address, device type, browser information, and usage
              patterns for platform improvement.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">How We Use Your Data</h2>
          <ul className="space-y-2">
            <li><strong>AI Matching:</strong> Our Prompt Engine uses natural language processing to match users with the most relevant experts for their needs.</li>
            <li><strong>Verification:</strong> To perform identity and credential verification for expert onboarding, ensuring platform trust and safety.</li>
            <li><strong>Platform Health:</strong> To calculate Expert Trust Indices, response rates, attendance rates, and User Trust Scores that maintain marketplace quality.</li>
            <li><strong>Gamification:</strong> To power the tier system, badge awards, XP tracking, and Rookee Points that reward engagement.</li>
            <li><strong>Communication:</strong> To send booking confirmations, session reminders, review prompts, and platform updates.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Data Retention & Security</h2>
          <ul className="space-y-2">
            <li><strong>Session Data:</strong> Stored in encrypted format for a default of 90 days after session completion.</li>
            <li><strong>Expert Documents:</strong> KYC documents are encrypted at rest and permanently deleted 6 months after account closure.</li>
            <li><strong>Infrastructure:</strong> Data is hosted on secure cloud infrastructure with industry-standard encryption (AES-256) in transit and at rest.</li>
            <li><strong>Access Control:</strong> Role-based access ensures only authorized personnel can view sensitive data.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
          <p>Under the Digital Personal Data Protection (DPDP) Act, 2023 (India) and GDPR (EU), you have the right to:</p>
          <ul className="space-y-2 mt-3">
            <li><strong>Access:</strong> Request a copy of all personal data we hold about you.</li>
            <li><strong>Erasure:</strong> Request deletion of your account and associated data within 30 days.</li>
            <li><strong>Export:</strong> Download your session history, reviews, and profile data in a portable format.</li>
            <li><strong>Rectification:</strong> Update or correct inaccurate personal information at any time via Settings.</li>
            <li><strong>Withdraw Consent:</strong> Opt out of non-essential data processing at any time.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Third-Party Services</h2>
          <p>
            We use select third-party services for authentication (Supabase Auth), analytics, and infrastructure.
            These services process data under their own privacy policies and are contractually bound to protect your information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
          <p>
            For privacy-related inquiries, data access requests, or concerns, contact our Data Protection team at{' '}
            <a href="mailto:kavin@irookee.com" className="text-primary hover:underline">kavin@irookee.com</a>.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  )
}
