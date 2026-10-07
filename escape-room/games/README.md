# 密室遊戲放這裡

每一間密室一個資料夾，資料夾名稱要跟 Supabase `games` 表的 `slug` 一樣：

```
games/
  room-01/
    index.html   ← 遊戲主頁（會被嵌在 game.html 的框框裡）
    images/      ← 密室圖片
```

開放一間密室：到 Supabase → Table Editor → games，把該列的 `status` 改成 `available`，
並可填上 `title`、`description`、`cover_url`（封面圖網址，例如 `games/room-01/images/cover.jpg`）。

遊戲通關時，在遊戲裡執行：

```js
window.parent.postMessage({ type: 'escape-room:cleared' }, '*');
```

想在遊戲裡拿到玩家名稱和外觀：

```js
window.addEventListener('message', (e) => {
  if (e.data?.type === 'escape-room:player') console.log(e.data.player);
});
```
