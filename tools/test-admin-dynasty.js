// node tools/test-admin-dynasty.js：管理頁看得到《不存在的王朝》的進度（2026-11-07 上架）
// 存檔用資料庫 _admin_save('dynasty', …) 真的會給的格式
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
(async () => {
  const PORT = 8897, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), p = await b.newPage(); let fail = 0;
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/manifest.webmanifest`);
  const r = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const ago = new Date(Date.now() - 3 * 60e3).toISOString();
    const G = [{ id: 'gd', slug: 'dynasty', title: '不存在的王朝', sort_order: 1, play_url: 'x' }];
    const dump = { now: new Date().toISOString(), admins: [], bugs: [], qs: [],
      players: [{ id: 'u1', username: '小明', created_at: ago, last_active: ago }, { id: 'u2', username: '小華', created_at: ago, last_active: ago }, { id: 'u3', username: '阿美', created_at: ago, last_active: ago }],
      records: [{ id: 1, user_id: 'u1', game_id: 'gd', status: 'started', created_at: ago, updated_at: ago }, { id: 2, user_id: 'u3', game_id: 'gd', status: 'cleared', created_at: ago, updated_at: ago, clear_time_sec: 9000 }],
      saves: [
        { user_id: 'u1', game: 'dynasty', updated_at: ago, data: { keys: { dynasty_g: { n: 7, hn: 1, np: 2, wr: 3, day: 1, pen: 90000, shi: '戌', pair: 'fang-su', used: 705268, ended: 0, phase: 'play', scene: 'beacon', budget: 10800000, ending: null } } } },
        { user_id: 'u2', game: 'dynasty', updated_at: ago, data: { keys: { dynasty_g: { n: 1, np: 2, day: 0, phase: 'play', scene: 'wake', used: 30000, budget: 10800000, ending: null } } } },
        { user_id: 'u3', game: 'dynasty', updated_at: ago, data: { keys: { dynasty_g: { n: 43, np: 2, day: 7, pair: 'ni-fan', phase: 'play', scene: 'altar', used: 9000000, budget: 10800000, ending: 'radish' }, dynasty_endings: ['fang-su:remember'] } } }] };
    const supabase = { rpc: async (fn, a) => ({ data: fn === 'admin_dump' ? (a && a.p_since ? { ...dump, players: [], records: [], saves: [] } : dump) : null }), from: () => ({ select: () => ({ order: async () => ({ data: G }) }) }) };
    await new Promise(r => { const q = indexedDB.deleteDatabase('yeyu-admin'); q.onsuccess = q.onerror = q.onblocked = r; });
    const root = document.createElement('div'); document.body.appendChild(root);
    const { mountAdmin } = await import('/admin.js?t=' + Date.now());
    const a = mountAdmin({ supabase, root, escapeHTML: s => String(s ?? '').replace(/</g, '&lt;'), avatarHTML: () => '', toast: () => {}, onContentChange: () => {} });
    await sleep(600);
    const ov = root.innerText;
    root.querySelector('[data-tab="stuck"]').click(); await sleep(200); const stuck = root.innerText;
    root.querySelector('[data-tab="live"]').click(); await sleep(200); const live = root.innerText;
    a.stop(); return { ov, stuck, live };
  });
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(/不存在的王朝/.test(r.ov), '總覽有不存在的王朝');
  ok(/第 1 天・戌時/.test(r.stuck) && /雁門關・烽火台/.test(r.stuck) && /7\/43|7 \/ 43/.test(r.stuck), '進行中：第幾天、時辰、場景、解開幾題：' + (r.stuck.match(/第 1 天[^\n]*/) || [''])[0]);
  ok(/方采洺 × 蘇宇凱/.test(r.stuck) && /2 人連線/.test(r.stuck) && /答錯 3/.test(r.stuck), '組合、人數、答錯');
  ok(/序章/.test(r.stuck), '還沒選角色：序章');
  ok(/已通關/.test(r.stuck) && /倪芮彤 × 樊資詠：換一下（隱藏）/.test(r.stuck) && /方采洺 × 蘇宇凱：記住/.test(r.stuck), '通關的結局名稱');
  ok(/不存在的王朝\s*\d+ 人/.test(r.live), '即時動態有這款');
  ok(!/有存檔/.test(r.stuck), '不再只顯示「有存檔」');
  ok(!errs.length, '沒有錯誤：' + errs.join(' / '));
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
