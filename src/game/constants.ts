import {
  BuyAmount,
  DungeonZone,
  HeroDef,
  HeroId,
  Locale,
  QuestDef,
  RaceDef,
  RaceId,
  RelicDef,
  SaveState,
  SkillDef,
  SkillId,
  UpgradeDef,
} from './types';

export const SAVE_KEY = 'wow_forever_dungeon_clicker_v2';
export const LOCALE_STORAGE_KEY = 'azeroth_dungeon_clicker_locale';
export const MONSTERS_PER_FLOOR = 10;
export const BOSS_TIMER_SEC = 30;
export const DAMAGE_BOOST_DURATION_SEC = 300;
export const ASCENSION_MIN_FLOOR = 10;
export const EMBLEM_DMG_BONUS = 0.25;
export const EMBLEM_GOLD_BONUS = 0.15;

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'sharp_blade',
    icon: 'sword',
    name: { en: 'Runed Blade', 'zh-TW': '符文利刃', 'zh-CN': '符文利刃' },
    baseCost: 10,
    costMultiplier: 1.15,
    kind: 'tap',
    baseValue: 1.6,
    hasMilestone25: true,
    accent: '#38bdf8',
  },
  {
    id: 'auto_attack',
    icon: 'auto',
    name: { en: 'Auto Strike', 'zh-TW': '自動連擊', 'zh-CN': '自动连击' },
    baseCost: 45,
    costMultiplier: 1.16,
    kind: 'dps',
    baseValue: 4,
    hasMilestone25: true,
    accent: '#60a5fa',
  },
  {
    id: 'fury',
    icon: 'fury',
    name: { en: 'Blood Fury', 'zh-TW': '嗜血狂怒', 'zh-CN': '嗜血狂怒' },
    baseCost: 450,
    costMultiplier: 1.38,
    kind: 'allDmg',
    baseValue: 0.25,
    accent: '#f97316',
  },
  {
    id: 'greed',
    icon: 'greed',
    name: { en: 'Goblin Greed', 'zh-TW': '地精貪婪', 'zh-CN': '地精贪婪' },
    baseCost: 220,
    costMultiplier: 1.35,
    kind: 'gold',
    baseValue: 0.25,
    accent: '#facc15',
  },
  {
    id: 'crit_luck',
    icon: 'clover',
    name: { en: 'Deadly Precision', 'zh-TW': '致命精準', 'zh-CN': '致命精准' },
    baseCost: 140,
    costMultiplier: 1.32,
    kind: 'crit',
    baseValue: 0.03,
    accent: '#4ade80',
  },
  {
    id: 'titan_grip',
    icon: 'titan',
    name: { en: "Titan's Might", 'zh-TW': '泰坦之力', 'zh-CN': '泰坦之力' },
    baseCost: 3200,
    costMultiplier: 1.18,
    kind: 'hybrid',
    baseValue: 35,
    hasMilestone25: true,
    accent: '#c084fc',
  },
];

// All 9 Races (10 Faction identities including Dual-Faction Skyborne) from WoW: Forever
export const RACES: RaceDef[] = [
  {
    id: 'human',
    name: { en: 'Human', 'zh-TW': '人類', 'zh-CN': '人类' },
    faction: 'Alliance',
    classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'mage', 'warlock'],
    newClassesInForever: ['hunter'],
    traitName: { en: 'Diplomacy', 'zh-TW': '外交官', 'zh-CN': '外交官' },
    traitDesc: { en: '+15% Gold & +8% All Dmg', 'zh-TW': '+15% 金幣與 +8% 傷害', 'zh-CN': '+15% 金币与 +8% 伤害' },
    bonus: { gold: 0.15, allDmg: 0.08 },
  },
  {
    id: 'dwarf',
    name: { en: 'Dwarf', 'zh-TW': '矮人', 'zh-CN': '矮人' },
    faction: 'Alliance',
    classes: ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman'],
    newClassesInForever: ['shaman'],
    traitName: { en: 'Stoneform', 'zh-TW': '石像形態', 'zh-CN': '石像形态' },
    traitDesc: { en: '+25% Boss Damage', 'zh-TW': '+25% 首領傷害', 'zh-CN': '+25% 首领伤害' },
    bonus: { bossDmg: 0.25 },
  },
  {
    id: 'night_elf',
    name: { en: 'Night Elf', 'zh-TW': '夜精靈', 'zh-CN': '暗夜精灵' },
    faction: 'Alliance',
    classes: ['warrior', 'hunter', 'rogue', 'priest', 'druid'],
    newClassesInForever: [],
    traitName: { en: 'Quickness', 'zh-TW': '迅捷', 'zh-CN': '迅捷' },
    traitDesc: { en: '+6% Crit Chance', 'zh-TW': '+6% 暴擊率', 'zh-CN': '+6% 暴击率' },
    bonus: { critChance: 0.06 },
  },
  {
    id: 'gnome',
    name: { en: 'Gnome', 'zh-TW': '地精', 'zh-CN': '侏儒' },
    faction: 'Alliance',
    classes: ['warrior', 'rogue', 'priest', 'mage', 'warlock'],
    newClassesInForever: ['priest'],
    traitName: { en: 'Expansive Mind', 'zh-TW': '開闊思維', 'zh-CN': '开阔思维' },
    traitDesc: { en: '+20% Auto DPS', 'zh-TW': '+20% 自動傷害', 'zh-CN': '+20% 自动伤害' },
    bonus: { dps: 0.2 },
  },
  {
    id: 'skyborne_alliance',
    name: { en: 'Skyborne (High Order)', 'zh-TW': '天裔 (崇高議會)', 'zh-CN': '天裔 (崇高议会)' },
    faction: 'Alliance',
    classes: ['warrior', 'hunter', 'rogue', 'mage', 'druid'],
    newClassesInForever: ['warrior', 'hunter', 'rogue', 'mage', 'druid'],
    traitName: { en: 'Zephyr Ascent', 'zh-TW': '微風飛昇', 'zh-CN': '微风飞升' },
    traitDesc: { en: '+14% All Damage', 'zh-TW': '+14% 全體傷害', 'zh-CN': '+14% 全体伤害' },
    bonus: { allDmg: 0.14 },
  },
  {
    id: 'orc',
    name: { en: 'Orc', 'zh-TW': '獸人', 'zh-CN': '兽人' },
    faction: 'Horde',
    classes: ['warrior', 'hunter', 'rogue', 'shaman', 'mage', 'warlock'],
    newClassesInForever: ['mage'],
    traitName: { en: 'Blood Fury', 'zh-TW': '血性狂怒', 'zh-CN': '血性狂怒' },
    traitDesc: { en: '+22% Tap Damage', 'zh-TW': '+22% 點擊傷害', 'zh-CN': '+22% 点击伤害' },
    bonus: { tapDmg: 0.22 },
  },
  {
    id: 'undead',
    name: { en: 'Undead (Forsaken)', 'zh-TW': '不死族 (被遺忘者)', 'zh-CN': '亡灵 (被遗忘者)' },
    faction: 'Horde',
    classes: ['warrior', 'paladin', 'rogue', 'priest', 'mage', 'warlock'],
    newClassesInForever: ['paladin'],
    traitName: { en: 'Will of Forsaken', 'zh-TW': '亡靈意志', 'zh-CN': '亡灵意志' },
    traitDesc: { en: '+12% All Dmg & +10% Gold', 'zh-TW': '+12% 傷害與 +10% 金幣', 'zh-CN': '+12% 伤害与 +10% 金币' },
    bonus: { allDmg: 0.12, gold: 0.1 },
  },
  {
    id: 'tauren',
    name: { en: 'Tauren', 'zh-TW': '牛頭人', 'zh-CN': '牛头人' },
    faction: 'Horde',
    classes: ['warrior', 'hunter', 'shaman', 'druid'],
    newClassesInForever: [],
    traitName: { en: 'Brawn', 'zh-TW': '蠻力', 'zh-CN': '蛮力' },
    traitDesc: { en: '+50% Crit Damage', 'zh-TW': '+50% 暴擊傷害', 'zh-CN': '+50% 暴击伤害' },
    bonus: { critDmg: 0.5 },
  },
  {
    id: 'troll',
    name: { en: 'Troll', 'zh-TW': '食人妖', 'zh-CN': '巨魔' },
    faction: 'Horde',
    classes: ['warrior', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock'],
    newClassesInForever: ['warlock'],
    traitName: { en: 'Berserking', 'zh-TW': '狂暴', 'zh-CN': '狂暴' },
    traitDesc: { en: '+12% Tap & +12% DPS', 'zh-TW': '+12% 點擊與秒傷', 'zh-CN': '+12% 点击与秒伤' },
    bonus: { tapDmg: 0.12, dps: 0.12 },
  },
  {
    id: 'skyborne_horde',
    name: { en: 'Skyborne (Windshaper)', 'zh-TW': '天裔 (馭風者)', 'zh-CN': '天裔 (驭风者)' },
    faction: 'Horde',
    classes: ['warrior', 'hunter', 'rogue', 'shaman', 'druid'],
    newClassesInForever: ['warrior', 'hunter', 'rogue', 'shaman', 'druid'],
    traitName: { en: 'Gale Blessing', 'zh-TW': '疾風祝福', 'zh-CN': '疾风祝福' },
    traitDesc: { en: '+15% Gold & +4% Crit', 'zh-TW': '+15% 金幣與 +4% 暴擊', 'zh-CN': '+15% 金币与 +4% 暴击' },
    bonus: { gold: 0.15, critChance: 0.04 },
  },
];

