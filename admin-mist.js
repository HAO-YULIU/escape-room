// 夜語工作室・管理頁：迷霧（大型開放 RPG）專用的分頁
// 迷霧玩家（存檔、存檔歷史與還原、修改存檔、停用帳號、排行榜隱藏）、回報處理（所有遊戲）、公告與活動、迷霧數據
// 所有資料都靠資料庫權限保護（is_admin()）：不是管理員，讀不到也寫不了。

const TZ = { timeZone: 'Asia/Taipei' };
const dt = (t) => t ? new Date(t).toLocaleString('zh-TW', { ...TZ, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '–';
const ago = (t) => {
  if (!t) return '–'; const s = (Date.now() - new Date(t)) / 1000;
  return s < 60 ? '剛剛' : s < 3600 ? `${s / 60 | 0} 分鐘前` : s < 86400 ? `${s / 3600 | 0} 小時前` : s < 86400 * 30 ? `${s / 86400 | 0} 天前` : new Date(t).toLocaleDateString('zh-TW', TZ);
};
const localInput = (t) => { if (!t) return ''; const d = new Date(t); const o = new Date(d.getTime() - d.getTimezoneOffset() * 60e3); return o.toISOString().slice(0, 16); };
const visitedN = (d) => d && d.visited && typeof d.visited === 'object' ? Object.keys(d.visited).length : 0;
const treasN = (d) => d && d.items && typeof d.items === 'object' ? Object.keys(d.items).length : 0;

// 迷霧的節慶活動（遊戲裡的任務 id）
const EVENTS = [['event_double10', '雙十節'], ['event_halloween', '萬聖節（含小活動）'], ['event_xmas', '聖誕節'], ['event_newyear', '跨年'], ['event_lunar', '春節'], ['event_midautumn', '中秋節'], ['event_valentine', '情人節']];
// 回報問題的遊戲名稱（bug_reports.game）
const GAME_NAMES = { mist: '迷霧', 'qianchan-school': '千嬋高級中學：第一章', school2: '千嬋高級中學：第二章', pupu: '「屎」瓦帝尼', love: '大直愛情摩天輪', bang: '越南公主', sea: '沈園殘燭', arg: '零號回信' };
const STATUS = [['open', '待處理', ''], ['doing', '處理中', 'warn'], ['done', '已解決', 'ok'], ['ignored', '不處理', 'bad']];

export const CSS_MIST = `
.adm-mist-p td .avatar-img, .adm-mist-p td .avatar-svg { width: 32px; height: 32px; }
.adm-mist-p .who { display: flex; gap: 8px; align-items: center; }
.adm-mist-p .who small { display: block; color: var(--muted); font-size: 11px; }
.adm-acts { display: flex; flex-wrap: wrap; gap: 4px; }
.adm-acts .btn { padding: 4px 10px; font-size: 12px; }
.adm-hist { margin: 8px 0 0; padding: 10px 12px; border-radius: 10px; background: rgba(14,17,32,.6); border: 1px solid var(--line); }
.adm-hist .row { display: flex; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px dashed rgba(239,230,210,.1); font-size: 13px; }
.adm-hist .row span { flex: 1; min-width: 0; }
.adm-rep { padding: 12px 0; border-bottom: 1px solid rgba(239,230,210,.08); }
.adm-rep pre { white-space: pre-wrap; word-break: break-word; font: 12px/1.45 ui-monospace, monospace; color: var(--muted); margin: 6px 0; max-height: 180px; overflow: auto; background: rgba(0,0,0,.2); padding: 8px; border-radius: 8px; }
.adm-rep .ctl { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; }
.adm-rep textarea { flex: 1 1 260px; min-height: 38px; font: 13px var(--sans); padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(239,230,210,.2); background: #0E1124; color: var(--parchment); }
.adm-tri { display: inline-flex; border: 1px solid rgba(239,230,210,.2); border-radius: 999px; overflow: hidden; }
.adm-tri button { font: 12px var(--sans); padding: 5px 10px; border: 0; background: transparent; color: var(--parchment); cursor: pointer; }
.adm-tri button[aria-pressed="true"] { background: var(--gold); color: #12142A; }
.adm-ev { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px dashed rgba(239,230,210,.1); flex-wrap: wrap; }
.adm-pbar { display: inline-block; width: 90px; height: 6px; border-radius: 4px; background: var(--ink-2); vertical-align: middle; overflow: hidden; margin-left: 6px; }
.adm-pbar i { display: block; height: 100%; background: linear-gradient(90deg, #8B7CE6, var(--gold)); }
`;

export function mountMist(ctx) {
  const { supabase, escapeHTML: esc, avatarHTML, toast } = ctx;
  const TABS = [['mplayers', '迷霧玩家'], ['reports', '回報處理'], ['ops', '公告與活動'], ['mstats', '迷霧數據']];
  const empty = (body, t) => { body.innerHTML = `<p class="adm-empty">${t}</p>`; };
  const fail = (body, e) => empty(body, '讀取失敗：' + esc(e.message || String(e)));

  // ---------- 迷霧玩家 ----------
  let plist = [], openHist = null, editUser = null;
  async function players(body) {
    empty(body, '讀取中…');
    const { data, error } = await supabase.rpc('admin_mist_players');
    if (error) return fail(body, error);
    plist = data || []; drawPlayers(body);
  }
  function drawPlayers(body) {
    const row = (p) => `<tr data-u="${p.user_id}">
      <td><div class="who">${avatarHTML({ avatar_url: p.avatar_url, appearance: p.appearance, username: p.username }, 32)}<div><b>${esc(p.username || '（沒有角色名字）')}</b>${p.is_admin ? '<span class="adm-tag">管理員</span>' : ''}${p.banned ? '<span class="adm-tag bad">已停用</span>' : ''}${p.hidden ? '<span class="adm-tag warn">排行榜隱藏</span>' : ''}<small>${esc(p.email || '')}</small></div></div></td>
      <td class="n">Lv ${p.level ?? 1}</td><td>${esc(p.station || '–')}</td><td class="n">${p.stations} 站</td><td class="n">${p.treasures} / 6</td>
      <td class="n">NT$ ${p.money ?? '–'}${p.gold ? `<br>🪙 ${p.gold}` : ''}</td><td class="n">${ago(p.updated_at)}</td>
      <td><div class="adm-acts"><button class="btn btn-ghost" data-hist="${p.user_id}">存檔歷史（${p.history}）</button><button class="btn btn-ghost" data-edit="${p.user_id}">修改存檔</button>
        <button class="btn btn-ghost" data-ban="${p.user_id}">${p.banned ? '恢復帳號' : '停用帳號'}</button><button class="btn btn-ghost" data-hide="${p.user_id}">${p.hidden ? '排行榜顯示' : '排行榜隱藏'}</button></div></td></tr>
      ${openHist === p.user_id ? `<tr><td colspan="8"><div class="adm-hist" id="adm-hist">讀取中…</div></td></tr>` : ''}
      ${editUser === p.user_id ? `<tr><td colspan="8"><div class="adm-hist" id="adm-edit">讀取中…</div></td></tr>` : ''}`;
    body.innerHTML = `<div class="adm-card"><h3>迷霧玩家<small>${plist.length} 人有雲端存檔・管理員和被隱藏、停用的帳號不會上排行榜</small></h3>
      ${plist.length ? `<div class="adm-scroll"><table class="adm-tbl adm-mist-p"><tr><th>玩家</th><th>等級</th><th>所在</th><th>去過</th><th>寶物</th><th>錢</th><th>最後同步</th><th></th></tr>${plist.map(row).join('')}</table></div>` : '<p class="adm-empty">還沒有人有迷霧的雲端存檔。</p>'}</div>`;
    body.querySelectorAll('[data-hist]').forEach(b => b.onclick = () => { editUser = null; openHist = openHist === b.dataset.hist ? null : b.dataset.hist; drawPlayers(body); if (openHist) history(body, openHist); });
    body.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { openHist = null; editUser = editUser === b.dataset.edit ? null : b.dataset.edit; drawPlayers(body); if (editUser) editSave(body, editUser); });
    body.querySelectorAll('[data-ban]').forEach(b => b.onclick = () => toggle(body, 'banned_users', b.dataset.ban, plist.find(p => p.user_id === b.dataset.ban)?.banned));
    body.querySelectorAll('[data-hide]').forEach(b => b.onclick = () => toggle(body, 'leaderboard_hidden', b.dataset.hide, plist.find(p => p.user_id === b.dataset.hide)?.hidden));
  }
  async function toggle(body, table, uid, on) {
    const p = plist.find(x => x.user_id === uid), name = p?.username || '這個帳號';
    if (table === 'banned_users' && !on && !confirm(`確定要停用「${name}」嗎？停用後他的進度不能再同步到雲端、也不會出現在排行榜（可以隨時恢復）。`)) return;
    let reason = null;
    if (table === 'banned_users' && !on) reason = prompt('停用原因（只有管理員看得到，可以不填）', '') || null;
    const { error } = on ? await supabase.from(table).delete().eq('user_id', uid) : await supabase.from(table).insert(table === 'banned_users' ? { user_id: uid, reason } : { user_id: uid });
    if (error) return toast('失敗：' + error.message, 'error');
    toast(table === 'banned_users' ? (on ? `已恢復「${name}」` : `已停用「${name}」`) : (on ? `「${name}」重新出現在排行榜` : `「${name}」已從排行榜隱藏`), 'ok');
    players(body);
  }
  async function history(body, uid) {
    const box = body.querySelector('#adm-hist'); if (!box) return;
    const [{ data: cur }, { data, error }] = await Promise.all([
      supabase.from('game_saves').select('data, level, station, updated_at').eq('user_id', uid).eq('game', 'mist').maybeSingle(),
      supabase.from('game_save_history').select('id, data, level, station, saved_at, replaced_at').eq('user_id', uid).eq('game', 'mist').order('replaced_at', { ascending: false }).limit(30)]);
    if (error) { box.textContent = '讀取失敗：' + error.message; return; }
    const line = (d, lv, st, when, extra) => `Lv ${lv ?? 1}・${esc(st || '–')}・去過 ${visitedN(d)} 站・寶物 ${treasN(d)}・NT$ ${d?.money ?? '–'}${d?.gold ? `・🪙 ${d.gold}` : ''}<br><small>${extra}${dt(when)}${d?._dev ? `・裝置 ${esc(String(d._dev).slice(0, 6))}` : ''}</small>`;
    box.innerHTML = `<b>現在的雲端存檔</b><div class="row"><span>${cur ? line(cur.data, cur.level, cur.station, cur.updated_at, '最後同步 ') : '（沒有）'}</span></div>
      <b style="display:block;margin-top:10px">以前的版本<small style="color:var(--muted);font-weight:400">（每次被覆蓋前留一份；同一台裝置 10 分鐘內只留一份，換了裝置一定留）</small></b>
      ${(data || []).map(h => `<div class="row"><span>${line(h.data, h.level, h.station, h.saved_at, '存於 ')}</span><button class="btn btn-ghost btn-sm" data-restore="${h.id}">還原這一份</button></div>`).join('') || '<p class="adm-empty">還沒有以前的版本。</p>'}`;
    box.querySelectorAll('[data-restore]').forEach(b => b.onclick = async () => {
      const h = data.find(x => String(x.id) === b.dataset.restore); if (!h) return;
      if (!confirm(`把這個玩家的存檔還原成 ${dt(h.saved_at)} 那一份嗎？現在的存檔會先自動留一份在歷史裡。玩家下次打開遊戲會被問要不要用雲端的進度。`)) return;
      const d = { ...h.data, savedAt: Date.now(), _dev: 'admin-restore' };
      const { error: e2 } = await supabase.from('game_saves').update({ data: d, level: h.level, station: h.station, updated_at: new Date().toISOString() }).eq('user_id', uid).eq('game', 'mist');
      if (e2) return toast('還原失敗：' + e2.message, 'error');
      toast('已還原 ✨', 'ok'); players(body);
    });
  }
  async function editSave(body, uid) {
    const box = body.querySelector('#adm-edit'); if (!box) return;
    const { data: cur, error } = await supabase.from('game_saves').select('data, level, station').eq('user_id', uid).eq('game', 'mist').maybeSingle();
    if (error || !cur) { box.textContent = error ? '讀取失敗：' + error.message : '這個玩家沒有雲端存檔。'; return; }
    const d = cur.data || {};
    box.innerHTML = `<form class="adm-form" id="adm-edit-f"><b>修改存檔<small style="color:var(--muted);font-weight:400">（改之前的版本會自動留在存檔歷史；玩家下次打開遊戲會被問要不要用雲端的進度）</small></b>
      <div class="two"><label>NT$<input type="number" name="money" value="${d.money ?? 0}"></label><label>黃金<input type="number" name="gold" value="${d.gold ?? 0}"></label></div>
      <div class="two"><label>經驗值<input type="number" name="xp" value="${d.xp ?? 0}" min="0"></label><label>所在車站<input name="current" value="${esc(d.current || '')}"></label></div>
      <div class="acts"><button class="btn btn-gold" type="submit">儲存</button><button class="btn btn-ghost" type="button" id="adm-edit-x">取消</button></div></form>`;
    box.querySelector('#adm-edit-x').onclick = () => { editUser = null; drawPlayers(body); };
    box.querySelector('#adm-edit-f').onsubmit = async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(e.target));
      const nd = { ...d, money: Math.round(+v.money || 0), gold: Math.max(0, Math.round(+v.gold || 0)), xp: Math.max(0, Math.round(+v.xp || 0)), current: v.current.trim() || d.current, savedAt: Date.now(), _dev: 'admin-edit' };
      const { error: e2 } = await supabase.from('game_saves').update({ data: nd, station: nd.current, updated_at: new Date().toISOString() }).eq('user_id', uid).eq('game', 'mist');
      if (e2) return toast('儲存失敗：' + e2.message, 'error');
      toast('存檔已修改', 'ok'); editUser = null; players(body);
    };
  }

  // ---------- 回報處理 ----------
  let repFilter = 'open', repGame = 'all';
  async function reports(body) {
    empty(body, '讀取中…');
    let q = supabase.from('bug_reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (repFilter !== 'all') q = q.eq('status', repFilter);
    if (repGame !== 'all') q = q.eq('game', repGame);
    const [{ data, error }, { data: counts }] = await Promise.all([q, supabase.from('bug_reports').select('status,game')]);
    if (error) return fail(body, error);
    const n = {}, ng = {}; for (const r of counts || []) { if (repGame === 'all' || r.game === repGame) n[r.status] = (n[r.status] || 0) + 1; if (r.status === 'open') ng[r.game] = (ng[r.game] || 0) + 1; }
    const games = [...new Set([...Object.keys(GAME_NAMES), ...(counts || []).map(r => r.game).filter(Boolean)])];
    const pr = await names((data || []).map(r => r.user_id));
    const infoTxt = (i) => { if (!i || typeof i !== 'object') return ''; const e = (i.errors || []).slice(-3).map(x => '• ' + (x.t ? x.t + ' ' : '') + (x.m || x.message || JSON.stringify(x))).join('\n');
      const extra = ['mode', 'ch', 'sc', 'phase', 'players', 'lives', 'chapter', 'p2', 'solved', 'hints', 'wrong'].filter(k => i[k] != null).map(k => `${k}=${i[k]}`).join('  ');
      return [i.at && `位置 ${i.at}`, i.v && `版本 ${i.v}`, i.zone && `區域 ${i.zone}`, i.pos && `位置 ${Array.isArray(i.pos) ? i.pos.map(v => (+v).toFixed?.(1) ?? v).join(', ') : JSON.stringify(i.pos)}`, i.time && `遊戲時間 ${i.time}`, extra, i.vp && `畫面 ${[].concat(i.vp).join(' × ')}`, i.lv && `Lv ${i.lv}`, i.quality && `畫質 ${i.quality}`, i.fps && `fps ${i.fps}`, i.ua && i.ua.slice(0, 140), e && '最近錯誤：\n' + e].filter(Boolean).join('\n'); };
    body.innerHTML = `<div class="adm-card"><h3>玩家回報的問題</h3>
      <div class="adm-acts" style="margin-bottom:8px">${[['open', '待處理'], ['doing', '處理中'], ['done', '已解決'], ['ignored', '不處理'], ['all', '全部']].map(([k, t]) => `<button class="btn ${repFilter === k ? 'btn-gold' : 'btn-ghost'} btn-sm" data-f="${k}">${t}${k !== 'all' ? `（${n[k] || 0}）` : ''}</button>`).join('')}</div>
      <div class="adm-acts" style="margin-bottom:8px">${[['all', '全部遊戲'], ...games.map(g => [g, GAME_NAMES[g] || g])].map(([k, t]) => `<button class="btn ${repGame === k ? 'btn-gold' : 'btn-ghost'} btn-sm" data-g="${esc(k)}">${esc(t)}${k !== 'all' && ng[k] ? `（待處理 ${ng[k]}）` : ''}</button>`).join('')}</div>
      ${(data || []).map(r => `<div class="adm-rep" data-id="${r.id}"><b>${esc(GAME_NAMES[r.game] || r.game || '大廳')}</b>${r.station ? `<span class="adm-tag">${esc(r.station)}</span>` : ''}<span class="adm-tag ${STATUS.find(s => s[0] === r.status)?.[2] || ''}">${STATUS.find(s => s[0] === r.status)?.[1] || r.status}</span>
        <span class="muted" style="font-size:12px;margin-left:6px">${dt(r.created_at)}・${r.user_id ? esc(pr[r.user_id] || '有登入') : '沒登入'}</span>
        <p style="margin:6px 0">${esc(r.message || '')}</p>${r.info ? `<pre>${esc(infoTxt(r.info))}</pre>` : ''}
        <div class="ctl"><select class="adm-sel" data-st>${STATUS.map(([k, t]) => `<option value="${k}"${r.status === k ? ' selected' : ''}>${t}</option>`).join('')}</select>
          <textarea data-note placeholder="處理備註（只有管理員看得到）">${esc(r.admin_note || '')}</textarea>
          <button class="btn btn-gold btn-sm" data-save>儲存</button><button class="btn btn-ghost btn-sm" data-del>刪除</button></div></div>`).join('') || '<p class="adm-empty">這裡沒有回報。</p>'}</div>`;
    body.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { repFilter = b.dataset.f; reports(body); });
    body.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { repGame = b.dataset.g; reports(body); });
    body.querySelectorAll('.adm-rep').forEach(el => {
      const id = el.dataset.id;
      el.querySelector('[data-save]').onclick = async () => {
        const status = el.querySelector('[data-st]').value, note = el.querySelector('[data-note]').value.trim().slice(0, 2000);
        const { error: e2 } = await supabase.from('bug_reports').update({ status, admin_note: note || null, handled_at: status === 'open' ? null : new Date().toISOString() }).eq('id', id);
        if (e2) return toast('儲存失敗：' + e2.message, 'error'); toast('已更新', 'ok'); reports(body);
      };
      el.querySelector('[data-del]').onclick = async () => {
        if (!confirm('確定要刪除這則回報嗎？刪掉就找不回來了。')) return;
        const { error: e2 } = await supabase.from('bug_reports').delete().eq('id', id);
        if (e2) return toast('刪除失敗：' + e2.message, 'error'); toast('已刪除'); reports(body);
      };
    });
  }
  async function names(ids) {
    const u = [...new Set(ids.filter(Boolean))]; if (!u.length) return {};
    const { data } = await supabase.from('profiles').select('id, username').in('id', u);
    return Object.fromEntries((data || []).map(p => [p.id, p.username || '（沒有角色名字）']));
  }

  // ---------- 公告與活動 ----------
  let annEdit = null;
  async function ops(body) {
    empty(body, '讀取中…');
    const [{ data: anns, error }, { data: cfg }] = await Promise.all([
      supabase.from('game_announcements').select('*').eq('game', 'mist').order('created_at', { ascending: false }).limit(50),
      supabase.from('game_config').select('key, value').eq('game', 'mist')]);
    if (error) return fail(body, error);
    const C = Object.fromEntries((cfg || []).map(r => [r.key, r.value]));
    const ev = C.events && typeof C.events === 'object' ? C.events : {}, xp = +C.xp_mult || 1;
    const a = annEdit ? anns.find(x => String(x.id) === String(annEdit)) : null;
    const now = Date.now(), live = x => x.active && new Date(x.starts_at) <= now && (!x.ends_at || new Date(x.ends_at) > now);
    body.innerHTML = `
      <div class="adm-card"><h3>活動設定<small>玩家下次打開遊戲（或 10 分鐘內）就會套用</small></h3>
        <div class="adm-ev"><span><b>經驗倍數</b><br><small class="muted">雙倍經驗時段；遊戲標題畫面會顯示</small></span>
          <div class="adm-tri" data-xp>${[1, 1.5, 2, 3].map(v => `<button type="button" data-v="${v}" aria-pressed="${xp === v}">${v === 1 ? '一般' : v + ' 倍'}</button>`).join('')}</div></div>
        ${EVENTS.map(([id, t]) => { const v = Object.prototype.hasOwnProperty.call(ev, id) ? (ev[id] ? 'on' : 'off') : 'auto';
          return `<div class="adm-ev"><span><b>${t}</b></span><div class="adm-tri" data-ev="${id}">${[['auto', '照日期'], ['on', '強制開'], ['off', '強制關']].map(([k, n]) => `<button type="button" data-v="${k}" aria-pressed="${v === k}">${n}</button>`).join('')}</div></div>`; }).join('')}
      </div>
      <div class="adm-card"><h3>${a ? '修改公告' : '發一則遊戲內公告'}<small>標題畫面會顯示最新兩則；遊戲中沒看過的會跳出來一次</small></h3>
        <form class="adm-form" id="adm-ann-f">
          <label>標題<input name="title" required maxlength="80" value="${esc(a?.title || '')}"></label>
          <label>內容（選填）<textarea name="body" maxlength="1000">${esc(a?.body || '')}</textarea></label>
          <div class="two"><label>開始時間<input type="datetime-local" name="starts_at" value="${localInput(a?.starts_at || new Date())}"></label><label>結束時間（留空＝一直顯示）<input type="datetime-local" name="ends_at" value="${localInput(a?.ends_at)}"></label></div>
          <label class="chk"><input type="checkbox" name="active"${!a || a.active ? ' checked' : ''}> 啟用</label>
          <div class="acts"><button class="btn btn-gold" type="submit">${a ? '儲存修改' : '發布'}</button>${a ? '<button class="btn btn-ghost" type="button" id="adm-ann-x">取消</button>' : ''}</div></form></div>
      <div class="adm-card"><h3>全部公告<small>${anns.length} 則</small></h3>${anns.map(x => `<div class="adm-news"><div><b>${esc(x.title)}</b>${live(x) ? '<span class="adm-tag ok">顯示中</span>' : x.active ? '<span class="adm-tag warn">不在時間內</span>' : '<span class="adm-tag">停用</span>'}
        <p>${dt(x.starts_at)} → ${x.ends_at ? dt(x.ends_at) : '不結束'}</p>${x.body ? `<p>${esc(x.body)}</p>` : ''}</div>
        <button class="btn btn-ghost" data-ae="${x.id}">修改</button><button class="btn btn-ghost" data-ad="${x.id}">刪除</button></div>`).join('') || '<p class="adm-empty">還沒有公告。</p>'}</div>`;
    const setCfg = async (key, value) => {
      const { error: e2 } = await supabase.from('game_config').upsert({ game: 'mist', key, value, updated_at: new Date().toISOString() });
      if (e2) return toast('儲存失敗：' + e2.message, 'error'); toast('已更新', 'ok'); ops(body);
    };
    body.querySelector('[data-xp]').onclick = e => { const b = e.target.closest('[data-v]'); if (b) setCfg('xp_mult', +b.dataset.v); };
    body.querySelectorAll('[data-ev]').forEach(g => g.onclick = e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      const next = { ...ev }; if (b.dataset.v === 'auto') delete next[g.dataset.ev]; else next[g.dataset.ev] = b.dataset.v === 'on';
      setCfg('events', next);
    });
    const f = body.querySelector('#adm-ann-f');
    f.onsubmit = async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      const row = { game: 'mist', title: v.title.trim(), body: v.body.trim() || null, starts_at: v.starts_at ? new Date(v.starts_at).toISOString() : new Date().toISOString(), ends_at: v.ends_at ? new Date(v.ends_at).toISOString() : null, active: !!v.active };
      const { error: e2 } = annEdit ? await supabase.from('game_announcements').update(row).eq('id', annEdit) : await supabase.from('game_announcements').insert(row);
      if (e2) return toast('儲存失敗：' + e2.message, 'error');
      toast(annEdit ? '公告已更新' : '公告已發布 ✨', 'ok'); annEdit = null; ops(body);
    };
    body.querySelector('#adm-ann-x')?.addEventListener('click', () => { annEdit = null; ops(body); });
    body.querySelectorAll('[data-ae]').forEach(b => b.onclick = () => { annEdit = b.dataset.ae; ops(body); scrollTo({ top: 0, behavior: 'smooth' }); });
    body.querySelectorAll('[data-ad]').forEach(b => b.onclick = async () => {
      if (!confirm('確定要刪除這則公告嗎？')) return;
      const { error: e2 } = await supabase.from('game_announcements').delete().eq('id', b.dataset.ad);
      if (e2) return toast('刪除失敗：' + e2.message, 'error'); toast('已刪除'); ops(body);
    });
  }

  // ---------- 迷霧數據 ----------
  let days = 7;
  async function stats(body) {
    empty(body, '讀取中…');
    const { data: S, error } = await supabase.rpc('admin_mist_stats', { days });
    if (error) return fail(body, error);
    const K = S.kinds || {}, daily = S.daily || [], mx = Math.max(1, ...daily.map(d => d.players));
    const bar = (a, b) => `<span class="adm-pbar"><i style="width:${b ? Math.round(a / b * 100) : 0}%"></i></span> ${b ? Math.round(a / b * 100) + '%' : '–'}`;
    const lv = Object.entries(S.levels || {}).sort((a, b) => +a[0] - +b[0]);
    body.innerHTML = `
      <div class="adm-acts" style="margin-bottom:14px">${[1, 7, 30, 90].map(d => `<button class="btn ${days === d ? 'btn-gold' : 'btn-ghost'} btn-sm" data-days="${d}">${d === 1 ? '今天' : `最近 ${d} 天`}</button>`).join('')}</div>
      <div class="adm-kpis">
        <div class="adm-kpi"><b>${daily.reduce((n, d) => Math.max(n, d.players), 0)}</b><span>單日最多玩家</span></div>
        <div class="adm-kpi"><b>${K.session || 0}</b><span>開遊戲次數</span></div>
        <div class="adm-kpi"><b>${K.arrive || 0}</b><span>到站次數</span></div>
        <div class="adm-kpi"><b>${K.quest_done || 0}</b><span>完成任務</span></div>
        <div class="adm-kpi"><b>${K.fog_end || 0}</b><span>讀完的霧夜短篇</span></div>
        <div class="adm-kpi"><b>${K.error || 0}</b><span>遊戲錯誤</span></div></div>
      <div class="adm-card"><h3>每天的玩家<small>依裝置或帳號計算</small></h3>${daily.length ? `<div class="adm-bars">${daily.map(d => `<div><b>${d.players}</b><i style="height:${d.players / mx * 70}px"></i><em>${d.day.slice(5)}</em></div>`).join('')}</div>` : '<p class="adm-empty">還沒有數據（玩家更新到新版後才會開始記錄）。</p>'}</div>
      <div class="adm-card"><h3>最常去的車站</h3>${(S.stations || []).length ? `<div class="adm-scroll"><table class="adm-tbl"><tr><th>車站</th><th>到站次數</th><th>玩家</th></tr>${S.stations.map(s => `<tr><td>${esc(s.station)}</td><td class="n">${s.n}</td><td class="n">${s.players}</td></tr>`).join('')}</table></div>` : '<p class="adm-empty">還沒有數據。</p>'}</div>
      <div class="adm-card"><h3>霧夜短篇<small>開始幾次、讀完幾次（完成率低的可能太難或有卡關）</small></h3>${(S.fog || []).length ? `<div class="adm-scroll"><table class="adm-tbl"><tr><th>篇名</th><th>開始</th><th>讀完</th><th>完成率</th><th>完美結局</th></tr>${S.fog.map(f => `<tr><td>${esc(f.name || f.tale)}<br><small class="muted">${esc(f.tale)}</small></td><td class="n">${f.started}</td><td class="n">${f.finished}</td><td>${bar(f.finished, f.started)}</td><td class="n">${f.perfect}</td></tr>`).join('')}</table></div>` : '<p class="adm-empty">還沒有數據。</p>'}</div>
      <div class="adm-card"><h3>任務<small>接了幾次、完成幾次</small></h3>${(S.quests || []).length ? `<div class="adm-scroll"><table class="adm-tbl"><tr><th>任務</th><th>接下</th><th>完成</th><th>完成率</th></tr>${S.quests.map(q => `<tr><td>${esc(q.title || q.quest)}<br><small class="muted">${esc(q.quest)}</small></td><td class="n">${q.started}</td><td class="n">${q.done}</td><td>${bar(q.done, q.started)}</td></tr>`).join('')}</table></div>` : '<p class="adm-empty">還沒有數據。</p>'}</div>
      <div class="adm-card"><h3>等級分布<small>有雲端存檔的玩家</small></h3>${lv.length ? `<div class="adm-chips">${lv.map(([l, n]) => `<span>Lv ${l}：${n} 人</span>`).join('')}</div>` : '<p class="adm-empty">還沒有存檔。</p>'}</div>
      <div class="adm-card"><h3>遊戲錯誤<small>同一個錯誤合在一起</small></h3>${(S.errors || []).length ? S.errors.map(e => `<div class="adm-news"><div><b>${esc(e.m || '（沒有訊息）')}</b><p>${e.n} 次・最後 ${dt(e.last)}</p></div></div>`).join('') : '<p class="adm-empty">沒有錯誤 🎉</p>'}</div>`;
    body.querySelectorAll('[data-days]').forEach(b => b.onclick = () => { days = +b.dataset.days; stats(body); });
  }

  return { TABS, render: (k, body) => ({ mplayers: players, reports, ops, mstats: stats }[k])(body) };
}
