# 《World of Dungeons: Forever Clicker》自動化打包與遊戲平台上架指南

本專案已內建 GitHub Actions 自動化工作流（`.github/workflows/game-release.yml` 與 `.github/workflows/record-trailer.yml`，採用 Ubuntu 24.04 與 Node.js 22），無需在本地安裝環境即可於雲端完成 `npm run lint`（`tsc --noEmit`）、雙版本打包與實機宣傳影片錄製。

---

## 一、 下載雙平台打包檔（免終端機）

1. 將代碼 Push 到 GitHub 倉庫（`main` 或 `master` 分支）。
2. 打開 GitHub 倉庫的 **Actions** 標籤頁，查看最新的 **Build Game Release & Deploy** 執行結果（也可點擊右側 **Run workflow** 手動觸發）。
3. 在頁尾 **Artifacts** 區塊依目標平台上傳需求下載對應 ZIP：
   - **`game-portal-release.zip`（Y8 / GamePix / itch.io 專用）**：透過 `npm run build` 生成，無任何外部平台 SDK 腳本，純相對路徑 `./` 打包，根目錄即為 `index.html`。
   - **`crazygames-release.zip`（CrazyGames 專用）**：透過 `npm run build:crazygames`（`VITE_PORTAL=crazygames`）編譯至 `dist-cg/`，自動注入 CrazyGames SDK v3 並整合 `init()`、`gameplayStart()`、`gameplayStop()`、`happytime()`、雲端存檔與激勵廣告回呼。

> **本地指令對照（選用）：**
> - `npm run dev`：啟動本地開發伺服器（Port `3000`）。
> - `npm run lint`：執行 TypeScript 型別檢查（`tsc --noEmit`）。
> - `npm run build`：產出通用版 `dist/`。
> - `npm run build:crazygames`：產出 CrazyGames SDK v3 版 `dist-cg/`。

---

## 二、 各大遊戲平台部署方式

### 1. Y8 Games（ZIP 上傳）
1. 下載 `game-portal-release.zip`（確認解壓根目錄即包含 `index.html`）。
2. 登入 Y8 開發者後台並上傳 `game-portal-release.zip`。
3. 如需自動產出符合 Y8 規範的實機截圖與 ≥15 秒無開場黑畫面實機影片，請執行 `.github/workflows/record-trailer.yml` 並下載 **`y8-media-pack`**。

### 2. CrazyGames（建議手動上傳 `crazygames-release.zip`）
1. 下載 `crazygames-release.zip`。
2. 登入 CrazyGames Developer Portal，於遊戲版本管理頁面上傳 ZIP 並使用 **CrazyGames QA Tool** 測試 `gameplayStart` / `gameplayStop` 與激勵廣告流程（2X Damage、Coin Ward、2X Haste、Reclaim 150% Gold、Boss Second Wind、Offline 2x Gold）。
3. > **注意：** `.github/workflows/game-release.yml` 內的 `npx @crazygames/sdk-cli upload` 僅為選用範例（若 `CRAZYGAMES_TOKEN` 未設定會自動跳過）；官方標準流程建議直接於 CrazyGames Developer Portal 上傳 `crazygames-release.zip`。

### 3. GamePix / GitHub Pages（選用自動託管）
1. 若要啟用自動 GitHub Pages 部署，請前往倉庫 **Settings -> Pages** 將 **Build and deployment -> Source** 切換為 **GitHub Actions**。
2. 工作流會在 `check_pages` 步驟自動偵測設定狀態：未啟用 Pages 時會安全跳過 `deploy-pages`（不再報 404 錯誤），同時照常產出 `game-portal-release.zip` 與 `crazygames-release.zip`。
3. 啟用後，每次 Push 會部署至 `https://<你的帳號>.github.io/<專案名>/`，可於 GamePix 後台填入該網址。

---

## 三、 Y8 & CrazyGames 上架合規檢查清單（Deployment Review）

| 檢查項目 | 狀態 | 說明 |
| :--- | :--- | :--- |
| **設定檔與元資料一致** | ✅ 通過 | `metadata.json`、`index.html`、`package.json` 已統一對齊 **World of Dungeons: Forever Clicker** 標題、描述與建置腳本。 |
| **相對路徑與根目錄 `index.html`** | ✅ 通過 | `vite.config.ts` 設定 `base: './'`，兩個 ZIP 根目錄皆為 `index.html`，支援 iframe 子路徑掛載。 |
| **Y8 / CrazyGames 雙包隔離** | ✅ 通過 | Y8 使用 `game-portal-release.zip`（零外部 SDK）；CrazyGames 使用 `crazygames-release.zip`（含 SDK v3）。 |
| **Start Screen 與種族／玩法說明** | ✅ 通過 | 開局標題畫面整合 10 種族／陣營選擇器（開始後鎖定種族與外觀）、`Start Game` / `Continue Quest`、`How to Play`、音效開關與三語切換。 |
| **CrazyGames SDK v3 生命週期** | ✅ 通過 | 實作 `init()`、`gameplayStart()`、`gameplayStop()`（含 Pause 與說明視窗）、`happytime()`、雲端存檔與完整 6 種激勵廣告回呼。 |
| **視窗失焦靜音與防右鍵選單** | ✅ 通過 | 監聽 `visibilitychange` 自動暫停 Web Audio，並停用 `contextmenu` 與方向鍵／空白鍵頁面捲動。 |
| **預錄腳本與封面素材** | ⚠️ 需注意 | `scripts/record-trailer.mjs` 已更新至最新存檔欄位（`raceLocked`、`classAttackLevels`、`classSkillLevels`、`stolenGoldBank`）；但 `src/assets/images/*` 仍保留舊版封面底圖，**上傳至 Y8 / CrazyGames 前請先替換為新版實機封面圖**。 |
| **智慧財產權與命名審查 (IP Check)** | ⚠️ 需注意 | 遊戲主標題為 **World of Dungeons: Forever Clicker**，但部分副本／首領／種族名詞仍具特定奇幻 IP 關聯；若平台商業審查要求，建議改為原創地名與首領名。 |
| **Google Fonts 外部字型載入** | ℹ️ 建議知悉 | `index.html` 引用 `fonts.googleapis.com`；若平台封鎖外部字型請求，CSS 已設定系統無襯線與等寬備援字型，不影響遊玩。 |

---

## 四、 一鍵產出平台宣傳影片與實機截圖

執行 GitHub Actions 中的 **Generate Platform Media Pack (Y8 & CrazyGames)**（`.github/workflows/record-trailer.yml`），可選 `all`、`y8`、`crazygames` 或 `social`：
- `scripts/record-trailer.mjs` 會透過 `?trailer=1` 自動注入已解鎖天裔（高階聖騎士 `paladin` × `skyborne_alliance`）第 15 層存檔並跳過標題畫面，在 `1280×720`、`960×720`、`1920×1080`、`800×1200` 與 `760×570` 視窗中自動點擊怪物、觸發職業專屬普攻／自動倒數技能與主動技能 `1`–`3`，錄製 17–18 秒實機畫面。
- **提醒：** 片頭封面合成使用的底圖來自 `src/assets/images/`，正式投稿 CrazyGames / Y8 前請先替換為對應實機封面圖。
