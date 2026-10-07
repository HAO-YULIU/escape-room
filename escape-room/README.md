# 第柒門｜線上密室逃脫

純 HTML + JavaScript，不需要編譯，直接用 GitHub Pages 部署。後端用 Supabase（登入、角色資料、頭像、遊玩紀錄）。

## 頁面
- `index.html`：大廳首頁（訪客可瀏覽所有密室；要遊玩必須註冊並建立角色）
- `login.html`：登入 / 註冊
- `character.html`：建立 / 編輯角色、選外觀、上傳頭像
- `game.html?room=<slug>`：遊玩頁，載入 `games/<slug>/index.html`（未登入或沒有角色會被擋下）

## 檔案結構（每個檔案要分開放，不能全部貼進 index.html）
```
index.html  login.html  character.html  game.html
css/style.css
js/app.js  js/avatar.js  js/config.js
games/README.md
supabase/schema.sql
```

## 部署
1. 把整個資料夾內容放到 repo 根目錄並推上 GitHub
2. repo → Settings → Pages → Source 選 `main` 分支、`/ (root)`
3. Supabase → Authentication → URL Configuration：
   - Site URL 填 `https://hao-yuliu.github.io/escape-room/`
   - Redirect URLs 加上 `https://hao-yuliu.github.io/escape-room/**`

資料庫結構在 `supabase/schema.sql`（已經套用到 Supabase 專案，不用再跑一次）。
