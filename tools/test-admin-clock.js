// node tools/test-admin-clock.js：玩家裝置時鐘快了幾個小時（存檔時間在未來）時，管理頁不會一直把他算成「在線」
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.resolve(__dirname, '../admin.js'), 'utf8');
const pick = name => src.split('\n').find(l => l.startsWith(`const ${name} =`));
const { future, maxT } = new Function(`${pick('future')}\n${pick('maxT')}\nreturn { future, maxT };`)();
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const now = Date.now(), iso = ms => new Date(ms).toISOString();
const sess = iso(now - 30 * 3600e3), aheadSave = iso(now + 9 * 3600e3), recent = iso(now - 60e3);
ok(future(aheadSave) && !future(recent) && !future(null), '未來 9 小時的存檔算「未來」，1 分鐘前的不算');
ok(maxT(sess, aheadSave) === sess, '未來的存檔時間不算：最後上線用登入紀錄（30 小時前），不會一直在線');
ok(maxT(sess, recent) === recent, '正常的存檔時間照算');
ok(maxT('2026-11-03 23:46:45+00', '2026-11-03T23:40:00.000Z') === '2026-11-03 23:46:45+00' || future('2026-11-03 23:46:45+00'), '不同格式的時間照時間先後比較（不是照字串）');
ok(maxT(null, undefined) === null, '都沒有就是 null');
console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
