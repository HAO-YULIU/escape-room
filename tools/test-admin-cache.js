// node tools/test-admin-cache.js：管理頁
//  - 《別讓他知道》(heart)、《反面》(fanmian) 的進度看得到（以前資料庫沒有存，管理頁顯示「按了開始，還沒有存檔」）
//  - 重新打開管理頁用這台裝置記住的資料，只抓變化（p_since）；從大廳回到管理頁也只抓變化；按「重新整理」才整包重抓
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
(async () => {
  const PORT = 8898, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), p = await b.newPage(); let fail = 0;
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/manifest.webmanifest`);
  const r = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const now = new Date().toISOString(), ago = new Date(Date.now() - 3 * 60e3).toISOString();
    const G = [{ id: 'gh', slug: 'heart', title: '別讓他知道', sort_order: 1, play_url: 'x' }, { id: 'gf', slug: 'fanmian', title: '反面', sort_order: 2, play_url: 'x' }];
    const dump = () => ({ now, admins: [], bugs: [], qs: [],
      players: [{ id: 'u1', username: '小明', created_at: ago, last_active: ago }, { id: 'u2', username: '小華', created_at: ago, last_active: ago }],
      records: [{ id: 1, user_id: 'u1', game_id: 'gh', status: 'started', created_at: ago, updated_at: ago }],
      saves: [
        { user_id: 'u1', game: 'heart', updated_at: ago, data: { keys: { heart_g: { n: 11, t: 1700, ch: 2, pl: ['小明', '阿嬤'], mode: 'multi', hintN: 4, phase: 'play', wrongs: 5 } } } },
        { user_id: 'u2', game: 'fanmian', updated_at: ago, data: { keys: { fanmian_g: { n: 14, t: 1110, ch: 2, nc: { 1: 13, 2: 1 }, pl: ['小華'], mode: 'solo', used: 2790, hintN: 6, lives: 6, phase: 'play', budget: 18000, deaths: 1, wrongs: 8 }, fanmian_end: { shard: 1 } } } }] });
    const calls = [];
    const supabase = {
      rpc: async (fn, args) => { calls.push([fn, args && args.p_since ? 'since' : 'full']); return { data: fn === 'admin_dump' ? (args && args.p_since ? { ...dump(), players: [], records: [], saves: [] } : dump()) : null }; },
      from: () => ({ select: () => ({ order: async () => ({ data: G }) }) }),
    };
    const ctx = () => { const root = document.createElement('div'); document.body.appendChild(root); return { supabase, root, escapeHTML: s => String(s ?? '').replace(/</g, '&lt;'), avatarHTML: () => '', toast: () => {}, onContentChange: () => {} }; };
    await new Promise(r => { const q = indexedDB.deleteDatabase('yeyu-admin'); q.onsuccess = q.onerror = q.onblocked = r; });
    const { mountAdmin } = await import('/admin.js?t=' + Date.now());
    // 第一次打開：整包
    const c1 = ctx(); const a1 = mountAdmin(c1); await sleep(600);
    c1.root.querySelector('[data-tab="live"]').click(); await sleep(200);
    const live = c1.root.innerText;
    const sel = async (g) => { c1.root.querySelector('[data-tab="stuck"]').click(); await sleep(150); const e = c1.root.querySelector('#adm-stuck-g'); e.value = g; e.dispatchEvent(new Event('change')); await sleep(100); return c1.root.innerText; };
    const stuckH = await sel('heart'), stuckF = await sel('fanmian');
    a1.stop();
    // 從大廳回到管理頁（同一頁）
    await a1.refresh(); await sleep(400);
    // 重新整理按鈕：整包
    c1.root.querySelector('#adm-reload').click(); await sleep(600);
    const n1 = calls.filter(c => c[0] === 'admin_dump').map(c => c[1]);
    // 重新打開網頁（新的 mount）：讀這台裝置記住的資料，只抓變化
    calls.length = 0;
    const c2 = ctx(); const a2 = mountAdmin(c2); await sleep(800);
    a2.stop();
    const n2 = calls.filter(c => c[0] === 'admin_dump').map(c => c[1]);
    const ov = c2.root.innerText;
    const tabErr = [];
    for (const t of ['overview', 'live', 'stuck', 'games']) { try { c2.root.querySelector(`[data-tab="${t}"]`).click(); await sleep(150); } catch (e) { tabErr.push(t + ': ' + e.message); } }
    const stuck = (c2.root.querySelector('[data-tab="stuck"]').click(), await sleep(150), c2.root.innerText);
    return { live, stuckH, stuckF, ov, n1, n2, tabErr, stuck };
  });
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(/2\s*現在正在玩遊戲的人/.test(r.live) && /別讓他知道\s*1 人/.test(r.live) && /反面\s*1 人/.test(r.live) && /迷霧\s*0 人/.test(r.live), '即時動態：正在玩的人數（總數＋每款）');
  ok(/別讓他知道/.test(r.stuckH) && /第二章/.test(r.stuckH) && /2 人連線：小明、阿嬤/.test(r.stuckH), '別讓他知道的進度看得到');
  ok(/反面/.test(r.stuckF) && /一樓後面・暗房/.test(r.stuckF) && /相機 6 \/ 7/.test(r.stuckF) && /時間池剩 4 小時/.test(r.stuckF), '反面的進度看得到（章節、相機、時間池）');
  ok(!/按了開始，還沒有存檔/.test(r.stuckH + r.stuckF), '不會再顯示「按了開始，還沒有存檔」');
  ok(r.n1.join(',') === 'full,since,full', '第一次整包、回到管理頁只抓變化、按重新整理才整包：' + r.n1.join(','));
  ok(r.n2.join(',') === 'since', '重新打開網頁：用記住的資料，只抓變化：' + r.n2.join(','));
  ok(/註冊玩家/.test(r.ov), '用記住的資料畫得出總覽');
  ok(!r.tabErr.length, '每個分頁都打得開：' + r.tabErr.join(' / '));
  ok(/反面|別讓他知道/.test(r.stuck), '卡關分析有這兩款');
  ok(!errs.length, '沒有錯誤：' + errs.join(' / '));
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
