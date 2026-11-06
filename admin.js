import { mountMist, CSS_MIST } from './admin-mist.js?v=2';
// 夜語・管理頁（只有管理員登入後才會載入）
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
const S3_SCENES = {
  side: '側門・清晨六點五十分', booth: '側門警衛亭', stopA: '公車亭・千嬋高中側門', shopA: '福記雜貨', streetA: '往海科館的路上', office: '總務處・下午四點五十分', archive: '地下檔案室',
  lghall: '和平路 21 巷 7 號・4 樓', lgroom: '立綱的客廳', sea: '海科館附近', apt0: '海濱路 24 巷 8 號・一樓', stair3: '樓梯間', apt8: '八樓', yroom: '八樓・小房間', loop4: '舊校舍・走廊',
  b13d: '走廊盡頭・鐵門', dark4: '黑暗中', club5: '校刊社教室', lg5: '立綱的客廳', tun0: 'B-10 配電室・維修口', tunK: '維修通道・敲門聲', tunW: '維修通道・積水', tunB: '維修通道・焦痕',
  tun13: '維修通道最深處', og6: '舊校舍入口', door6: '地下通道・門前', door7: '地下通道・最後的門', box7: '維修通道・文件箱', final7: '最後的門'
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
  school3: { e1: '不要再等了', e2: '我記得妳', e3: '姊姊來接妳了', e4: '留下來的人', e5: '第二個人', e6: '所有人都忘了（隱藏）', e7: '她跟我回家了' },
  school2: { e1: '沒有帶聖安', e2: 'TRUE END', e3: '她還在等我', e4: '她現在是我', e5: '逃跑失敗', e6: '邦瑜真正被放下', eh: '隱藏真結局' },
  bang: { pb: '彈珠王', xq_w: '象棋勝', xq_l: '象棋輸', xq_d: '象棋和', cd1: '撲克第一', cd2: '撲克第二', cd3: '撲克第三', mj1: '麻將第一', mj2: '麻將第二', mj3: '麻將第三', mj4: '麻將最後' },
  sea: { solo: '單人破案', duo: '雙人破案' },
  'qianshan-night': { 'return-names': '把姓名還給原主', 'seal-building': '封閉舊住院大樓', 'stop-qianshan': '終止記憶保存程序', 'let-her-go': '讓四十七號病患離院',
    'evidence-out': '讓所有證據離開和山醫院', 'stay-handover': '有人留下完成交班', leave: '離開醫院，不再追問', 'leave-early': '提早離開（失敗）', 'blank-patient': '空白病患（隱藏）',
    'never-ending-night': '暮兒之夜：永不熄滅的夜', forgotten: '暮兒之夜：被遺忘的人', 'last-page': '暮兒之夜：最後一頁', 'still-searching': '暮兒之夜：她還在找人',
    'all-vanished': '失敗：全隊的名字都消失', 'hell-fail': '失敗：全隊成為病患（地獄版）', 'no-handover': '失敗：沒有人接班（地獄版）' },
  hotel1: { rescue: '救出皇后', secret: '救出皇后＋看到 B3 的祕密（隱藏）' },
  heart: { diva: '影后結局', busted: '穿幫結局', coco: 'Coco 結局', g12k: '彩蛋：遊戲儲值 NT$12,000' },
  fanmian: { front: '正面', back: '反面', shard: '碎片', fifth: '第五個人（隱藏）', lost: '時間到（失敗）' },
  arg: { E1: '未完成', E2: '交接', E3: '記錄者', E4: '停止計算', E5: '沉默', E6: '第八位收件人', E7: '被遺忘的權利', E8: '你不知道' },
};
const BANG_CH = [['序章', '台北車站', 8], ['第一章', '故宮', 11], ['第二章', '台北市立美術館', 11], ['第三章', '九份', 11], ['第四章', '十分', 11],
  ['第五章', '台北 101', 11], ['第六章', '淡水老街', 11], ['第七章', '西門町', 11], ['第八章', '饒河夜市', 11], ['第九章', '大安森林公園', 12]];
