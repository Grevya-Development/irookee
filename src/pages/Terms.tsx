import Navigation from '@/components/Navigation'
import Footer from '@/components/sections/Footer'

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 max-w-4xl prose prose-gray dark:prose-invert">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last Updated: 19 April 2026</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">1. The irookee Marketplace</h2>
          <p>
            irookee acts as an intermediary infrastructure layer connecting users (Help-Seekers) with
            verified experts across 200+ categories. We do not provide professional advice directly —
            all consultations are guidance-based and do not constitute formal medical diagnosis,
            legal representation, financial advice, or any other professional service requiring
            statutory licensing.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3 not-prose">
            <p className="text-sm text-amber-800">
              <strong>Disclaimer:</strong> Sessions on irookee are for informational and guidance purposes only.
              For medical emergencies, legal proceedings, or financial decisions, always consult a licensed
              professional in your jurisdiction.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">2. Expert Obligations</h2>
          <ul className="space-y-2">
            <li><strong>Verification:</strong> All experts must undergo mandatory KYC (Know Your Customer) and credential verification before their profile goes live. This includes submitting government-issued ID and professional certificates.</li>
            <li><strong>Response SLA:</strong> Experts must respond to booking requests within 6 hours. Failure to respond results in automatic decline and impacts the Expert Trust Index.</li>
            <li><strong>Attendance:</strong> Experts are expected to attend all confirmed sessions. A session is marked as an expert no-show if the expert does not join within 10 minutes of the scheduled start time.</li>
            <li><strong>No-Show Policy:</strong>
              <ul className="mt-2 space-y-1">
                <li>1st no-show in 90 days: Warning notification</li>
                <li>2nd no-show in 90 days: Tier review + 14-day search rank suppression</li>
                <li>3rd no-show in 90 days: 7-day account suspension + re-onboarding review</li>
                <li>5+ no-shows in 12 months: Permanent ban from the platform</li>
              </ul>
            </li>
            <li><strong>Content Policy:</strong> Experts must not solicit off-platform payments, share personal contact details before completing 3 mutual bookings, or engage in any form of harassment or discrimination.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">3. User Obligations</h2>
          <ul className="space-y-2">
            <li><strong>Booking Commitment:</strong> A confirmed booking is a commitment. Users must cancel at least 4 hours before the session to avoid a no-show flag.</li>
            <li><strong>No-Show Escalation:</strong>
              <ul className="mt-2 space-y-1">
                <li>1st no-show in 90 days: Warning notification</li>
                <li>2nd no-show in 90 days: Attendance flag visible to experts</li>
                <li>3rd no-show in 90 days: Account restrictions applied</li>
                <li>5+ lifetime no-shows: Experts may auto-decline bookings</li>
              </ul>
            </li>
            <li><strong>Reviews:</strong> Users are encouraged to leave honest, constructive reviews after every session. Reviews must be based on the actual session, at least 20 words for written reviews, and submitted within 7 days.</li>
            <li><strong>Respectful Conduct:</strong> Users must treat experts with respect during sessions. Harassment, abuse, or discriminatory behavior results in immediate account suspension.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">4. Platform Pricing</h2>
          <p>
            irookee is currently <strong>free for all users and experts</strong> during our launch phase.
            No fees are charged for bookings, sessions, or platform usage. When paid features are introduced
            in the future, users and experts will be notified in advance with clear pricing details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">5. Gamification & Loyalty</h2>
          <ul className="space-y-2">
            <li><strong>Non-Monetary Value:</strong> XP (Experience Points), badges, and tier levels have no direct cash value. They influence platform visibility, search ranking, and eligibility for special programs.</li>
            <li><strong>Rookee Points:</strong> User loyalty points expire after 12 months of inactivity. Points balance is visible on the user dashboard.</li>
            <li><strong>Tier System:</strong> Expert tiers (Newcomer through Legend) are recalculated every 30 days based on rolling 90-day performance. Experts can move up or down tiers.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">6. Mutual Rating System</h2>
          <p>
            After every session, both users and experts may rate each other. Expert ratings are public
            and contribute to their overall score. User attendance rates and reliability scores are
            visible to experts when reviewing booking requests. This two-way accountability system
            ensures quality for both sides of the marketplace.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">7. Intellectual Property</h2>
          <p>
            All platform content, including the irookee brand, Prompt Engine technology, gamification
            systems, and UI/UX design, is the intellectual property of irookee. Expert-generated content
            (session recordings, course materials) remains the property of the respective expert unless
            otherwise agreed.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">8. Account Termination</h2>
          <p>
            Users and experts may delete their accounts at any time via Settings. irookee reserves the
            right to suspend or terminate accounts that violate these terms, engage in fraudulent activity,
            or pose a risk to platform safety. Upon termination, personal data will be handled per our
            Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">9. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
            jurisdiction of the courts in Bangalore, Karnataka, India.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-3">Contact</h2>
          <p>
            Questions about these terms? Reach us at{' '}
            <a href="mailto:kavin@irookee.com" className="text-primary hover:underline">kavin@irookee.com</a>.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  )
}
