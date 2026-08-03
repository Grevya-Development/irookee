/**
 * Backend smoke test.
 *
 * Mirrors scripts/smoke_test_report.js but replaces its Test 2 with a
 * NON-DESTRUCTIVE variant: the original writes a new name onto a real
 * production speaker row, which mutates live data if RLS is misconfigured.
 * Here we write the row's CURRENT value back, which yields the same
 * authorization signal with no data change.
 */
const SB = 'https://tlsdxbjoghpfzltubshs.supabase.co';
const KEY = 'sb_publishable_XZkwTtNrAyyZIB-_u3_xBg_RbYaNcSD';
const H = { apikey: KEY, 'Content-Type': 'application/json' };

let pass = 0, fail = 0, warn = 0;
const ok = (m) => { console.log(`  PASS  ${m}`); pass++; };
const no = (m) => { console.log(`  FAIL  ${m}`); fail++; };
const wr = (m) => { console.log(`  WARN  ${m}`); warn++; };

const get = async (path) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: H });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, json };
};

console.log('\n=== 1. Connectivity & core reads ===');
{
  const r = await get('speakers?select=id,name&limit=1');
  r.status === 200 && Array.isArray(r.json)
    ? ok(`speakers readable (HTTP ${r.status})`)
    : no(`speakers read failed: ${JSON.stringify(r.json).slice(0, 120)}`);

  const c = await fetch(`${SB}/rest/v1/speakers?select=id&limit=1`, { headers: { ...H, Prefer: 'count=exact' } });
  const range = c.headers.get('content-range');
  ok(`speaker count: ${range}`);

  for (const t of ['categories', 'expertise_bookings', 'reviews', 'availability_slots', 'notifications']) {
    const res = await get(`${t}?select=*&limit=1`);
    res.status === 200 ? ok(`${t} reachable`) : no(`${t} -> ${JSON.stringify(res.json).slice(0, 100)}`);
  }
}

console.log('\n=== 2. RPCs used for authorization ===');
for (const [fn, body] of [
  ['is_admin', {}],
  ['has_role', { _user_id: '00000000-0000-0000-0000-000000000000', _role: 'admin' }],
]) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  const v = await r.text();
  r.status === 200 ? ok(`${fn}() -> ${v.trim()}`) : no(`${fn}() HTTP ${r.status} ${v.slice(0, 100)}`);
}

console.log('\n=== 3. RLS write posture (non-destructive identity write) ===');
{
  const target = 'ec38d48e-6737-4bfa-9fae-1fa61c4cc82f'; // pending speaker
  const cur = await get(`speakers?select=id,name&id=eq.${target}`);
  const current = Array.isArray(cur.json) && cur.json[0];
  if (!current) {
    wr('target speaker not readable; skipping write probe');
  } else {
    const r = await fetch(`${SB}/rest/v1/speakers?id=eq.${target}`, {
      method: 'PATCH',
      headers: { ...H, Prefer: 'return=representation' },
      // identical value -> no data change regardless of outcome
      body: JSON.stringify({ name: current.name }),
    });
    const text = await r.text();
    let rows; try { rows = JSON.parse(text); } catch { rows = text; }

    if (r.status >= 400) {
      ok(`anonymous write rejected (HTTP ${r.status}) — ${String(text).slice(0, 90)}`);
    } else if (Array.isArray(rows) && rows.length === 0) {
      ok('anonymous write blocked by RLS (0 rows affected)');
    } else {
      no(`ANONYMOUS WRITE SUCCEEDED on speakers — RLS is not protecting this table (${JSON.stringify(rows).slice(0, 100)})`);
    }
    // confirm nothing changed
    const after = await get(`speakers?select=name&id=eq.${target}`);
    after.json?.[0]?.name === current.name
      ? ok(`row unchanged after probe (name still "${current.name}")`)
      : no(`ROW MUTATED by probe: ${JSON.stringify(after.json)}`);
  }
}

console.log('\n=== 4. PII exposure check ===');
{
  const r = await get('profiles?select=email,phone&limit=3');
  const leaked = Array.isArray(r.json) && r.json.some((p) => p.email);
  leaked
    ? no(`profiles exposes emails/phones to the anon key (${r.json.filter((p) => p.email).length} rows with email)`)
    : ok('profiles does not leak email/phone to anon');
}

console.log('\n=== 5. delete_account RPC posture ===');
{
  // Edge functions were removed; account deletion now lives in the database as
  // public.delete_account(). EXECUTE is revoked from anon, so an anonymous
  // call must be rejected — a 2xx here means the grants are wrong.
  const r = await fetch(`${SB}/rest/v1/rpc/delete_account`, { method: 'POST', headers: H, body: '{}' });
  const text = await r.text();
  r.status >= 400
    ? ok(`anonymous delete_account rejected (HTTP ${r.status})`)
    : no(`ANONYMOUS delete_account call returned HTTP ${r.status} — revoke EXECUTE from anon! (${text.slice(0, 100)})`);
}

console.log('\n=== 6. Logic checks from the original smoke script ===');
{
  // Test 1: token-boundary matching
  const matchToken = (field, token) =>
    field.toLowerCase().trim().split(/[\s,.\-()&/|\\_]+/).includes(token.toLowerCase().trim());
  const good = !matchToken('built with react', 'ui') && !matchToken('located in mumbai', 'ui') && matchToken('ui/ux designer', 'ui');
  good ? ok('search token boundaries reject false positives') : no('search token boundary check failed');

  // Test 3: timezone formatting
  const d = new Date('2026-07-23T12:00:00.000Z');
  const ist = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  const est = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
  /5:30|05:30/.test(ist) && /8:00|08:00/.test(est)
    ? ok(`timezone conversion correct (IST ${ist}, EST ${est})`)
    : no(`timezone conversion wrong (IST ${ist}, EST ${est})`);
}

console.log('\n============================================');
console.log(`BACKEND SMOKE: ${pass} passed, ${fail} failed, ${warn} warnings`);
console.log('============================================');
