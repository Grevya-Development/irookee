/**
 * Companionship service taxonomy.
 *
 * Companionship lets a user book a trusted companion for everyday activities,
 * assistance, outings and social support. Each vertical below is a bookable
 * service.
 *
 * A companion advertises the verticals they offer through ordinary
 * `speakers.topics` / `speakers.expertise` tags (see `servicesFor` in
 * `@/lib/searchAgent`), so the feature needs no schema change: tagging a
 * profile "Hospital Companion" is enough to list them under that service.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Stethoscope,
  ShoppingBag,
  Landmark,
  Plane,
  Footprints,
  MessageCircleHeart,
  Smartphone,
  PartyPopper,
  HeartHandshake,
  CalendarSync,
} from 'lucide-react';

export interface CompanionService {
  /** URL + tag slug. Stable: it is persisted in profile tags. */
  slug: string;
  name: string;
  /** One-line promise shown on cards. */
  tagline: string;
  description: string;
  /** Concrete tasks, shown as a checklist on the detail view. */
  includes: string[];
  icon: LucideIcon;
  /** Tailwind classes for the icon chip. Kept WCAG-safe on white. */
  accent: string;
  /** Typical booking length in minutes, pre-selected in the booking flow. */
  defaultDurationMinutes: number;
  /** Matches the tag text used on companion profiles. */
  profileTag: string;
}

