// node tools/test-mist-live.js：大廳的全服目標／本週站長區塊
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); let fail = 0;
  await p.setContent('<div id="x"></div>'); await p.addScriptTag({ path: path.resolve(__dirname, '../mist-live.js') });
  const t = await p.evaluate(() => {
    const cs = { goal_id: 'clock', target: 200000, total: 51000, top: [{ name: '小明<b>', amount: 20000 }], ends: new Date(Date.now() + 2 * 864e5).toISOString(), done_goals: [] };
    const ms = { period: 2, masters: { 西門: { name: '阿華', price: 9000 }, 辛亥: { name: '小美', price: 1300 } } };
    document.getElementById('x').innerHTML = MistLive.html(cs, ms);
    const rows = [{ user_id: 'u1', username: '阿華', stations: 3, total: 21000, names: ['西門', '台北車站', '辛亥'], period: 2 }, { user_id: 'u2', username: '小美<i>', stations: 1, total: 1300, names: ['淡水'], period: 2 }];
    const board = MistLive.boardRows(rows, 'u2', () => '<span class="av"></span>');
    const emptyBoard = MistLive.boardRows([], null, () => '');
    return { text: document.getElementById('x').innerText, html: document.getElementById('x').innerHTML, empty: MistLive.html(null, null), board, emptyBoard };
  });
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
  ok(/停了三十年的老鐘/.test(t.text) && /51,000/.test(t.text) && /200,000/.test(t.text), '募款題目與進度');
  ok(/西門/.test(t.text) && /阿華/.test(t.text) && t.text.indexOf('西門') < t.text.indexOf('辛亥'), '本週站長依得標價排序');
  ok(!/<b>/.test(t.text) || !t.html.includes('小明<b>'), '名字有跳脫（不會插入 HTML）');
  ok(t.empty === '', '沒資料時不顯示');
  ok(/阿華/.test(t.board) && /3<small> 站/.test(t.board) && /西門/.test(t.board) && t.board.indexOf('阿華') < t.board.indexOf('小美'), '排行榜：擁有的車站數排名');
  ok(/mist-mine/.test(t.board.split('</li>')[1]) && !t.board.includes('小美<i>'), '自己那一列有標示、名字有跳脫');
  ok(/還沒有站長/.test(t.emptyBoard), '沒有站長時的說明');
  await b.close(); console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
})();
