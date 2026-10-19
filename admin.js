import { mountMist, CSS_MIST } from './admin-mist.js?v=1';
// 夜語工作室・管理頁（只有管理員登入後才會載入）
// 資料都靠資料庫權限保護：admin_dump() 不是管理員會直接被拒絕；最新消息、遊戲資訊的修改也只有管理員能寫入。
// 這個檔案本身沒有任何秘密，就算被人看到也拿不到資料。

// ---------- 各款遊戲的存檔格式 → 看得懂的進度 ----------
const QC_SCENES = {
  wc: '舊宿舍・一樓洗手間', gate: '校門', hall2: '教學大樓・二樓走廊', lib: '圖書館', side: '側門', hallA: '教學大樓・一樓走廊',
  pcroom: '舊電腦教室', bleach: '舊看台', room: '慈幽的房間', lib2: '圖書館・最裡面的座位', store: '舊宿舍旁的儲藏室', study: '小羽的書房',
  dorm1: '舊宿舍・一樓', dorm2: '舊宿舍・二樓走廊', r207: '207 號房', r2011: '207 號房（？）', dawn: '學校側門・清晨',
  e1room: '小羽的書房（幾天後）', e1board: '穿堂・公布欄', e1cls: 'A204 教室', e2yu: '小羽的書房（深夜）', e2ci: '慈幽的房間', e3: '207 號房・鏡子前', e3home: '慈幽的房間（那天晚上）', e4: '小羽的書房（幾天後）', e4cls: 'A204 教室（幾天後）',
};
const S2_SCENES = {
  home: '印潔家門口', gate: '校門口', c109: '109 班教室', office: '導師辦公室', hall: '一樓走廊', oldgate: '舊校舍鐵門', c2: '二年級走廊', cdoor: '社團教室門口',
  club: '社團教室', club3: '社團教室・門後', hall3: '二樓走廊', stair3: '樓梯間',
  lamp: '舊校舍最深處', oldhall: '舊校舍・一樓走廊', oldclass: '三年八班（三年前）', oldoffice: '教務處（三年前）', store: '雜物間',
  b1: '地下一樓走廊', b10: 'B-10 舊廣播機房', b11: 'B-11 暗房', b12: 'B-12 置物室', b13: 'B-13 資料室', iron: '大鐵門前',
  e1: '地下樓梯・往一樓', elib: '圖書館', elobby: '一樓大廳', efield: '操場', elast: '最後一條走廊', egate: '校門・倒數',
  d0: '三樓・舊校舍走廊', dmusic: '音樂教室', dfinal: '三年八班', p7out: '校門外', dawn: '校門口・清晨',
};
const PUPU_SCENES = {
  seat: '第 17 排・A 座', aisle: '機艙走道', door: '廁所門前', airport: '史瓦帝尼機場', bus: '觀光巴士', mantenga: 'Mantenga 文化村',
  hlane: 'Hlane 國家公園', market: 'Malkerns 市集', lobby: '旅館大廳', hall: '走廊', room: '113 號房', r103: '103 號房', maze: '相連的房間',
  store: '郝翔的秘密倉庫', black: '黑色的門',
};
const QS_FAIL = ['all-vanished', 'hell-fail', 'no-handover'];   // 千山夜錄的失敗結局
const QS_CH = [['prologue', '序章'], ['ch1', '第一章'], ['ch2', '第二章'], ['ch3', '第三章'], ['ch4', '第四章'], ['finale', '終章'], ['ending', '最後的交班']];
// 五星級救援隊：樓層順序（pi＝爬到第幾層）、隊員代號
const HOTEL_FLOORS = [['palace', '序幕・亞西吉王宮'], ['B2', 'B2 地下停車場'], ['B1', 'B1 運動中心・游泳池'], ['1F', '1F 大廳'], ['2F', '2F 皇家餐廳'], ['3F', '3F 小遊戲區'],
  ['4F', '4F 皇家宴會廳'], ['5F', '5F 客房區'], ['6F', '6F 辦公室・機房'], ['7F', '7F 總統套房'], ['RF', '頂樓']];
const HOTEL_HEROES = { xueling: '雪鈴', yunfeng: '允楓', zixin: '子馨', guanxian: '冠賢', yixin: '誼心', junwei: '均為' };
const PARTS8 = ['第一部分', '第二部分', '第三部分', '第四部分', '第五部分', '第六部分', '第七部分', '第八部分'];
const ENDING_NAMES = {
  'qianchan-school': { e1: '封存的黎明', e2: '空白名冊', e3: '鏡子後面的走廊', e4: '名字還在（隱藏）' },
  school2: { e1: '沒有帶聖安', e2: 'TRUE END', e3: '她還在等我', e4: '她現在是我', e5: '逃跑失敗', e6: '邦瑜真正被放下', eh: '隱藏真結局' },
  bang: { pb: '彈珠王', xq_w: '象棋勝', xq_l: '象棋輸', xq_d: '象棋和', cd1: '撲克第一', cd2: '撲克第二', cd3: '撲克第三', mj1: '麻將第一', mj2: '麻將第二', mj3: '麻將第三', mj4: '麻將最後' },
  sea: { solo: '單人破案', duo: '雙人破案' },
  'qianshan-night': { 'return-names': '把姓名還給原主', 'seal-building': '封閉舊住院大樓', 'stop-qianshan': '終止記憶保存程序', 'let-her-go': '讓四十七號病患離院',
    'evidence-out': '讓所有證據離開和山醫院', 'stay-handover': '有人留下完成交班', leave: '離開醫院，不再追問', 'leave-early': '提早離開（失敗）', 'blank-patient': '空白病患（隱藏）',
    'never-ending-night': '暮兒之夜：永不熄滅的夜', forgotten: '暮兒之夜：被遺忘的人', 'last-page': '暮兒之夜：最後一頁', 'still-searching': '暮兒之夜：她還在找人',
    'all-vanished': '失敗：全隊的名字都消失', 'hell-fail': '失敗：全隊成為病患（地獄版）', 'no-handover': '失敗：沒有人接班（地獄版）' },
  hotel1: { rescue: '救出皇后', secret: '救出皇后＋看到 B3 的祕密（隱藏）' },
  arg: { E1: '未完成', E2: '交接', E3: '記錄者', E4: '停止計算', E5: '沉默', E6: '第八位收件人', E7: '被遺忘的權利', E8: '你不知道' },
};
const BANG_CH = [['序章', '台北車站', 8], ['第一章', '故宮', 11], ['第二章', '台北市立美術館', 11], ['第三章', '九份', 11], ['第四章', '十分', 11],
  ['第五章', '台北 101', 11], ['第六章', '淡水老街', 11], ['第七章', '西門町', 11], ['第八章', '饒河夜市', 11], ['第九章', '大安森林公園', 12]];
