// node tools/test-lobby-page.js：把 supabase-js 換成假的，讓大廳整頁真的跑起來，打開迷霧的排行榜視窗
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
export function createClient() {
  return new Proxy({}, { get: (t, k) => {
    if (k === 'rpc') return (n) => Promise.resolve({ data: DATA[n] ?? null, error: null });
    if (k === 'auth') return { getSession: async () => ({ data: { session: null } }), getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) };
    return chain();
  } });
}`;
(async () => {
  const PORT = 8898, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 420, height: 900 } }); const errs = []; let fail = 0;
  p.on('pageerror', e => errs.push(e.message));
  await p.route('**/@supabase/supabase-js@*/**', r => r.fulfill({ contentType: 'application/javascript', body: FAKE }));
  await p.route(/^https:\/\/(?!localhost)/, r => r.request().url().includes('supabase-js') ? r.fallback() : r.abort());
  await p.goto(`http://localhost:${PORT}/index.html`);
  await p.waitForTimeout(4000);
  const opened = await p.evaluate(() => { const b = document.querySelector('[data-hub="mist"], [data-rank="mist"], .hero-rpg'); return !!b; });
  // 直接打開迷霧的排行榜視窗（大廳裡點迷霧的「排行榜」會走同一個函式）
  const r = await p.evaluate(async () => {
    const btn = document.querySelector('[data-hub="mist"]');   // 迷霧卡片上的「🏆 排行榜」
    if (btn) btn.click();
    await new Promise(r => setTimeout(r, 1500));
    const hub = document.getElementById('game-hub');
    return { btn: !!btn, open: hub && hub.open, text: hub ? hub.innerText : '' };
  });
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(errs.length === 0, '大廳沒有程式錯誤：' + errs.slice(0, 3).join(' | '));
  ok(r.open, '打開了迷霧的排行榜視窗（找到按鈕：' + r.btn + '）');
  ok(/擁有最多車站/.test(r.text) && /夜語/.test(r.text) && /阿華/.test(r.text) && /115/.test(r.text), '站長排行榜：' + r.text.slice(0, 160).replace(/\n/g, ' '));
  ok(/點亮環狀線/.test(r.text) && /2,345/.test(r.text), '全服目標');
  ok(/其餘 1 站由 夜語 管理/.test(r.text), '預設站長合併');
  ok(/貢獻前三/.test(r.text) && !/捐款前三/.test(r.text), '次數型題目寫「貢獻」不是「捐款」');
  const lay = await p.evaluate(() => {
    const li = document.querySelector('.mist-live .ml-masters li'), nm = li && li.querySelector('.ml-name'), price = li && [...li.querySelectorAll('span')].find(s => /NT\$/.test(s.textContent) && !s.classList.contains('ml-name'));
    const rows = [...document.querySelectorAll('.mist-list .mist-row')];
    const small = rows[1] && rows[1].querySelector('small');
    return { nameBeforePrice: nm && price ? nm.getBoundingClientRect().left <= price.getBoundingClientRect().left + 5 || /阿華・NT/.test(li.innerText) : false, def: rows[0] && rows[0].innerText, clipped: small ? small.scrollWidth > small.clientWidth + 2 : true, small: small && small.innerText };
  });
  ok(lay.nameBeforePrice, '本週站長：名字在金額前面');
  ok(!/NT\$ 0\b/.test(lay.def) && /預設/.test(lay.def), '排行榜的預設站長不寫 NT$ 0：' + lay.def.replace(/\n/g, ' '));
  ok(/^得標 NT\$ 21,000/.test(lay.small), '得標總額放在最前面（窄螢幕截掉的只會是後面的站名）：' + lay.small);
  await p.screenshot({ path: require('os').tmpdir() + '/mist-lobby.png' });
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