// All 9 Playable Classes from WoW: Forever
export const HEROES: HeroDef[] = [
  {
    id: 'warrior',
    name: { en: 'Warrior', 'zh-TW': '戰士', 'zh-CN': '战士' },
    title: { en: 'Vanguard Blade', 'zh-TW': '先鋒劍士', 'zh-CN': '先锋剑士' },
    defaultRace: 'human',
    bonusLabel: (rank, locale) => {
      const pct = 30 + (rank - 1) * 15;
      if (locale === 'zh-TW') return `+${pct}% 點擊傷害`;
      if (locale === 'zh-CN') return `+${pct}% 点击伤害`;
      return `+${pct}% tap damage`;
    },
    unlockCost: 0,
    upgradeBaseCost: 80,
    upgradeMultiplier: 1.55,
    accent: '#c79c6e',
    projectileColor: '#e2e8f0',
  },
  {
    id: 'hunter',
    name: { en: 'Hunter', 'zh-TW': '獵人', 'zh-CN': '猎人' },
    title: { en: 'Zephras Marksman', 'zh-TW': '風嶼神射手', 'zh-CN': '风屿神射手' },
    defaultRace: 'skyborne_alliance',
    bonusLabel: (rank, locale) => {
      const pct = 10 + (rank - 1) * 2;
      if (locale === 'zh-TW') return `+${pct}% 暴擊率`;
      if (locale === 'zh-CN') return `+${pct}% 暴击率`;
      return `+${pct}% crit chance`;
    },
    unlockCost: 160,
    upgradeBaseCost: 200,
    upgradeMultiplier: 1.6,
    accent: '#abd473',
    projectileColor: '#86efac',
  },
  {
    id: 'priest',
    name: { en: 'Priest', 'zh-TW': '牧師', 'zh-CN': '牧师' },
    title: { en: 'Light & Shadow Cleric', 'zh-TW': '聖光暗影祭司', 'zh-CN': '圣光暗影牧师' },
    defaultRace: 'dwarf',
    bonusLabel: (rank, locale) => {
      const pct = 45 + (rank - 1) * 25;
      if (locale === 'zh-TW') return `+${pct}% 首領傷害`;
      if (locale === 'zh-CN') return `+${pct}% 首领伤害`;
      return `+${pct}% boss damage`;
    },
    unlockCost: 480,
    upgradeBaseCost: 420,
    upgradeMultiplier: 1.6,
    accent: '#f8fafc',
    projectileColor: '#fef08a',
  },
  {
    id: 'mage',
    name: { en: 'Mage', 'zh-TW': '法師', 'zh-CN': '法师' },
    title: { en: 'Dalaran Arcanist', 'zh-TW': '達拉然奧術師', 'zh-CN': '达拉然奥术师' },
    defaultRace: 'gnome',
    bonusLabel: (rank, locale) => {
      const pct = 60 + (rank - 1) * 30;
      if (locale === 'zh-TW') return `+${pct}% 自動傷害`;
      if (locale === 'zh-CN') return `+${pct}% 自动伤害`;
      return `+${pct}% auto damage`;
    },
    unlockCost: 1400,
    upgradeBaseCost: 1000,
    upgradeMultiplier: 1.6,
    accent: '#69ccf0',
    projectileColor: '#7dd3fc',
  },
  {
    id: 'rogue',
    name: { en: 'Rogue', 'zh-TW': '盜賊', 'zh-CN': '潜行者' },
    title: { en: 'Ravenholdt Assassin', 'zh-TW': '拉文霍德刺客', 'zh-CN': '拉文霍德刺客' },
    defaultRace: 'night_elf',
    bonusLabel: (rank, locale) => {
      const pct = 60 + (rank - 1) * 25;
      if (locale === 'zh-TW') return `+${pct}% 金幣掉落`;
      if (locale === 'zh-CN') return `+${pct}% 金币掉落`;
      return `+${pct}% gold drops`;
    },
    unlockCost: 4200,
    upgradeBaseCost: 2800,
    upgradeMultiplier: 1.65,
    accent: '#fff569',
    projectileColor: '#fda4af',
  },
  {
    id: 'shaman',
    name: { en: 'Shaman', 'zh-TW': '薩滿', 'zh-CN': '萨满祭司' },
    title: { en: 'Windshaper Stormcaller', 'zh-TW': '馭風喚雷者', 'zh-CN': '驭风唤雷者' },
    defaultRace: 'skyborne_horde',
    bonusLabel: (rank, locale) => {
      const pct = 50 + (rank - 1) * 25;
      if (locale === 'zh-TW') return `+${pct}% 點擊與自動`;
      if (locale === 'zh-CN') return `+${pct}% 点击与自动`;
      return `+${pct}% tap & auto`;
    },
    unlockCost: 12500,
    upgradeBaseCost: 8200,
    upgradeMultiplier: 1.65,
    accent: '#0070de',
    projectileColor: '#38bdf8',
  },
  {
    id: 'paladin',
    name: { en: 'Paladin', 'zh-TW': '聖騎士', 'zh-CN': '圣骑士' },
    title: { en: 'Forsaken Crusader', 'zh-TW': '永恆十字軍', 'zh-CN': '永恒十字军' },
    defaultRace: 'undead',
    bonusLabel: (rank, locale) => {
      const pct = 75 + (rank - 1) * 35;
      if (locale === 'zh-TW') return `+${pct}% 全體傷害`;
      if (locale === 'zh-CN') return `+${pct}% 全体伤害`;
      return `+${pct}% all damage`;
    },
    unlockCost: 36000,
    upgradeBaseCost: 22000,
    upgradeMultiplier: 1.7,
    accent: '#f58cba',
    projectileColor: '#fde047',
  },
  {
    id: 'druid',
    name: { en: 'Druid', 'zh-TW': '德魯伊', 'zh-CN': '德鲁伊' },
    title: { en: 'Hyjal Moonkeeper', 'zh-TW': '海加爾月光守衛', 'zh-CN': '海加尔月光守卫' },
    defaultRace: 'tauren',
    bonusLabel: (rank, locale) => {
      const pct = 85 + (rank - 1) * 35;
      if (locale === 'zh-TW') return `+${pct}% 傷害與金幣`;
      if (locale === 'zh-CN') return `+${pct}% 伤害与金币`;
      return `+${pct}% dmg & gold`;
    },
    unlockCost: 95000,
    upgradeBaseCost: 58000,
    upgradeMultiplier: 1.72,
    accent: '#ff7d0a',
    projectileColor: '#4ade80',
  },
  {
    id: 'warlock',
    name: { en: 'Warlock', 'zh-TW': '術士', 'zh-CN': '术士' },
    title: { en: 'Fel Harvest Master', 'zh-TW': '黑鐮邪能領主', 'zh-CN': '黑镰邪能领主' },
    defaultRace: 'troll',
    bonusLabel: (rank, locale) => {
      const pct = 120 + (rank - 1) * 45;
      if (locale === 'zh-TW') return `+${pct}% 暴擊與技能`;
      if (locale === 'zh-CN') return `+${pct}% 暴击与技能`;
      return `+${pct}% crit & skills`;
    },
    unlockCost: 260000,
    upgradeBaseCost: 145000,
    upgradeMultiplier: 1.75,
    accent: '#9482c9',
    projectileColor: '#4ade80',
  },
];