const SEA_PARTS = ['第一部分・殘燭初燃', '第二部分・暗潮浮影', '第三部分・燭影照罪'];
const SEA_SOLO = [['gate', '雨夜請柬', 1], ['dinner', '沈家的晚宴', 1], ['before', '十點之前', 1], ['murder', '書房命案', 1], ['testimony', '證詞與謊言', 2], ['clinic', '醫師的判斷', 2],
  ['kitchen', '吳媽的鑰匙', 2], ['phone', '電話間的空白', 2], ['restudy', '重新勘查書房', 3], ['office', '帳目與鑰匙', 3], ['final', '最後的證詞', 3], ['timeline', '重建案發時間', 3]];
const SEA_DUO = [...SEA_SOLO.slice(0, 8), ['music', '柳如煙的信', 2], ['ledger', '唐紹文的帳冊', 2], ...SEA_SOLO.slice(8)];
const ARG_P1 = ['序章', '第一章', '第二章', '第三章', '第四章', '第五章', '第六章', '第七章', '第八章', '最終階段'];
const ARG_P2 = { 9: '第零層檔案', 10: '那個沒有被記錄的下午', 11: '第八個人的名字', 12: '最後一名研究人員', 13: '你不能寄出的信', 14: '最後一個不存在的資料夾', 15: '原始請求',
  16: '你第一次登入的時間', 17: '七個人都說自己不是寄件者', 18: '不存在的第八份證詞', 19: '你留下的不是答案', 20: '零號回信' };

// 存檔裡的值：可能是 JSON 字串，也可能已經被資料庫解析好；很長的欄位會被換成 {_n: 數量}
const J = (v) => { if (v == null) return null; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return null; } };
const cnt = (o) => !o ? 0 : typeof o._n === 'number' ? o._n : Array.isArray(o) ? o.length : typeof o === 'object' ? Object.keys(o).length : 0;
const keysOf = (o) => (o && typeof o === 'object' && typeof o._n !== 'number' ? Object.keys(o) : null);
const endList = (game, e) => Object.keys(e || {}).filter(k => k !== '_n').map(k => ENDING_NAMES[game]?.[k] || k);

// 千嬋一、二、屎瓦帝尼共用的引擎
const ENGINE = {
  'qianchan-school': { save: 'qc207_v1_save', end: 'qc207_v1_endings', parts: [...PARTS8.slice(0, 5), '結局'], scenes: QC_SCENES,
    part: (pi) => pi < 5 ? [['p' + (pi + 1) + '_'], [20, 24, 22, 24, 20][pi]] : [['e1_', 'e2_', 'e3_', 'e4_'], null] },
  school2: { save: 'qc2_v1_save', end: 'qc2_v1_endings', parts: PARTS8, scenes: S2_SCENES,
    part: (pi, S) => pi < 5 ? [['p' + (pi + 1) + '_'], [12, 13, 10, 10, 15][pi]] : pi === 5 ? (S.route === 'def' ? [['pd_', 'ad_'], 19] : [['pe_'], 18]) : [[], 0] },
  pupu: { save: 'pupu_v2_save', parts: ['Ⅰ 雲上的秘密', 'Ⅱ 蜜月觀光團', 'Ⅲ 旅館的最後一關'], scenes: PUPU_SCENES,
    flags: [['wrapDone', 'rules', 'parfait', 'tiger', 'seenClouds'], ['feesPaid', 's1', 's2', 's3', 'cert', 'doorTalk', 'sneak', 'dark', 'grille', 'diary', 'stamp'], ['mapDone', 'wardrobe', 'storeSeen', 'stitchNote']] },
};

