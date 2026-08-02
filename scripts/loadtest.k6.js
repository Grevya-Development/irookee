/**
 * k6 load test — models real irookee user journeys against Supabase.
 *
 *   brew install k6     (or: https://k6.io/docs/get-started/installation/)
 *
 *   # ramp to 500 virtual users
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=<key> \
 *     k6 run scripts/loadtest.k6.js
 *
 *   # full 10k-user run (see WARNING below)
 *   ... k6 run -e PROFILE=peak10k scripts/loadtest.k6.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WARNING — POINT THIS AT A STAGING PROJECT, NOT PRODUCTION.
 *
 * The `peak10k` profile is indistinguishable from a denial-of-service attack
 * against your own database. It will burn egress quota (~1.75 GB per full
 * 10k-user cycle at 28 experts, far more as the roster grows), can exhaust the
 * connection pooler, and will degrade or take down the live site for real
 * users. Branch the project (`supabase branches create`) or restore a snapshot
 * into a scratch project first.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const URL = __ENV.SUPABASE_URL;
const KEY = __ENV.SUPABASE_ANON_KEY;
if (!URL || !KEY) throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY');

const PROFILES = {
  // Default: prove the system is healthy before scaling up.
  smoke: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '15s', target: 0 },
  ],
  // Realistic launch day: 10k users spread across an hour.
  launch: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '2m', target: 0 },
  ],
  // The literal ask. Read the warning above before running this.
  peak10k: [
    { duration: '2m', target: 1000 },
    { duration: '3m', target: 5000 },
    { duration: '5m', target: 10000 },
    { duration: '5m', target: 10000 },
    { duration: '2m', target: 0 },
  ],
};

const corpusBytes = new Trend('corpus_payload_bytes');
const corpusTime = new Trend('corpus_duration_ms');
const throttled = new Counter('http_429');
const failures = new Rate('failed_requests');

export const options = {
  stages: PROFILES[__ENV.PROFILE || 'smoke'],
  thresholds: {
    // A user waiting >2s for the expert list has effectively bounced.
    http_req_duration: ['p(95)<2000'],
    failed_requests: ['rate<0.01'],
    http_429: ['count<1'],
  },
};

const H = { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } };

// Mirrors src/lib/searchAgent/index.ts — the single most expensive query.
const CORPUS =
  '/rest/v1/speakers?select=*,speaker_categories(category_id,categories(id,name))' +
  '&or=(verification_status.eq.verified,is_verified.eq.true,verification_status.is.null)';

export default function () {
  group('cold landing page', () => {
    const res = http.batch([
      ['GET', `${URL}${CORPUS}`, null, H],
      ['GET', `${URL}/rest/v1/categories?select=*&order=name`, null, H],
      ['GET', `${URL}/rest/v1/speakers?select=id&verification_status=eq.verified`, null, H],
    ]);
    res.forEach((r) => {
      failures.add(r.status !== 200);
      if (r.status === 429) throttled.add(1);
    });
    corpusBytes.add(res[0].body ? res[0].body.length : 0);
    corpusTime.add(res[0].timings.duration);
    check(res[0], { 'corpus 200': (r) => r.status === 200 });
  });

  sleep(Math.random() * 3 + 2); // user reads the page

  group('view an expert', () => {
    const r = http.get(
      `${URL}/rest/v1/speakers?select=*,speaker_categories(category_id,categories(id,name))&limit=1`,
      H
    );
    failures.add(r.status !== 200);
    if (r.status === 429) throttled.add(1);
  });

  sleep(Math.random() * 4 + 2);

  group('check availability', () => {
    const r = http.get(`${URL}/rest/v1/availability_slots?select=*&limit=20`, H);
    failures.add(r.status !== 200);
    if (r.status === 429) throttled.add(1);
  });

  sleep(Math.random() * 5 + 3);
}

export function handleSummary(data) {
  const m = data.metrics;
  const get = (k, s) => (m[k] && m[k].values ? m[k].values[s] : undefined);
  const mb = (get('corpus_payload_bytes', 'avg') || 0) / 1048576;
  const users = get('vus_max', 'value') || 0;

  const lines = [
    '',
    '='.repeat(64),
    `  peak virtual users     : ${users}`,
    `  requests               : ${get('http_reqs', 'count')}`,
    `  failed                 : ${((get('failed_requests', 'rate') || 0) * 100).toFixed(2)}%`,
    `  HTTP 429 (throttled)   : ${get('http_429', 'count') || 0}`,
    `  latency p50 / p95 / p99: ${(get('http_req_duration', 'med') || 0).toFixed(0)}ms / ` +
      `${(get('http_req_duration', 'p(95)') || 0).toFixed(0)}ms / ` +
      `${(get('http_req_duration', 'p(99)') || 0).toFixed(0)}ms`,
    `  corpus payload (avg)   : ${mb.toFixed(2)} MB`,
    `  egress if 10k users    : ${(mb * 10000).toFixed(0)} MB per refresh cycle`,
    '='.repeat(64),
    '',
  ];
  return { stdout: lines.join('\n') };
}
