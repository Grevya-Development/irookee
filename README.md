# irookee — People for People

irookee is a peer-to-peer expertise marketplace that connects people with verified experts, mentors, and guides for one-on-one sessions across career, life, travel, health, finance, and more. A visitor describes what they need in plain language, gets matched to relevant experts, books a free session (with an auto-generated video link), and can review the expert afterward.

- **Frontend:** Vite + React 18 + TypeScript, Tailwind CSS, shadcn/ui (Radix), React Router, TanStack Query
- **Backend:** Supabase — PostgreSQL + Row Level Security, Auth, Storage (no edge functions; all backend logic lives in SQL — RLS, triggers, and RPCs like `delete_account()`)
- **Analytics:** PostHog (product events + session replay), Vercel Analytics (traffic), Vercel Speed Insights (Core Web Vitals)
- **Payments:** sessions are currently **free**; only client-side Stripe publishable-key scaffolding remains
- **Hosting:** Vercel (single-page app)

---

## Features

### For users
- **Natural-language expert search** — type *"startup mentor in Bangalore"* and get relevance-ranked matches via keyword scoring across expert names, titles, bios, expertise, topics, location, and languages (stopword-aware).
- **Browse by category** — 200+ categories with emoji icons; click through to a filtered expert list.
- **Advanced discovery** — filter by category, language, location, and minimum rating; sort by rating, sessions, or experience. Filters are URL-synced so result views are shareable.
- **Expert profiles** — bio, expertise, topics, languages, experience, tier/badges, gamified stats (attendance, on-time, response, repeat clients), reviews, and social/share-ready meta tags.
- **Booking** — pick a date/time and session format; a Jitsi Meet link is generated automatically. Booking requires sign-in.
- **Reviews** — leave a rating + comment after a session.
- **Accounts** — email/password and OAuth (Google, Apple) via Supabase Auth, password reset, profile setup, guest profiles, settings.

### For experts
- **4-step onboarding wizard** — about you, expertise, links, and submission for verification.
- **Expert dashboard** — manage availability, view bookings and stats.
- **Gamification** — tiers (New → Legend), badges, loyalty points, and a public leaderboard.

### For admins
- **Dedicated, role-gated admin console** at `/admin` (separate login) — user management, expert approvals, payment tracking, and analytics dashboards.

