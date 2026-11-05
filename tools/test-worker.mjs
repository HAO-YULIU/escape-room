// node tools/test-worker.mjs：大廳 Worker（worker/index.js）——Supabase 用假的 fetch 代替
import worker from '../worker/index.js';
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fail++; };
const calls = []; let broken = false;
globalThis.fetch = async (url, opt = {}) => {
  url = String(url); calls.push([opt.method || 'GET', url, opt.headers && opt.headers.apikey]);
  if (broken && url.includes('rpc/get_game_stats')) return new Response('x', { status: 500 });
  if (url.includes('/storage/v1/object/public/avatars/u1/a.jpg')) return new Response('IMG', { headers: { 'Content-Type': 'image/webp' } });
  if (url.includes('/storage/')) return new Response('no', { status: 400 });
  if (url.includes('/rest/v1/games')) return Response.json([{ id: 'g1', slug: 'x' }]);
  if (url.includes('/rest/v1/news')) return Response.json([{ id: 1, title: '消息' }]);
  if (url.includes('rpc/mist_early_slots')) return Response.json({ left: 0, limit: 10 });
  return Response.json([{ n: 1 }]);
};
const get = p => worker.fetch(new Request('https://lobby-api.example' + p));

let r = await get('/api/lobby'), j = await r.json();
ok(r.status === 200 && /s-maxage=300/.test(r.headers.get('Cache-Control')) && /max-age=300/.test(r.headers.get('Cache-Control')), '大廳資料：200、Cloudflare 和瀏覽器都快取 5 分鐘');
ok(r.headers.get('Access-Control-Allow-Origin') === '*', '大廳網頁在另一個網址：允許跨網址讀取');
ok(j.games?.[0]?.slug === 'x' && j.news?.[0]?.title === '消息' && j.stats && j.monthly && j.escaped && j.board && j.early, '一包裡有密室、消息、人氣、暢銷榜、逃脫人數、站長榜、搶先名額');
ok(calls.every(c => c[2]), '跟 Supabase 拿資料都有帶 apikey');
ok(calls.some(c => c[1].includes('news?') && c[1].includes('published_at=lte.')), '消息只拿已經發佈的');
broken = true; r = await get('/api/lobby');
ok(r.status === 502 && r.headers.get('Cache-Control') === 'no-store', 'Supabase 出錯：502、不快取（網頁改成自己拿）');
r = await get('/av/u1/a.jpg');
ok(r.status === 200 && (await r.text()) === 'IMG' && /immutable/.test(r.headers.get('Cache-Control')) && r.headers.get('Content-Type') === 'image/webp', '頭像：照原本的格式回傳、快取一年');
r = await get('/av/a/b/c.jpg');
ok(r.status === 400, '頭像路徑不合法：400');
r = await get('/av/u1/none.jpg');
ok(r.status === 404, '頭像不存在：404');
r = await get('/index.html');
ok(r.status === 404 && r.headers.get('Access-Control-Allow-Origin') === '*', '其他網址：404（大廳網頁是另一個只有靜態檔案的 Worker）');
r = await get('/av/u1/a.jpg');
ok(r.headers.get('Access-Control-Allow-Origin') === '*', '頭像也允許跨網址');
console.log(fail ? `${fail} failed` : 'all passed'); process.exit(fail ? 1 : 0);
