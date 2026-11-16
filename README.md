# World of Dungeons: Forever Clicker | 地下城世界：永恆點擊 | 地下城世界：永恒点击

A crisp 2D pixel-art RPG dungeon clicker featuring **9 playable classes**, **9 playable races** (including dual-faction Skyborne), **9 dungeons**, **3 launch raids**, **Rare & Rare Elite spawns**, active skills, **Soul Forge Relics**, and **Spirit Ascension** prestige progression.

---

## 1. Portal Submission Copy (Copy-Paste Ready)

### English (EN)
- **Game Name:** World of Dungeons: Forever Clicker
- **Category / Genre:** Idle / Clicker / RPG / Dungeon Crawler / Pixel Art
- **Tags:** `clicker`, `idle`, `rpg`, `dungeon`, `pixel-art`, `incremental`, `fantasy`, `html5`
- **Short Description (Tagline):**
  > Lead 9 classes and 9 races through 13 dungeons and raids in crisp 2D pixel art—tap to strike, hunt Rare Elites, cast skills, and ascend for permanent Heroic Emblems!
- **Full Description (Player-Facing):**
  > Assemble your dungeon party and battle through endless pixel-art corridors in **World of Dungeons: Forever Clicker**!
  >
  > **Key Features:**
  > - **9 Playable Classes & 9 Races:** Unlock Warrior, Hunter, Priest, Mage, Rogue, Shaman, Paladin, Druid, and Warlock. Pair your hero with 9 races (including dual-faction Skyborne: High Order & Windshaper) for authentic class combinations and racial bonuses.
  > - **13 Dungeon & Raid Zones:** Progress from Zephras Isle through 9 distinct dungeons (Hall of Thanes, Ruins of Lordaeron, Excavation Site, City of Dalaran, The Drowned City, Krol'dok Stronghold, Alcaz Island Prison, Blackmaw Hold, Shaper's Terrace) and 3 endgame raids (The Barrow Deeps, Hyjal Summit, Onyxia's Lair).
  > - **Rare & Rare Elite Hunts:** Spot silver-ringed Rares and violet-ringed Rare Elites for bonus Gold and Soul Shards.
  > - **Active Skills & Upgrades:** Level 6 core stat upgrades (`x1`, `x10`, `MAX` bulk buy with 25-level milestones) and trigger **Bloodlust** (`1`), **Gold Rush** (`2`), and **Lightning Smite** (`3`).
  > - **Soul Forge & Spirit Ascension:** Spend Soul Shards on permanent Relics and ascend at Floor 10+ for Heroic Emblems (+25% Damage and +15% Gold each).
  > - **Offline Raid Loot:** Your heroes keep fighting while you're away (up to 8 hours).

### 繁體中文 (TC)
- **遊戲名稱：** 地下城世界：永恆點擊 (World of Dungeons: Forever Clicker)
- **遊戲分類：** 放置 / 點擊 / 角色扮演 / 像素地城
- **標籤：** `放置點擊`, `地城RPG`, `像素風`, `數值成長`, `H5小遊戲`
- **一句話簡介：**
  > 率領 9 大職業與 9 大種族征戰 9 座地下城與 3 大團隊副本！點擊攻擊、狩獵稀有精英、施放主動技能與靈魂飛昇！
- **詳細介紹（玩家向）：**
  > 在 2D 像素風地下城中召集英雄小隊，一路突破永無止境的怪物與史詩首領！
  >
  > **遊戲特色：**
  > - **9 大職業 × 9 大種族：** 解鎖戰士、獵人、牧師、法師、盜賊、薩滿、聖騎士、德魯伊與術士，自由切換種族天賦（含聯盟／部落雙陣營天裔）。
  > - **13 座地下城與團隊副本：** 從澤弗拉斯之島出發，推進 9 座全新副本並挑戰《獸穴深處》、《海加爾山巔》與《奧妮克希亞巢穴》。
  > - **稀有與稀有精英：** 銀色／金色光環怪物掉落大量金幣與靈魂碎片。
  > - **主動技能與飛昇系統：** 施放嗜血狂熱、點金時刻與雷霆聖擊，並於第 10 層起透過靈魂飛昇獲取永久英雄徽記。

### 简体中文 (SC)
- **游戏名称：** 地下城世界：永恒点击 (World of Dungeons: Forever Clicker)
- **游戏分类：** 放置 / 点击 / 角色扮演 / 像素地城
- **标签：** `放置点击`, `地城RPG`, `像素风`, `数值成长`, `H5小游戏`
- **一句话简介：**
  > 率领 9 大职业与 9 大种族征战 9 座地下城与 3 大团队副本！点击攻击、狩猎稀有精英、施放主动技能与灵魂飞升！

---

## 2. How to Play & Controls (EN / 繁體中文 / 简体中文)

| Action / 操作 | Desktop / 電腦版 | Mobile / 手機觸控 |
| :--- | :--- | :--- |
| **Attack Enemies / 攻擊敵人** | Click enemy or press `Space` / 點擊怪物或按空白鍵 | Tap enemy / 點擊場上怪物 |
| **Cast Skills / 施放技能** | Press `1`, `2`, `3` or click hotbar / 按 `1`–`3` 或點擊圖示 | Tap skill button / 點擊圓形技能鈕 |
| **Upgrades & Party / 升級與職業** | Use the right dock tabs (`Upgrades`, `Heroes`, `Skills`, `Quests`, `Relics`, `Ascension`) | Tap bottom dock tabs |
| **Start / Pause / 開始與暫停** | `Enter` / `Space` on Title · `Esc` or Gear icon / 按 `Esc` 或齒輪圖示 | Tap `Start Game` / Gear icon |

---

## 3. Core Mechanics & Progression (`src/game/constants.ts`)

- **6 Core Upgrades:** Runed Blade (Tap), Auto Strike (DPS), Blood Fury (All Damage), Goblin Greed (Gold), Deadly Precision (Crit Chance), Titan's Might (Hybrid Tap + DPS), with `2x` milestone multipliers every 25 levels.
- **9 Playable Classes & 9 Races:** Each unlocked class upgrades with Gold and projects a rank-scaled combat aura while active; Races restrict valid class pairings and add passive traits (e.g., Diplomacy, Stoneform, Quickness, Windshaper Gale).
- **Floor & Boss Loop:** 10 enemies per standard floor; every 5th floor spawns a timed Boss (`30s` base timer + Heart of Azeroth bonus) dropping Soul Shards. Standard floors have a 14% chance to spawn named **Rare** or **Rare Elite** encounters (`+4x` Gold + `1` Soul Shard).
- **3 Active Skills:** Bloodlust (`1`, floor 5), Gold Rush (`2`, floor 15), Lightning Smite (`3`, floor 25).
- **5 Soul Forge Relics:** Warchief's Totem, Gadgetzan Coin, Frostblade Shard, Kirin Tor Crystal, Heart of Azeroth.
- **Spirit Ascension:** Available from Floor 10+, converting run progress into permanent Heroic Emblems (`+25%` Damage and `+15%` Gold per emblem) while preserving Classes, Races, Relics, Soul Shards, and Quests.

---

## 4. Technical Spec

- **Frontend Stack:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite 8 (`base: './'` for portable relative-path portal bundles).
- **Render Loop:** 60fps `requestAnimationFrame` `<canvas>` with clamped delta time (`Math.min(rawDt, 0.05)`), DPR scaling, pre-baked offscreen 16×16 pixel sprites (`imageSmoothingEnabled = false`), and pooled particles/floating text.
- **Audio:** Procedural Web Audio API synthesizer (`src/audio/synth.ts`) with mute toggle and automatic tab-visibility / ad pause handling.
- **Persistence:** `localStorage` (`wow_forever_dungeon_clicker_v2`) + CrazyGames Cloud Data sync (`src/sdk/crazygames.ts`), auto-saved every 5 seconds.
- **Portal Build Splitting (`vite.config.ts`):**
  - Generic build (`npm run build`): zero external SDK scripts (`game-portal-release.zip` for Y8, GamePix, itch.io).
  - CrazyGames build (`VITE_PORTAL=crazygames npx vite build`): injects `https://sdk.crazygames.com/crazygames-sdk-v3.js` (`crazygames-release.zip`).

---

## 5. Automated Build & Deployment Guide

See `DEPLOY_GUIDE.md` for step-by-step instructions on GitHub Actions (`game-release.yml` & `record-trailer.yml`) and the Y8 / CrazyGames technical compliance checklist.
