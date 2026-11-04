// node tools/test-pub.js：大廳共用資料從 /api/lobby（大廳 Worker 的快取）拿，不再各自跟 Supabase 拿
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const FAKE = `
const fut = new Date(Date.now() + 3 * 864e5).toISOString();
const DATA = {
  get_mist_master_board2: [{ user_id: 'adm', username: '夜語', avatar_url: null, appearance: null, stations: 115, total: 0, names: ['辛亥', '麟光'], period: 2, name_color: null },
    { user_id: 'u1', username: '阿華', avatar_url: null, appearance: null, stations: 3, total: 21000, names: ['西門', '台北車站', '板橋'], period: 2, name_color: 'rainbow' }],
  mist_community_status: { goal_id: 'ring', kind: 'arrive', target: 6000, total: 2345, top: [{ name: '小明', amount: 40 }], ends: fut, done_goals: [] },
  mist_stations: { period: 2, masters: { 西門: { name: '阿華', price: 9000, color: '#5ac8fa' }, 辛亥: { name: '夜語', price: 0 } } },
};
const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? (res => res({ data: [], error: null, count: 0 })) : chain(), apply: () => chain() });
window.__sbCalls = [];
export function createClient() {
  return new Proxy({}, { get: (t, k) => {
    if (k === 'rpc') return (n) => { window.__sbCalls.push('rpc:' + n); return Promise.resolve({ data: DATA[n] ?? null, error: null }); };
    if (k === 'from') return (t) => { window.__sbCalls.push('from:' + t); return chain(); };
    if (k === 'auth') return { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) };
    return chain();
  } });
}`;
(async () => {
  const PORT = 8895, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 420, height: 900 } }); const errs = []; let fail = 0;
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/@supabase/supabase-js@*/**', r => r.fulfill({ contentType: 'application/javascript', body: FAKE }));
  await p.route(/^https:\/\/(?!localhost)/, r => r.request().url().includes('supabase-js') ? r.fallback() : r.abort());
  const PUB = { at: new Date().toISOString(),
    games: [{ id: 'g1', slug: 'pupu', title: '快取來的密室', status: 'available', play_url: 'https://x/', sort_order: 1, min_players: 1, max_players: 2, duration_min: 60, difficulty: 3, release_date: '2026-10-01', tags: ['歡樂'], description: 'd' }],
    news: [{ id: 1, title: '快取來的消息', published_at: '2026-11-01T00:00:00Z', tag: '公告' }],
    stats: [], monthly: [{ game_id: 'mist', players: 1053, plays: null }], escaped: [], board: [], early: { left: 0, limit: 10, launched: true } };
  let pubHits = 0;
  await p.route('**/api/lobby', r => { pubHits++; return r.fulfill({ contentType: 'application/json', body: JSON.stringify(PUB) }); });
  await p.goto(`http://localhost:${PORT}/index.html?pub`);
  await p.waitForTimeout(4000);
  const r = await p.evaluate(() => ({ calls: window.__sbCalls, news: document.querySelector('#news-list')?.innerText || '', monthly: document.querySelector('#monthly-list')?.innerText || '', body: document.body.innerText }));
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(pubHits === 1, '只跟 /api/lobby 拿一次：' + pubHits);
  ok(/快取來的消息/.test(r.news), '最新消息用快取的資料');
  ok(/快取來的密室/.test(r.body), '密室用快取的資料');
  ok(/迷霧/.test(r.monthly) && /1053/.test(r.monthly), '暢銷榜用快取的資料');
  const pubCalls = r.calls.filter(c => /^(from:games|from:news|rpc:get_game_stats|rpc:get_monthly_top2|rpc:get_escaped_counts|rpc:get_mist_master_board2|rpc:mist_early_slots)$/.test(c));
  ok(!pubCalls.length, '沒有再跟 Supabase 拿共用資料：' + pubCalls.join(','));
  ok(!errs.length, '沒有錯誤：' + errs.join(' / '));
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