export const SKILLS: SkillDef[] = [
  {
    id: 'frenzy',
    hotkey: '1',
    name: { en: 'Bloodlust', 'zh-TW': '嗜血狂暴', 'zh-CN': '嗜血狂暴' },
    description: {
      en: 'Your taps strike much harder for a while',
      'zh-TW': '短時間內大幅提升點擊傷害',
      'zh-CN': '短时间内大幅提升点击伤害',
    },
    unlockFloor: 3,
    baseCost: 250,
    costMultiplier: 2.2,
    maxLevel: 10,
    cooldownSec: 45,
    baseDurationSec: 10,
    basePower: 3,
    accent: '#f97316',
  },
  {
    id: 'gold_rush',
    hotkey: '2',
    name: { en: 'Gold Rush', 'zh-TW': '淘金狂潮', 'zh-CN': '淘金狂潮' },
    description: {
      en: 'Every monster drops extra gold for a while',
      'zh-TW': '期間內所有怪物掉落更多金幣',
      'zh-CN': '期间内所有怪物掉落更多金币',
    },
    unlockFloor: 6,
    baseCost: 1500,
    costMultiplier: 2.35,
    maxLevel: 10,
    cooldownSec: 75,
    baseDurationSec: 18,
    basePower: 2.5,
    accent: '#facc15',
  },
  {
    id: 'smite',
    hotkey: '3',
    name: { en: 'Arcane Smite', 'zh-TW': '奧術天罰', 'zh-CN': '奥术天罚' },
    description: {
      en: 'Unleash lightning on all dungeon foes',
      'zh-TW': '召喚奧術閃電重創場上所有敵人',
      'zh-CN': '召唤奥术闪电重创场上所有敌人',
    },
    unlockFloor: 10,
    baseCost: 6000,
    costMultiplier: 2.5,
    maxLevel: 10,
    cooldownSec: 35,
    baseDurationSec: 0,
    basePower: 28,
    accent: '#38bdf8',
  },
];

