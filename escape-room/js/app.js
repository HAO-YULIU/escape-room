import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { renderAvatar } from './avatar.js';

export const BRAND = '第柒門';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function getUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) console.error(error);
  return data;
}

// 頭像：有上傳圖片就用圖片，沒有就用角色外觀
export function avatarHTML(profile, size = 40) {
  if (profile?.avatar_url) {
    return `<img class="avatar-img" src="${escapeHTML(profile.avatar_url)}" alt="${escapeHTML(profile.username)} 的頭像" width="${size}" height="${size}">`;
  }
  return `<span class="avatar-svg" style="width:${size}px;height:${size}px">${renderAvatar(profile?.appearance, { size })}</span>`;
}

export function escapeHTML(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function toast(msg, type = 'info') {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.dataset.type = type;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

// 品牌標誌：拱門裡的「柒」
export const LOGO_SVG = `
  <svg viewBox="0 0 32 36" width="26" height="30" aria-hidden="true">
    <path d="M3 35 V14 Q3 2 16 2 Q29 2 29 14 V35" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <circle cx="22.5" cy="22" r="1.8" fill="currentColor"/>
  </svg>`;

// 每一頁共用的頂部導覽列
export async function mountHeader() {
  const header = document.querySelector('#site-header');
  const user = await getUser();
  const profile = user ? await getProfile(user.id) : null;

  const right = user
    ? `<a class="me" href="character.html" title="編輯角色">
         ${avatarHTML(profile, 36)}
         <span>${escapeHTML(profile?.username ?? '尚未建立角色')}</span>
       </a>
       <button class="btn btn-ghost btn-sm" id="logout">登出</button>`
    : `<a class="btn btn-ghost btn-sm" href="login.html">登入</a>
       <a class="btn btn-gold btn-sm" href="login.html?mode=signup">註冊</a>`;

  header.innerHTML = `
    <div class="header-inner">
      <a class="logo" href="index.html" aria-label="${BRAND} 首頁">${LOGO_SVG}<span>${BRAND}</span></a>
      <nav class="nav" id="nav">
        <a href="index.html#rooms">密室主題</a>
        <a href="index.html#how">遊戲方式</a>
        <a href="index.html#about">關於我們</a>
        <a href="index.html#faq">Q&amp;A</a>
        ${user ? '<a href="character.html">我的角色</a>' : ''}
      </nav>
      <div class="header-right">${right}</div>
      <button class="menu-btn" id="menu-btn" aria-label="選單" aria-expanded="false" aria-controls="nav">
        <span></span><span></span><span></span>
      </button>
    </div>`;

  const menuBtn = header.querySelector('#menu-btn');
  const nav = header.querySelector('#nav');
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }
  });

  // 往下捲時讓導覽列變實色
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  header.querySelector('#logout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.href = 'index.html';
  });

  return { user, profile };
}

// 沒有帳號 / 沒有角色時跳出的提示
export function showGate(user, roomTitle = '') {
  let dlg = document.querySelector('#gate');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'gate';
    dlg.className = 'gate';
    document.body.appendChild(dlg);
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  }
  const needAccount = !user;
  dlg.innerHTML = `
    <div class="gate-inner">
      <button class="gate-x" data-close aria-label="關閉">×</button>
      <div class="gate-door">${LOGO_SVG}</div>
      <h2>${needAccount ? '門鎖著，需要鑰匙' : '還差一步：建立角色'}</h2>
      <p>${roomTitle ? `想進入「${escapeHTML(roomTitle)}」？` : ''}${needAccount
        ? '訪客可以自由逛大廳，但要推門遊玩，必須先免費註冊並建立你的角色。'
        : '你已經登入了，建立一個角色，就能用他的身分走進密室。'}</p>
      <div class="gate-actions">
        ${needAccount
          ? `<a class="btn btn-gold" href="login.html?mode=signup">免費註冊並建立角色</a>
             <a class="btn btn-ghost" href="login.html">我已經有帳號</a>`
          : `<a class="btn btn-gold" href="character.html">建立角色</a>
             <button class="btn btn-ghost" data-close>先逛逛</button>`}
      </div>
    </div>`;
  dlg.showModal();
}
