import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const TARGET_URL = process.env.TRAILER_URL || 'http://127.0.0.1:4173/?trailer=1';
const OUTPUT_DIR = path.resolve(process.cwd(), 'media-output');
const PLATFORM = (process.env.MEDIA_PLATFORM || 'all').toLowerCase(); // 'y8' | 'crazygames' | 'social' | 'all'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const VIDEO_SPECS = {
  y8_16x9: {
    platform: 'y8',
    width: 1280,
    height: 720,
    filename: 'y8-video-16x9-1280x720.webm',
    screenshots: [
      { name: 'y8-screenshot-widescreen-1-1280x720.png', atStep: 'normal' },
      { name: 'y8-screenshot-widescreen-2-1280x720.png', atStep: 'fever' },
    ],
  },
  y8_4x3: {
    platform: 'y8',
    width: 960,
    height: 720,
    filename: 'y8-video-4x3-960x720.webm',
    screenshots: [],
  },
  cg_landscape: {
    platform: 'crazygames',
    width: 1920,
    height: 1080,
    filename: 'crazygames-video-landscape-1920x1080-raw.webm',
    screenshots: [],
  },
  cg_portrait: {
    platform: 'crazygames',
    width: 800,
    height: 1200,
    filename: 'crazygames-video-portrait-800x1200-raw.webm',
    screenshots: [],
  },
  social_9x16: {
    platform: 'social',
    width: 720,
    height: 1280,
    filename: 'social-shorts-9x16-720x1280.webm',
    screenshots: [],
  },
};

function getTargets() {
  if (PLATFORM === 'all') return Object.keys(VIDEO_SPECS);
  return Object.keys(VIDEO_SPECS).filter((k) => VIDEO_SPECS[k].platform === PLATFORM);
}

async function createSeededContext(browser, width, height, videoDir) {
  const options = {
    viewport: { width, height },
    deviceScaleFactor: 1,
  };
  if (videoDir) {
    options.recordVideo = {
      dir: videoDir,
      size: { width, height },
    };
  }
  const context = await browser.newContext(options);
  const page = await context.newPage();

  await page.addInitScript(() => {
    const seedSave = {
      gold: 4850,
      lifetimeGold: 28500,
      stolenGoldBank: 0,
      floor: 15,
      maxFloor: 15,
      killsOnFloor: 4,
      totalKills: 94,
      raresSlain: 4,
      bossesSlain: 2,
      totalClicks: 65,
      totalCrits: 14,
      soulShards: 6,
      emblems: 1,
      ascensionCount: 0,
      activeHero: 'paladin',
      activeRace: 'skyborne_alliance',
      raceLocked: true,
      unlockedHeroes: ['warrior', 'hunter', 'priest', 'mage', 'rogue', 'shaman', 'paladin'],
      heroRanks: {
        warrior: 3,
        paladin: 2,
        hunter: 2,
        rogue: 1,
        priest: 2,
        shaman: 2,
        mage: 2,
        warlock: 1,
        druid: 1,
      },
      classAttackLevels: {
        warrior: 8,
        paladin: 16,
        hunter: 4,
        rogue: 2,
        priest: 4,
        shaman: 4,
        mage: 5,
        warlock: 1,
        druid: 1,
      },
      classSkillLevels: {
        heroic_strike: 6,
        whirlwind: 5,
        aimed_shot: 3,
        multi_shot: 3,
        holy_fire: 4,
        shadow_nova: 4,
        frostbolt: 4,
        arcane_barrage: 4,
        sinister_strike: 2,
        fan_knives: 2,
        chain_lightning: 4,
        lava_burst: 4,
        crusader_strike: 12,
        consecration: 11,
      },
      upgrades: {
        fury: 3,
        greed: 3,
        crit_luck: 5,
        titan_grip: 1,
      },
      skillLevels: {
        frenzy: 2,
        gold_rush: 2,
        smite: 2,
      },
      relics: { warchief_totem: 1 },
      claimedQuests: ['first_blood'],
      lastSavedAt: Date.now(),
    };
    localStorage.setItem('wow_forever_dungeon_clicker_v2', JSON.stringify(seedSave));
  });

  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  await sleep(300);
  return { context, page };
}

