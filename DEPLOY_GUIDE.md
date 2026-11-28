# 《World of Dungeons: Forever Clicker》自動化打包與遊戲平台上架指南

本專案已內建 GitHub Actions 自動化工作流（`.github/workflows/game-release.yml` 與 `.github/workflows/record-trailer.yml`，採用 Ubuntu 24.04 與 Node.js 22），無需在本地安裝環境即可於雲端完成 `npm run lint`（`tsc --noEmit`）、雙版本打包與實機宣傳影片錄製。

---

## 一、 下載四平台獨立打包檔（免終端機）

1. 將代碼 Push 到 GitHub 倉庫（`main` 或 `master` 分支）。
2. 打開 GitHub 倉庫的 **Actions** 標籤頁，查看最新的 **Build Game Release & Deploy** 執行結果（也可點擊右側 **Run workflow** 手動觸發）。
3. 在頁尾 **Artifacts** 區塊依目標平台上傳需求下載對應 ZIP：
   - **`bountyboard-release.zip`（BountyBoard 專用）**：透過 `npm run build:bountyboard`（`VITE_PORTAL=bountyboard`）編譯至 `dist-bb/`，自動注入 `https://www.bountyboard.gg/arcade-sdk/v1.js`，完整整合 `prepareRewardedAd()` 預載激勵廣告（支援點擊手勢同步顯示）、雲端存檔與 `localStorage` 沙盒墊片、`gameplayStart`/`gameplayStop` 以及 `submitScore`/`gameOver` 排行榜上傳。
   - **`crazygames-release.zip`（CrazyGames 專用）**：透過 `npm run build:crazygames`（`VITE_PORTAL=crazygames`）編譯至 `dist-cg/`，自動注入 CrazyGames SDK v3 並整合 `init()`、`gameplayStart()`、`gameplayStop()`、`happytime()`、雲端存檔、激勵廣告與 AES-GCM 加密排行榜上傳（若設定 `VITE_CG_LEADERBOARD_KEY` Secret）。
   - **`y8-release.zip`（Y8 SDK 排行榜與廣告專用）**：透過 `npm run build:y8`（`VITE_PORTAL=y8`）編譯至 `dist-y8/`，自動注入 `https://cdn.y8.com/minimal-sdk/2-0/y8.min.js`，整合 Y8 排行榜讀寫（需於 Repository Variables/Secrets 設定 `VITE_Y8_APP_ID`，可選 `VITE_Y8_LEADERBOARD_TABLE`）與激勵廣告。
   - **`game-portal-release.zip`（GitHub Pages / GamePix / itch.io 通用無 SDK 版）**：透過 `npm run build` 生成，無任何外部平台 SDK 腳本，純相對路徑 `./` 打包，根目錄即為 `index.html`。

> **本地指令對照（選用）：**
> - `npm run dev`：啟動本地開發伺服器（Port `3000`）。
> - `npm run lint`：執行 TypeScript 型別檢查（`tsc --noEmit`）。
> - `npm run build`：產出通用版 `dist/`。
> - `npm run build:bountyboard`：產出 BountyBoard SDK 版 `dist-bb/`。
> - `npm run build:crazygames`：產出 CrazyGames SDK v3 版 `dist-cg/`。
> - `npm run build:y8`：產出 Y8 Minimal SDK v2 版 `dist-y8/`。

---

## 二、 各大遊戲平台部署方式

### 1. BountyBoard Arcade（`bountyboard-release.zip`）
1. 下載 `bountyboard-release.zip`（確認解壓根目錄即包含 `index.html`，且僅注入 BountyBoard SDK，不含 CrazyGames 腳本）。
2. 於 BountyBoard 後台設定啟用 **Leaderboards** 與 **Rewarded Ads** 並上傳 `bountyboard-release.zip`。
3. 遊戲內排行榜與激勵廣告（`2X Damage`、`Coin Ward`、`2X Haste`、`Reclaim Gold`、`Boss Second Wind`、`Offline 2x`）將自動呼叫 `BBArcade.prepareRewardedAd()` 與 `BBArcade.submitScore()`。

### 2. Y8 Games（`y8-release.zip` 或無 SDK 版 `game-portal-release.zip`）
1. 若需使用 Y8 排行榜與廣告，請於 GitHub Repository Settings -> Secrets and variables -> Actions 設定 `VITE_Y8_APP_ID`（及選用 `VITE_Y8_LEADERBOARD_TABLE`，預設為 `Leaderboard`），下載並上傳 `y8-release.zip`；若不需要平台 SDK 亦可上傳通用版 `game-portal-release.zip`。
2. 如需自動產出符合 Y8 規範的實機截圖與 ≥15 秒無開場黑畫面實機影片，請執行 `.github/workflows/record-trailer.yml` 並下載 **`y8-media-pack`**。

