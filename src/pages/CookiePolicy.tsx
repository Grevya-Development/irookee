import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 max-w-4xl prose prose-gray dark:prose-invert">
        <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: 19 April 2026</p>

        <section className="mb-8">
          <p>
            irookee uses cookies and similar tracking technologies to enhance your experience on our
            platform. This policy explains what cookies we use and how you can manage them.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Types of Cookies We Use</h2>
          <div className="space-y-4 not-prose">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-base mb-1">Essential Cookies</h3>
              <p className="text-sm text-muted-foreground">
                Necessary for core platform functionality including authentication (Supabase Auth),
                session management, and secure interactions. The platform cannot function without these.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-base mb-1">Functional Cookies</h3>
              <p className="text-sm text-muted-foreground">
                Remember your preferences such as language settings, timezone, theme preference,
                and recently viewed expert profiles to provide a personalized experience.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-base mb-1">Performance & Analytics Cookies</h3>
              <p className="text-sm text-muted-foreground">
                Help us understand how users interact with the Prompt Engine, booking flows, and
                expert profiles. This data is aggregated and anonymized to improve platform performance
                and user experience.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-base mb-1">AI & Search Cookies</h3>
              <p className="text-sm text-muted-foreground">
                Used by our AI matching models to maintain search context during Smart Prompting sessions,
                enabling more accurate expert recommendations as you refine your query.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Managing Cookies</h2>
          <p>
            You can manage cookie preferences through your browser settings. Most browsers allow you
            to block or delete cookies. However, please note that disabling essential cookies may
            prevent the platform from functioning correctly, particularly during:
          </p>
          <ul className="mt-3 space-y-1">
            <li>Authentication and session management</li>
            <li>Booking and scheduling flows</li>
            <li>Real-time session features</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Cookie Retention</h2>
          <ul className="space-y-2">
            <li><strong>Session Cookies:</strong> Deleted when you close your browser.</li>
            <li><strong>Authentication Cookies:</strong> Persist for up to 30 days for "Remember Me" functionality.</li>
            <li><strong>Preference Cookies:</strong> Persist for up to 12 months.</li>
            <li><strong>Analytics Cookies:</strong> Persist for up to 24 months.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy periodically to reflect changes in our practices or
            applicable regulations. We will notify users of significant changes via email or in-app
            notification.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p>
            Questions about our use of cookies? Contact us at{' '}
            <a href="mailto:kavin@irookee.com" className="text-primary hover:underline">kavin@irookee.com</a>.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  )
}
