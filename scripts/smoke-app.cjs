/**
 * Application smoke test: every route + the critical user journeys.
 *
 * Requires Playwright, which is intentionally NOT a dependency of this app
 * (it pulls a browser download). Install it when you want to run this:
 *   npm i -D playwright && npx playwright install chromium
 *
 * Usage:
 *   npm run dev            # or: npm run build && npm run preview
 *   npm run smoke:app
 *   SMOKE_BASE=http://localhost:4173 npm run smoke:app   # against a prod build
 */
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error(
    '\nsmoke:app needs Playwright.\n' +
      '  npm i -D playwright && npx playwright install chromium\n' +
      '\n(scripts/smoke-backend.mjs has no such dependency and can run right now.)\n'
  );
  process.exit(2);
}
const BASE = process.env.SMOKE_BASE || 'http://localhost:8080';

let pass = 0, fail = 0;
const ok = (m, d) => { console.log(`  PASS  ${m}${d ? ' :: ' + d : ''}`); pass++; };
const no = (m, d) => { console.log(`  FAIL  ${m}${d ? ' :: ' + d : ''}`); fail++; };
const t = (m, cond, d) => (cond ? ok(m, d) : no(m, d));

const IGNORE = [
  /Structural CSS detected/,
  /404 Error: User attempted/,
  /script-src.*not explicitly set/,
  /Failed to load resource/,
];

async function mk(browser, vp = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const txt = m.text();
    if (!IGNORE.some((re) => re.test(txt))) page.errs.push(txt.slice(0, 160));
  });
  page.on('pageerror', (e) => page.errs.push('PAGEERROR ' + String(e).slice(0, 160)));
  return { ctx, page };
}
const go = (p, u) => p.goto(BASE + u, { waitUntil: 'domcontentloaded', timeout: 30000 });

const ROUTES = [
  '/', '/home', '/experts', '/search', '/speakers', '/companionship',
  '/companionship/hospital', '/companionship/social',
  '/companionship/search', '/companionship/apply', '/leaderboard',
  '/about', '/blog', '/privacy', '/terms', '/cookies', '/guest-profile',
  '/auth', '/admin', '/booking', '/expert/onboarding',
  '/definitely-not-a-route',
];

