/**
 * Per-route SEO copy, kept in one place so titles and descriptions can be
 * reviewed as a set rather than hunted across twenty components.
 *
 * Guidelines applied: titles <= ~60 chars so they are not truncated in results,
 * descriptions 120-160 chars, each one unique and written for a searcher rather
 * than stuffed with keywords.
 */
export interface RouteSeo {
  title: string;
  description: string;
  path: string;
}

export const ROUTE_SEO = {
  home: {
    title: 'irookee — Book Verified Experts & Companions',
    description:
      'Describe what you need in plain words and get matched with verified experts, mentors and trusted companions. One-on-one sessions, free while we grow.',
    path: '/',
  },
  experts: {
    title: 'Find & Book Verified Experts',
    description:
      'Browse verified mentors, coaches and specialists across career, health, finance, tech and travel. Filter by category, language, location and rating.',
    path: '/experts',
  },
  companionship: {
    title: 'Companionship — Book a Trusted Companion',
    description:
      'Book a verified companion for hospital visits, shopping, errands, travel, outings, social time, digital help, events and caregiver respite.',
    path: '/companionship',
  },
  companionSearch: {
    title: 'Find a Verified Companion Near You',
    description:
      'Search verified irookee companions for hospital visits, shopping, errands, travel, outings and social time. Companions only — never expert-consulting profiles.',
    path: '/companionship/search',
  },
  companionApply: {
    title: 'Apply as an irookee Companion',
    description:
      'Become a verified irookee companion. Choose the companionship services you offer, set where you can travel in person, and complete ID verification.',
    path: '/companionship/apply',
  },
  leaderboard: {
    title: 'Top-Rated Expert Leaderboard',
    description:
      'See the highest-rated and most-booked experts on irookee, ranked by real completed sessions, attendance and client reviews.',
    path: '/leaderboard',
  },
  about: {
    title: 'About irookee — People for People',
    description:
      'irookee connects people with verified experts and companions for the moments that matter. Learn how we vet, match and support every session.',
    path: '/about',
  },
  blog: {
    title: 'irookee Blog — Guidance & Stories',
    description:
      'Insights and stories on mentorship, companionship and getting the most from a one-on-one expert session.',
    path: '/blog',
  },
  privacy: {
    title: 'Privacy Policy',
    description:
      'How irookee collects, uses, stores and protects your personal data, and the choices and rights you have over it.',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service',
    description:
      'The terms governing your use of irookee, covering bookings, cancellations, conduct, payments and account responsibilities.',
    path: '/terms',
  },
  cookies: {
    title: 'Cookie Policy',
    description:
      'Which cookies irookee uses, what each one does, and how to control them in your browser.',
    path: '/cookies',
  },
  guestProfile: {
    title: 'Apply as a Guest Expert',
    description:
      'Submit your profile to join irookee as a verified expert or companion and start taking one-on-one sessions.',
    path: '/guest-profile',
  },
  auth: {
    title: 'Sign In or Create an Account',
    description: 'Sign in to irookee to book sessions, manage bookings and message your experts.',
    path: '/auth',
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has moved.',
    path: '/404',
  },
} satisfies Record<string, RouteSeo>;

/** Breadcrumb roots reused across pages. */
export const HOME_CRUMB = { name: 'Home', path: '/' };