// summarize：一個玩家在一款遊戲的存檔 → { part, pi, pn, scene, solved, total, time, deaths, hints, endings, done, fail, note }
function summarize(game, save) {
  if (!save) return null;
  const d = save.data || {}, k = d.keys || {};
  const E = ENGINE[game];
  if (E) {
    const S = J(k[E.save]), ends = endList(game, J(k[E.end]));
    if (!S) return ends.length ? { done: true, endings: ends, part: '已完成', pi: E.parts.length, pn: E.parts.length } : null;
    const pi = Math.max(0, E.parts.indexOf(S.act));
    let solved = null, total = null;
    if (E.flags) { const fl = E.flags[pi] || []; solved = fl.filter(f => S.f?.[f]).length; total = fl.length; }
    else { const [pre, n] = E.part(pi, S); const ids = keysOf(S.pz); solved = ids ? ids.filter(x => pre.some(p => x.startsWith(p))).length : null; total = n; }
    return { part: S.act || E.parts[0], pi, pn: E.parts.length, scene: E.scenes[S.sc] || S.sc, solved, total, all: cnt(S.pz) || null,
      time: S.t, deaths: S.deaths, hints: S.hints, endings: ends, fail: S.on === 0 && S.t >= 9000 };
  }
  if (game === 'bang') {
    const G = J(k.bang_g), ends = endList(game, J(k.bang_end));
    if (!G) return ends.length ? { done: true, endings: ends, part: '已完成', pi: 11, pn: 11 } : null;
    const ch = Math.min(9, Math.max(0, G.ch | 0)), ids = keysOf(G.solved);
    const multi = G.mode === 'multi' && (G.players?.length ?? 0) >= 2;
    const done = G.phase === 'award', fin = G.phase === 'finale';
    return { part: done ? '已完成' : fin ? '最終決戰' : BANG_CH[ch][0], pi: done ? 11 : fin ? 10 : ch, pn: 11, scene: BANG_CH[ch][1],
      solved: ids ? ids.filter(x => x.startsWith('c' + ch + '_') || x.startsWith('m' + ch + '_')).length : null,
      total: BANG_CH[ch][2] + (multi && ch >= 1 && ch <= 8 ? 1 : 0), all: cnt(G.solved), time: G.t, deaths: G.deaths, hints: G.hints,
      endings: ends, done, fail: G.phase === 'fail', note: multi ? `${G.players.length} 人連線：${G.players.map(p => p.name).join('、')}` : '單人' };
  }
  if (game === 'sea') {
    const G = J(k.sea_g), ends = endList(game, J(k.sea_end));
    if (!G) return ends.length ? { done: true, endings: ends, part: '已完成', pi: 3, pn: 3 } : null;
    const list = G.mode === 'duo' ? SEA_DUO : SEA_SOLO, sc = list[Math.min(list.length - 1, Math.max(0, G.sc | 0))];
    const done = G.phase === 'end';
    return { part: done ? '已完成' : G.phase === 'accuse' ? '最終推理' : SEA_PARTS[sc[2] - 1], pi: done ? 3 : sc[2] - 1, pn: 3, scene: sc[1],
      solved: cnt(G.solved), total: 75, time: G.t, deaths: G.deaths, hints: G.hints, endings: ends, done, fail: G.phase === 'fail',
      note: `${G.mode === 'duo' ? '雙人' : '單人'}・燭火 ${G.lives ?? '?'} / 5` };
  }
  if (game === 'arg') {
    const R = J(k['still-layer-v1']), M = J(k['still-layer-meta-v1']) || {}, ends = endList(game, M.endings);
    if (!R) return ends.length ? { done: true, endings: ends, part: '已完成', pi: 21, pn: 21 } : null;
    const p2 = R.p2 | 0, ch = R.chapter ?? -1, answered = !!R.flags?.answered;
    const part = p2 >= 21 ? '第二部完成' : p2 >= 9 ? `第二部・${ARG_P2[p2] || p2}` : answered ? '第一部完成' : ch < 0 ? '還沒登入' : ARG_P1[Math.min(9, Math.max(0, ch))];
    const hints = Object.values(R.hintsShown || {}).reduce((a, b) => a + (+b || 0), 0);
    return { part, pi: p2 >= 9 ? p2 : answered ? 9 : Math.max(0, ch), pn: 21, scene: null, solved: cnt(M.cb?.solved) || null, total: null,
      // time：實際遊玩秒數（舊存檔沒有這個欄位，就不顯示，避免一直往上加）
      time: R.playSec > 0 ? R.playSec : null, hints, endings: ends, done: p2 >= 21, note: `碎片 ${cnt(R.frags)} / 7` };
  }
  if (game === 'mist') {
    const s = cnt(d.visited);
    return { part: `Lv ${save.level || 1}`, pi: 0, pn: 1, scene: save.station, solved: s, total: 118, note: `寶物 ${cnt(d.items)} / 6` };
  }
  if (game === 'qianshan-night') {
    // 存檔：unlocks、endings（陣列）、current（玩到一半的這一場：房號、模式、難度、章節、解開幾題、已玩秒數、提示、角色、地點、剩幾顆藥）
    const C = d.current, raw = Array.isArray(d.endings) ? d.endings : [], ends = raw.map(e => ENDING_NAMES[game][e] || e);
    const unlocked = Array.isArray(d.unlocks) && d.unlocks.includes('first-clear');
    // 失敗結局（全員消失等）也會記在 endings，但不算通關
    const cleared = raw.some(e => !QS_FAIL.includes(e));
    if (!C && !cleared && ends.length) return { part: '這一場失敗了，目前沒有進行中的一場', pi: 0, pn: 1, endings: ends, fail: true };
    if (!C) return cleared ? { done: true, endings: raw.filter(e => !QS_FAIL.includes(e)).map(e => ENDING_NAMES[game][e] || e), part: '已完成', pi: QS_CH.length, pn: QS_CH.length, note: unlocked ? '已解鎖病患角色' : '還沒解鎖病患角色（要 180 分鐘內通關）' } : { part: '目前沒有進行中的一場', pi: 0, pn: 1 };
    const muer = C.mode === 'muer', hell = C.difficulty === 'hell';
    const pi = muer ? 0 : Math.max(0, QS_CH.findIndex(([id]) => id === C.chapter));
    const unit = hell ? '針筒' : '藥', state = { vanished: '名字消失', anomaly: '異常', patient: '成為病患', caught: '被抓' }[C.state];
    return { part: muer ? '暮兒之夜' : QS_CH[pi]?.[1] || C.chapter, pi, pn: muer ? 1 : QS_CH.length, scene: C.place || C.location,
      solved: C.solved ?? null, total: muer ? 5 : hell ? 44 : 84, time: C.playSec ?? null, deaths: C.deaths, hints: C.hints, endings: ends,
      note: [muer ? '暮兒之夜' : hell ? '地獄版' : '普通版', C.code && `房號 ${C.code}`, C.characterName, C.lives != null && `${unit} ${C.lives}`, state].filter(Boolean).join('・') };
  }
  if (game === 'hotel1') {
    // 存檔就是遊戲狀態本身：scene（所在樓層）、solved（M 主線 74／S 支線 44／X 隱藏 6）、play（實際遊玩毫秒）、hintsUsed、refillSeen（房卡補發）、team、mode、room
    const ids = keysOf(d.solved) || [], n = (c) => ids.filter(x => x[0] === c).length;
    const seen = keysOf(d.seen) || [], top = HOTEL_FLOORS.reduce((i, [id], k) => seen.includes(id) || d.scene === id ? k : i, 0);
    const at = HOTEL_FLOORS.find(([id]) => id === d.scene)?.[1] || (d.scene === 'B3' ? 'B3 下水道（隱藏樓層）' : d.scene);
    const done = !!d.solved?.M74 && d.scene === 'RF';
    const team = Array.isArray(d.team) ? d.team.map(h => HOTEL_HEROES[h] || h) : [];
    return { part: done ? '已到頂樓' : HOTEL_FLOORS[top][1], pi: top, pn: HOTEL_FLOORS.length - 1, scene: at,
      solved: ids.length ? n('M') : cnt(d.solved), total: 74, time: d.play > 0 ? d.play / 1000 : null, hints: d.hintsUsed || 0,
      note: [d.mode === 'online' ? `連線${d.room ? `・房號 ${d.room}` : ''}` : '單機測試', team.length && `${team.length} 人：${team.join('、')}`,
        ids.length && `支線 ${n('S')} / 44・隱藏 ${n('X')} / 6`, d.refillSeen && `房卡補發 ${d.refillSeen} 次`].filter(Boolean).join('・') };
  }
  return { part: '有存檔', pi: 0, pn: 1 };
}

