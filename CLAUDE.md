# 夜語工作室大廳（escape-room）

## 發佈
- 大廳發佈在 Cloudflare Workers（`lobby`）：https://lobby.noron.workers.dev/ 。原本的 GitHub Pages（hao-yuliu.github.io/escape-room/）因 GitHub 帳號被標記而下架。
- `wrangler.jsonc` 把 repo 根目錄當成靜態檔案發佈，`.assetsignore` 列出不發佈的檔案。
- 部署：`npx wrangler deploy`（需要 `CLOUDFLARE_API_TOKEN`）。
- 各遊戲裡的大廳網址（`LOBBY`）都要指向上面的網址；Supabase Auth 的 Site URL / Redirect URLs 也要包含它。

## 新增遊戲
- 加一個分享頁 `g/<slug>/index.html`（複製現有的改內容），並把 slug 加進 `index.html` 的 `SHARE_PAGES`。
- 封面放在 `covers/<slug>.jpg`，`games.cover_url` 寫相對路徑 `covers/<slug>.jpg`。