### Platform / quality
- **Live, accurate stats** — homepage hero pulls real expert/category counts and average rating from the database.
- **Trust & conversion signals** — "Verified", "Top rated", and "Popular" chips derived from real data; sticky mobile booking CTA; meaningful empty states.
- **Robustness** — app-wide React error boundary, loading skeletons, and retry-able error states on data fetches.
- **SEO** — unique `<title>`/description per route, Open Graph + Twitter Cards, canonical URLs on a single host, `robots.txt`, a build-time `sitemap.xml` (static + companionship + every verified expert), JSON-LD structured data (Organization, WebSite + SearchAction, ProfilePage/Person with AggregateRating, Service, BreadcrumbList), and `noindex` on private and 404 routes. See [SEO](#seo).

---

## Prerequisites

- **Node.js** 18+ and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A **Supabase** project (free tier is fine)
- Optional: the **Supabase CLI** for local development — [docs](https://supabase.com/docs/guides/cli); the schema can also be applied straight from the SQL editor
- Optional: a **PostHog** project (analytics), a **Vercel** account (hosting + traffic/perf analytics), a **Stripe** account (if you enable paid sessions)

---

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Configure environment

Copy the example file and fill in your values:

```sh
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |
| `VITE_SITE_URL` | recommended | Canonical app URL for auth/redirect/SEO (e.g. `https://irookee.com`). Blank falls back to `window.location.origin`. |
| `VITE_PUBLIC_POSTHOG_KEY` | optional | PostHog project API key (`phc_…`). Blank disables analytics. |
| `VITE_PUBLIC_POSTHOG_HOST` | optional | PostHog host (default `https://us.i.posthog.com`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | optional | Stripe publishable key (only if enabling client-side payments) |

> Only `VITE_`-prefixed variables reach the browser. Server-side secrets (Stripe secret key, service-role key, AI keys) must never be put in this app — everything here ships to every visitor. The non-`VITE_` `POSTHOG_*` keys in `.env` are for server/CLI tooling only.

### 3. Set up the database

The full schema (tables, RLS policies, functions, triggers, storage buckets) lives in a single file: [`supabase/schema.sql`](supabase/schema.sql). Run it in the Supabase SQL editor, or via psql:

```sh
psql "$DATABASE_URL" -f supabase/schema.sql
```

Optional seed data lives in [`scripts/`](scripts/) (`seed-database.sql`, `seed-v2-full-platform.sql`, `seed-v3-referrals-reviews.sql`, `fix-storage-policies.sql`) — run these in the Supabase SQL editor as needed.

### 4. Run the dev server

```sh
npm run dev
```

Vite prints the local URL (it auto-selects a free port, e.g. `http://localhost:8080`).

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Build using development-mode settings |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the project |

---

## Analytics

Three complementary layers, all wired into [`src/App.tsx`](src/App.tsx) / [`src/main.tsx`](src/main.tsx):

| Layer | Measures | Setup |
| --- | --- | --- |
| **PostHog** | Custom product events, funnels, autocapture, session replay | Set `VITE_PUBLIC_POSTHOG_KEY`. Init + helpers live in [`src/lib/analytics.ts`](src/lib/analytics.ts). |
| **Vercel Analytics** | Visitors, top pages, referrers | Enable in Vercel → Analytics. Active on Vercel deploys only. |
| **Vercel Speed Insights** | Core Web Vitals (LCP, CLS, INP, …) | Enable in Vercel → Speed Insights. Active on Vercel deploys only. |

**Instrumented PostHog events:** `$pageview` (SPA route changes), `search_performed`, `expert_profile_viewed`, `booking_started` (tagged by source), `booking_submitted`, `admin_login_success`. Signed-in users are identified by Supabase user id; identity is reset on sign-out. All analytics calls no-op safely when no key is configured.

---

## SEO

| Piece | Where |
| --- | --- |
| Base tags, canonical host, Organization + WebSite JSON-LD | [`index.html`](index.html) |
| Per-route title/description/OG/Twitter, canonical, robots, JSON-LD | [`src/components/Seo.tsx`](src/components/Seo.tsx) |
| Route copy (one place to review every title & description) | [`src/lib/seoMeta.ts`](src/lib/seoMeta.ts) |
| schema.org builders | [`src/lib/structuredData.ts`](src/lib/structuredData.ts) |
| Crawl rules | [`public/robots.txt`](public/robots.txt) |
| Sitemap generator (runs in `npm run build`) | [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs) |

**Canonical host.** `VITE_SITE_URL` drives canonical and OG URLs, and the sitemap's `<loc>` values. It must be set in production — `irookee.com` and `irookee.vercel.app` serve identical content, so without it they compete as duplicates.

**Sitemap.** Regenerate any time with `npm run sitemap`. It queries Supabase for verified experts, so `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` must be present at build time; without them it still emits the static and companionship routes and warns rather than failing the build.

**Private routes** (`/dashboard`, `/settings`, `/booking`, `/admin`, `/auth`, `/profile-setup`) are `Disallow`ed in robots.txt *and* carry `noindex` — belt and braces, because the SPA rewrite means they return HTTP 200 rather than a redirect.

**Known limitation — soft 404s.** `vercel.json` rewrites every path to `index.html`, so unknown URLs return **HTTP 200** with the 404 page rather than a 404 status. `noindex` on `NotFound` keeps them out of the index, but Search Console may still report them as Soft 404s. A real fix needs prerendering or an edge function that returns a genuine 404 status.

## Admin Console

A **separate, self-contained route** at `/admin` with its own login screen (independent of `/auth`).

- Authentication goes through Supabase Auth (`signInWithPassword`); no credentials are stored in the client.
- After sign-in, access is verified against the backend `is_admin()` RPC (backed by the `user_roles` table + RLS). Non-admin accounts are signed out automatically.
- Admins are granted the `admin` role on signup via the `handle_new_user()` trigger; see the "admin_grevya" section of [`supabase/schema.sql`](supabase/schema.sql).

**Create an admin user:** add the user in the Supabase dashboard (Authentication → Users → *Add user*, auto-confirm). The trigger grants the admin role for the configured admin email automatically. Keep the email consistent between [`src/lib/auth.ts`](src/lib/auth.ts) and the trigger in `schema.sql`.

---

## Project Structure

```
.
├── public/                     # Static assets (favicons, logos, OG image)
├── scripts/                    # SQL seed / fix scripts
├── supabase/
│   └── schema.sql              # Full database schema in one file (tables, RLS, functions, triggers)
├── src/
│   ├── components/
│   │   ├── admin/              # Admin console + dedicated AdminLogin
│   │   ├── booking/            # Booking calendar, confirmation, search bar
│   │   ├── expert/             # Expert onboarding & dashboard
│   │   ├── gamification/       # Badges, tiers, leaderboard, loyalty
│   │   ├── sections/           # Landing page sections (hero/stats/footer)
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── ErrorBoundary.tsx   # App-wide crash fallback
│   │   ├── Seo.tsx             # Per-page meta / OG / Twitter tags
│   │   ├── ExpertCardSkeleton.tsx
│   │   ├── ExpertGrid.tsx / CategoryGrid.tsx / ExpertCard.tsx
│   │   └── AuthProvider.tsx / Navigation.tsx / BookingModal.tsx
│   ├── hooks/                  # useAuth, useBookings, useExperts, useAISearch, usePlatformStats
│   ├── integrations/supabase/  # Supabase client + generated types
│   ├── lib/                    # analytics, auth, searchExperts, siteUrl, utils
│   ├── pages/                  # Route-level pages
│   ├── types/                  # Shared TypeScript types
│   ├── App.tsx                 # Routes + providers + analytics
│   └── main.tsx                # App entry + PostHog init
├── vercel.json                 # SPA rewrite config
└── vite.config.ts
```

### Routes

| Path | Page | Access |
| --- | --- | --- |
| `/`, `/home` | Landing / natural-language search | Public |
| `/search` | Search + filters | Public |
| `/speakers` | Browse experts (category-filterable) | Public |
| `/expert/:id` | Expert profile | Public |
| `/leaderboard` | Expert leaderboard | Public |
| `/booking` | Booking flow | Auth |
| `/dashboard`, `/user-dashboard` | User dashboard | Auth |
| `/expert/onboarding`, `/expert/dashboard` | Expert onboarding & dashboard | Auth |
| `/settings`, `/profile-setup`, `/guest-profile` | Account | Auth |
| `/auth` | Public sign in / sign up | Public |
| `/admin` | Admin console (role-gated) | Admin |
| `/about`, `/blog`, `/privacy`, `/terms`, `/cookies` | Static | Public |

---

## Data Model (Supabase, high level)

- **speakers** — expert profiles (name, title, bio, expertise, topics, languages, location, rating, sessions, verification_status, hourly_rate, etc.)
- **categories** / **speaker_categories** — taxonomy + many-to-many join
- **profiles** — user profiles (created on signup via trigger)
- **user_roles** + `app_role` enum + `has_role()` / `is_admin()` — RBAC, enforced by RLS
- **expertise_bookings** — bookings (date, duration, status, meeting link, amount)
- **reviews** — ratings + comments per expert
- gamification tables — achievements/badges, stats, loyalty

RLS policies restrict reads/writes per user; admin-only operations check `has_role(auth.uid(), 'admin')`.

---

## Deployment (Vercel)

This is a Vite single-page app. [`vercel.json`](vercel.json) rewrites all routes to `index.html` so client-side routes (e.g. `/admin`) resolve on direct navigation and refresh:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Steps:

1. Import the repository into Vercel (auto-detects Vite: build `npm run build`, output `dist/`).
2. Add the `VITE_*` environment variables (Project → Settings → Environment Variables).
3. Enable **Analytics** and **Speed Insights** in the Vercel project dashboard.
4. Push to deploy.

There is nothing else to deploy — the app has no edge functions or server components; all backend behavior is enforced in the database (`supabase/schema.sql`).

---

## Documentation

A full end-to-end Product Requirements Document is included at [`docs/irookee-PRD.docx`](docs/irookee-PRD.docx).

---

## License

Proprietary — all rights reserved.