// 《別讓他知道》《反面》：資料庫只存數字（_admin_key：n＝已解題數、nc＝反面每章解幾題、pl＝玩家名字）
const HEART_CH = ['序章', '第一章', '第二章', '第三章', '第四章', '第五章', '終章'];
const FANMIAN_CH = [['序章', '老街'], ['第一章', '一樓・門市', 13], ['第二章', '一樓後面・暗房', 12], ['第三章', '二樓・林家', 12], ['第四章', '鏡子的兩邊', 12], ['第五章', '三樓・攝影棚', 13]];
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
  // 第三章：每條路線的謎題不一樣，不顯示每部分的總題數
  school3: { save: 'qc3_v1_save', end: 'qc3_v1_endings', parts: PARTS8.slice(0, 7), scenes: S3_SCENES, part: (pi) => [['p' + (pi + 1)], null] },
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
  if (game === 'heart' || game === 'fanmian') {
    const G = J(k[game + '_g']), ends = endList(game, J(k[game + '_end']));
    const pn = game === 'heart' ? HEART_CH.length : FANMIAN_CH.length + 1;
    if (!G) return ends.length ? { done: true, endings: ends, part: '已完成', pi: pn, pn } : null;
    const ch = Math.max(0, G.ch | 0), done = G.phase === 'end' && G.ending !== 'lost', fail = G.ending === 'lost';
    const names = Array.isArray(G.pl) ? G.pl : [], multi = G.mode === 'multi' && names.length >= 2;
    const fin = game === 'heart' && G.phase === 'finale';
    if (game === 'heart') return { part: done ? '已完成' : fin ? '終章・最後的任務' : HEART_CH[Math.min(ch, HEART_CH.length - 1)], pi: done ? pn : Math.min(ch, pn - 1), pn,
      scene: null, solved: G.n ?? null, total: 45, all: G.n ?? null, time: G.clearT ?? G.t, hints: G.hintN, endings: ends, done, fail,
      note: [multi ? `${names.length} 人連線：${names.join('、')}` : '單人', G.wrongs ? `答錯 ${G.wrongs}` : ''].filter(Boolean).join('・') };
    const c = FANMIAN_CH[Math.min(ch, FANMIAN_CH.length - 1)];
    const left = G.budget ? Math.max(0, G.budget - (G.used || 0)) : null;
    return { part: done ? '已完成' : fail ? '時間到' : c[0], pi: done ? pn : Math.min(ch, pn - 1), pn, scene: c[1],
      solved: c[2] ? (G.nc?.[ch] ?? 0) : null, total: c[2] || null, all: G.n ?? null, time: G.clearT ?? G.t, deaths: G.deaths, hints: G.hintN, endings: ends, done, fail,
      note: [multi ? `${names.length} 人連線：${names.join('、')}` : '單人', G.lives != null ? `相機 ${G.lives} / 7` : '', left != null && !done ? `時間池剩 ${Math.floor(left / 3600)} 小時 ${Math.floor(left % 3600 / 60)} 分` : '', G.wrongs ? `答錯 ${G.wrongs}` : ''].filter(Boolean).join('・') };
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
// 最新的時間。玩家裝置的時鐘不準（快了幾個小時）時，遊戲存檔的時間會在「未來」→ 以前會一直被當成「在線」；超過現在 5 分鐘的時間不算
const future = (t) => t && new Date(t) - Date.now() > 5 * 60e3;
const maxT = (...ts) => ts.filter(t => t && !future(t)).sort((a, b) => new Date(a) - new Date(b)).pop() || null;

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
.adm-kpi.warn b { color: #FFB86B; }
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
.adm-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-bottom: 14px; }
.adm-seg { display: inline-flex; border: 1px solid rgba(239,230,210,.2); border-radius: 10px; overflow: hidden; }
.adm-seg button { font: 13px var(--sans); padding: 7px 12px; border: 0; background: transparent; color: var(--muted); cursor: pointer; }
.adm-seg button[aria-pressed="true"] { background: rgba(255,200,119,.16); color: var(--parchment); }
.adm-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: 13px; color: var(--parchment); margin-bottom: 6px; }
.adm-legend i { display: inline-block; width: 14px; height: 3px; border-radius: 2px; vertical-align: 4px; margin-right: 6px; }
.adm-legend b { font-variant-numeric: tabular-nums; }
.adm-chart { position: relative; }
.adm-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.adm-chart text { fill: var(--muted); font: 11px var(--sans); }
.adm-tip { position: absolute; pointer-events: none; background: #120D08; border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; font-size: 12px; color: var(--parchment); white-space: nowrap; box-shadow: 0 6px 18px rgba(0,0,0,.5); transform: translate(-50%, -100%); z-index: 2; }
.adm-tip[hidden] { display: none; }
.adm-tip i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.adm-heat { display: grid; grid-template-columns: 28px repeat(24, minmax(0, 1fr)); gap: 2px; font-size: 11px; color: var(--muted); }
.adm-heat span { text-align: center; }
.adm-heat .c { aspect-ratio: 1; border-radius: 3px; background: rgba(255,200,119,.04); cursor: default; }
.adm-heat .c.max { outline: 2px solid var(--parchment); outline-offset: -2px; }
.adm-heat .h { font-size: 10px; }
.adm-scale { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); margin-top: 8px; }
.adm-scale i { width: 16px; height: 10px; border-radius: 2px; display: inline-block; }
.adm-dl { display: flex; gap: 8px; flex-wrap: wrap; }
.adm-note { color: var(--muted); font-size: 12px; margin: 8px 0 0; }
@media (max-width: 760px) {
  #view-admin { padding-top: 76px; }
  .adm-kpis { grid-template-columns: repeat(2, 1fr); }
  .adm-fun { grid-template-columns: 1fr; gap: 4px; }
  .adm-form .two { grid-template-columns: 1fr; }
  .adm-tbl { font-size: 13px; }
  .adm-heat { grid-template-columns: 22px repeat(24, minmax(0, 1fr)); gap: 1px; }
  .adm-heat .h:nth-child(odd) { visibility: hidden; }
}`;

export function mountAdmin(ctx) {
  const { supabase, root, escapeHTML: esc, avatarHTML, toast, onContentChange } = ctx;
  if (!document.getElementById('adm-css')) { const st = document.createElement('style'); st.id = 'adm-css'; st.textContent = CSS + CSS_MIST; document.head.appendChild(st); }
  const mist = mountMist(ctx);   // 迷霧專用的分頁（玩家存檔、回報處理、公告與活動、數據）
  let D = null, games = [], tab = 'overview', stuckGame = null, timer = 0, loading = false;
  const TABS = [['overview', '總覽'], ['live', '即時動態'], ['stuck', '卡關分析'], ['trend', '📈 趨勢'], ...mist.TABS, ['notice', '🚨 大廳公告'], ['news', '最新消息'], ['games', '遊戲資訊']];

  root.innerHTML = `<div class="container">
    <div class="adm-head"><h1>🛠 管理</h1><span class="muted" id="adm-upd"></span><button class="btn btn-ghost btn-sm" type="button" id="adm-reload">重新整理</button></div>
    <div class="adm-tabs" role="tablist">${TABS.map(([k, t]) => `<button type="button" role="tab" data-tab="${k}">${t}</button>`).join('')}</div>
    <div id="adm-body"><p class="adm-empty">讀取中…</p></div></div>`;
  const body = root.querySelector('#adm-body');
  root.querySelector('.adm-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  root.querySelector('#adm-reload').addEventListener('click', () => load(true));

  // full：整包重抓（第一次、按「重新整理」）；不然只抓上次之後有變化的部分再合併（即時動態每 20 秒一次，整包約 5 MB，會吃掉 Supabase 的流量額度）
  // 這台裝置上記住上次的資料（IndexedDB）：重新打開管理頁只抓有變化的部分，不用每次整包約 10 MB 重抓。
  // 超過 3 天、或按「重新整理」才整包重抓（期間被刪掉的資料要整包重抓才會消失）。
  const CACHE_MAX = 72 * 3600e3;   // 3 天才整包重抓一次（整包約 10 MB；平常只抓變化的部分）
  const idb = (mode, fn) => new Promise((res) => {
    try {
      const rq = indexedDB.open('yeyu-admin', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
      rq.onerror = () => res(null);
      rq.onsuccess = () => { try { const tx = rq.result.transaction('kv', mode), r = fn(tx.objectStore('kv')); tx.oncomplete = () => { res(r && r.result); rq.result.close(); }; tx.onerror = tx.onabort = () => { res(null); rq.result.close(); }; } catch (e) { res(null); } };
    } catch (e) { res(null); }
  });
  let cachedAt = 0, savedAt = 0;
  async function fromCache() {
    const c = await idb('readonly', (st) => st.get('dump'));
    if (!c || !c.D || !c.D.now || Date.now() - c.at > CACHE_MAX) return false;
    D = c.D; games = c.games || []; cachedAt = c.at; return true;
  }
  function toCache(full) {
    // 整包抓完一定存；只抓變化的話最多 5 分鐘存一次（存的是整份資料，太常存會讓手機變慢）
    if (!full && Date.now() - savedAt < 5 * 60e3) return;
    savedAt = Date.now();
    const at = full ? Date.now() : (cachedAt || Date.now());   // 3 天從上次整包重抓算起
    if (full) cachedAt = at;
    idb('readwrite', (st) => st.put({ D, games, at }, 'dump'));
  }

  async function load(full = false) {
    if (loading) return; loading = true;
    try {
      if (full) cachedAt = 0;
      else if (!D && await fromCache()) { prep(); render(); }   // 先用記住的資料畫出來，再去抓變化
      const since = !full && D?.now ? new Date(new Date(D.now).getTime() - 60000).toISOString() : null;   // 多抓 1 分鐘，避免漏掉
      // 偶爾逾時或網路不穩：自動再試一次
      let res;
      for (let i = 0; i < 2; i++) {
        res = await Promise.all([supabase.rpc('admin_dump', since ? { p_since: since } : {}), supabase.from('games').select('*').order('sort_order')]);
        if (!res[0].error && !res[1].error) break;
        if (i === 0) await new Promise((r) => setTimeout(r, 1500));
      }
      const [{ data, error }, g] = res;
      if (error) throw error;
      if (g.error) throw g.error;
      D = since ? merge(D, data) : data; games = g.data || [];
      toCache(!since);
      prep();
      root.querySelector('#adm-upd').textContent = '更新於 ' + new Date().toLocaleTimeString('zh-TW', { ...TZ, hour12: false });
      render();
    } catch (e) {
      const m = esc(e.message || String(e));
      // 已經有資料（例如即時動態自動更新失敗）：保留畫面，只在上方提示
      if (D) root.querySelector('#adm-upd').textContent = `更新失敗（${e.message || e}），目前顯示的是上一次的資料`;
      else {
        body.innerHTML = `<p class="adm-empty">讀取失敗：${m}</p><button class="btn btn-gold btn-sm" type="button" data-retry>重試</button>`;
        body.querySelector('[data-retry]').onclick = () => load();
      }
    } finally { loading = false; }
  }

  // 把「有變化的部分」合併進原本的資料（玩家依 id、紀錄依 id、存檔依玩家＋遊戲取代；回報沿用原本的）
  function merge(old, add) {
    const upd = (arr, key, more) => { const m = new Map(arr.map(x => [key(x), x])); for (const x of more) m.set(key(x), x); return [...m.values()]; };
    return { ...add,
      players: upd(old.players, x => x.id, add.players).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
      records: upd(old.records, x => x.id, add.records),
      saves: upd(old.saves, x => x.user_id + '|' + x.game, add.saves),
      bugs: add.bugs || old.bugs };   // 回報每次都重抓（只有還沒處理的，很小）
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
      if (future(x.save?.updated_at)) p.skew = Math.max(p.skew || 0, (new Date(x.save.updated_at) - Date.now()) / 36e5);   // 裝置時鐘快了幾小時
      x.status = x.cleared || x.sum?.done ? 'done' : x.sum ? 'progress' : 'started';
      p.last = maxT(p.last, x.last);
    }
  }

  function show(k) {
    tab = k;
    root.querySelectorAll('.adm-tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === k));
    clearInterval(timer);
    // 即時動態開著時每 1 分鐘更新一次（以前 20 秒；開著不關也會一直累積 Supabase 的用量）
    if (k === 'live') timer = setInterval(() => { if (!document.hidden && root.isConnected && !root.hidden) load(); }, 60000);
    render();
  }
  function render() {
    if (!D) return;
    if (mist.TABS.some(([k]) => k === tab)) return mist.render(tab, body);
    const fn = { overview, live, stuck, trend, notice, news, gamesTab }[tab === 'games' ? 'gamesTab' : tab];
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
      <div class="adm-kpis">${kpi(ps.length, '註冊玩家')}${kpi(newToday, '今天新增')}${kpi(new7, '最近 7 天新增')}${kpi(on15, '現在在線（15 分鐘內）', 'live')}${kpi(act24, '今天來過（24 小時內）')}${kpi(playedAny, '至少玩過一款')}${kpi(D.bugs.length, '待處理回報', D.bugs.length ? 'warn' : '')}${D.db_bytes ? kpi(Math.round(D.db_bytes / 1048576) + ' MB', '資料庫（免費上限 500 MB）', D.db_bytes > 450 * 1048576 ? 'warn' : '') : ''}</div>
      <div class="adm-card"><h3>每款遊戲<small>不含你自己的紀錄</small></h3><div class="adm-scroll"><table class="adm-tbl">
        <tr><th>遊戲</th><th>玩過</th><th>通關</th><th>通關率</th><th>玩到一半</th><th>只按開始</th><th>平均通關</th><th>最快</th></tr>${rows}
        ${mist ? `<tr><td>迷霧</td><td class="n">${mist}</td><td colspan="6" class="adm-note">開放世界，沒有通關</td></tr>` : ''}</table></div></div>
      <div class="adm-card"><h3>最近 14 天註冊</h3><div class="adm-bars">${days.map(d => `<div><b>${byDay[d] || ''}</b><i style="height:${byDay[d] / mx * 70}px"></i><em>${d.slice(8)}</em></div>`).join('')}</div></div>
      <div class="adm-card"><h3>最新註冊的玩家</h3>${recent.map(p => `<div class="adm-row">${avatarHTML(p, 40)}<div><b>${esc(p.name)}</b>
        <p>${dt(p.created_at)} 註冊・最後上線 ${ago(p.last)}・${esc(p.email || '')}</p></div></div>`).join('') || '<p class="adm-empty">還沒有玩家。</p>'}</div>
      <div class="adm-card"><h3>待處理的回報<small>處理請到「回報處理」分頁</small></h3>${D.bugs.length ? D.bugs.map(b => `<div class="adm-row"><div><b>${esc(gameBySlug[b.game]?.title || b.game || '大廳')}</b>
        <span class="adm-tag">${dt(b.created_at)}</span>${b.user_id && P[b.user_id] ? `<span class="adm-tag">${esc(P[b.user_id].name)}</span>` : ''}
        <p class="prog">${esc(b.message || '')}</p>${b.station ? `<p>位置：${esc(b.station)}</p>` : ''}</div></div>`).join('') : '<p class="adm-empty">目前沒有待處理的回報。</p>'}</div>`;
  }

  // ---------- 2. 即時動態：現在有幾個人在玩遊戲 ----------
  // 「在玩」＝最近 15 分鐘內有遊戲存檔（遊戲裡一有進度，最多 10 秒就會存到雲端）。不含管理員自己。
  function live() {
    const now = Date.now(), cnt = {};
    for (const p of players()) {
      const xs = Object.values(p.games).filter(x => x.last && now - new Date(x.last) < 15 * 60e3);
      if (!xs.length) continue;
      const cur = xs.sort((a, b) => String(b.last).localeCompare(String(a.last)))[0];
      cnt[cur.slug] = (cnt[cur.slug] || 0) + 1;
    }
    const total = Object.values(cnt).reduce((a, b) => a + b, 0);
    const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([slug, n]) => `<tr><td>${esc(gameBySlug[slug]?.title || (slug === 'mist' ? '迷霧' : slug))}</td><td class="n">${n} 人</td></tr>`).join('');
    body.innerHTML = `
      <div class="adm-kpis"><div class="adm-kpi live"><b>${total}</b><span>現在正在玩遊戲的人</span></div></div>
      ${total ? `<div class="adm-card"><h3>在玩哪一款<small>每 1 分鐘自動更新，要馬上看按右上角「重新整理」</small></h3><div class="adm-scroll"><table class="adm-tbl"><tr><th>遊戲</th><th>人數</th></tr>${rows}</table></div></div>` : '<p class="adm-empty">現在沒有人在玩遊戲。</p>'}
      <p class="adm-note">算法：最近 15 分鐘內有遊戲存檔的玩家（不含你自己）。遊戲裡一有進度，最多 10 秒就會存到雲端；打開遊戲但完全沒動作的人算不到。每個人的進度在「卡關分析」。</p>`;
  }

  // ---------- 3b. 趨勢：每天開局／通關、玩家幾點來玩、下載 CSV ----------
  // 全部用已經抓下來的資料（D.records、D.players）算，不會多問 Supabase。不含管理員自己的紀錄。
  // 「開局」＝遊玩紀錄建立的時間；「通關」＝狀態是已通關的紀錄最後更新的時間。時間都用台灣時間。
  let trendGame = 'all', trendDays = 30;
  const C_START = '#4F95D9', C_CLEAR = '#BD8020';   // 已用 dataviz 的檢查跑過（深色底、色盲可分）
  const twParts = (t) => { const o = {}; for (const x of new Intl.DateTimeFormat('en-US', { ...TZ, weekday: 'short', hour: 'numeric', hour12: false }).formatToParts(new Date(t))) o[x.type] = x.value; return o; };
  const WD = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }, WD_ZH = ['一', '二', '三', '四', '五', '六', '日'];
  function trendRecs() {
    const gid = trendGame === 'all' ? null : gameBySlug[trendGame]?.id;
    return D.records.filter(r => !admins.has(r.user_id) && (!gid || r.game_id === gid));
  }
  function trend() {
    const now = Date.now(), days = [...Array(trendDays)].map((_, i) => day(now - (trendDays - 1 - i) * 864e5)), from = days[0];
    const recs = trendRecs();
    const st = Object.fromEntries(days.map(d => [d, 0])), cl = Object.fromEntries(days.map(d => [d, 0]));
    for (const r of recs) {
      const a = day(r.created_at); if (a in st) st[a]++;
      if (r.status === 'cleared') { const c = day(r.updated_at || r.created_at); if (c in cl) cl[c]++; }
    }
    const S = days.map(d => st[d]), C = days.map(d => cl[d]), sumS = S.reduce((a, b) => a + b, 0), sumC = C.reduce((a, b) => a + b, 0);
    // 熱度圖：同一段時間的開局，星期 × 小時
    const heat = [...Array(7)].map(() => Array(24).fill(0));
    for (const r of recs) { if (day(r.created_at) < from) continue; const p = twParts(r.created_at); const w = WD[p.weekday], h = +p.hour % 24; if (w != null) heat[w][h]++; }
    const hmax = Math.max(0, ...heat.flat()), byHour = Array(24).fill(0); heat.forEach(row => row.forEach((v, h) => byHour[h] += v));
    const topH = byHour.indexOf(Math.max(...byHour));
    // 折線圖（SVG）
    // 圖的寬度跟著畫面（手機上字不會縮得太小）
    const W = Math.round(Math.max(320, Math.min(720, (body.clientWidth || 720) - 40))), H = W < 500 ? 200 : 220, L = 34, R = 10, T = 10, B = 26, mx = Math.max(4, ...S, ...C), step = Math.pow(10, Math.floor(Math.log10(mx))) * (mx / Math.pow(10, Math.floor(Math.log10(mx))) > 5 ? 2 : 1);
    const top = Math.ceil(mx / step) * step, x = (i) => L + (W - L - R) * (days.length === 1 ? .5 : i / (days.length - 1)), y = (v) => T + (H - T - B) * (1 - v / top);
    const ticks = []; for (let v = 0; v <= top; v += step) ticks.push(v);
    const path = (A) => A.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const every = Math.ceil(days.length / (W < 500 ? 4 : 8)), xl = days.map((d, i) => (i % every === 0 || i === days.length - 1) && !(i !== days.length - 1 && days.length - 1 - i < every / 2) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${+d.slice(5, 7)}/${+d.slice(8)}</text>` : '').join('');
    const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="每天開局和通關的局數">
      ${ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(239,230,210,${v ? .07 : .2})"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      ${xl}
      <line id="tr-x" y1="${T}" y2="${H - B}" stroke="rgba(239,230,210,.35)" visibility="hidden"/>
      <path d="${path(S)}" fill="none" stroke="${C_START}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${path(C)}" fill="none" stroke="${C_CLEAR}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle id="tr-ds" r="4" fill="${C_START}" stroke="var(--wall)" stroke-width="2" visibility="hidden"/><circle id="tr-dc" r="4" fill="${C_CLEAR}" stroke="var(--wall)" stroke-width="2" visibility="hidden"/>
      <rect id="tr-hit" x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent"/></svg>`;
    const list = games.filter(g => g.play_url);
    const seg = (id, opts, cur) => `<div class="adm-seg" id="${id}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(cur)}">${t}</button>`).join('')}</div>`;
    const alpha = (v) => v ? .14 + .86 * v / hmax : 0;
    body.innerHTML = `
      <div class="adm-filters"><select class="adm-sel" id="tr-g"><option value="all">全部遊戲</option>${list.map(g => `<option value="${esc(g.slug)}"${g.slug === trendGame ? ' selected' : ''}>${esc(g.title)}</option>`).join('')}</select>
        ${seg('tr-d', [[14, '14 天'], [30, '30 天'], [90, '90 天']], trendDays)}</div>
      <div class="adm-kpis"><div class="adm-kpi"><b>${sumS}</b><span>開局（${trendDays} 天）</span></div><div class="adm-kpi"><b>${sumC}</b><span>通關（${trendDays} 天）</span></div>
        <div class="adm-kpi"><b>${pct(sumC, sumS)}</b><span>通關局數 ÷ 開局局數</span></div>${hmax ? `<div class="adm-kpi"><b>${topH}:00</b><span>最多人開局的時段</span></div>` : ''}</div>
      <div class="adm-card"><h3>每天開局、通關<small>台灣時間・不含你自己</small></h3>
        <div class="adm-legend"><span><i style="background:${C_START}"></i>開局</span><span><i style="background:${C_CLEAR}"></i>通關</span></div>
        <div class="adm-chart" id="tr-chart">${svg}<div class="adm-tip" id="tr-tip" hidden></div></div>
        <details style="margin-top:10px"><summary class="muted" style="cursor:pointer">看數字</summary><div class="adm-scroll"><table class="adm-tbl" style="min-width:0"><tr><th>日期</th><th>開局</th><th>通關</th></tr>
          ${days.slice().reverse().map(d => `<tr><td>${d}</td><td class="n">${st[d]}</td><td class="n">${cl[d]}</td></tr>`).join('')}</table></div></details></div>
      <div class="adm-card"><h3>玩家幾點來玩<small>${trendDays} 天內的開局，星期 × 小時（台灣時間）；框起來的是最多的格子</small></h3>
        ${hmax ? `<div class="adm-heat" id="tr-heat"><span></span>${[...Array(24)].map((_, h) => `<span class="h">${h}</span>`).join('')}
          ${heat.map((row, w) => `<span>${WD_ZH[w]}</span>${row.map((v, h) => `<i class="c${v === hmax ? ' max' : ''}" data-tip="星期${WD_ZH[w]} ${h}:00–${h}:59：${v} 局" style="${v ? `background:rgba(189,128,32,${alpha(v).toFixed(2)})` : ''}"></i>`).join('')}`).join('')}</div>
          <div class="adm-scale"><span>少</span>${[.14, .35, .57, .78, 1].map(a => `<i style="background:rgba(189,128,32,${a})"></i>`).join('')}<span>多（最多 ${hmax} 局）</span></div>
          <div class="adm-scroll" style="margin-top:12px"><table class="adm-tbl" style="min-width:0"><tr><th>時段</th>${[0, 6, 12, 18].map(h => `<th>${h}–${h + 5} 點</th>`).join('')}</tr><tr><td>開局</td>${[0, 6, 12, 18].map(h => `<td class="n">${byHour.slice(h, h + 6).reduce((a, b) => a + b, 0)}</td>`).join('')}</tr></table></div>`
        : '<p class="adm-empty">這段時間沒有開局。</p>'}</div>
      <div class="adm-card"><h3>下載資料<small>CSV，Excel、Google 試算表都打得開</small></h3>
        <div class="adm-dl"><button class="btn btn-ghost btn-sm" type="button" data-csv="players">⬇️ 玩家名單</button><button class="btn btn-ghost btn-sm" type="button" data-csv="records">⬇️ 遊玩紀錄（全部遊戲）</button></div>
        <p class="adm-note">用的是管理頁已經抓下來的資料，不會多花 Supabase 的用量。玩家名單不含管理員；紀錄含全部（狀態欄看得出來）。</p></div>
      <p class="adm-note">開局＝按下開始、建立一筆遊玩紀錄；同一個人重玩會再算一局。通關的日期是紀錄最後更新的時間。《迷霧》沒有遊玩紀錄，不在這裡。</p>`;
    body.querySelector('#tr-g').onchange = (e) => { trendGame = e.target.value; trend(); };
    body.querySelectorAll('#tr-d button').forEach(b => b.onclick = () => { trendDays = +b.dataset.v; trend(); });
    body.querySelectorAll('[data-csv]').forEach(b => b.onclick = () => downloadCSV(b.dataset.csv));
    // 滑過折線圖：直線＋兩個點＋提示框
    const box = body.querySelector('#tr-chart'), sv = box.querySelector('svg'), tip = box.querySelector('#tr-tip');
    const hx = sv.querySelector('#tr-x'), ds = sv.querySelector('#tr-ds'), dc = sv.querySelector('#tr-dc');
    const hide = () => { tip.hidden = true; [hx, ds, dc].forEach(e => e.setAttribute('visibility', 'hidden')); };
    const move = (ev) => {
      const rc = sv.getBoundingClientRect(), px = (ev.clientX - rc.left) / rc.width * W;
      const i = Math.max(0, Math.min(days.length - 1, Math.round((px - L) / (W - L - R) * (days.length - 1))));
      hx.setAttribute('x1', x(i)); hx.setAttribute('x2', x(i)); ds.setAttribute('cx', x(i)); ds.setAttribute('cy', y(S[i])); dc.setAttribute('cx', x(i)); dc.setAttribute('cy', y(C[i]));
      [hx, ds, dc].forEach(e => e.setAttribute('visibility', 'visible'));
      const d = days[i], wd = WD_ZH[(new Date(d + 'T12:00:00+08:00').getUTCDay() + 6) % 7];
      tip.innerHTML = `<b>${+d.slice(5, 7)}/${+d.slice(8)}（${wd}）</b><br><i style="background:${C_START}"></i>開局 ${S[i]}<br><i style="background:${C_CLEAR}"></i>通關 ${C[i]}`;
      tip.hidden = false;
      const bx = box.getBoundingClientRect(), left = x(i) / W * rc.width + rc.left - bx.left;
      tip.style.left = Math.max(60, Math.min(bx.width - 60, left)) + 'px'; tip.style.top = (Math.min(y(S[i]), y(C[i])) / H * rc.height + rc.top - bx.top - 10) + 'px';
    };
    sv.addEventListener('pointermove', move); sv.addEventListener('pointerdown', move); sv.addEventListener('pointerleave', hide);
    // 熱度圖：滑過或點格子顯示數字
    const ht = body.querySelector('#tr-heat');
    if (ht) {
      const t2 = document.createElement('div'); t2.className = 'adm-tip'; t2.hidden = true; ht.style.position = 'relative'; ht.appendChild(t2);
      const sh = (ev) => { const c = ev.target.closest('.c'); if (!c) { t2.hidden = true; return; } const a = ht.getBoundingClientRect(), b = c.getBoundingClientRect(); t2.textContent = c.dataset.tip; t2.hidden = false; t2.style.left = Math.max(70, Math.min(a.width - 70, b.left - a.left + b.width / 2)) + 'px'; t2.style.top = (b.top - a.top - 4) + 'px'; };
      ht.addEventListener('pointerover', sh); ht.addEventListener('pointerdown', sh); ht.addEventListener('pointerleave', () => (t2.hidden = true));
    }
  }
  // CSV：Excel 打開中文不亂碼要加 BOM；時間用台灣時間
  function downloadCSV(kind) {
    const tw = (t) => t ? new Date(t).toLocaleString('sv-SE', TZ) : '';
    const cell = (v) => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? '"' + (/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
    let rows;
    if (kind === 'players') {
      rows = [['名字', 'Email', '註冊時間', '最後上線', '玩過幾款', '通關幾款', '玩過的遊戲']];
      for (const p of players()) { const gs = Object.values(p.games); rows.push([p.username || '', p.email || '', tw(p.created_at), tw(p.last), gs.length, gs.filter(x => x.status === 'done').length, gs.map(x => gameBySlug[x.slug]?.title || x.slug).join('、')]); }
    } else {
      const ST = { started: '進行中', cleared: '通關', failed: '失敗' };
      rows = [['玩家', '遊戲', '狀態', '開始時間', '最後更新', '通關時間（秒）', '提示', '死亡', '結局', '是管理員']];
      for (const r of D.records.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))) rows.push([P[r.user_id]?.name || r.user_id, gameById[r.game_id]?.title || r.game_id, ST[r.status] || r.status, tw(r.created_at), tw(r.updated_at), r.clear_time_sec ?? '', r.hints ?? '', r.deaths ?? '', r.ending ?? '', admins.has(r.user_id) ? '是' : '']);
    }
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `夜語_${kind === 'players' ? '玩家名單' : '遊玩紀錄'}_${day(Date.now())}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(`已下載 ${rows.length - 1} 筆`);
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

  // ---------- 5b. 大廳公告（緊急公告）：直接顯示在大廳最上面，可以設定開始、結束時間 ----------
  // 存在 game_announcements（game = 'lobby'），level：info＝一般（金色）、urgent＝緊急（紅色）
  // 大廳從 Worker 的 /api/notice 拿（快取 1 分鐘）、每 2 分鐘再查一次：發布或到開始時間後，最多 1～3 分鐘出現在大家的大廳
  let noticeEdit = null;
  async function notice() {
    body.innerHTML = '<p class="adm-empty">讀取中…</p>';
    const { data: list, error } = await supabase.from('game_announcements').select('*').eq('game', 'lobby').order('starts_at', { ascending: false }).limit(50);
    if (error) { body.innerHTML = `<p class="adm-empty">讀取失敗：${esc(error.message)}</p>`; return; }
    const a = noticeEdit ? list.find(x => String(x.id) === String(noticeEdit)) : null;
    const now = Date.now(), state = (x) => !x.active ? ['停用', ''] : new Date(x.starts_at) > now ? ['還沒開始', 'warn'] : x.ends_at && new Date(x.ends_at) <= now ? ['已結束', ''] : ['顯示中', 'ok'];
    const end = (h) => localInput(new Date(Date.now() + h * 3600e3));
    body.innerHTML = `
      <div class="adm-card"><h3>${a ? '修改大廳公告' : '發一則大廳公告'}<small>直接顯示在大廳最上面（所有人，包含沒登入的）；發布後 1～3 分鐘內出現，不用重新整理</small></h3>
        <form class="adm-form" id="adm-nt-f">
          <label>標題<input name="title" required maxlength="80" placeholder="例如：今晚 23:00～23:30 系統維護" value="${esc(a?.title || '')}"></label>
          <label>內容（選填，網址會變成連結）<textarea name="body" maxlength="1000">${esc(a?.body || '')}</textarea></label>
          <label>等級<select name="level"><option value="urgent"${!a || a.level === 'urgent' ? ' selected' : ''}>🚨 緊急（紅色）</option><option value="info"${a && a.level !== 'urgent' ? ' selected' : ''}>📢 一般（金色）</option></select></label>
          <div class="two"><label>開始時間<input type="datetime-local" name="starts_at" value="${localInput(a?.starts_at || new Date())}"></label><label>結束時間（留空＝一直顯示）<input type="datetime-local" name="ends_at" value="${a?.ends_at ? localInput(a.ends_at) : ''}"></label></div>
          <div class="acts" style="font-size:13px"><span class="muted">結束時間快速設定：</span>${[[1, '1 小時後'], [3, '3 小時後'], [24, '明天這時候'], [168, '一週後']].map(([h, t]) => `<button class="btn btn-ghost btn-sm" type="button" data-end="${end(h)}">${t}</button>`).join('')}<button class="btn btn-ghost btn-sm" type="button" data-end="">不結束</button></div>
          <label class="chk"><input type="checkbox" name="active"${!a || a.active ? ' checked' : ''}> 啟用（取消勾選＝馬上收起來）</label>
          <div class="acts"><button class="btn btn-gold" type="submit">${a ? '儲存修改' : '發布'}</button>${a ? '<button class="btn btn-ghost" type="button" id="adm-nt-x">取消</button>' : ''}</div></form></div>
      <div class="adm-card"><h3>全部大廳公告<small>${list.length} 則</small></h3>${list.map(x => { const [t, c] = state(x); return `<div class="adm-news"><div><b>${x.level === 'urgent' ? '🚨 ' : '📢 '}${esc(x.title)}</b><span class="adm-tag ${c}">${t}</span>
        <p>${dt(x.starts_at)} → ${x.ends_at ? dt(x.ends_at) : '不結束'}</p>${x.body ? `<p>${esc(x.body)}</p>` : ''}</div>
        ${t === '顯示中' ? `<button class="btn btn-ghost" data-nstop="${x.id}">立刻結束</button>` : ''}<button class="btn btn-ghost" data-ne="${x.id}">修改</button><button class="btn btn-ghost" data-nd="${x.id}">刪除</button></div>`; }).join('') || '<p class="adm-empty">還沒有大廳公告。</p>'}</div>`;
    const f = body.querySelector('#adm-nt-f');
    body.querySelectorAll('[data-end]').forEach(b => b.onclick = () => { f.ends_at.value = b.dataset.end; });
    f.onsubmit = async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(f));
      const st = v.starts_at ? new Date(v.starts_at) : new Date(), en = v.ends_at ? new Date(v.ends_at) : null;
      if (en && en <= st) return toast('結束時間要比開始時間晚', 'error');
      const row = { game: 'lobby', title: v.title.trim(), body: v.body.trim() || null, level: v.level === 'urgent' ? 'urgent' : 'info', starts_at: st.toISOString(), ends_at: en ? en.toISOString() : null, active: !!v.active };
      const { error: e2 } = noticeEdit ? await supabase.from('game_announcements').update(row).eq('id', noticeEdit) : await supabase.from('game_announcements').insert(row);
      if (e2) return toast('儲存失敗：' + e2.message, 'error');
      toast(noticeEdit ? '公告已更新' : '公告已發布，1～3 分鐘內會出現在大廳', 'ok'); noticeEdit = null; notice();
      window.dispatchEvent(new Event('lobby-notice-changed'));
    };
    body.querySelector('#adm-nt-x')?.addEventListener('click', () => { noticeEdit = null; notice(); });
    body.querySelectorAll('[data-ne]').forEach(b => b.onclick = () => { noticeEdit = b.dataset.ne; notice(); scrollTo({ top: 0, behavior: 'smooth' }); });
    body.querySelectorAll('[data-nstop]').forEach(b => b.onclick = async () => {
      const { error: e2 } = await supabase.from('game_announcements').update({ ends_at: new Date().toISOString() }).eq('id', b.dataset.nstop);
      if (e2) return toast('失敗：' + e2.message, 'error'); toast('已結束，1～3 分鐘內從大廳消失'); notice(); window.dispatchEvent(new Event('lobby-notice-changed'));
    });
    body.querySelectorAll('[data-nd]').forEach(b => b.onclick = async () => {
      if (!confirm('確定要刪除這則公告嗎？')) return;
      const { error: e2 } = await supabase.from('game_announcements').delete().eq('id', b.dataset.nd);
      if (e2) return toast('刪除失敗：' + e2.message, 'error'); toast('已刪除'); notice(); window.dispatchEvent(new Event('lobby-notice-changed'));
    });
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
  // 從大廳回到管理頁：只抓變化（以前每次都整包重抓約 10 MB）；要整包重抓按「重新整理」
  return { refresh: () => load(), stop: () => clearInterval(timer) };
}
