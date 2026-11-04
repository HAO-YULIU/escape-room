// 大廳的 Cloudflare Worker：網頁照樣當靜態檔案發佈（assets）；只有下面兩種網址交給這裡，用 Cloudflare 的快取擋在 Supabase 前面，
// 省 Supabase 的流量（每月約 20 GB 的額度）。Cloudflare 送給玩家的流量不收費。快取要 wrangler.jsonc 的 "cache": { "enabled": true }。
//   /api/lobby       大家看到都一樣的大廳資料（密室、最新消息、人氣、本月暢銷榜、迷霧站長榜、搶先體驗名額），一包回傳，快取 5 分鐘（新消息最多晚 5 分鐘出現；管理員改完內容自己會直接看到最新的）
//                    以前每個人打開大廳都各自跟 Supabase 拿一次（一天約 2 萬次）
//   /api/notice      大廳公告（管理頁「大廳公告」發的，game_announcements 的 game='lobby'），快取 1 分鐘：緊急公告不能等 5 分鐘
//   /av/<路徑>       頭像圖片（Supabase Storage 的 avatars），快取一年：檔名裡有上傳時間，換頭像就是新網址
//                    以前一天約 180 MB，全部從 Supabase 出去
const SB = 'https://umlnwzpmjxktfzjvcbts.supabase.co';
const KEY = 'sb_publishable_8J3VI8dijlCccHQbXPfCQQ_v_O0Au3w';   // 跟網頁裡的一樣，是公開的金鑰

const H = { apikey: KEY, 'Content-Type': 'application/json' };
async function rest(path) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: H });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}
async function rpc(fn, args = {}) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(args) });
  if (!r.ok) throw new Error(`${fn} ${r.status}`);
  return r.json();
}

async function lobby() {
  const now = new Date().toISOString();
  try {
    const [games, news, stats, monthly, escaped, board, early] = await Promise.all([
      rest('games?select=*&order=sort_order'),
      rest(`news?select=*&published_at=lte.${encodeURIComponent(now)}&order=published_at.desc&limit=30`),
      rpc('get_game_stats'), rpc('get_monthly_top2', { lim: 3 }), rpc('get_escaped_counts'),
      rpc('get_mist_master_board2', { lim: 20 }), rpc('mist_early_slots'),
    ]);
    return new Response(JSON.stringify({ at: now, games, news, stats, monthly, escaped, board, early }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=60, s-maxage=300' },
    });
  } catch (e) {
    // 拿不到就不要快取：網頁會改成自己跟 Supabase 拿
    return new Response(JSON.stringify({ error: String(e && e.message || e) }), { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}

async function notice() {
  try {
    // 資料庫的權限只讓大家讀到「啟用中、已經開始、還沒結束」的公告
    const list = await rest("game_announcements?select=id,title,body,level,starts_at,ends_at&game=eq.lobby&order=starts_at.desc&limit=5");
    return new Response(JSON.stringify(list), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch (e) {
    return new Response('[]', { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
}

async function avatar(path) {
  if (!/^[\w-]+\/[\w.-]+$/.test(path)) return new Response('bad path', { status: 400 });
  let r; try { r = await fetch(`${SB}/storage/v1/object/public/avatars/${path}`); } catch (e) { return new Response('upstream error', { status: 502, headers: { 'Cache-Control': 'no-store' } }); }
  if (!r.ok) return new Response('not found', { status: r.status === 400 ? 404 : r.status, headers: { 'Cache-Control': 'public, max-age=300' } });
  return new Response(r.body, {
    headers: { 'Content-Type': r.headers.get('Content-Type') || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/api/lobby') return lobby();
    if (req.method === 'GET' && url.pathname === '/api/notice') return notice();
    if (req.method === 'GET' && url.pathname.startsWith('/av/')) return avatar(url.pathname.slice(4));
    return env.ASSETS.fetch(req);
  },
};