// ---------- 小工具 ----------
const TZ = { timeZone: 'Asia/Taipei' };
const fmtT = (s) => { if (s == null || isNaN(s)) return '–'; s = Math.round(s); const h = s / 3600 | 0, m = (s % 3600) / 60 | 0, x = s % 60, p = n => String(n).padStart(2, '0'); return (h ? h + ':' + p(m) : m) + ':' + p(x); };
const ago = (t) => {
  if (!t) return '–'; const s = (Date.now() - new Date(t)) / 1000;
  return s < 60 ? '剛剛' : s < 3600 ? `${s / 60 | 0} 分鐘前` : s < 86400 ? `${s / 3600 | 0} 小時前` : s < 86400 * 30 ? `${s / 86400 | 0} 天前` : new Date(t).toLocaleDateString('zh-TW', TZ);
};
const dt = (t) => t ? new Date(t).toLocaleString('zh-TW', { ...TZ, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '–';
const day = (t) => new Date(t).toLocaleDateString('sv-SE', TZ);
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
const maxT = (...ts) => ts.filter(Boolean).sort().pop() || null;

const CSS = `
#view-admin { padding: 92px 0 60px; min-height: 100vh; }
#view-admin .container { width: min(1100px, 100% - 32px); margin-inline: auto; }
.adm-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.adm-head h1 { font: 700 26px var(--serif); margin: 0; color: var(--gold); letter-spacing: .08em; }
.adm-head .muted { font-size: 13px; }
.adm-tabs { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 0 20px; padding-bottom: 2px; }
.adm-tabs::-webkit-scrollbar { display: none; }
.adm-tabs button { flex: none; font: 700 14px var(--sans); padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(239,230,210,.2); background: rgba(14,17,32,.6); color: var(--parchment); cursor: pointer; }
.adm-tabs button[aria-selected="true"] { background: var(--gold); color: #12142A; border-color: transparent; }
.adm-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 22px; }
.adm-kpi { background: var(--wall); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
.adm-kpi b { display: block; font: 700 28px var(--serif); color: var(--gold); }
.adm-kpi span { font-size: 13px; color: var(--muted); }
.adm-kpi.live b { color: #8FE3B0; }
.adm-card { background: var(--wall); border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px; margin-bottom: 18px; }
.adm-card h3 { font: 700 17px var(--serif); margin: 0 0 12px; color: var(--parchment); }
.adm-card h3 small { font: 400 12px var(--sans); color: var(--muted); margin-left: 6px; }
.adm-tbl { width: 100%; border-collapse: collapse; font-size: 14px; }
.adm-tbl th, .adm-tbl td { text-align: left; padding: 8px 6px; border-bottom: 1px solid rgba(239,230,210,.08); vertical-align: top; }
.adm-tbl th { color: var(--muted); font-weight: 500; font-size: 12px; white-space: nowrap; }
.adm-tbl td.n { font-variant-numeric: tabular-nums; white-space: nowrap; }
.adm-scroll .adm-tbl { min-width: 640px; }
.adm-scroll .adm-tbl td:first-child { min-width: 140px; }
.adm-scroll { overflow-x: auto; }
.adm-bars { display: flex; align-items: flex-end; gap: 4px; height: 90px; }
.adm-bars div { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
.adm-bars i { display: block; width: 100%; max-width: 26px; background: linear-gradient(180deg, var(--gold), #8B7CE6); border-radius: 4px 4px 0 0; min-height: 2px; }
.adm-bars em { font-style: normal; font-size: 10px; color: var(--muted); }
.adm-bars b { font-size: 11px; color: var(--parchment); font-weight: 500; }
.adm-row { display: flex; gap: 12px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid rgba(239,230,210,.08); }
.adm-row:last-child { border-bottom: 0; }
.adm-row .avatar-img, .adm-row .avatar-svg { width: 40px; height: 40px; flex: none; }
.adm-row > div { min-width: 0; flex: 1; }
.adm-row b { font-size: 15px; }
.adm-row p { margin: 3px 0 0; font-size: 13px; color: var(--muted); }
.adm-row .prog { color: var(--parchment); }
.adm-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #8FE3B0; box-shadow: 0 0 8px #8FE3B0; margin-right: 6px; vertical-align: 1px; }
.adm-dot.idle { background: #777; box-shadow: none; }
.adm-tag { display: inline-block; font-size: 11px; padding: 1px 8px; border-radius: 999px; background: rgba(139,124,230,.2); color: #CFC8FF; margin-left: 6px; vertical-align: 1px; }
.adm-tag.ok { background: rgba(110,190,150,.2); color: #A8E8C4; }
.adm-tag.warn { background: rgba(214,178,106,.2); color: #FFE0A0; }
.adm-tag.bad { background: rgba(196,64,64,.2); color: #FFB4A8; }
.adm-funnel { display: grid; gap: 8px; }
.adm-fun { display: grid; grid-template-columns: 150px 1fr; gap: 12px; align-items: start; padding: 10px 0; border-bottom: 1px dashed rgba(239,230,210,.1); }
.adm-fun > span { font-weight: 700; font-size: 14px; }
.adm-fun .bar { height: 8px; border-radius: 6px; background: var(--ink-2); overflow: hidden; margin: 6px 0; }
.adm-fun .bar i { display: block; height: 100%; background: linear-gradient(90deg, #8B7CE6, var(--gold)); }
.adm-fun small { color: var(--muted); font-size: 12px; }
.adm-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.adm-chips span { font-size: 12px; padding: 3px 9px; border-radius: 999px; background: rgba(239,230,210,.07); border: 1px solid rgba(239,230,210,.1); }
.adm-chips span.stale { opacity: .55; }
.adm-sel { font: 14px var(--sans); padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(239,230,210,.2); background: #0E1124; color: var(--parchment); }
.adm-form { display: grid; gap: 10px; }
.adm-form label { display: grid; gap: 4px; font-size: 13px; color: var(--muted); }
.adm-form input, .adm-form textarea, .adm-form select { font: 14px var(--sans); padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(239,230,210,.2); background: #0E1124; color: var(--parchment); width: 100%; box-sizing: border-box; }
.adm-form textarea { min-height: 80px; resize: vertical; }
.adm-form .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.adm-form .acts { display: flex; gap: 8px; flex-wrap: wrap; }
.adm-form .chk { display: flex; align-items: center; gap: 8px; color: var(--parchment); }
.adm-form .chk input { width: auto; }
.adm-news { display: flex; gap: 10px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid rgba(239,230,210,.08); }
.adm-news > div { flex: 1; min-width: 0; }
.adm-news p { margin: 4px 0 0; font-size: 13px; color: var(--muted); }
.adm-news .btn, .adm-card .btn-sm { padding: 6px 12px; font-size: 13px; }
.adm-game { border: 1px solid var(--line); border-radius: 12px; margin-bottom: 10px; background: rgba(14,17,32,.5); }
.adm-game summary { cursor: pointer; padding: 12px 14px; font-weight: 700; list-style: none; display: flex; gap: 8px; align-items: center; }
.adm-game summary::-webkit-details-marker { display: none; }
.adm-game .adm-form { padding: 0 14px 14px; }
.adm-empty { color: var(--muted); font-size: 14px; padding: 8px 0; }
.adm-note { color: var(--muted); font-size: 12px; margin: 8px 0 0; }
@media (max-width: 760px) {
  #view-admin { padding-top: 76px; }
  .adm-kpis { grid-template-columns: repeat(2, 1fr); }
  .adm-fun { grid-template-columns: 1fr; gap: 4px; }
  .adm-form .two { grid-template-columns: 1fr; }
  .adm-tbl { font-size: 13px; }
}`;

export function mountAdmin(ctx) {
  const { supabase, root, escapeHTML: esc, avatarHTML, toast, onContentChange } = ctx;
  if (!document.getElementById('adm-css')) { const st = document.createElement('style'); st.id = 'adm-css'; st.textContent = CSS + CSS_MIST; document.head.appendChild(st); }
  const mist = mountMist(ctx);   // 迷霧專用的分頁（玩家存檔、回報處理、公告與活動、數據）
  let D = null, games = [], tab = 'overview', stuckGame = null, timer = 0, loading = false;
  const TABS = [['overview', '總覽'], ['live', '即時動態'], ['stuck', '卡關分析'], ...mist.TABS, ['news', '最新消息'], ['games', '遊戲資訊']];

  root.innerHTML = `<div class="container">
    <div class="adm-head"><h1>🛠 管理</h1><span class="muted" id="adm-upd"></span><button class="btn btn-ghost btn-sm" type="button" id="adm-reload">重新整理</button></div>
    <div class="adm-tabs" role="tablist">${TABS.map(([k, t]) => `<button type="button" role="tab" data-tab="${k}">${t}</button>`).join('')}</div>
    <div id="adm-body"><p class="adm-empty">讀取中…</p></div></div>`;
  const body = root.querySelector('#adm-body');
  root.querySelector('.adm-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  root.querySelector('#adm-reload').addEventListener('click', () => load());

  async function load() {
    if (loading) return; loading = true;
    try {
      const [{ data, error }, g] = await Promise.all([supabase.rpc('admin_dump'), supabase.from('games').select('*').order('sort_order')]);
      if (error) throw error;
      D = data; games = g.data || [];
      prep();
      root.querySelector('#adm-upd').textContent = '更新於 ' + new Date().toLocaleTimeString('zh-TW', { ...TZ, hour12: false });
      render();
    } catch (e) {
      body.innerHTML = `<p class="adm-empty">讀取失敗：${esc(e.message || String(e))}</p>`;
    } finally { loading = false; }
  }

  // 整理資料：每位玩家、每款遊戲的狀態
  let P = {}, admins = new Set(), gameById = {}, gameBySlug = {};
  function prep() {
    admins = new Set(D.admins);
    gameById = Object.fromEntries(games.map(g => [g.id, g])); gameBySlug = Object.fromEntries(games.map(g => [g.slug, g]));
    P = {};
    for (const p of D.players) P[p.id] = { ...p, name: p.username || '（尚未建立角色）', admin: admins.has(p.id), games: {}, last: p.last_active };
    const slot = (uid, slug) => { const p = P[uid]; if (!p) return null; return p.games[slug] ??= { slug, recs: [], save: null, sum: null }; };
    for (const r of D.records) { const g = gameById[r.game_id]; const s = g && slot(r.user_id, g.slug); if (s) s.recs.push(r); }
    for (const s of D.saves) { const x = slot(s.user_id, s.game); if (x) { x.save = s; x.sum = summarize(s.game, s); } }
    for (const p of Object.values(P)) for (const x of Object.values(p.games)) {
      const cleared = x.recs.filter(r => r.status === 'cleared');
      x.best = cleared.length ? Math.min(...cleared.map(r => r.clear_time_sec ?? Infinity)) : null;
      x.cleared = cleared.length > 0;
      x.last = maxT(x.save?.updated_at, ...x.recs.map(r => r.updated_at || r.created_at));
      x.status = x.cleared || x.sum?.done ? 'done' : x.sum ? 'progress' : 'started';
      p.last = maxT(p.last, x.last);
    }
  }

  function show(k) {
    tab = k;
    root.querySelectorAll('.adm-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === k));
    clearInterval(timer);
    if (k === 'live') timer = setInterval(() => { if (!document.hidden && root.isConnected && !root.hidden) load(); }, 20000);
    render();
  }
  function render() {
    if (!D) return;
    if (mist.TABS.some(([k]) => k === tab)) return mist.render(tab, body);
    const fn = { overview, live, stuck, news, gamesTab }[tab === 'games' ? 'gamesTab' : tab];
    fn();
  }

  const players = () => Object.values(P).filter(p => !p.admin);
  const progLine = (slug, x) => {
    const s = x.sum, g = gameBySlug[slug];
    const title = esc(g?.title || (slug === 'mist' ? '迷霧' : slug));
    if (x.status === 'done') return `${title}<span class="adm-tag ok">已通關${x.best != null && isFinite(x.best) ? ' ' + fmtT(x.best) : ''}</span>${s?.endings?.length ? `<span class="adm-tag">結局 ${s.endings.length}：${esc(s.endings.join('、'))}</span>` : ''}`;
    if (!s) return `${title}<span class="adm-tag warn">按了開始，還沒有存檔</span>`;
    const bits = [esc(s.part), s.scene && esc(s.scene), s.solved != null ? `已解 ${s.solved}${s.total ? ' / ' + s.total : ''}` : '', s.time != null ? '⏱ ' + fmtT(s.time) : '',
      s.deaths ? `死亡 ${s.deaths}` : '', s.hints ? `提示 ${s.hints}` : '', s.note && esc(s.note)].filter(Boolean);
    return `${title}${s.fail ? '<span class="adm-tag bad">時間到／失敗</span>' : ''}<br><span class="prog">${bits.join('・')}</span>`;
  };

  // ---------- 1. 總覽 ----------
  function overview() {
    const ps = players(), now = Date.now(), today = day(now);
    const on15 = ps.filter(p => p.last && now - new Date(p.last) < 15 * 60e3).length;
    const act24 = ps.filter(p => p.last && now - new Date(p.last) < 864e5).length;
    const newToday = ps.filter(p => day(p.created_at) === today).length, new7 = ps.filter(p => now - new Date(p.created_at) < 7 * 864e5).length;
    const playedAny = ps.filter(p => Object.keys(p.games).length).length;
    const kpi = (v, t, c = '') => `<div class="adm-kpi ${c}"><b>${v}</b><span>${t}</span></div>`;
    // 近 14 天註冊
    const days = [...Array(14)].map((_, i) => day(now - (13 - i) * 864e5));
    const byDay = Object.fromEntries(days.map(d => [d, 0])); for (const p of ps) { const d = day(p.created_at); if (d in byDay) byDay[d]++; }
    const mx = Math.max(1, ...Object.values(byDay));
    // 每款遊戲
    const rows = games.filter(g => g.play_url).map(g => {
      const xs = ps.map(p => p.games[g.slug]).filter(Boolean);
      const done = xs.filter(x => x.status === 'done'), prog = xs.filter(x => x.status === 'progress'), st = xs.filter(x => x.status === 'started');
      const times = done.map(x => x.best).filter(t => t != null && isFinite(t));
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
      return `<tr><td>${esc(g.title)}</td><td class="n">${xs.length}</td><td class="n">${done.length}</td><td class="n">${pct(done.length, xs.length)}</td>
        <td class="n">${prog.length}</td><td class="n">${st.length}</td><td class="n">${fmtT(avg)}</td><td class="n">${times.length ? fmtT(Math.min(...times)) : '–'}</td></tr>`;
    }).join('');
    const mist = ps.filter(p => p.games.mist).length;
    const recent = ps.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8);
    body.innerHTML = `
      <div class="adm-kpis">${kpi(ps.length, '註冊玩家')}${kpi(newToday, '今天新增')}${kpi(new7, '最近 7 天新增')}${kpi(on15, '現在在線（15 分鐘內）', 'live')}${kpi(act24, '今天來過（24 小時內）')}${kpi(playedAny, '至少玩過一款')}${kpi(D.bugs.length, 'Bug 回報')}</div>
      <div class="adm-card"><h3>每款遊戲<small>不含你自己的紀錄</small></h3><div class="adm-scroll"><table class="adm-tbl">
        <tr><th>遊戲</th><th>玩過</th><th>通關</th><th>通關率</th><th>玩到一半</th><th>只按開始</th><th>平均通關</th><th>最快</th></tr>${rows}
        ${mist ? `<tr><td>迷霧</td><td class="n">${mist}</td><td colspan="6" class="adm-note">開放世界，沒有通關</td></tr>` : ''}</table></div></div>
      <div class="adm-card"><h3>最近 14 天註冊</h3><div class="adm-bars">${days.map(d => `<div><b>${byDay[d] || ''}</b><i style="height:${byDay[d] / mx * 70}px"></i><em>${d.slice(8)}</em></div>`).join('')}</div></div>
      <div class="adm-card"><h3>最新註冊的玩家</h3>${recent.map(p => `<div class="adm-row">${avatarHTML(p, 40)}<div><b>${esc(p.name)}</b>
        <p>${dt(p.created_at)} 註冊・最後上線 ${ago(p.last)}・${esc(p.email || '')}</p></div></div>`).join('') || '<p class="adm-empty">還沒有玩家。</p>'}</div>
      <div class="adm-card"><h3>Bug 回報<small>最近 50 筆</small></h3>${D.bugs.length ? D.bugs.map(b => `<div class="adm-row"><div><b>${esc(gameBySlug[b.game]?.title || b.game || '大廳')}</b>
        <span class="adm-tag">${dt(b.created_at)}</span>${b.user_id && P[b.user_id] ? `<span class="adm-tag">${esc(P[b.user_id].name)}</span>` : ''}
        <p class="prog">${esc(b.message || '')}</p>${b.station ? `<p>位置：${esc(b.station)}</p>` : ''}</div></div>`).join('') : '<p class="adm-empty">目前沒有回報。</p>'}</div>`;
  }

  // ---------- 2. 即時動態 ----------
  function live() {
    const now = Date.now(), ps = Object.values(P).filter(p => p.last).sort((a, b) => String(b.last).localeCompare(String(a.last)));
    const on = ps.filter(p => now - new Date(p.last) < 15 * 60e3), day1 = ps.filter(p => !on.includes(p) && now - new Date(p.last) < 864e5);
    const row = (p, live) => {
      const xs = Object.values(p.games).filter(x => x.last).sort((a, b) => String(b.last).localeCompare(String(a.last)));
      const cur = xs[0] && now - new Date(xs[0].last) < (live ? 15 * 60e3 : 864e5) ? xs[0] : null;
      const where = cur ? progLine(cur.slug, cur) + `<br><small>存檔 ${ago(cur.last)}</small>` : live ? '在大廳（最近 15 分鐘沒有遊戲存檔）' : '沒有玩遊戲';
      return `<div class="adm-row">${avatarHTML(p, 40)}<div><b><span class="adm-dot ${live ? '' : 'idle'}"></span>${esc(p.name)}</b>${p.admin ? '<span class="adm-tag">你</span>' : ''}
        <span class="adm-tag">${ago(p.last)}</span><p>${where}</p></div></div>`;
    };
    body.innerHTML = `
      <div class="adm-card"><h3>現在在線<small>最近 15 分鐘有動作・每 20 秒自動更新</small></h3>${on.map(p => row(p, true)).join('') || '<p class="adm-empty">現在沒有人在線。</p>'}</div>
      <div class="adm-card"><h3>今天來過<small>24 小時內</small></h3>${day1.map(p => row(p, false)).join('') || '<p class="adm-empty">今天還沒有其他人來過。</p>'}</div>
      <p class="adm-note">「在線」是用登入狀態和遊戲存檔推算的：遊戲裡一有進度，最多 10 秒就會存到雲端；打開遊戲但完全沒動作的人看不出來。</p>`;
  }

  // ---------- 3. 卡關分析 ----------
  function stuck() {
    const list = games.filter(g => g.play_url);
    if (!stuckGame || !list.some(g => g.slug === stuckGame)) {
      // 預設選玩的人最多的那款
      const n = (g) => players().filter(p => p.games[g.slug]).length;
      stuckGame = list.slice().sort((a, b) => n(b) - n(a))[0]?.slug;
    }
    const g = gameBySlug[stuckGame];
    const xs = players().map(p => ({ p, x: p.games[stuckGame] })).filter(o => o.x);
    const done = xs.filter(o => o.x.status === 'done'), prog = xs.filter(o => o.x.status === 'progress'), st = xs.filter(o => o.x.status === 'started');
    const pn = Math.max(1, ...prog.map(o => o.x.sum.pn || 1));
    const partName = (i) => prog.find(o => o.x.sum.pi === i)?.x.sum.part || `第 ${i + 1} 段`;
    const stale = (o) => Date.now() - new Date(o.x.last) > 3 * 864e5;
    const chip = (o) => `<span class="${stale(o) ? 'stale' : ''}" title="最後存檔 ${dt(o.x.last)}">${esc(o.p.name)}${o.x.sum?.scene ? '・' + esc(o.x.sum.scene) : ''}${o.x.sum?.solved != null ? `・${o.x.sum.solved}${o.x.sum.total ? '/' + o.x.sum.total : ''}` : ''}${stale(o) ? ' 💤' : ''}</span>`;
    const parts = [...new Set(prog.map(o => o.x.sum.pi))].sort((a, b) => a - b);
    const reached = (i) => done.length + prog.filter(o => o.x.sum.pi >= i).length;
    const total = xs.length;
    const funnel = parts.map(i => {
      const here = prog.filter(o => o.x.sum.pi === i);
      const solved = here.map(o => o.x.sum.solved).filter(v => v != null), tot = here[0]?.x.sum.total;
      const hints = here.map(o => o.x.sum.hints || 0), deaths = here.map(o => o.x.sum.deaths || 0);
      const avg = (a) => a.length ? (a.reduce((s, v) => s + v, 0) / a.length).toFixed(1) : '–';
      return `<div class="adm-fun"><span>${esc(partName(i))}</span><div>
        <small>目前停在這裡 <b>${here.length}</b> 人・到過這裡 ${reached(i)} / ${total} 人${solved.length ? `・平均已解 ${avg(solved)}${tot ? ' / ' + tot : ''}` : ''}・平均提示 ${avg(hints)}・平均死亡 ${avg(deaths)}</small>
        <div class="bar"><i style="width:${total ? reached(i) / total * 100 : 0}%"></i></div>
        <div class="adm-chips">${here.map(chip).join('')}</div></div></div>`;
    }).join('');
    body.innerHTML = `
      <div class="adm-card"><h3>選擇遊戲</h3><select class="adm-sel" id="adm-stuck-g">${list.map(x => `<option value="${esc(x.slug)}"${x.slug === stuckGame ? ' selected' : ''}>${esc(x.title)}（${players().filter(p => p.games[x.slug]).length} 人）</option>`).join('')}</select></div>
      ${total ? `<div class="adm-kpis">
        <div class="adm-kpi"><b>${total}</b><span>玩過的人</span></div>
        <div class="adm-kpi"><b>${done.length}</b><span>已通關（${pct(done.length, total)}）</span></div>
        <div class="adm-kpi"><b>${prog.length}</b><span>玩到一半</span></div>
        <div class="adm-kpi"><b>${st.length}</b><span>按了開始就沒存檔</span></div></div>
      <div class="adm-card"><h3>玩家停在哪裡<small>💤＝超過 3 天沒動，可能放棄了；名字後面是所在場景和這一段已解的題數</small></h3>
        <div class="adm-funnel">
          ${st.length ? `<div class="adm-fun"><span>一開始就離開</span><div><small>按了開始、沒有任何存檔</small><div class="adm-chips">${st.map(o => `<span title="${dt(o.x.last)}">${esc(o.p.name)}</span>`).join('')}</div></div></div>` : ''}
          ${funnel}
          <div class="adm-fun"><span>✅ 已通關</span><div><div class="bar"><i style="width:${pct(done.length, total)}"></i></div>
            <div class="adm-chips">${done.map(o => `<span>${esc(o.p.name)}${o.x.best != null && isFinite(o.x.best) ? '・' + fmtT(o.x.best) : ''}${o.x.sum?.endings?.length ? '・結局 ' + o.x.sum.endings.length : ''}</span>`).join('')}</div></div></div>
        </div></div>
      <div class="adm-card"><h3>每位玩家</h3>${xs.sort((a, b) => String(b.x.last).localeCompare(String(a.x.last))).map(o => `<div class="adm-row">${avatarHTML(o.p, 40)}<div><b>${esc(o.p.name)}</b><span class="adm-tag">${ago(o.x.last)}</span>
        <span class="adm-tag">挑戰 ${o.x.recs.length} 次</span><p>${progLine(stuckGame, o.x)}</p></div></div>`).join('')}</div>`
      : '<p class="adm-empty">還沒有人玩過這款（不含你自己）。</p>'}
      <p class="adm-note">「已解」只算目前這一段的題目；有些題目要看劇情分支才會出現，所以總數是大約的。已通關的玩家存檔會被遊戲清掉，所以只看得到通關紀錄。</p>`;
    body.querySelector('#adm-stuck-g').addEventListener('change', (e) => { stuckGame = e.target.value; stuck(); });
  }

  // ---------- 5a. 最新消息 ----------
  const TAGS = ['新密室', '預告', '改版', '功能', '公告', '活動'];
  let newsList = [], editing = null;
  async function news() {
    body.innerHTML = '<p class="adm-empty">讀取中…</p>';
    const { data, error } = await supabase.from('news').select('*').order('published_at', { ascending: false });
    if (error) { body.innerHTML = `<p class="adm-empty">讀取失敗：${esc(error.message)}</p>`; return; }
    newsList = data;
    drawNews();
  }
  const localInput = (t) => { const d = t ? new Date(t) : new Date(); const o = new Date(d.getTime() - d.getTimezoneOffset() * 60e3); return o.toISOString().slice(0, 16); };
  function drawNews() {
    const n = editing ? newsList.find(x => x.id === editing) : null;
    const link = n?.link || '', slugOpts = games.map(g => `<option value="game:${esc(g.slug)}"${link === 'game:' + g.slug ? ' selected' : ''}>開啟遊戲：${esc(g.title)}</option>`).join('');
    const isCustom = link && !link.startsWith('game:');
    body.innerHTML = `
      <div class="adm-card"><h3>${n ? '修改消息' : '發一則新消息'}</h3>
        <form class="adm-form" id="adm-news-f">
          <label>標題<input name="title" required maxlength="80" value="${esc(n?.title || '')}"></label>
          <div class="two"><label>分類<select name="tag"><option value="">（不分類）</option>${TAGS.map(t => `<option${n?.tag === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
            <label>發布時間<input type="datetime-local" name="published_at" value="${localInput(n?.published_at)}"></label></div>
          <label>內容<textarea name="summary" maxlength="400">${esc(n?.summary || '')}</textarea></label>
          <div class="two"><label>點了會去哪裡<select name="linkType"><option value="">不連結</option>${slugOpts}
              <option value="#rooms"${link === '#rooms' ? ' selected' : ''}>大廳：密室主題</option><option value="#rpg"${link === '#rpg' ? ' selected' : ''}>大廳：迷霧</option>
              <option value="#ranking"${link === '#ranking' ? ' selected' : ''}>大廳：排行榜</option><option value="#retired"${link === '#retired' ? ' selected' : ''}>大廳：已下架遊戲</option>
              <option value="custom"${isCustom && !['#rooms', '#rpg', '#ranking', '#retired'].includes(link) ? ' selected' : ''}>自訂網址…</option></select></label>
            <label>自訂網址<input name="custom" placeholder="https://…" value="${isCustom && !['#rooms', '#rpg', '#ranking', '#retired'].includes(link) ? esc(link) : ''}"></label></div>
          <label>縮圖網址（選填，留空會用遊戲封面）<input name="cover_url" value="${esc(n?.cover_url || '')}"></label>
          <div class="acts"><button class="btn btn-gold" type="submit">${n ? '儲存修改' : '發布'}</button>${n ? '<button class="btn btn-ghost" type="button" id="adm-news-cancel">取消</button>' : ''}</div>
        </form></div>
      <div class="adm-card"><h3>全部消息<small>${newsList.length} 則</small></h3>${newsList.map(x => `<div class="adm-news"><div>
        ${x.tag ? `<span class="adm-tag">${esc(x.tag)}</span> ` : ''}<b>${esc(x.title)}</b><p>${dt(x.published_at)}${x.link ? '・連到 ' + esc(x.link) : ''}</p>${x.summary ? `<p>${esc(x.summary)}</p>` : ''}</div>
        <button class="btn btn-ghost" type="button" data-edit="${x.id}">修改</button><button class="btn btn-ghost" type="button" data-del="${x.id}">刪除</button></div>`).join('')}</div>`;
    const f = body.querySelector('#adm-news-f');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      let lk = v.linkType === 'custom' ? v.custom.trim() : v.linkType;
      // 縮圖留空、又連到遊戲時，用那款遊戲的封面
      let cover = v.cover_url.trim();
      if (!cover && lk.startsWith('game:')) cover = gameBySlug[lk.slice(5)]?.cover_url || '';
      const row = { title: v.title.trim(), tag: v.tag || null, summary: v.summary.trim() || null, link: lk || null, cover_url: cover || null,
        published_at: v.published_at ? new Date(v.published_at).toISOString() : new Date().toISOString() };
      const q = editing ? supabase.from('news').update(row).eq('id', editing) : supabase.from('news').insert(row);
      const { error } = await q;
      if (error) return toast('儲存失敗：' + error.message, 'error');
      toast(editing ? '已更新消息' : '已發布消息 ✨', 'ok'); editing = null;
      onContentChange?.(); news();
    });
    body.querySelector('#adm-news-cancel')?.addEventListener('click', () => { editing = null; drawNews(); });
    body.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { editing = b.dataset.edit; drawNews(); scrollTo({ top: 0, behavior: 'smooth' }); }));
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      const x = newsList.find(n => n.id === b.dataset.del);
      if (!confirm(`確定要刪除「${x?.title}」嗎？刪掉就找不回來了。`)) return;
      const { error } = await supabase.from('news').delete().eq('id', b.dataset.del);
      if (error) return toast('刪除失敗：' + error.message, 'error');
      toast('已刪除'); onContentChange?.(); news();
    }));
  }

  // ---------- 5b. 遊戲資訊 ----------
  function gamesTab() {
    const field = (g, k, label, type = 'text') => `<label>${label}<input name="${k}" type="${type}" value="${esc(g[k] ?? '')}"></label>`;
    body.innerHTML = `<p class="adm-note" style="margin:0 0 12px">改完按「儲存」，大廳重新整理後就會看到。上線日期之前，大廳會顯示倒數、還不能玩。</p>` + games.map(g => `
      <details class="adm-game"><summary>No.${String(g.sort_order).padStart(2, '0')} ${esc(g.title)}
        <span class="adm-tag ${g.status === 'available' ? 'ok' : 'warn'}">${g.status === 'available' ? '開放中' : g.status === 'coming_soon' ? '即將開放' : esc(g.status)}</span>${g.release_date ? `<span class="adm-tag">${esc(g.release_date)}</span>` : ''}</summary>
        <form class="adm-form" data-id="${g.id}">
          <div class="two">${field(g, 'title', '名稱')}${field(g, 'subtitle', '副標題')}</div>
          <label>簡介（卡片上）<textarea name="description">${esc(g.description || '')}</textarea></label>
          <label>故事介紹（點開後）<textarea name="intro">${esc(g.intro || '')}</textarea></label>
          <div class="two"><label>狀態<select name="status"><option value="available"${g.status === 'available' ? ' selected' : ''}>開放中</option><option value="coming_soon"${g.status === 'coming_soon' ? ' selected' : ''}>即將開放</option></select></label>
            ${field(g, 'release_date', '上線日期', 'date')}</div>
          <div class="two">${field(g, 'duration_min', '建議時長（分鐘）', 'number')}${field(g, 'difficulty', '難度（1–5，可以 .5）', 'number')}</div>
          <div class="two">${field(g, 'min_players', '最少人數', 'number')}${field(g, 'max_players', '最多人數', 'number')}</div>
          <div class="two">${field(g, 'play_url', '遊戲網址')}${field(g, 'cover_url', '封面圖片網址')}</div>
          <div class="two">${field(g, 'sort_order', '編號（排序）', 'number')}<label class="chk"><input type="checkbox" name="featured"${g.featured ? ' checked' : ''}> 精選</label></div>
          <div class="acts"><button class="btn btn-gold" type="submit">儲存</button></div>
        </form></details>`).join('');
    body.querySelectorAll('form[data-id]').forEach(f => f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f)), num = (x) => x === '' ? null : +x;
      const row = { title: v.title.trim(), subtitle: v.subtitle.trim() || null, description: v.description.trim() || null, intro: v.intro.trim() || null,
        status: v.status, release_date: v.release_date || null, duration_min: num(v.duration_min), difficulty: num(v.difficulty),
        min_players: num(v.min_players), max_players: num(v.max_players), play_url: v.play_url.trim() || null, cover_url: v.cover_url.trim() || null,
        sort_order: num(v.sort_order), featured: !!v.featured };
      const { data, error } = await supabase.from('games').update(row).eq('id', f.dataset.id).select();
      if (error || !data?.length) return toast('儲存失敗：' + (error?.message || '沒有權限'), 'error');
      Object.assign(games.find(g => g.id === f.dataset.id), data[0]);
      toast('已儲存 ✨', 'ok'); onContentChange?.();
    }));
  }

  show('overview');
  load();
  return { refresh: load, stop: () => clearInterval(timer) };
}