(async () => {
  // SMOKE_CHANNEL=chrome runs against a locally installed Chrome, so the suite
  // works without downloading Playwright's bundled browser.
  const browser = await chromium.launch(
    process.env.SMOKE_CHANNEL ? { channel: process.env.SMOKE_CHANNEL } : {}
  );

  console.log(`\n=== A. Route smoke (desktop) — ${BASE} ===`);
  {
    const { ctx, page } = await mk(browser);
    for (const r of ROUTES) {
      await go(page, r);
      await page.waitForTimeout(r === '/auth' || r === '/admin' ? 9000 : 4000);
      const s = await page.evaluate(() => {
        const root = document.getElementById('root');
        const txt = (root?.innerText || '').trim();
        return {
          len: txt.length,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          stuck: txt === 'Loading...' || txt === '',
        };
      });
      t(`${r}`, s.len > 0 && !s.overflow && !s.stuck,
        `chars=${s.len}${s.overflow ? ' OVERFLOW' : ''}${s.stuck ? ' BLANK/STUCK' : ''}`);
    }
    t('no unexpected console errors across all routes', page.errs.length === 0, page.errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  console.log('\n=== B. Route smoke (mobile 390px) ===');
  {
    const { ctx, page } = await mk(browser, { width: 390, height: 844 });
    for (const r of ['/', '/experts', '/companionship', '/companionship/hospital', '/leaderboard', '/terms']) {
      await go(page, r);
      await page.waitForTimeout(4000);
      const s = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        len: (document.getElementById('root')?.innerText || '').trim().length,
      }));
      t(`${r} @390px`, !s.overflow && s.len > 0, s.overflow ? 'HORIZONTAL OVERFLOW' : `chars=${s.len}`);
    }
    await ctx.close();
  }

  console.log('\n=== C. Journey: semantic search ===');
  {
    const { ctx, page } = await mk(browser);

    // An ADVISORY natural-language query is what the expert search is for.
    // (This used to use "someone to take my mother to the hospital" — a
    // companionship request — and passed only because companionship concepts bled
    // onto advisory experts. That was COMP-4, so the query moved to section E.)
    await go(page, '/experts?q=' + encodeURIComponent('I want to raise a seed round for my startup'));
    await page.waitForTimeout(9000);
    const s = await page.evaluate(() => {
      const txt = document.getElementById('root')?.innerText || '';
      return {
        results: document.querySelectorAll('h3').length,
        empty: /No experts match your search/i.test(txt),
        chips: Array.from(document.querySelectorAll('span.rounded-full.bg-primary\\/10')).map((e) => e.textContent),
      };
    });
    t('natural-language query returns results', s.results > 0 && !s.empty, `results=${s.results}`);
    t('match-reason chips rendered', s.chips.length > 0, JSON.stringify(s.chips.slice(0, 3)));

    // Service boundary: a companionship request must not surface advisory experts
    // tagged as companions on the expert search either (COMP-4).
    await go(page, '/experts?q=' + encodeURIComponent('someone to take my mother to the hospital'));
    await page.waitForTimeout(9000);
    const boundary = await page.evaluate(() => ({
      companionChips: Array.from(document.querySelectorAll('span.rounded-full.bg-primary\\/10'))
        .map((e) => e.textContent.trim())
        .filter((txt) => /companion/i.test(txt)),
    }));
    t(
      'expert search never labels an expert as a companionship match',
      boundary.companionChips.length === 0,
      JSON.stringify(boundary.companionChips.slice(0, 3))
    );

    // nonsense query must return the empty state, not noise
    await go(page, '/experts?q=zzzqqqxyzzy');
    await page.waitForTimeout(8000);
    const n = await page.evaluate(() => /No experts match your search/i.test(document.getElementById('root')?.innerText || ''));
    t('nonsense query shows empty state (no noise)', n);
    await ctx.close();
  }

  console.log('\n=== D. Journey: search filters + clear ===');
  {
    const { ctx, page } = await mk(browser);
    await go(page, '/experts?location=Mars');
    await page.waitForSelector('text=No experts match your search', { timeout: 25000 }).catch(() => {});
    await page.getByRole('button', { name: /Clear Search & Filters/i }).click();
    await page.waitForTimeout(4000);
    const s = await page.evaluate(() => ({
      url: location.pathname + location.search,
      loc: document.getElementById('location')?.value,
      empty: /No experts match your search/i.test(document.getElementById('root')?.innerText || ''),
    }));
    t('clear filters resets URL, input and results', !s.url.includes('Mars') && !s.loc && !s.empty, JSON.stringify(s));
    await ctx.close();
  }

  console.log('\n=== E. Journey: companionship ===');
  {
    const { ctx, page } = await mk(browser);
    await go(page, '/companionship');
    await page.waitForTimeout(5000);
    // Count service cards only: /companionship/search and /companionship/apply
    // are CTAs on the same page, not verticals.
    const hub = await page.evaluate(() => {
      const NON_SERVICE = ['/companionship/search', '/companionship/apply'];
      const links = Array.from(document.querySelectorAll('a[href^="/companionship/"]'));
      return {
        services: links.filter((a) => !NON_SERVICE.includes(a.getAttribute('href'))).length,
        applyHref: document.querySelector('a[href="/companionship/apply"]')?.getAttribute('href'),
        browseHref: document.querySelector('a[href="/companionship/search"]')?.getAttribute('href'),
        leaksToExpertSurfaces: links
          .map((a) => a.getAttribute('href'))
          .concat(
            Array.from(document.querySelectorAll('main a')).map((a) => a.getAttribute('href'))
          )
          .filter((h) => h === '/experts' || h === '/expert/onboarding'),
        h1: document.querySelector('h1')?.innerText,
      };
    });
    t('hub lists all 10 services', hub.services === 10, `${hub.services}`);
    // COMP-2 / COMP-3: companionship CTAs must not hand off to expert surfaces.
    t('apply CTA is companion-specific', hub.applyHref === '/companionship/apply', String(hub.applyHref));
    t('browse CTA is companion-specific', hub.browseHref === '/companionship/search', String(hub.browseHref));
    t('hub never links into expert surfaces', hub.leaksToExpertSurfaces.length === 0, hub.leaksToExpertSurfaces.join(','));

    // COMP-4: a companionship query must stay scoped to companions.
    await page.fill('input[type="search"]', 'someone to shop');
    await page.click('button:has-text("Find companions")');
    await page.waitForTimeout(6000);
    const scoped = await page.evaluate(() => ({
      url: location.pathname,
      bookable: Array.from(document.querySelectorAll('button, a')).filter((b) => /book now/i.test(b.textContent)).length,
      emptyState: /No companions found/i.test(document.body.innerText),
      companionshipTag: /Matched on[\s\S]{0,80}Companionship/i.test(document.body.innerText),
    }));
    t('companionship search stays on companionship', scoped.url === '/companionship/search', scoped.url);
    t(
      'companionship search returns companions or an empty state, never experts',
      scoped.emptyState || (!scoped.companionshipTag && scoped.bookable >= 0),
      JSON.stringify(scoped)
    );

    await go(page, '/companionship');
    await page.waitForTimeout(4000);
    await page.locator('a[href^="/companionship/"]:not([href$="/search"]):not([href$="/apply"])').first().click();
    await page.waitForTimeout(5000);
    const detail = await page.evaluate(() => ({
      path: location.pathname,
      h1: document.querySelector('h1')?.innerText,
      hasCompanionSection: !!document.querySelector('#companions-heading'),
    }));
    t('service card navigates to detail', /^\/companionship\/.+/.test(detail.path) && detail.hasCompanionSection, detail.h1);

    await go(page, '/companionship/not-real');
    await page.waitForTimeout(4000);
    const is404 = await page.evaluate(() => /couldn.t find that page|Page not found/i.test(document.getElementById('root')?.innerText || ''));
    t('unknown service slug 404s', is404);
    await ctx.close();
  }

  console.log('\n=== F. Journey: auth gating & redirects ===');
  {
    const { ctx, page } = await mk(browser);
    for (const [route, label] of [['/dashboard', 'dashboard'], ['/settings', 'settings'], ['/profile-setup', 'profile-setup']]) {
      await go(page, route);
      await page.waitForTimeout(14000);
      const s = await page.evaluate(() => ({ path: location.pathname, search: location.search }));
      t(`${route} redirects signed-out user to /auth`, s.path === '/auth', s.path + s.search);
    }
    await go(page, '/user-dashboard');
    await page.waitForTimeout(9000);
    const legacy = await page.evaluate(() => location.pathname);
    t('/user-dashboard legacy redirect works', legacy === '/auth' || legacy === '/dashboard', legacy);
    t('no render-phase React warnings', !page.errs.some((e) => /Cannot update a component/.test(e)), page.errs.find((e) => /Cannot update/.test(e)) || '');
    await ctx.close();
  }

  console.log('\n=== G. Journey: auth page ===');
  {
    const { ctx, page } = await mk(browser);
    await go(page, '/auth');
    await page.waitForSelector('#auth-email', { timeout: 35000 });
    await page.waitForTimeout(2000);
    let s = await page.evaluate(() => ({
      email: !!document.getElementById('auth-email'),
      password: !!document.getElementById('auth-password'),
      submit: document.querySelector('form button[type="submit"]')?.textContent?.trim(),
    }));
    t('sign-in form renders', s.email && s.password && /Sign in/i.test(s.submit || ''), JSON.stringify(s));
    await page.getByRole('button', { name: /^Create an account$/ }).click();
    await page.waitForTimeout(3000);
    s = await page.evaluate(() => ({
      name: !!document.getElementById('auth-name'),
      submit: document.querySelector('form button[type="submit"]')?.textContent?.trim(),
      q: location.search,
    }));
    t('switches to sign-up', s.name && /Create account/i.test(s.submit || '') && s.q.includes('mode=signup'), JSON.stringify(s));
    await go(page, '/auth?mode=forgot');
    await page.waitForTimeout(3000);
    const forgot = await page.evaluate(() => ({
      submit: document.querySelector('form button[type="submit"]')?.textContent?.trim(),
      password: !!document.getElementById('auth-password'),
    }));
    t('forgot-password mode renders', /Send reset link/i.test(forgot.submit || '') && !forgot.password, JSON.stringify(forgot));
    await go(page, '/auth/reset-password');
    await page.waitForTimeout(8000);
    const sub = await page.evaluate(() => ({ p: location.pathname, is404: /couldn.t find that page|Page not found/i.test(document.getElementById('root')?.innerText || '') }));
    t('reset-password route does not 404', sub.p === '/auth/reset-password' && !sub.is404, JSON.stringify(sub));
    await ctx.close();
  }

  console.log('\n=== H. Journey: booking gate ===');
  {
    const { ctx, page } = await mk(browser);
    await go(page, '/booking');
    await page.waitForTimeout(5000);
    const noExpert = await page.evaluate(() => /select an expert/i.test(document.getElementById('root')?.innerText || ''));
    t('/booking without expertId prompts selection', noExpert);

    await go(page, '/booking?expertId=33133a07-58ea-4523-823d-ba5d6917e937');
    await page.waitForTimeout(8000);
    const s = await page.evaluate(() => {
      const txt = document.getElementById('root')?.innerText || '';
      return { hasCal: /Select Date|availability/i.test(txt), notFound: /Expert not found/i.test(txt) };
    });
    t('/booking with valid expert renders booking UI', s.hasCal && !s.notFound, JSON.stringify(s));

    await go(page, '/booking?expertId=bogus-id');
    await page.waitForTimeout(6000);
    const bogus = await page.evaluate(() => /Expert not found/i.test(document.getElementById('root')?.innerText || ''));
    t('/booking with malformed id shows "Expert not found"', bogus);
    t('malformed id makes no failing API call', !page.errs.some((e) => /invalid input syntax for type uuid/.test(e)), '');
    await ctx.close();
  }

  console.log('\n=== I. SEO / meta hygiene ===');
  {
    const { ctx, page } = await mk(browser);
    await go(page, '/expert/8e1de0c5-c7a2-4a84-9304-35d0985f62f7');
    await page.waitForTimeout(6000);
    const a = await page.evaluate(() => ({
      title: document.title,
      tw: document.querySelectorAll('meta[name="twitter:title"],meta[property="twitter:title"]').length,
      canon: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
    }));
    t('expert page sets its own title', /irookee/.test(a.title), a.title);
    t('no duplicate twitter:title', a.tw === 1, `count=${a.tw}`);
    await go(page, '/about');
    await page.waitForTimeout(4000);
    const b = await page.evaluate(() => ({
      title: document.title,
      canon: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
    }));
    t('meta does not leak to next route', !/travel guide/i.test(b.title) && !/expert\//.test(b.canon || ''), JSON.stringify(b));
    await ctx.close();
  }

  console.log('\n============================================');
  console.log(`APP SMOKE: ${pass} passed, ${fail} failed`);
  console.log('============================================');
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
