// node tools/test-admin-market.js：管理頁「站長與募款」分頁
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
(async () => {
  const PORT = 8899, srv = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.resolve(__dirname, '..'), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch(), p = await b.newPage(); let fail = 0;
  p.on('dialog', d => d.accept());
  await p.goto(`http://localhost:${PORT}/manifest.webmanifest`);
  const r = await p.evaluate(async () => {
    document.body.innerHTML = '<div id="b"></div>';
    const { mountMist } = await import('/admin-mist.js');
    const calls = [];
    const M = { period: 2, goal: { goal_id: 'clock', total: 51000, target: 200000 }, masters: [{ station: '西門', name: '阿華', price: 9000, message: '歡迎' }], bids: [{ id: 7, station: '辛亥', name: '小美', amount: 1300, at: new Date().toISOString() }], designs: [{ station: '西門', name: '阿華', period: 2 }], words: ['壞字'] };
    const supabase = { rpc: async (fn, args) => { calls.push([fn, args]); return fn === 'admin_mist_market' ? { data: M } : { data: null }; } };
    const m = mountMist({ supabase, escapeHTML: s => String(s).replace(/</g, '&lt;'), avatarHTML: () => '', toast: () => {} });
    const tab = m.TABS.find(t => t[0] === 'mmarket');
    const body = document.getElementById('b'); await m.render('mmarket', body);
    const text = body.innerText;
    body.querySelector('[data-delmsg]').click(); await new Promise(r => setTimeout(r, 50));
    body.querySelector('[data-void]').click(); await new Promise(r => setTimeout(r, 50));
    return { tab: tab && tab[1], text, calls: calls.map(c => c[0]) };
  });
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(r.tab === '站長與募款', '有分頁');
  ok(/停了三十年的老鐘/.test(r.text) && /阿華/.test(r.text) && /小美/.test(r.text) && /壞字/.test(r.text), '內容：' + r.text.slice(0, 80));
  ok(r.calls.includes('admin_mist_delete_message') && r.calls.includes('admin_mist_void_bid'), '刪留言、作廢出價會呼叫資料庫：' + r.calls.join(','));
  await b.close(); srv.kill(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