// Zephras Isle + All 9 New WoW: Forever Dungeons + All 3 Launch Raids!
export const DUNGEON_ZONES: DungeonZone[] = [
  {
    index: 0,
    kind: 'zone',
    levelRange: 'Lv 1–13',
    name: { en: 'Zephras Isle', 'zh-TW': '澤弗拉斯之島', 'zh-CN': '泽弗拉斯之岛' },
    wallColor: '#1a2736',
    wallTrim: '#2d4761',
    floorColor: '#25332b',
    floorAccent: '#384f41',
    bannerColor: '#0284c7',
    torchColor: '#38bdf8',
    enemies: [
      { id: 'mystmane', spriteId: 'beast_wolf', name: { en: 'Mystmane Stalker', 'zh-TW': '秘鬃潛獵獸', 'zh-CN': '秘鬃潜猎兽' } },
      { id: 'slydris', spriteId: 'murloc', name: { en: 'Slydris Serpent', 'zh-TW': '斯萊德里斯鱗蛇', 'zh-CN': '斯莱德里斯鳞蛇' } },
      { id: 'galestrider', spriteId: 'wyrmling', name: { en: 'Ornery Galestrider', 'zh-TW': '暴躁疾風陸行鳥', 'zh-CN': '暴躁疾风陆行鸟' } },
    ],
    rares: [
      { id: 'fernfeather', spriteId: 'wyrmling', name: { en: 'Fernfeather', 'zh-TW': '蕨羽神鳥', 'zh-CN': '蕨羽神鸟' }, tier: 'rare' },
      { id: 'prideclaw', spriteId: 'beast_wolf', name: { en: 'Prideclaw', 'zh-TW': '傲爪獸王', 'zh-CN': '傲爪兽王' }, tier: 'rare_elite' },
    ],
    boss: { id: 'ursanah', spriteId: 'boss_arugal', name: { en: "Urs'anah, Isle Matriarch", 'zh-TW': '烏爾薩娜', 'zh-CN': '乌尔萨娜' }, tier: 'boss' },
  },
  {
    index: 1,
    kind: 'dungeon',
    levelRange: 'Lv 13–18',
    name: { en: 'Hall of Thanes', 'zh-TW': '山丘之王大廳', 'zh-CN': '山丘之王大厅' },
    wallColor: '#232024',
    wallTrim: '#473e3c',
    floorColor: '#2e2724',
    floorAccent: '#4a3d37',
    bannerColor: '#b45309',
    torchColor: '#fb923c',
    enemies: [
      { id: 'iron_guard', spriteId: 'darkiron', name: { en: 'Thane Forgeguard', 'zh-TW': '氏族鑄爐衛士', 'zh-CN': '氏族铸炉卫士' } },
      { id: 'tunnel_kobold', spriteId: 'kobold', name: { en: 'Deepvault Kobold', 'zh-TW': '深窟狗頭人', 'zh-CN': '深窟狗头人' } },
      { id: 'rune_golem', spriteId: 'titan_watcher', name: { en: 'Earthen Runeguard', 'zh-TW': '土靈符文守衛', 'zh-CN': '土灵符文守卫' } },
    ],
    rares: [
      { id: 'dendralass', spriteId: 'beast_wolf', name: { en: "Den'dralass", 'zh-TW': '登德拉拉斯', 'zh-CN': '登德拉拉斯' }, tier: 'rare' },
    ],
    boss: { id: 'thane_ironheart', spriteId: 'boss_rend', name: { en: 'High Thane Ironheart', 'zh-TW': '大領主鐵心', 'zh-CN': '大领主铁心' }, tier: 'boss' },
  },
  {
    index: 2,
    kind: 'dungeon',
    levelRange: 'Lv 15–20',
    name: { en: 'Ruins of Lordaeron', 'zh-TW': '羅德隆廢墟', 'zh-CN': '洛丹伦废墟' },
    wallColor: '#1d1c2e',
    wallTrim: '#363254',
    floorColor: '#262436',
    floorAccent: '#393652',
    bannerColor: '#581c87',
    torchColor: '#a855f7',
    enemies: [
      { id: 'risen_guard', spriteId: 'deathguard', name: { en: 'Risen Sentinel', 'zh-TW': '復生哨兵', 'zh-CN': '复生哨兵' } },
      { id: 'plague_ghoul', spriteId: 'ghoul', name: { en: 'Tirisfal Ghoul', 'zh-TW': '提里斯法食屍鬼', 'zh-CN': '提瑞斯法食尸鬼' } },
      { id: 'abandoned', spriteId: 'banshee', name: { en: 'The Abandoned', 'zh-TW': '被遺棄的哀嚎女妖', 'zh-CN': '被遗弃的哀嚎女妖' } },
    ],
    rares: [
      { id: 'victor_vile', spriteId: 'acolyte', name: { en: 'Victor the Vile', 'zh-TW': '卑劣的維克多', 'zh-CN': '卑劣的维克多' }, tier: 'rare_elite' },
    ],
    boss: { id: 'wrath_mel', spriteId: 'boss_lich', name: { en: 'Wrath Mel, Undead Mage', 'zh-TW': '亡靈法師·拉絲梅爾', 'zh-CN': '亡灵法师·拉丝梅尔' }, tier: 'boss' },
  },
  {
    index: 3,
    kind: 'dungeon',
    levelRange: 'Lv 24–29',
    name: { en: 'Excavation Site', 'zh-TW': '濕地挖掘場', 'zh-CN': '湿地挖掘场' },
    wallColor: '#24211b',
    wallTrim: '#453d2e',
    floorColor: '#2e271e',
    floorAccent: '#4a3e2f',
    bannerColor: '#a16207',
    torchColor: '#f59e0b',
    enemies: [
      { id: 'exc_raider', spriteId: 'defias', name: { en: 'Relic Pillager', 'zh-TW': '古物掠奪者', 'zh-CN': '古物掠夺者' } },
      { id: 'stone_watcher', spriteId: 'titan_watcher', name: { en: 'Awakened Excavator', 'zh-TW': '覺醒石傀儡', 'zh-CN': '觉醒石傀儡' } },
      { id: 'dark_miner', spriteId: 'darkiron', name: { en: 'Dark Iron Sapper', 'zh-TW': '黑鐵工兵', 'zh-CN': '黑铁工兵' } },
    ],
    rares: [
      { id: 'urendra', spriteId: 'beast_wolf', name: { en: "Ur'endra", 'zh-TW': '烏爾恩德拉', 'zh-CN': '乌尔恩德拉' }, tier: 'rare' },
    ],
    boss: { id: 'stonepick', spriteId: 'boss_edwin', name: { en: 'Overseer Stonepick', 'zh-TW': '監工石鎬', 'zh-CN': '监工石镐' }, tier: 'boss' },
  },
  {
    index: 4,
    kind: 'dungeon',
    levelRange: 'Lv 28–33',
    name: { en: 'City of Dalaran', 'zh-TW': '達拉然城', 'zh-CN': '达拉然城' },
    wallColor: '#1e1938',
    wallTrim: '#433878',
    floorColor: '#251e42',
    floorAccent: '#423675',
    bannerColor: '#7e22ce',
    torchColor: '#c084fc',
    enemies: [
      { id: 'arcane_anomaly', spriteId: 'anomaly', name: { en: 'Arcane Anomaly', 'zh-TW': '奧術異象', 'zh-CN': '奥术异象' } },
      { id: 'unstable_sent', spriteId: 'titan_watcher', name: { en: 'Unstable Sentinel', 'zh-TW': '不穩定哨兵', 'zh-CN': '不稳定哨兵' } },
      { id: 'mana_devourer', spriteId: 'fel_ancient', name: { en: 'Mana Devourer', 'zh-TW': '法力吞噬者', 'zh-CN': '法力吞噬者' } },
    ],
    rares: [
      { id: 'arcanic_enigma', spriteId: 'anomaly', name: { en: 'Arcanic Enigma', 'zh-TW': '奧術謎團', 'zh-CN': '奥术谜团' }, tier: 'rare' },
      { id: 'lynn_ignored', spriteId: 'banshee', name: { en: 'Lynn the Ignored', 'zh-TW': '被遺忘的琳恩', 'zh-CN': '被遗忘的琳恩' }, tier: 'rare_elite' },
    ],
    boss: { id: 'atrixis', spriteId: 'boss_lich', name: { en: 'Atrixis the Grave Knight', 'zh-TW': '墓穴騎士·阿崔克西斯', 'zh-CN': '墓穴骑士·阿崔克西斯' }, tier: 'boss' },
  },
  {
    index: 5,
    kind: 'dungeon',
    levelRange: 'Lv 35–40',
    name: { en: 'The Drowned City', 'zh-TW': '沉沒之城', 'zh-CN': '沉没之城' },
    wallColor: '#12262b',
    wallTrim: '#1f4954',
    floorColor: '#163036',
    floorAccent: '#25525c',
    bannerColor: '#0f766e',
    torchColor: '#2dd4bf',
    enemies: [
      { id: 'sunken_naga', spriteId: 'naga', name: { en: 'Sunken Naga Myrmidon', 'zh-TW': '深海納迦侍從', 'zh-CN': '深海娜迦侍从' } },
      { id: 'tidal_murloc', spriteId: 'murloc', name: { en: 'Abyssal Murloc', 'zh-TW': '深淵魚人', 'zh-CN': '深渊鱼人' } },
      { id: 'coral_horror', spriteId: 'anomaly', name: { en: 'Tidal Elemental', 'zh-TW': '潮汐元素', 'zh-CN': '潮汐元素' } },
    ],
    rares: [
      { id: 'slydris_elite', spriteId: 'naga', name: { en: 'Slydris Depthstalker', 'zh-TW': '深淵斯萊德里斯', 'zh-CN': '深渊斯莱德里斯' }, tier: 'rare_elite' },
    ],
    boss: { id: 'boss_drowned', spriteId: 'boss_arugal', name: { en: "Tidecaller Vex'ra", 'zh-TW': '喚潮者維克絲拉', 'zh-CN': '唤潮者维克丝拉' }, tier: 'boss' },
  },
  {
    index: 6,
    kind: 'dungeon',
    levelRange: 'Lv 40–45',
    name: { en: "Krol'dok Stronghold", 'zh-TW': '克羅多克要塞', 'zh-CN': '克罗多克要塞' },
    wallColor: '#281e1a',
    wallTrim: '#4f382e',
    floorColor: '#30241f',
    floorAccent: '#4d3930',
    bannerColor: '#991b1b',
    torchColor: '#f97316',
    enemies: [
      { id: 'kroldok_brute', spriteId: 'felguard', name: { en: "Krol'dok Marauder", 'zh-TW': '克羅多克劫掠者', 'zh-CN': '克罗多克劫掠者' } },
      { id: 'river_shaman', spriteId: 'acolyte', name: { en: 'Riverglades Hexer', 'zh-TW': '河谷巫術師', 'zh-CN': '河谷巫术师' } },
      { id: 'ironjaw', spriteId: 'worgen', name: { en: 'Ironjaw Stalker', 'zh-TW': '鐵顎潛行者', 'zh-CN': '铁颚潜行者' } },
    ],
    rares: [
      { id: 'gloomrise', spriteId: 'nerubian', name: { en: 'Gloomrise Spinner', 'zh-TW': '幽影織網蛛', 'zh-CN': '幽影织网蛛' }, tier: 'rare' },
    ],
    boss: { id: 'warlord_kroldok', spriteId: 'boss_rend', name: { en: "Warlord Krol'dok", 'zh-TW': '督軍克羅多克', 'zh-CN': '督军克罗多克' }, tier: 'boss' },
  },
  {
    index: 7,
    kind: 'dungeon',
    levelRange: 'Lv 48–53',
    name: { en: 'Alcaz Island Prison', 'zh-TW': '奧卡茲島監獄', 'zh-CN': '奥卡兹岛监狱' },
    wallColor: '#1f242d',
    wallTrim: '#394354',
    floorColor: '#262c36',
    floorAccent: '#3d4757',
    bannerColor: '#b91c1c',
    torchColor: '#f59e0b',
    enemies: [
      { id: 'warden_jailer', spriteId: 'houndmaster', name: { en: 'Alcaz Jailer', 'zh-TW': '奧卡茲獄卒', 'zh-CN': '奥卡兹狱卒' } },
      { id: 'prison_zealot', spriteId: 'zealot', name: { en: 'Defias Insurgent', 'zh-TW': '叛亂囚徒', 'zh-CN': '叛乱囚徒' } },
      { id: 'spider_guard', spriteId: 'nerubian', name: { en: 'Shadowweb Lurker', 'zh-TW': '暗網潛伏者', 'zh-CN': '暗网潜伏者' } },
    ],
    rares: [
      { id: 'valraxx', spriteId: 'nerubian', name: { en: 'Broodmother Valraxx', 'zh-TW': '育母瓦爾拉克斯', 'zh-CN': '育母瓦尔拉克斯' }, tier: 'rare_elite' },
    ],
    boss: { id: 'warden_drakkon', spriteId: 'boss_mograine', name: { en: 'High Warden Drakkon', 'zh-TW': '大典獄官德拉康', 'zh-CN': '大典狱官德拉康' }, tier: 'boss' },
  },
  {
    index: 8,
    kind: 'dungeon',
    levelRange: 'Lv 55–60',
    name: { en: 'Blackmaw Hold', 'zh-TW': '黑喉要塞', 'zh-CN': '黑喉要塞' },
    wallColor: '#26171a',
    wallTrim: '#4c262c',
    floorColor: '#291a1c',
    floorAccent: '#472a2e',
    bannerColor: '#7f1d1d',
    torchColor: '#4ade80',
    enemies: [
      { id: 'fel_ancient', spriteId: 'fel_ancient', name: { en: 'Fel Ancient', 'zh-TW': '魔化古樹', 'zh-CN': '邪能古树' } },
      { id: 'blackmaw_fel', spriteId: 'felguard', name: { en: 'Blackmaw Felguard', 'zh-TW': '黑喉惡魔衛士', 'zh-CN': '黑喉恶魔卫士' } },
      { id: 'flame_imp', spriteId: 'imp', name: { en: 'Hyjal Flamewaker', 'zh-TW': '喚焰魔侍', 'zh-CN': '唤焰魔侍' } },
    ],
    rares: [
      { id: 'inquisitor_fel', spriteId: 'inquisitor', name: { en: 'Dread Pyromancer', 'zh-TW': '恐懼控火師', 'zh-CN': '恐惧控火师' }, tier: 'rare_elite' },
    ],
    boss: { id: 'overlord_blackmaw', spriteId: 'boss_rend', name: { en: 'Overlord Blackmaw', 'zh-TW': '霸主黑喉', 'zh-CN': '霸主黑喉' }, tier: 'boss' },
  },
  {
    index: 9,
    kind: 'dungeon',
    levelRange: 'Lv 58–60',
    name: { en: "Shaper's Terrace", 'zh-TW': '造物者平台', 'zh-CN': '造物者平台' },
    wallColor: '#1b2429',
    wallTrim: '#344954',
    floorColor: '#222e33',
    floorAccent: '#384c54',
    bannerColor: '#ca8a04',
    torchColor: '#38bdf8',
    enemies: [
      { id: 'titan_watcher', spriteId: 'titan_watcher', name: { en: 'Titan Sentinel', 'zh-TW': '泰坦哨兵', 'zh-CN': '泰坦哨兵' } },
      { id: 'ungoro_anomaly', spriteId: 'anomaly', name: { en: 'Arcane Shaper-Core', 'zh-TW': '奧術造物核心', 'zh-CN': '奥术造物核心' } },
      { id: 'terrace_colossus', spriteId: 'darkiron', name: { en: 'Terrace Stoneguard', 'zh-TW': '平台石衛', 'zh-CN': '平台石卫' } },
    ],
    rares: [
      { id: 'golden_watcher', spriteId: 'titan_watcher', name: { en: 'Chrono-Keeper Oros', 'zh-TW': '時光守衛奧羅斯', 'zh-CN': '时光守卫奥罗斯' }, tier: 'rare_elite' },
    ],
    boss: { id: 'arch_shaper', spriteId: 'boss_mograine', name: { en: 'Arch-Shaper Talos', 'zh-TW': '大造物師塔洛斯', 'zh-CN': '大造物师塔洛斯' }, tier: 'boss' },
  },
  {
    index: 10,
    kind: 'raid10',
    levelRange: '10-Player Raid',
    name: { en: 'The Barrow Deeps', 'zh-TW': '獸穴深處 (10人團隊)', 'zh-CN': '兽穴深处 (10人团本)' },
    wallColor: '#171d29',
    wallTrim: '#2b384f',
    floorColor: '#1c2430',
    floorAccent: '#2f3d52',
    bannerColor: '#065f46',
    torchColor: '#4ade80',
    enemies: [
      { id: 'barrow_warden', spriteId: 'felguard', name: { en: 'Barrow Jailer', 'zh-TW': '深穴典獄官', 'zh-CN': '深穴典狱官' } },
      { id: 'shadow_druid', spriteId: 'acolyte', name: { en: 'Corrupted Claw', 'zh-TW': '腐化利爪德魯伊', 'zh-CN': '腐化利爪德鲁伊' } },
      { id: 'fel_satyr', spriteId: 'imp', name: { en: 'Shadowhoof Imp', 'zh-TW': '暗蹄魔僕', 'zh-CN': '暗蹄魔仆' } },
    ],
    rares: [
      { id: 'barrow_banshee', spriteId: 'banshee', name: { en: 'Wailing Watcher', 'zh-TW': '哀嚎看守者', 'zh-CN': '哀嚎看守者' }, tier: 'rare_elite' },
    ],
    boss: { id: 'illidan_echo', spriteId: 'boss_arugal', name: { en: "Illidan's Shadow", 'zh-TW': '伊利丹之影', 'zh-CN': '伊利丹之影' }, tier: 'boss' },
  },
  {
    index: 11,
    kind: 'raid20',
    levelRange: '20-Player Raid',
    name: { en: 'Hyjal Summit', 'zh-TW': '海加爾山巔 (20人團隊)', 'zh-CN': '海加尔山巅 (20人团本)' },
    wallColor: '#1a2321',
    wallTrim: '#314540',
    floorColor: '#212b28',
    floorAccent: '#364742',
    bannerColor: '#047857',
    torchColor: '#34d399',
    enemies: [
      { id: 'hyjal_ghoul', spriteId: 'ghoul', name: { en: 'Risen Scourge Fiend', 'zh-TW': '天譴魔兵', 'zh-CN': '天灾魔兵' } },
      { id: 'hyjal_fel', spriteId: 'fel_ancient', name: { en: 'Possessed Ancient', 'zh-TW': '附魔古樹', 'zh-CN': '附魔古树' } },
      { id: 'hyjal_deathguard', spriteId: 'deathguard', name: { en: 'Summit Dreadknight', 'zh-TW': '山巔恐懼騎士', 'zh-CN': '山巅恐惧骑士' } },
    ],
    rares: [
      { id: 'spirit_beast', spriteId: 'beast_wolf', name: { en: 'Spirit-Possessed Guardian', 'zh-TW': '靈魂附體荒野神靈', 'zh-CN': '灵魂附体荒野神灵' }, tier: 'rare_elite' },
    ],
    boss: { id: 'undead_crocalisk', spriteId: 'crocalisk', name: { en: 'Undead Crocalisk (Wild God)', 'zh-TW': '亡靈鱷蜥·荒野半神', 'zh-CN': '亡灵鳄蜥·荒野半神' }, tier: 'boss' },
  },
  {
    index: 12,
    kind: 'raid40',
    levelRange: '40-Player Raid',
    name: { en: "Onyxia's Lair", 'zh-TW': '奧妮克希亞的巢穴 (40人)', 'zh-CN': '奥妮克希亚的巢穴 (40人)' },
    wallColor: '#261414',
    wallTrim: '#4f2424',
    floorColor: '#2e1818',
    floorAccent: '#522929',
    bannerColor: '#991b1b',
    torchColor: '#fb923c',
    enemies: [
      { id: 'onyx_whelp', spriteId: 'wyrmling', name: { en: 'Onyxian Whelp', 'zh-TW': '奧妮克希亞雛龍', 'zh-CN': '奥妮克希亚雏龙' } },
      { id: 'onyx_warder', spriteId: 'felguard', name: { en: 'Blackwing Warder', 'zh-TW': '黑翼看守者', 'zh-CN': '黑翼看守者' } },
      { id: 'onyx_flame', spriteId: 'inquisitor', name: { en: 'Lair Pyromancer', 'zh-TW': '龍穴控火師', 'zh-CN': '龙穴控火师' } },
    ],
    rares: [
      { id: 'brood_elder', spriteId: 'wyrmling', name: { en: 'Elder Broodguard', 'zh-TW': '長老龍衛', 'zh-CN': '长老龙卫' }, tier: 'rare_elite' },
    ],
    boss: { id: 'onyxia_boss', spriteId: 'onyxia', name: { en: 'Onyxia, Broodmother', 'zh-TW': '黑龍公主奧妮克希亞', 'zh-CN': '黑龙公主奥妮克希亚' }, tier: 'boss' },
  },
];

