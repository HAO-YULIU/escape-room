// node tools/test-admin-trend.js：管理頁「📈 趨勢」分頁
//  - 每天開局／通關的折線圖、星期 × 小時熱度圖（台灣時間）、不含管理員
//  - 下載 CSV（玩家名單、遊玩紀錄）有 BOM、欄位對
//  - 即時動態 1 分鐘才自動更新一次
//  - 不會多問 Supabase（只有原本的 admin_dump、games）
// SHOT=路徑 會存一張截圖
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
(async () => {
  const PORT = 8899, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: +(process.env.W || 1000), height: 1600 } }); let fail = 0;
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/manifest.webmanifest`);
  await p.setContent(`<html><head><style>:root{--ink:#140E09;--ink-2:#1B130D;--wall:#241A11;--wall-2:#2F2216;--line:rgba(255,200,119,.16);--gold:#FFC877;--parchment:#F5EBDD;--muted:#BBA78C;--sans:sans-serif;--serif:serif}body{background:var(--ink);color:var(--parchment);margin:0}.btn{color:var(--parchment);background:none;border:1px solid var(--line);border-radius:8px}</style></head><body></body></html>`);
  const r = await p.evaluate(async (PORT) => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const now = Date.now(), iso = (t) => new Date(t).toISOString();
    const G = [{ id: 'gh', slug: 'heart', title: '別讓他知道', sort_order: 1, play_url: 'x' }, { id: 'gf', slug: 'fanmian', title: '反面', sort_order: 2, play_url: 'x' }];
    const players = [{ id: 'adm', username: '管理員', created_at: iso(now - 40 * 864e5), last_active: iso(now) }];
    const records = []; let id = 1;
    for (let i = 0; i < 40; i++) players.push({ id: 'u' + i, username: '玩家' + i, email: `p${i}@x.tw`, created_at: iso(now - 35 * 864e5), last_active: iso(now - i * 3600e3) });
    // 固定的亂數：每天幾局，晚上 20–22 點（台灣時間）比較多
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let d = 29; d >= 1; d--) for (let k = 0; k < 3 + (d % 7 === 0 ? 8 : 0); k++) {
      const twHour = rnd() < .6 ? 20 + (rnd() * 3 | 0) : rnd() * 24 | 0;
      const dayStart = Math.floor((now + 8 * 3600e3) / 864e5) * 864e5 - 8 * 3600e3 - d * 864e5;
      const t = dayStart + twHour * 3600e3 + rnd() * 3600e3;
      const cleared = rnd() < .4;
      records.push({ id: id++, user_id: 'u' + (rnd() * 40 | 0), game_id: rnd() < .5 ? 'gh' : 'gf', status: cleared ? 'cleared' : 'started', created_at: iso(t), updated_at: iso(Math.min(now - 1000, t + (cleared ? 2 * 3600e3 : 0))), clear_time_sec: cleared ? 7000 : null, hints: 2, deaths: 1, ending: cleared ? 'front' : null });
    }
    records.push({ id: id++, user_id: 'adm', game_id: 'gh', status: 'cleared', created_at: iso(now - 3600e3), updated_at: iso(now - 600e3) });   // 管理員：不算
    const expectStart = records.filter(r => r.user_id !== 'adm').length;
    const dump = { now: iso(now), admins: ['adm'], bugs: [], qs: [], players, records, saves: [] };
    const calls = [];
    const supabase = {
      rpc: async (fn, args) => { calls.push(fn + (args && args.p_since ? ':since' : '')); return { data: fn === 'admin_dump' ? (args && args.p_since ? { ...dump, players: [], records: [], saves: [] } : dump) : null }; },
      from: (t) => { calls.push('from:' + t); return { select: () => ({ order: async () => ({ data: G }) }) }; },
    };
    await new Promise(r => { const q = indexedDB.deleteDatabase('yeyu-admin'); q.onsuccess = q.onerror = q.onblocked = r; });
    const root = document.createElement('div'); root.id = 'view-admin'; document.body.appendChild(root);
    let toasts = [];
    const { mountAdmin } = await import(`http://localhost:${PORT}/admin.js?t=` + Date.now());
    const a = mountAdmin({ supabase, root, escapeHTML: s => String(s ?? '').replace(/</g, '&lt;'), avatarHTML: () => '', toast: (m) => toasts.push(m), onContentChange: () => {} });
    await sleep(600);
    root.querySelector('[data-tab="trend"]').click(); await sleep(200);
    const txt = root.innerText;
    const kpiStart = +root.querySelector('.adm-kpi b').textContent;
    const paths = root.querySelectorAll('#tr-chart path').length, cells = root.querySelectorAll('#tr-heat .c').length, maxCell = root.querySelector('#tr-heat .c.max')?.dataset.tip;
    const topH = [...root.querySelectorAll('.adm-kpi')].find(k => /最多人開局/.test(k.innerText))?.querySelector('b').textContent;
    // 滑過折線圖
    const sv = root.querySelector('#tr-chart svg'), rc = sv.getBoundingClientRect();
    sv.dispatchEvent(new PointerEvent('pointermove', { clientX: rc.right - 20, clientY: rc.top + 50, bubbles: true }));
    const tip = root.querySelector('#tr-tip'); const tipTxt = tip.hidden ? '' : tip.innerText;
    // 切成 14 天、只看反面
    root.querySelector('#tr-d [data-v="14"]').click(); await sleep(100);
    const s14 = +root.querySelector('.adm-kpi b').textContent;
    const g = root.querySelector('#tr-g'); g.value = 'fanmian'; g.dispatchEvent(new Event('change')); await sleep(100);
    const sF = +root.querySelector('.adm-kpi b').textContent;
    g.value = 'all'; g.dispatchEvent(new Event('change')); root.querySelector('#tr-d [data-v="30"]').click(); await sleep(100);
    // CSV：攔下 Blob
    const blobs = []; const oc = URL.createObjectURL; URL.createObjectURL = (bl) => { blobs.push(bl); return oc.call(URL, bl); };
    HTMLAnchorElement.prototype.click = function () { blobs[blobs.length - 1].name = this.download; };
    root.querySelector('[data-csv="players"]').click(); root.querySelector('[data-csv="records"]').click();
    const csv = await Promise.all(blobs.map(async bl => ({ name: bl.name, bom: new Uint8Array(await bl.arrayBuffer()).slice(0, 3).join(','), text: await bl.text() })));
    a.stop();
    return { txt, kpiStart, expectStart, paths, cells, maxCell, topH, tipTxt, s14, sF, csv, calls, toasts };
  }, PORT);
  if (process.env.SHOT) await p.screenshot({ path: process.env.SHOT, fullPage: true });
  // 即時動態：1 分鐘才更新
  const src = fs.readFileSync(path.resolve(__dirname, '../admin.js'), 'utf8');
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(r.kpiStart === r.expectStart, `30 天開局數不含管理員：${r.kpiStart} / ${r.expectStart}`);
  ok(r.paths === 2 && /開局/.test(r.txt) && /通關/.test(r.txt), '折線圖兩條線、有圖例');
  ok(/開局 \d+/.test(r.tipTxt) && /通關 \d+/.test(r.tipTxt), '滑過折線圖有提示框：' + r.tipTxt.replace(/\n/g, ' '));
  ok(r.cells === 168, '熱度圖 7 × 24 格：' + r.cells);
  ok(/星期. 2[0-2]:00/.test(r.maxCell || ''), '最多的格子在晚上 20–22 點：' + r.maxCell);
  ok(['20:00', '21:00', '22:00'].includes(r.topH), '最多人開局的時段：' + r.topH);
  ok(r.s14 > 0 && r.s14 < r.kpiStart, `切成 14 天：${r.s14}`);
  ok(r.sF > 0 && r.sF < r.s14 + 1000 && r.sF < r.kpiStart, `只看反面：${r.sF}`);
  const pl = r.csv.find(c => /玩家名單/.test(c.name)), rc = r.csv.find(c => /遊玩紀錄/.test(c.name));
  ok(pl && pl.bom === '239,187,191' && pl.text.split('\r\n').length === 41 && /^名字,Email/.test(pl.text) && !/管理員/.test(pl.text), '玩家名單 CSV：開頭有 BOM（Excel 中文不亂碼）、40 人、不含管理員');
  ok(rc && rc.text.split('\r\n').length === r.expectStart + 2 && /別讓他知道|反面/.test(rc.text) && /通關/.test(rc.text), '遊玩紀錄 CSV：全部紀錄（含管理員，標出來）');
  ok(r.calls.filter(c => c.startsWith('admin_dump')).length === 1 && r.calls.every(c => /^(admin_dump|from:games)/.test(c)), '沒有多問 Supabase：' + r.calls.join(','));
  ok(/load\(\); \}, 60000\)/.test(src) && !/}, 20000\)/.test(src), '即時動態每 1 分鐘更新');
  ok(!errs.length, '沒有錯誤：' + errs.join(' / '));
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
