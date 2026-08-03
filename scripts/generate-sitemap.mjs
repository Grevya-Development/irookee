/**
 * Build-time sitemap generator.
 *
 * The most valuable URLs on this site are dynamic — one page per verified
 * expert — so a hand-written sitemap goes stale immediately. This queries
 * Supabase at build time and writes dist/sitemap.xml.
 *
 * Runs as part of `npm run build`. It must never fail the build: if Supabase is
 * unreachable it still emits the static routes and warns, because shipping a
 * partial sitemap beats shipping none.
 *
 *   node scripts/generate-sitemap.mjs [outDir]
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Vite loads .env for the app bundle, but a plain node script does not — without
 * this the generator silently produces a sitemap with zero experts.
 * CI/Vercel environment variables take precedence over the local files.
 */
function loadEnvFiles() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!match) continue;
      const key = match[1];
      if (process.env[key]) continue; // real env wins
      process.env[key] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
loadEnvFiles();

const OUT_DIR = process.argv[2] || 'dist';
const SITE = (process.env.VITE_SITE_URL || 'https://irookee.com').replace(/\/+$/, '');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

/** Companionship slugs — keep in sync with src/lib/companionship.ts. */
const COMPANION_SLUGS = [
  'hospital', 'shopping', 'errands', 'travel', 'outing',
  'social', 'digital', 'events', 'caregiver-respite', 'recurring',
];

/** Public, indexable routes. Private/auth routes are excluded (see robots.txt). */
const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/experts', changefreq: 'daily', priority: '0.9' },
  { path: '/companionship', changefreq: 'weekly', priority: '0.9' },
  // The companion listing, mirroring /experts. The /companionship/apply form is
  // excluded, exactly as /expert/onboarding is.
  { path: '/companionship/search', changefreq: 'daily', priority: '0.8' },
  { path: '/leaderboard', changefreq: 'weekly', priority: '0.6' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/blog', changefreq: 'weekly', priority: '0.4' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookies', changefreq: 'yearly', priority: '0.3' },
];

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]
  );

const isoDate = (value) => {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10)
                                   : d.toISOString().slice(0, 10);
};

async function fetchExperts() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[sitemap] Supabase env vars absent — emitting static routes only.');
    return [];
  }
  // Mirrors the public listing rule in src/lib/searchAgent: anything a visitor
  // can actually reach. Unverified profiles must not be advertised to crawlers.
  const query =
    '/rest/v1/speakers?select=id,updated_at' +
    '&or=(verification_status.eq.verified,is_verified.eq.true)';
  try {
    const res = await fetch(SUPABASE_URL + query, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] Could not load experts (${err.message}) — static routes only.`);
    return [];
  }
}

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n');

const experts = await fetchExperts();
const today = isoDate();

const entries = [
  ...STATIC_ROUTES.map((r) => ({ loc: `${SITE}${r.path}`, lastmod: today, ...r })),
  ...COMPANION_SLUGS.map((slug) => ({
    loc: `${SITE}/companionship/${slug}`,
    lastmod: today,
    changefreq: 'weekly',
    priority: '0.8',
  })),
  ...experts.map((e) => ({
    loc: `${SITE}/expert/${e.id}`,
    lastmod: isoDate(e.updated_at),
    changefreq: 'weekly',
    priority: '0.7',
  })),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.map(urlEntry).join('\n') +
  '\n</urlset>\n';

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'sitemap.xml'), xml, 'utf8');

console.log(
  `[sitemap] ${entries.length} URLs -> ${join(OUT_DIR, 'sitemap.xml')} ` +
  `(${STATIC_ROUTES.length} static, ${COMPANION_SLUGS.length} companionship, ${experts.length} experts)`
);