export const QUESTS: QuestDef[] = [
  {
    id: 'q_slay_15',
    name: { en: 'Zephras Isle Patrol', 'zh-TW': '風嶼巡邏隊', 'zh-CN': '风屿巡逻队' },
    description: { en: 'Slay 15 monsters across Azeroth', 'zh-TW': '擊敗 15 隻怪物', 'zh-CN': '击败 15 只怪物' },
    target: 15,
    rewardGold: 120,
    getProgress: (s) => s.totalKills,
  },
  {
    id: 'q_floor_5',
    name: { en: 'Skyborne Departure', 'zh-TW': '天裔啟程', 'zh-CN': '天裔启程' },
    description: { en: 'Clear Zephras Isle (Floor 5)', 'zh-TW': '通關澤弗拉斯之島 (第 5 層)', 'zh-CN': '通关泽弗拉斯之岛 (第 5 层)' },
    target: 5,
    rewardGold: 400,
    rewardShards: 1,
    getProgress: (s) => s.maxFloor,
  },
  {
    id: 'q_first_boss',
    name: { en: 'Boss Bounty', 'zh-TW': '首領懸賞', 'zh-CN': '首领悬赏' },
    description: { en: 'Defeat your first Dungeon Boss', 'zh-TW': '擊敗第 1 隻副本首領', 'zh-CN': '击败第 1 只副本首领' },
    target: 1,
    rewardGold: 750,
    rewardShards: 2,
    getProgress: (s) => s.bossesSlain,
  },
  {
    id: 'q_rare_3',
    name: { en: 'Rare Elite Hunter', 'zh-TW': '稀有精英獵手', 'zh-CN': '稀有精英猎手' },
    description: { en: 'Slay 3 Rare or Rare Elite foes', 'zh-TW': '擊敗 3 隻稀有或稀有精英怪', 'zh-CN': '击败 3 只稀有或稀有精英怪' },
    target: 3,
    rewardGold: 1800,
    rewardShards: 2,
    getProgress: (s) => s.raresSlain,
  },
  {
    id: 'q_heroes_4',
    name: { en: 'Forever Vanguard', 'zh-TW': '永恆先鋒小隊', 'zh-CN': '永恒先锋小队' },
    description: { en: 'Recruit 4 Hero Classes', 'zh-TW': '解鎖 4 個英雄職業', 'zh-CN': '解锁 4 个英雄职业' },
    target: 4,
    rewardGold: 3800,
    rewardShards: 2,
    getProgress: (s) => s.unlockedHeroes.length,
  },
  {
    id: 'q_dalaran',
    name: { en: 'Dome of Dalaran', 'zh-TW': '達拉然穹頂', 'zh-CN': '达拉然穹顶' },
    description: { en: 'Reach City of Dalaran (Floor 21)', 'zh-TW': '抵達達拉然城 (第 21 層)', 'zh-CN': '抵达达拉然城 (第 21 层)' },
    target: 21,
    rewardGold: 32000,
    rewardShards: 4,
    getProgress: (s) => s.maxFloor,
  },
  {
    id: 'q_slay_200',
    name: { en: 'Azeroth Champion', 'zh-TW': '艾澤拉斯勇士', 'zh-CN': '艾泽拉斯勇士' },
    description: { en: 'Slay 200 monsters', 'zh-TW': '累計擊敗 200 隻怪物', 'zh-CN': '累计击败 200 只怪物' },
    target: 200,
    rewardGold: 22000,
    rewardShards: 3,
    getProgress: (s) => s.totalKills,
  },
  {
    id: 'q_raid_barrow',
    name: { en: 'Launch Raid: Barrow Deeps', 'zh-TW': '進軍獸穴深處團本', 'zh-CN': '进军兽穴深处团本' },
    description: { en: 'Enter The Barrow Deeps Raid (Floor 51)', 'zh-TW': '踏入獸穴深處 10人團隊 (第 51 層)', 'zh-CN': '踏入兽穴深处 10人团本 (第 51 层)' },
    target: 51,
    rewardGold: 250000,
    rewardShards: 6,
    getProgress: (s) => s.maxFloor,
  },
  {
    id: 'q_heroes_9',
    name: { en: 'All 9 Forever Classes', 'zh-TW': '全九大職業制霸', 'zh-CN': '全九大职业制霸' },
    description: { en: 'Recruit all 9 Playable Classes', 'zh-TW': '集齊全部 9 大英雄職業', 'zh-CN': '集齐全部 9 大英雄职业' },
    target: 9,
    rewardGold: 450000,
    rewardShards: 10,
    getProgress: (s) => s.unlockedHeroes.length,
  },
  {
    id: 'q_ascend',
    name: { en: 'Spirit Walker', 'zh-TW': '靈魂飛昇者', 'zh-CN': '灵魂飞升者' },
    description: { en: 'Ascend at the Spirit Healer once', 'zh-TW': '完成 1 次靈魂飛昇', 'zh-CN': '完成 1 次灵魂飞升' },
    target: 1,
    rewardGold: 50000,
    rewardShards: 5,
    getProgress: (s) => s.ascensionCount,
  },
];