### 3. CrazyGames（建議手動上傳 `crazygames-release.zip`）
1. 如需在 CrazyGames 上傳排行榜分數，請先於 GitHub Repository Secrets 新增 `VITE_CG_LEADERBOARD_KEY`（CrazyGames 後台提供的 Base64 加密金鑰），再重新觸發 Actions 並下載 `crazygames-release.zip`。
2. 登入 CrazyGames Developer Portal，於遊戲版本管理頁面上傳 ZIP 並使用 **CrazyGames QA Tool** 測試 `gameplayStart` / `gameplayStop` 與激勵廣告流程（2X Damage、Coin Ward、2X Haste、Reclaim 150% Gold、Boss Second Wind、Offline 2x Gold）。
3. > **注意：** `.github/workflows/game-release.yml` 內的 `npx @crazygames/sdk-cli upload` 僅為選用範例（若 `CRAZYGAMES_TOKEN` 未設定會自動跳過）；官方標準流程建議直接於 CrazyGames Developer Portal 上傳 `crazygames-release.zip`。

### 4. GamePix / GitHub Pages（選用自動託管）
1. 若要啟用自動 GitHub Pages 部署，請前往倉庫 **Settings -> Pages** 將 **Build and deployment -> Source** 切換為 **GitHub Actions**。
2. 工作流會在 `check_pages` 步驟自動偵測設定狀態：未啟用 Pages 時會安全跳過 `deploy-pages`（不再報 404 錯誤），同時照常產出四種平台 ZIP。
3. 啟用後，每次 Push 會部署至 `https://<你的帳號>.github.io/<專案名>/`，可於 GamePix 後台填入該網址。

---

## 三、 多平台上架合規檢查清單（Deployment Review）

| 檢查項目 | 狀態 | 說明 |
| :--- | :--- | :--- |
| **設定檔與元資料一致** | ✅ 通過 | `metadata.json`、`index.html`、`package.json` 已統一對齊 **World of Dungeons: Forever Clicker** 標題、描述與建置腳本。 |
| **相對路徑與根目錄 `index.html`** | ✅ 通過 | `vite.config.ts` 設定 `base: './'`，所有 ZIP 根目錄皆為 `index.html`，支援 iframe 子路徑掛載。 |
| **四平台 SDK 完全隔離** | ✅ 通過 | `VITE_PORTAL` 隔離 `crazygames`、`bountyboard`、`y8` 與通用無 SDK 版，互不干擾也不會誤載入他方 SDK。 |
| **Start Screen 與種族／玩法說明** | ✅ 通過 | 開局標題畫面整合 10 種族／陣營選擇器（開始後鎖定種族與外觀）、排行榜按鈕、`Start Game` / `Continue Quest`、`How to Play`、音效開關與三語切換。 |
| **CrazyGames / BountyBoard / Y8 SDK 生命週期** | ✅ 通過 | 各自實作專屬 `init()`、遊玩起停、雲端存檔、激勵廣告與排行榜整合。 |
| **視窗失焦靜音與防右鍵選單** | ✅ 通過 | 監聽 `visibilitychange` 自動暫停 Web Audio，並停用 `contextmenu` 與方向鍵／空白鍵頁面捲動。 |
| **預錄腳本與封面素材** | ✅ 通過 | `scripts/record-trailer.mjs` 與 `.github/workflows/record-trailer.yml` 已全面對齊 **World of Dungeons: Forever Clicker**，並於 `src/assets/images/` 採用奇幻風「初階精靈德魯伊 → 鹿角套裝大德魯伊」2D 像素成長封面（16:9、2:3、1:1），同步套用至 Y8 與 CrazyGames 宣傳包。 |
| **視覺與音效品質強化** | ✅ 通過 | 角色與怪物採用 2× EPX 邊緣平滑與立體明暗著色、快取石砌地城背景與動態火把光暈、磁吸金幣飛行、寶箱點擊彩蛋、跨瀏覽器打擊白閃，以及全平台縮放高清晰字體排版。 |
| **智慧財產權與命名審查 (IP Check)** | ✅ 通過 | 已全面將副本、團隊副本、首領、種族與聖物名稱改寫為原創奇幻命名（如 Aetheris Isle、Ashencrown、Arcanum Spire、Worldroot Summit、Obsidian Lair、Heart of the Realm 等），避免商業版權衝突。 |
| **Google Fonts 外部字型載入** | ℹ️ 建議知悉 | `index.html` 引用 `fonts.googleapis.com`；若平台封鎖外部字型請求，CSS 已設定系統無襯線與等寬備援字型，不影響遊玩。 |

---

## 四、 一鍵產出平台宣傳影片與實機截圖

執行 GitHub Actions 中的 **Generate Platform Media Pack (Y8 & CrazyGames)**（`.github/workflows/record-trailer.yml`），可選 `all`、`y8`、`crazygames` 或 `social`：
- `scripts/record-trailer.mjs` 會透過 `?trailer=1` 自動注入已解鎖天裔（高階聖騎士 `paladin` × `skyborne_alliance`）第 15 層存檔並跳過標題畫面，在 `1280×720`、`960×720`、`1920×1080`、`800×1200` 與 `760×570` 視窗中自動點擊怪物、觸發職業專屬普攻／自動倒數技能與主動技能 `1`–`3`，錄製 17–18 秒實機畫面。
- **說明：** 片頭封面與平台宣傳圖（Y8 `1920×1080`、`1080×1920`、`760×570` 與 CrazyGames `1920×1080`、`800×1200`、`800×800`）皆直接由 `src/assets/images/` 內的新版 2D 像素地城進化封面自動裁切生成。