async function recordSpec(browser, specKey) {
  const spec = VIDEO_SPECS[specKey];
  const rawDir = path.join(OUTPUT_DIR, 'raw', specKey);
  const platformDir = path.join(OUTPUT_DIR, spec.platform);
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(platformDir, { recursive: true });

  const { context, page } = await createSeededContext(browser, spec.width, spec.height, rawDir);

  const isWideSide = spec.width >= 860 && spec.width >= spec.height * 0.95;
  const isMobileLandscape = spec.width < 860 && spec.height < 520 && spec.width > spec.height * 1.2;
  const isSide = isWideSide || isMobileLandscape;
  const dockW = isSide
    ? isMobileLandscape
      ? Math.min(320, Math.max(250, Math.round(spec.width * 0.44)))
      : spec.width >= 1120
      ? 430
      : spec.width >= 960
      ? 390
      : 350
    : spec.width;
  const arenaW = isSide ? Math.max(280, spec.width - dockW) : spec.width;
  const arenaH = isSide ? spec.height : Math.round(spec.height * 0.52);
  const enemyX = Math.round(arenaW * 0.67);
  const enemyY = Math.round(arenaH * 0.71);

  // Phase 1 (~7.5s): Active dungeon clicks + Space strikes
  for (let i = 0; i < 62; i++) {
    if (i % 2 === 0) {
      await page.mouse.click(enemyX + (Math.random() - 0.5) * 40, enemyY + (Math.random() - 0.5) * 24);
    } else {
      await page.keyboard.press('Space');
    }
    if (i === 48) {
      const normalShot = spec.screenshots.find((s) => s.atStep === 'normal');
      if (normalShot) {
        await page.screenshot({ path: path.join(platformDir, normalShot.name) });
      }
    }
    await sleep(115);
  }

  // Phase 2 (~10.5s): Trigger Bloodlust (1), Gold Rush (2), and Lightning Smite (3)
  await page.keyboard.press('1');
  await sleep(120);
  await page.keyboard.press('2');
  await sleep(120);
  await page.keyboard.press('3');
  await sleep(150);

  for (let i = 0; i < 84; i++) {
    if (i % 2 === 0) {
      await page.mouse.click(enemyX + (Math.random() - 0.5) * 50, enemyY + (Math.random() - 0.5) * 28);
    } else {
      await page.keyboard.press('Space');
    }
    if (i === 36) {
      const feverShot = spec.screenshots.find((s) => s.atStep === 'fever');
      if (feverShot) {
        await page.screenshot({ path: path.join(platformDir, feverShot.name) });
      }
    }
    await sleep(115);
  }

  const video = page.video();
  await context.close();

  const recordedPath = await video.path();
  const finalRawPath = path.join(OUTPUT_DIR, 'raw', spec.filename);
  fs.copyFileSync(recordedPath, finalRawPath);
  fs.rmSync(rawDir, { recursive: true, force: true });
  console.log(`Recorded ${specKey} -> ${finalRawPath}`);
}

async function captureY8StandardScreenshot(browser) {
  const y8Dir = path.join(OUTPUT_DIR, 'y8');
  fs.mkdirSync(y8Dir, { recursive: true });
  const { context, page } = await createSeededContext(browser, 760, 570, null);
  const arenaW = 760;
  const arenaH = Math.round(570 * 0.52);
  const enemyX = Math.round(arenaW * 0.67);
  const enemyY = Math.round(arenaH * 0.71);
  await page.keyboard.press('1');
  for (let i = 0; i < 8; i++) {
    await page.mouse.click(enemyX, enemyY);
    await sleep(90);
  }
  await page.screenshot({ path: path.join(y8Dir, 'y8-screenshot-standard-760x570.png') });
  await context.close();
  console.log('Captured Y8 standard 760x570 screenshot');
}

async function main() {
  fs.mkdirSync(path.join(OUTPUT_DIR, 'raw'), { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const targets = getTargets();
    for (const key of targets) {
      await recordSpec(browser, key);
    }
    if (PLATFORM === 'all' || PLATFORM === 'y8') {
      await captureY8StandardScreenshot(browser);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Media generation failed:', err);
  process.exit(1);
});