export const RELICS: RelicDef[] = [
  {
    id: 'warchief_totem',
    name: { en: "Warchief's Totem", 'zh-TW': '大酋長圖騰', 'zh-CN': '大酋长图腾' },
    description: { en: '+40% All Damage per rank', 'zh-TW': '每階 +40% 全體傷害', 'zh-CN': '每阶 +40% 全体伤害' },
    baseShardCost: 2,
    maxRank: 25,
    accent: '#f97316',
  },
  {
    id: 'gadgetzan_coin',
    name: { en: 'Coin of Gadgetzan', 'zh-TW': '加基森幸運幣', 'zh-CN': '加基森幸运币' },
    description: { en: '+40% Gold Drops per rank', 'zh-TW': '每階 +40% 金幣掉落', 'zh-CN': '每阶 +40% 金币掉落' },
    baseShardCost: 2,
    maxRank: 25,
    accent: '#facc15',
  },
  {
    id: 'runeblade_shard',
    name: { en: 'Frostblade Shard', 'zh-TW': '霜刃碎片', 'zh-CN': '霜刃碎片' },
    description: { en: '+50% Tap Damage per rank', 'zh-TW': '每階 +50% 點擊傷害', 'zh-CN': '每阶 +50% 点击伤害' },
    baseShardCost: 3,
    maxRank: 25,
    accent: '#38bdf8',
  },
  {
    id: 'kirin_crystal',
    name: { en: 'Kirin Tor Crystal', 'zh-TW': '祈倫托魔晶', 'zh-CN': '肯瑞托魔晶' },
    description: { en: '+50% Auto Damage per rank', 'zh-TW': '每階 +50% 自動傷害', 'zh-CN': '每阶 +50% 自动伤害' },
    baseShardCost: 3,
    maxRank: 25,
    accent: '#c084fc',
  },
  {
    id: 'heart_azeroth',
    name: { en: 'Heart of Azeroth', 'zh-TW': '艾澤拉斯之心', 'zh-CN': '艾泽拉斯之心' },
    description: { en: '+3s Boss Timer & -8% Skill CD per rank', 'zh-TW': '每階 +3秒 首領限時與 -8% 技能冷卻', 'zh-CN': '每阶 +3秒 首领限时与 -8% 技能冷却' },
    baseShardCost: 4,
    maxRank: 8,
    accent: '#22d3ee',
  },
];

export const UI_COPY: Record<
  Locale,
  {
    gameTitle: string;
    gameTitleEdition: string;
    subtitle: string;
    playCta: string;
    continueCta: string;
    howToPlayCta: string;
    controlsHint: string;
    startFeatures: { title: string; desc: string }[];
    boostBtn: string;
    boostSub: string;
    boostActive: string;
    floorLabel: string;
    bossTag: string;
    heroesHeader: string;
    heroesSub: string;
    raceLabel: string;
    fighting: string;
    pick: string;
    unlock: string;
    upgrade: string;
    skillsTitle: string;
    skillsSub: string;
    opensOnFloor: string;
    nextLevel: string;
    maxed: string;
    questsTitle: string;
    claim: string;
    claimed: string;
    relicsTitle: string;
    relicsSub: string;
    shardsLabel: string;
    ascensionTitle: string;
    ascensionDesc: string;
    ascensionBtn: string;
    ascensionNeed: string;
    emblemBonus: string;
    onboardingHint: string;
    pausedTitle: string;
    helpTitle: string;
    helpLines: string[];
    close: string;
    resume: string;
    reset: string;
    resetConfirm: string;
    offlineTitle: string;
    offlineDesc: string;
    offlineDouble: string;
    offlineClaim: string;
    adTitle: string;
    adDamage: string;
    adOffline: string;
    adWait: string;
    adClaim: string;
    tapDmgShort: string;
    dpsShort: string;
  }
