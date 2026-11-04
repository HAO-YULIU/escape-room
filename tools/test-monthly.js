// node tools/test-monthly.js：本月暢銷榜也算《迷霧》（get_monthly_top2 回傳 game_id 'mist'）
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const FAKE = `
const fut = new Date(Date.now() + 3 * 864e5).toISOString();
const DATA = {
  get_monthly_top2: [{ game_id: 'mist', players: 1053, plays: null }],
  get_mist_master_board2: [{ user_id: 'adm', username: '夜語', avatar_url: null, appearance: null, stations: 115, total: 0, names: ['辛亥', '麟光'], period: 2, name_color: null },
    { user_id: 'u1', username: '阿華', avatar_url: null, appearance: null, stations: 3, total: 21000, names: ['西門', '台北車站', '板橋'], period: 2, name_color: 'rainbow' }],
  mist_community_status: { goal_id: 'ring', kind: 'arrive', target: 6000, total: 2345, top: [{ name: '小明', amount: 40 }], ends: fut, done_goals: [] },
  mist_stations: { period: 2, masters: { 西門: { name: '阿華', price: 9000, color: '#5ac8fa' }, 辛亥: { name: '夜語', price: 0 } } },
};
const chain = () => new Proxy(function () {}, { get: (t, k) => k === 'then' ? (res => res({ data: [], error: null, count: 0 })) : chain(), apply: () => chain() });
export function createClient() {
  return new Proxy({}, { get: (t, k) => {
    if (k === 'rpc') return (n) => Promise.resolve({ data: DATA[n] ?? null, error: null });
    if (k === 'auth') return { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) };
    return chain();
  } });
}`;
(async () => {
  const PORT = 8897, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 420, height: 900 } }); const errs = []; let fail = 0;
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/@supabase/supabase-js@*/**', r => r.fulfill({ contentType: 'application/javascript', body: FAKE }));
  await p.route(/^https:\/\/(?!localhost)/, r => r.request().url().includes('supabase-js') ? r.fallback() : r.abort());
  await p.goto(`http://localhost:${PORT}/index.html`);
  await p.waitForTimeout(4000);
  const t = await p.evaluate(() => document.querySelector('#monthly-list').innerText);
  const note = await p.evaluate(() => document.querySelector('.month-note').innerText);
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(/迷霧/.test(t) && /本月 1053 人挑戰/.test(t), '暢銷榜有迷霧和人數：' + t.replace(/\s+/g, ' ').slice(0, 80));
  ok(/大型網頁解謎/.test(t) && !/難度/.test(t.split('迷霧')[1] || ''), '迷霧的卡片寫「大型網頁解謎」，不寫難度');
  ok(/迷霧/.test(note), '說明寫了迷霧怎麼算');
  ok(!errs.length, '沒有錯誤：' + errs.join(' / '));
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
