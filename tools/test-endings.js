// node tools/test-endings.js：同一場看過的其他結局（play_records.endings）也算結局成就
// 回報 11/4：千嬋第三章先看到普通結局 e2，再「回到最後的選擇」看到 e3，ending 只留 e3，普通結局的成就不見了
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const fake = (endings) => `
const G3 = { id: 'g3', slug: 'school3', title: '千嬋高級中學：第三章', status: 'available', play_url: 'https://x/', sort_order: 1, min_players: 1, max_players: 1, duration_min: 240, difficulty: 4, release_date: '2026-10-31', tags: [] };
const TABLES = {
  games: [G3],
  profiles: [{ id: 'u1', username: '蜻蜓', appearance: null, avatar_url: null }],
  play_records: [{ game_id: 'g3', status: 'cleared', clear_time_sec: 13583, created_at: '2026-11-03T02:45:35Z', updated_at: '2026-11-03T17:37:12Z', deaths: 2, hints: 3, borrows: 0, ending: 'e3', endings: ${JSON.stringify(endings)}, variant: null }],
};
function chain(t) {
  let one = false;
  const p = new Proxy(function () {}, { get: (o, k) => {
    if (k === 'then') return res => { const d = TABLES[t] ?? []; res({ data: one ? (d[0] ?? null) : d, error: null, count: d.length }); };
    if (k === 'maybeSingle' || k === 'single') return () => { one = true; return p; };
    return () => p;
  }, apply: () => p });
  return p;
}
const user = { id: 'u1', email: 'a@b.c' };
export function createClient() {
  return new Proxy({}, { get: (o, k) => {
    if (k === 'rpc') return () => Promise.resolve({ data: null, error: null });
    if (k === 'from') return (t) => chain(t);
    if (k === 'auth') return { getSession: async () => ({ data: { session: { user, access_token: 'x' } } }), getUser: async () => ({ data: { user } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) };
    if (k === 'channel') return () => ({ on() { return this; }, subscribe() { return this; } });
    if (k === 'removeChannel') return () => {};
    if (k === 'storage') return { from: () => ({ getPublicUrl: () => ({ data: {} }) }) };
    return () => chain('_');
  } });
}`;
(async () => {
  const PORT = 8896, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(); let fail = 0; const errs = [];
  const count = async (endings) => {
    const p = await b.newPage({ viewport: { width: 420, height: 900 } });
    p.on('pageerror', e => errs.push(e.message));
    await p.route('**/@supabase/supabase-js@*/**', r => r.fulfill({ contentType: 'application/javascript', body: fake(endings) }));
    await p.route(/^https:\/\/(?!localhost)/, r => r.request().url().includes('supabase-js') ? r.fallback() : r.abort());
    await p.goto(`http://localhost:${PORT}/index.html#progress`);
    await p.waitForTimeout(4500);
    const t = await p.evaluate(() => { const b = [...document.querySelectorAll('.ach-tab')].find(x => /第三章/.test(x.textContent)); return b ? b.textContent : null; });
    await p.close(); return t;
  };
  const a = await count([]), c = await count(['e2']);
  const n = s => +(String(s).match(/(\d+)\/\d+/) || [])[1];
  const ok = (v, m) => { console.log((v ? '  ✓ ' : '  ✗ ') + m); if (!v) fail++; };
  ok(a && c, '看得到第三章的成就：' + a + ' / ' + c);
  ok(n(c) === n(a) + 1, 'endings 有 e2 時多一個成就（普通結局）：' + n(a) + ' → ' + n(c));
  ok(!errs.length, '沒有錯誤：' + [...new Set(errs)].join(' / '));
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