> = {
  en: {
    gameTitle: 'WORLD OF DUNGEONS',
    gameTitleEdition: 'FOREVER CLICKER',
    subtitle: '9 Classes · 9 Races · 9 Dungeons · 3 Launch Raids',
    playCta: 'Start Game',
    continueCta: 'Continue Quest',
    howToPlayCta: 'How to Play',
    controlsHint: 'Click / Space: Strike · Keys 1–3: Cast Skills · Esc: Pause & Audio',
    startFeatures: [
      { title: '9 Classes & 9 Races', desc: 'Build combos with Dual-Faction Skyborne & class auras' },
      { title: '13 Dungeons & Raids', desc: 'Conquer Zephras Isle up to Onyxia’s Lair & Hyjal Summit' },
      { title: 'Rare Elites & Relics', desc: 'Hunt silver & gold Rares for Soul Shards & Ascend' },
    ],
    boostBtn: '2X DAMAGE',
    boostSub: 'watch a short ad',
    boostActive: '2X ACTIVE',
    floorLabel: 'FLOOR',
    bossTag: 'BOSS',
    heroesHeader: 'CLASSES',
    heroesSub: 'Tap any unlocked class to fight · Pick your Race below',
    raceLabel: 'Active Race',
    fighting: 'FIGHTING',
    pick: 'PICK',
    unlock: 'UNLOCK',
    upgrade: 'UPGRADE',
    skillsTitle: 'SKILLS',
    skillsSub: 'Use them with the round buttons or keys 1, 2, 3',
    opensOnFloor: 'Opens on floor',
    nextLevel: 'Next level',
    maxed: 'MAX',
    questsTitle: 'FOREVER QUESTS',
    claim: 'CLAIM',
    claimed: 'DONE',
    relicsTitle: 'SOUL FORGE',
    relicsSub: 'Slay Bosses & Rare Elites to earn Soul Shards',
    shardsLabel: 'Soul Shards',
    ascensionTitle: 'SPIRIT ASCENSION',
    ascensionDesc:
      'Reset floor & gold upgrades to claim permanent Heroic Emblems (+25% Damage & +15% Gold each). Keep all Classes, Races, Relics & Quests!',
    ascensionBtn: 'Ascend Now',
    ascensionNeed: 'Reach Floor 10 to unlock Ascension',
    emblemBonus: 'Emblem Bonus',
    onboardingHint: 'Tap an enemy or press SPACE to strike!',
    pausedTitle: 'SETTINGS & PAUSE',
    helpTitle: 'ADVENTURER GUIDE',
    helpLines: [
      'Play all 9 Classes (Warrior, Hunter, Priest, Mage, Rogue, Shaman, Paladin, Druid, Warlock) and choose from 9 Races including Dual-Faction Skyborne!',
      'Progress from Zephras Isle through all 9 Dungeons (Hall of Thanes, Ruins of Lordaeron, City of Dalaran, Shaper\'s Terrace) into the 3 Launch Raids (Barrow Deeps, Hyjal Summit, Onyxia\'s Lair).',
      'Watch for silver/gold RARE and RARE ELITE spawns (like Fernfeather, Victor the Vile, Lynn the Ignored, Broodmother Valraxx) for bonus Gold & Soul Shards.',
      'Cast active Skills using the round buttons or keys 1, 2, 3.',
      'Ascend at Floor 10+ to earn permanent Heroic Emblems.',
    ],
    close: 'Close',
    resume: 'Resume Battle',
    reset: 'Reset Save',
    resetConfirm: 'Confirm Reset?',
    offlineTitle: 'Offline Raid Loot',
    offlineDesc: 'Your party kept clearing monsters while you were away:',
    offlineDouble: 'Watch Ad for 2x Gold',
    offlineClaim: 'Claim 1x',
    adTitle: 'Tavern Reward',
    adDamage: 'Unlock 5-Minute 2X Damage Aura',
    adOffline: 'Double Your Offline Raid Loot',
    adWait: 'Summoning reward...',
    adClaim: 'Claim Buff',
    tapDmgShort: 'Tap',
    dpsShort: 'DPS',
  },
  'zh-TW': {
    gameTitle: '地下城世界',
    gameTitleEdition: '永恆點擊 · FOREVER CLICKER',
    subtitle: '9 大職業 · 9 大種族 · 9 新副本 · 3 大團本',
    playCta: '開始冒險',
    continueCta: '繼續征戰',
    howToPlayCta: '遊戲說明',
    controlsHint: '點擊怪物 / 空白鍵攻擊 · 按鍵 1–3 施放技能 · Esc 暫停與音效',
    startFeatures: [
      { title: '九大職業與種族', desc: '自由搭配雙陣營天裔與九大職業光環' },
      { title: '十三大副本與團本', desc: '從澤弗拉斯一路攻略至奧妮克希亞巢穴' },
      { title: '稀有精英與飛昇', desc: '狩獵稀有怪掉落靈魂碎片鍛造聖物' },
    ],
    boostBtn: '2倍傷害',
    boostSub: '觀看短廣告',
    boostActive: '2倍增幅中',
    floorLabel: '第',
    bossTag: '首領',
    heroesHeader: '九大職業',
    heroesSub: '點擊職業派遣出戰 · 下方選擇對應種族天賦',
    raceLabel: '當前種族',
    fighting: '作戰中',
    pick: '派遣',
    unlock: '招募',
    upgrade: '強化',
    skillsTitle: '主動技能',
    skillsSub: '點擊圓形按鈕或按鍵盤 1, 2, 3 施放',
    opensOnFloor: '解鎖層數：第',
    nextLevel: '下一級',
    maxed: '已滿級',
    questsTitle: '永恆懸賞任務',
    claim: '領取',
    claimed: '已完成',
    relicsTitle: '靈魂熔爐',
    relicsSub: '擊敗首領與稀有精英獲取靈魂碎片',
    shardsLabel: '靈魂碎片',
    ascensionTitle: '靈魂醫者飛昇',
    ascensionDesc: '重置層數與金幣升級，換取永久英雄徽記（每枚 +25% 傷害與 +15% 金幣）。保留已解鎖職業、聖物與任務！',
    ascensionBtn: '立即飛昇',
    ascensionNeed: '抵達第 10 層解鎖飛昇',
    emblemBonus: '徽記加成',
    onboardingHint: '點擊怪物或按 SPACE 展開攻擊！',
    pausedTitle: '設定與暫停',
    helpTitle: '冒險者指南',
    helpLines: [
      '解鎖全部 9 大職業（戰士、獵人、牧師、法師、盜賊、薩滿、聖騎士、德魯伊、術士）並搭配 9 大種族（含雙陣營天裔）天賦！',
      '從澤弗拉斯之島出發，攻略 9 大全新副本與 3 大團隊副本（獸穴深處、海加爾山巔、奧妮克希亞巢穴）。',
      '擊敗銀色/金色邊框的「稀有」與「稀有精英」怪物可掉落額外金幣與靈魂碎片！',
      '使用左下角圓形按鈕或按 1, 2, 3 施放技能。',
      '第 10 層後可進行靈魂飛昇獲得永久徽記。',
    ],
    close: '關閉',
    resume: '繼續戰鬥',
    reset: '重置存檔',
    resetConfirm: '確定重置嗎？',
    offlineTitle: '離線副本戰利品',
    offlineDesc: '在您離開期間，英雄小隊持續刷怪獲得了：',
    offlineDouble: '看廣告領取 2倍金幣',
    offlineClaim: '直接領取 1倍',
    adTitle: '旅店激勵獎勵',
    adDamage: '解鎖 5 分鐘 2倍傷害光環',
    adOffline: '雙倍領取離線戰利品',
    adWait: '獎勵載入中...',
    adClaim: '領取強化',
    tapDmgShort: '點擊',
    dpsShort: '秒傷',
  },
  'zh-CN': {
    gameTitle: '地下城世界',
    gameTitleEdition: '永恒点击 · FOREVER CLICKER',
    subtitle: '9 大职业 · 9 大种族 · 9 新副本 · 3 大团本',
    playCta: '开始冒险',
    continueCta: '继续征战',
    howToPlayCta: '玩法说明',
    controlsHint: '点击怪物 / 空格键攻击 · 按键 1–3 施放技能 · Esc 暂停与音效',
    startFeatures: [
      { title: '九大职业与种族', desc: '自由搭配双阵营天裔与九大职业光环' },
      { title: '十三大副本与团本', desc: '从泽弗拉斯一路攻略至奥妮克希亚巢穴' },
      { title: '稀有精英与飞升', desc: '狩猎稀有怪掉落灵魂碎片锻造圣物' },
    ],
    boostBtn: '2倍伤害',
    boostSub: '观看短广告',
    boostActive: '2倍增幅中',
    floorLabel: '第',
    bossTag: '首领',
    heroesHeader: '九大职业',
    heroesSub: '点击职业派遣出战 · 下方选择对应种族天赋',
    raceLabel: '当前种族',
    fighting: '作战中',
    pick: '派遣',
    unlock: '招募',
    upgrade: '强化',
    skillsTitle: '主动技能',
    skillsSub: '点击圆形按钮或按键盘 1, 2, 3 施放',
    opensOnFloor: '解锁层数：第',
    nextLevel: '下一级',
    maxed: '已满级',
    questsTitle: '永恒悬赏任务',
    claim: '领取',
    claimed: '已完成',
    relicsTitle: '灵魂熔炉',
    relicsSub: '击败首领与稀有精英获取灵魂碎片',
    shardsLabel: '灵魂碎片',
    ascensionTitle: '灵魂医者飞升',
    ascensionDesc: '重置层数与金币升级，换取永久英雄徽记（每枚 +25% 伤害与 +15% 金币）。保留已解锁职业、圣物与任务！',
    ascensionBtn: '立即飞升',
    ascensionNeed: '抵达第 10 层解锁飞升',
    emblemBonus: '徽记加成',
    onboardingHint: '点击怪物或按 SPACE 展开攻击！',
    pausedTitle: '设置与暂停',
    helpTitle: '冒险者指南',
    helpLines: [
      '解锁全部 9 大职业（战士、猎人、牧师、法师、潜行者、萨满、圣骑士、德鲁伊、术士）并搭配 9 大种族（含双阵营天裔）天赋！',
      '从泽弗拉斯之岛出发，攻略 9 大全新副本与 3 大团队副本（兽穴深处、海加尔山巅、奥妮克希亚巢穴）。',
      '击败银色/金色边框的“稀有”与“稀有精英”怪物可掉落额外金币与灵魂碎片！',
      '使用左下角圆形按钮或按 1, 2, 3 施放技能。',
      '第 10 层后可进行灵魂飞升获得永久徽记。',
    ],
    close: '关闭',
    resume: '继续战斗',
    reset: '重置存档',
    resetConfirm: '确定重置吗？',
    offlineTitle: '离线副本战利品',
    offlineDesc: '在您离开期间，英雄小队持续刷怪获得了：',
    offlineDouble: '看广告领取 2倍金币',
    offlineClaim: '直接领取 1倍',
    adTitle: '旅店激励奖励',
    adDamage: '解锁 5 分钟 2倍伤害光环',
    adOffline: '双倍领取离线战利品',
    adWait: '奖励加载中...',
    adClaim: '领取强化',
    tapDmgShort: '点击',
    dpsShort: '秒伤',
  },
};

