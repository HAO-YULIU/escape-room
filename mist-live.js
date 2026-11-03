/* 大廳：《迷霧》的全服目標進度、本週站長（顯示在迷霧的排行榜視窗）。
 * 資料：mist_community_status、mist_stations（沒登入也可以讀）。跟遊戲 js/community.js 的題目名稱一致。 */
window.MistLive = (() => {
  const GOAL = { clock: ['停了三十年的老鐘', '台北車站'], sunset: ['熄掉的夕陽燈', '淡水'], ferry: ['渡口的木船', '小碧潭'], onsen: ['湯之庭的木招牌', '北投'],
    ring: ['點亮環狀線', '板橋', '次到站'], letters: ['一千封感謝信', '南港展覽館', '個任務'], lanterns: ['霧裡的提燈', '小南門', '篇霧夜短篇'] };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nt = n => 'NT$ ' + Number(n || 0).toLocaleString();
  function html(cs, ms) {
    if (!cs && !ms) return '';
    let out = '';
    if (cs && cs.goal_id) {
      const [title, st, unit] = GOAL[cs.goal_id] || [cs.goal_id, ''], pct = Math.min(100, Math.round(cs.total / cs.target * 100));
      const amt = n => (unit ? `${Number(n || 0).toLocaleString()} ${unit}` : nt(n));   // 不用捐錢的題目顯示次數
      const ms2 = cs.ends ? Date.parse(cs.ends) - Date.now() : 0, left = ms2 > 0 ? `還剩 ${Math.floor(ms2 / 864e5)} 天 ${Math.floor(ms2 % 864e5 / 36e5)} 小時` : '';
      out += `<div class="ml-goal"><b>🤝 本週全服目標：${esc(title)}</b>${st ? `<small>（${esc(st)}）</small>` : ''}
        <div class="ml-bar"><i style="width:${pct}%"></i></div>
        <small>${cs.done_at ? '已經達標！' : ''}${amt(cs.total).replace(/ \S+$/, unit ? '' : '$&')} / ${amt(cs.target)}（${pct}%）　${left}</small>
        ${(cs.top || []).length ? `<small>捐款前三：${cs.top.slice(0, 3).map(t => esc(t.name)).join('、')}</small>` : ''}</div>`;
    }
    // 玩家得標的站列出來；沒人得標、由管理員預設管理（0 元）的合併成一行
    const all = ms && ms.masters ? Object.entries(ms.masters) : [], dflt = all.filter(([, m]) => !m.price);
    const masters = all.filter(([, m]) => m.price > 0).sort((a, b) => b[1].price - a[1].price).slice(0, 20);
    if (ms) out += `<div class="ml-masters"><b>🏷️ 本週站長${ms.period ? `（第 ${ms.period} 期）` : ''}</b>${masters.length ? `<ol>${masters.map(([s, m]) => `<li>${esc(s)}<span>${esc(m.name)}・${nt(m.price)}</span></li>`).join('')}</ol>` : '<small>這一期還沒有玩家得標。到遊戲裡任何一站大廳的「投標所」出價，就能當下一期的站長。</small>'}${dflt.length ? `<small>其餘 ${dflt.length} 站由 ${esc(dflt[0][1].name)} 管理，等你來投標。</small>` : ''}</div>`;
    return out;
  }
  async function load(supabase) {
    try {
      const [{ data: cs }, { data: ms }] = await Promise.all([supabase.rpc('mist_community_status'), supabase.rpc('mist_stations')]);
      return html(cs, ms);
    } catch (e) { return ''; }
  }
  // 大廳排行榜：本期擁有最多車站的站長（同站數比得標總額）；每週一 20:00 換期時更新
  function boardRows(rows, uid, avatarHTML) {
    if (!rows || !rows.length) return '<li class="mist-empty">這一期還沒有站長。到遊戲裡任何一站大廳的「投標所」出價，得標就能當 7 天站長、登上這個排行榜。</li>';
    return rows.map((r, i) => `<li class="mist-row${uid && r.user_id === uid ? ' mist-mine' : ''}"><span class="mist-no">${i + 1}</span>${avatarHTML(r, 36)}<span class="mist-name">${esc(r.username || '旅人')}<small>${(r.names || []).slice(0, 4).map(esc).join('、')}${(r.names || []).length > 4 ? ` 等 ${r.names.length} 站` : ''}・得標 ${nt(r.total)}</small></span><b>${r.stations}<small> 站</small></b></li>`).join('');
  }
  return { html, load, boardRows };
})();
