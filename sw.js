// 夜語工作室大廳：讓大廳可以「加到主畫面」當成 App 開啟
// 策略：大廳頁面一律先拿網路上的最新版（網路不通時才用上次存的），圖示等靜態檔用快取。
// 只處理大廳自己的檔案；Supabase、遊戲、字型等其他網站的請求一律不經過這裡。
const CACHE = 'yeyu-lobby-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(new URL('./', location).pathname)) return;
  if (req.mode === 'navigate') {
    // 頁面：網路優先，確保大廳永遠是最新的；離線時才顯示上次的版本
    // 只把大廳首頁存起來（分享頁 g/<遊戲>/ 等其他頁面不要蓋掉它）
    const home = url.pathname === new URL('./', location).pathname || url.pathname.endsWith('/index.html') && !url.pathname.includes('/g/');
    e.respondWith(fetch(req).then((res) => { if (home && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); } return res; })
      .catch(() => caches.match(home ? './index.html' : req).then((hit) => hit || caches.match('./index.html'))));
    return;
  }
  // 程式檔（admin.js 等）：網路優先，改版後馬上拿到新的
  if (url.pathname.endsWith('.js')) {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => caches.match(req)));
    return;
  }
  // 其他大廳檔案（圖示、封面）：先用快取，同時在背景更新
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