export function detectDefaultLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'zh-TW' || saved === 'zh-CN') return saved;
  } catch {
    // ignore
  }
  return 'en';
}

export function getZoneForFloor(floor: number): { zone: DungeonZone; tier: number } {
  const zeroFloor = Math.max(0, floor - 1);
  const zoneIdx = Math.floor(zeroFloor / 5) % DUNGEON_ZONES.length;
  const tier = Math.floor(zeroFloor / (5 * DUNGEON_ZONES.length)) + 1;
  return { zone: DUNGEON_ZONES[zoneIdx], tier };
}

export function isBossFloor(floor: number): boolean {
  return floor > 0 && floor % 5 === 0;
}

export function getMonsterHp(floor: number, isBoss: boolean, isRare = false): number {
  const base = 10 * Math.pow(1.38, floor - 1);
  const mult = isBoss ? 6.5 : isRare ? 2.6 : 1;
  return Math.max(10, Math.floor(base * mult));
}

export function getMonsterGold(floor: number, isBoss: boolean, isRare = false): number {
  const base = Math.max(2, Math.floor(3 * Math.pow(1.34, floor - 1)));
  return isBoss ? base * 8 : isRare ? base * 4 : base;
}

export function getUpgradeCost(def: UpgradeDef, owned: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costMultiplier, owned));
}

export function getBulkUpgradeQuote(
  def: UpgradeDef,
  owned: number,
  gold: number,
  buyAmount: BuyAmount
): { count: number; totalCost: number } {
  if (buyAmount === 1) {
    return { count: 1, totalCost: getUpgradeCost(def, owned) };
  }
  if (buyAmount === 10) {
    let total = 0;
    for (let i = 0; i < 10; i++) total += getUpgradeCost(def, owned + i);
    return { count: 10, totalCost: total };
  }
  let count = 0;
  let total = 0;
  let cur = owned;
  while (count < 100) {
    const cost = getUpgradeCost(def, cur);
    if (total + cost > gold) break;
    total += cost;
    cur++;
    count++;
  }
  if (count === 0) return { count: 1, totalCost: getUpgradeCost(def, owned) };
  return { count, totalCost: total };
}

export function getHeroUpgradeCost(hero: HeroDef, rank: number): number {
  return Math.floor(hero.upgradeBaseCost * Math.pow(hero.upgradeMultiplier, Math.max(0, rank - 1)));
}

export function getSkillUpgradeCost(skill: SkillDef, level: number): number {
  return Math.floor(skill.baseCost * Math.pow(skill.costMultiplier, level));
}

export function getRelicCost(baseShardCost: number, currentRank: number): number {
  return baseShardCost + currentRank * 2;
}

export function getSkillMetrics(skill: SkillDef, level: number): { power: number; duration: number } {
  const effLv = Math.max(1, level);
  if (skill.id === 'frenzy') {
    return {
      power: skill.basePower + (effLv - 1) * 0.35,
      duration: skill.baseDurationSec + (effLv - 1) * 1.5,
    };
  }
  if (skill.id === 'gold_rush') {
    return {
      power: skill.basePower + (effLv - 1) * 0.25,
      duration: skill.baseDurationSec + (effLv - 1) * 2,
    };
  }
  return {
    power: skill.basePower + (effLv - 1) * 8,
    duration: 0,
  };
}

export function calculatePendingEmblems(state: SaveState): number {
  if (state.maxFloor < ASCENSION_MIN_FLOOR) return 0;
  const raw = Math.floor(Math.pow(state.maxFloor - 7, 1.18) / 2) + Math.floor(state.bossesSlain / 2);
  return Math.max(1, raw);
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n < 1000) {
    return n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toLocaleString('en-US');
  }
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp'];
  const tier = Math.floor(Math.log10(Math.abs(n)) / 3);
  if (tier <= 0) return Math.floor(n).toLocaleString('en-US');
  const suffix = units[tier - 1] ?? `e${tier * 3}`;
  const scale = Math.pow(10, tier * 3);
  const val = n / scale;
  return (val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)) + suffix;
}

export function getHeroRank(save: SaveState, id: HeroId): number {
  return save.heroRanks[id] || 1;
}

export function getSkillLevel(save: SaveState, id: SkillId): number {
  return save.skillLevels[id] || 0;
}

export function getRacesForClass(heroId: HeroId): RaceDef[] {
  return RACES.filter((r) => r.classes.includes(heroId));
}

export function getRaceById(raceId: RaceId): RaceDef {
  return RACES.find((r) => r.id === raceId) || RACES[0];
}