export const COMPANION_SERVICES: CompanionService[] = [
  {
    slug: 'hospital',
    name: 'Hospital Companion',
    tagline: 'Never face an appointment alone',
    description:
      'Accompany someone to appointments, help with registration, queues, pharmacy pickup, reports, transportation, and getting them safely home.',
    includes: [
      'Travel to and from the hospital',
      'Registration, queues and paperwork',
      'Sitting in during consultation if wanted',
      'Collecting reports and prescriptions',
      'Pharmacy pickup',
      'Safe drop back home',
    ],
    icon: Stethoscope,
    accent: 'bg-rose-50 text-rose-700 ring-rose-200',
    defaultDurationMinutes: 180,
    profileTag: 'Hospital Companion',
  },
  {
    slug: 'shopping',
    name: 'Shopping Companion',
    tagline: 'A hand with the bags and the aisles',
    description:
      'Accompany them for groceries, clothes, household purchases, carrying bags, navigation, and more.',
    includes: [
      'Groceries and daily provisions',
      'Clothes and household shopping',
      'Carrying and loading bags',
      'Navigating large stores and markets',
      'Price and label reading help',
    ],
    icon: ShoppingBag,
    accent: 'bg-amber-50 text-amber-700 ring-amber-200',
    defaultDurationMinutes: 120,
    profileTag: 'Shopping Companion',
  },
  {
    slug: 'errands',
    name: 'Errand Companion',
    tagline: 'Paperwork and queues, handled together',
    description:
      'Assist with bank visits, government offices, document collection, bill payments, service centers, and other everyday errands.',
    includes: [
      'Bank and post office visits',
      'Government and municipal offices',
      'Document and certificate collection',
      'Bill payments and renewals',
      'Service centre drop-offs',
    ],
    icon: Landmark,
    accent: 'bg-sky-50 text-sky-700 ring-sky-200',
    defaultDurationMinutes: 120,
    profileTag: 'Errand Companion',
  },
  {
    slug: 'travel',
    name: 'Travel Companion',
    tagline: 'Door-to-door, station to station',
    description:
      'Provide companionship and assistance for airport or station visits, local journeys, or travel between cities.',
    includes: [
      'Airport and railway station assistance',
      'Luggage handling',
      'Check-in and boarding support',
      'Local journeys across the city',
      'Intercity travel accompaniment',
    ],
    icon: Plane,
    accent: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    defaultDurationMinutes: 240,
    profileTag: 'Travel Companion',
  },
  {
    slug: 'outing',
    name: 'Walking / Outing Companion',
    tagline: 'A reason to get outside',
    description:
      'Join users for parks, temples, cafes, movies, events, or simply getting outside.',
    includes: [
      'Morning and evening walks',
      'Parks and gardens',
      'Temple, church or mosque visits',
      'Cafes, movies and local outings',
      'Steady arm-in-arm support if needed',
    ],
    icon: Footprints,
    accent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    defaultDurationMinutes: 90,
    profileTag: 'Walking Companion',
  },
  {
    slug: 'social',
    name: 'Social Companion',
    tagline: 'Company, conversation, presence',
    description:
      'Spend quality time through conversation, games, reading together, having tea, or simply being present for a few hours.',
    includes: [
      'Conversation and listening',
      'Board games, cards and chess',
      'Reading together',
      'Tea and shared meals',
      'Simply being present',
    ],
    icon: MessageCircleHeart,
    accent: 'bg-violet-50 text-violet-700 ring-violet-200',
    defaultDurationMinutes: 120,
    profileTag: 'Social Companion',
  },
  {
    slug: 'digital',
    name: 'Digital Companion',
    tagline: 'Patient help with the screen',
    description:
      'Help with smartphones, video calls, online payments, booking tickets, ordering products or services, and other digital activities.',
    includes: [
      'Smartphone and app basics',
      'Video calls with family',
      'UPI and online payments',
      'Booking tickets and appointments',
      'Ordering products and services',
      'Spotting scams and staying safe online',
    ],
    icon: Smartphone,
    accent: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    defaultDurationMinutes: 90,
    profileTag: 'Digital Companion',
  },
  {
    slug: 'events',
    name: 'Event Companion',
    tagline: 'Arrive with someone beside you',
    description:
      'Accompany users to weddings, functions, religious events, community gatherings, and other social occasions.',
    includes: [
      'Weddings and receptions',
      'Religious ceremonies and functions',
      'Community gatherings',
      'Travel to and from the venue',
      'Support with crowds and seating',
    ],
    icon: PartyPopper,
    accent: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    defaultDurationMinutes: 240,
    profileTag: 'Event Companion',
  },
  {
    slug: 'caregiver-respite',
    name: 'Caregiver Respite',
    tagline: 'Take the break you have earned',
    description:
      'A trusted companion stays with an elderly person for a few hours while their regular caregiver or family member attends to other responsibilities.',
    includes: [
      'Stays at home with your family member',
      'Conversation and light activities',
      'Medication and meal-time reminders',
      'Immediate contact if anything changes',
      'Handover notes when you return',
    ],
    icon: HeartHandshake,
    accent: 'bg-teal-50 text-teal-700 ring-teal-200',
    defaultDurationMinutes: 240,
    profileTag: 'Caregiver Respite',
  },
  {
    slug: 'recurring',
    name: 'Recurring Companion',
    tagline: 'The same familiar face, every week',
    description:
      'Book the same verified companion every week or on a recurring schedule, helping build trust, comfort, and familiarity over time.',
    includes: [
      'The same companion each visit',
      'Weekly or custom schedule',
      'Consistent routine and rapport',
      'Priority rebooking',
      'Adjust or pause any time',
    ],
    icon: CalendarSync,
    accent: 'bg-blue-50 text-blue-700 ring-blue-200',
    defaultDurationMinutes: 120,
    profileTag: 'Recurring Companion',
  },
];

export const SERVICE_BY_SLUG = new Map<string, CompanionService>(
  COMPANION_SERVICES.map((s) => [s.slug, s])
);

export const getCompanionService = (slug?: string | null): CompanionService | undefined =>
  slug ? SERVICE_BY_SLUG.get(slug) : undefined;

/** Trust commitments shown on the Companionship surfaces. */
export const TRUST_POINTS = [
  {
    title: 'Identity verified',
    body: 'Every companion completes ID verification before they can be booked.',
  },
  {
    title: 'Reviewed by the community',
    body: 'Ratings and written reviews come only from completed sessions.',
  },
  {
    title: 'You choose who comes',
    body: 'Browse profiles, languages and experience before you book anyone.',
  },
  {
    title: 'Free while we grow',
    body: 'Companionship sessions carry no platform fee during early access.',
  },
];
