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
    id: 'fury',
    icon: 'fury',
    name: { en: 'Blood Fury', 'zh-TW': '嗜血狂怒', 'zh-CN': '嗜血狂怒' },
    baseCost: 350,
    costMultiplier: 1.38,
    kind: 'allDmg',
    baseValue: 0.25,
    accent: '#f97316',
  },
  {
    id: 'greed',
    icon: 'greed',
    name: { en: 'Goblin Greed', 'zh-TW': '地精貪婪', 'zh-CN': '地精贪婪' },
    baseCost: 180,
    costMultiplier: 1.35,
    kind: 'gold',
    baseValue: 0.25,
    accent: '#facc15',
  },
  {
    id: 'crit_luck',
    icon: 'clover',
    name: { en: 'Deadly Precision', 'zh-TW': '致命精準', 'zh-CN': '致命精准' },
    baseCost: 120,
    costMultiplier: 1.32,
    kind: 'crit',
    baseValue: 0.03,
    accent: '#4ade80',
  },
  {
    id: 'titan_grip',
    icon: 'titan',
    name: { en: "Titan's Might", 'zh-TW': '泰坦之力', 'zh-CN': '泰坦之力' },
    baseCost: 2600,
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

// All 9 Playable Classes with unique Primary Attacks, distinct VFX & 2 upgradeable Countdown Auto-Skills
export const HEROES: HeroDef[] = [
  {
    id: 'warrior',
    name: { en: 'Warrior', 'zh-TW': '戰士', 'zh-CN': '战士' },
    title: { en: 'Vanguard Blade', 'zh-TW': '先鋒劍士', 'zh-CN': '先锋剑士' },
    defaultRace: 'human',
    attackStyle: 'cleave',
    primaryAttack: {
      id: 'heroic_cleave',
      name: { en: 'Sundering Cleave', 'zh-TW': '破甲順劈斬', 'zh-CN': '破甲顺劈斩' },
      description: { en: 'Heavy steel crescent arc strike', 'zh-TW': '重鋼新月弧光劈斬', 'zh-CN': '重钢新月弧光劈斩' },
      style: 'cleave',
      color: '#ef4444',
      powerMult: 1.1,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'mortal_cleave',
        name: { en: 'Mortal Strike', 'zh-TW': '致死打擊', 'zh-CN': '致死打击' },
        description: { en: 'Heavy crimson cleave on target', 'zh-TW': '重創單體目標', 'zh-CN': '重创单体目标' },
        cooldownSec: 3.5,
        damageMult: 2.2,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'cleave',
        color: '#ef4444',
      },
      {
        id: 'whirlwind',
        name: { en: 'Whirlwind', 'zh-TW': '旋風斬', 'zh-CN': '旋风斩' },
        description: { en: 'Spinning blade wave hits all foes', 'zh-TW': '橫掃場上所有敵人', 'zh-CN': '横扫场上所有敌人' },
        cooldownSec: 8.0,
        damageMult: 2.8,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'whirlwind',
        color: '#f87171',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 30 + (rank - 1) * 15;
      if (locale === 'zh-TW') return `+${pct}% 點擊傷害`;
      if (locale === 'zh-CN') return `+${pct}% 点击伤害`;
      return `+${pct}% tap damage`;
    },
    unlockCost: 0,
    switchCostBase: 25,
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
    attackStyle: 'arrow',
    primaryAttack: {
      id: 'heartseeker_arrow',
      name: { en: 'Heartseeker Arrow', 'zh-TW': '尋心疾箭', 'zh-CN': '寻心疾箭' },
      description: { en: 'High-velocity piercing wind arrow', 'zh-TW': '高速穿甲疾風箭矢', 'zh-CN': '高速穿甲疾风箭矢' },
      style: 'arrow',
      color: '#4ade80',
      powerMult: 1.05,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'aimed_shot',
        name: { en: 'Aimed Shot', 'zh-TW': '瞄準射擊', 'zh-CN': '瞄准射击' },
        description: { en: 'Guaranteed critical piercing arrow', 'zh-TW': '必中暴擊穿甲箭', 'zh-CN': '必中暴击穿甲箭' },
        cooldownSec: 3.2,
        damageMult: 2.0,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'arrow',
        color: '#4ade80',
        special: 'crit_guaranteed',
      },
      {
        id: 'multi_shot',
        name: { en: 'Multi-Shot', 'zh-TW': '多重射擊', 'zh-CN': '多重射击' },
        description: { en: 'Arrow volley hits every enemy', 'zh-TW': '箭雨齊射所有目標', 'zh-CN': '箭雨齐射所有目标' },
        cooldownSec: 7.5,
        damageMult: 2.5,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'volley',
        color: '#86efac',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 10 + (rank - 1) * 2;
      if (locale === 'zh-TW') return `+${pct}% 暴擊率`;
      if (locale === 'zh-CN') return `+${pct}% 暴击率`;
      return `+${pct}% crit chance`;
    },
    unlockCost: 80,
    switchCostBase: 35,
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
    attackStyle: 'holy_beam',
    primaryAttack: {
      id: 'radiant_smite',
      name: { en: 'Radiant Smite', 'zh-TW': '聖光懲擊', 'zh-CN': '圣光惩击' },
      description: { en: 'Golden skybeam descends on target', 'zh-TW': '召喚天降聖光柱懲戒敵人', 'zh-CN': '召唤天降圣光柱惩戒敌人' },
      style: 'holy_beam',
      color: '#fef08a',
      powerMult: 1.05,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'holy_fire',
        name: { en: 'Holy Fire', 'zh-TW': '神聖之火', 'zh-CN': '神圣之火' },
        description: { en: 'Radiant beam (+40% vs Boss)', 'zh-TW': '聖光柱灼燒首領', 'zh-CN': '圣光柱灼烧首领' },
        cooldownSec: 3.2,
        damageMult: 2.1,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'holy',
        color: '#fef08a',
        special: 'boss_bonus',
      },
      {
        id: 'shadow_nova',
        name: { en: 'Mind Sear', 'zh-TW': '精神灼燒', 'zh-CN': '精神灼烧' },
        description: { en: 'Shadow burst damages all foes', 'zh-TW': '暗影衝擊波全體傷害', 'zh-CN': '暗影冲击波全体伤害' },
        cooldownSec: 7.0,
        damageMult: 2.7,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'shadow_aoe',
        color: '#c084fc',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 45 + (rank - 1) * 25;
      if (locale === 'zh-TW') return `+${pct}% 首領傷害`;
      if (locale === 'zh-CN') return `+${pct}% 首领伤害`;
      return `+${pct}% boss damage`;
    },
    unlockCost: 180,
    switchCostBase: 45,
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
    attackStyle: 'frost_orb',
    primaryAttack: {
      id: 'frostfire_lance',
      name: { en: 'Frostfire Lance', 'zh-TW': '霜火長矛', 'zh-CN': '霜火长矛' },
      description: { en: 'Shattering crystalline ice orb', 'zh-TW': '迸裂寒冰法球貫穿敵陣', 'zh-CN': '迸裂寒冰法球贯穿敌阵' },
      style: 'frost_orb',
      color: '#38bdf8',
      powerMult: 1.0,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'frostbolt',
        name: { en: 'Frostbolt', 'zh-TW': '寒冰箭', 'zh-CN': '寒冰箭' },
        description: { en: 'Chills & delays enemy skills', 'zh-TW': '冰霜緩速延緩敵方技能', 'zh-CN': '冰霜减速延缓敌方技能' },
        cooldownSec: 2.8,
        damageMult: 2.0,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'frost',
        color: '#38bdf8',
        special: 'chill',
      },
      {
        id: 'arcane_barrage',
        name: { en: 'Arcane Barrage', 'zh-TW': '奧術彈幕', 'zh-CN': '奥术弹幕' },
        description: { en: 'Arcane missiles blast all foes', 'zh-TW': '多重奧術飛彈轟炸全場', 'zh-CN': '多重奥术飞弹轰炸全场' },
        cooldownSec: 7.2,
        damageMult: 3.0,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'arcane_barrage',
        color: '#818cf8',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 60 + (rank - 1) * 30;
      if (locale === 'zh-TW') return `+${pct}% 奧義傷害`;
      if (locale === 'zh-CN') return `+${pct}% 奥义伤害`;
      return `+${pct}% skill power`;
    },
    unlockCost: 420,
    switchCostBase: 60,
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
    attackStyle: 'dual_slash',
    primaryAttack: {
      id: 'venom_shiv',
      name: { en: 'Venom Twin-Shiv', 'zh-TW': '淬毒雙刃刺', 'zh-CN': '淬毒双刃刺' },
      description: { en: 'Cross-blade shadow venom slash', 'zh-TW': '劇毒雙匕首十字瞬斬', 'zh-CN': '剧毒双匕首十字瞬斩' },
      style: 'dual_slash',
      color: '#4ade80',
      powerMult: 1.15,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'sinister_strike',
        name: { en: 'Eviscerate', 'zh-TW': '剔骨', 'zh-CN': '刺骨' },
        description: { en: 'Rapid dual-blade X-slash', 'zh-TW': '高速雙刃十字斬', 'zh-CN': '高速双刃十字斩' },
        cooldownSec: 2.2,
        damageMult: 1.9,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'dual',
        color: '#fbbf24',
      },
      {
        id: 'fan_knives',
        name: { en: 'Fan of Knives', 'zh-TW': '飛舞刀扇', 'zh-CN': '刀扇' },
        description: { en: 'Hits all foes & pilfers Gold', 'zh-TW': '全場飛刀並額外竊取金幣', 'zh-CN': '全场飞刀并额外窃取金币' },
        cooldownSec: 6.8,
        damageMult: 2.4,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'fan_knives',
        color: '#fda4af',
        special: 'gold_steal',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 60 + (rank - 1) * 25;
      if (locale === 'zh-TW') return `+${pct}% 金幣掉落`;
      if (locale === 'zh-CN') return `+${pct}% 金币掉落`;
      return `+${pct}% gold drops`;
    },
    unlockCost: 950,
    switchCostBase: 80,
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
    attackStyle: 'lightning',
    primaryAttack: {
      id: 'stormstrike_bolt',
      name: { en: 'Stormstrike Bolt', 'zh-TW': '風暴閃電擊', 'zh-CN': '风暴闪电击' },
      description: { en: 'Crackling storm arc hits target', 'zh-TW': '狂暴電弧直接轟擊目標', 'zh-CN': '狂暴电弧直接轰击目标' },
      style: 'lightning',
      color: '#38bdf8',
      powerMult: 1.15,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'chain_lightning',
        name: { en: 'Chain Lightning', 'zh-TW': '閃電鏈', 'zh-CN': '闪电链' },
        description: { en: 'Arcs across all active enemies', 'zh-TW': '跳躍電流貫穿全場敵人', 'zh-CN': '跳跃电流贯穿全场敌人' },
        cooldownSec: 3.4,
        damageMult: 2.0,
        upgradeBaseCost: 30,
        aoe: true,
        effect: 'lightning',
        color: '#38bdf8',
      },
      {
        id: 'lava_burst',
        name: { en: 'Lava Burst', 'zh-TW': '熔岩爆裂', 'zh-CN': '熔岩爆裂' },
        description: { en: 'Molten critical blast on target', 'zh-TW': '必爆烈焰熔岩重擊', 'zh-CN': '必爆烈焰熔岩重击' },
        cooldownSec: 7.4,
        damageMult: 3.4,
        upgradeBaseCost: 55,
        aoe: false,
        effect: 'lava',
        color: '#f97316',
        special: 'crit_guaranteed',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 50 + (rank - 1) * 25;
      if (locale === 'zh-TW') return `+${pct}% 點擊與奧義`;
      if (locale === 'zh-CN') return `+${pct}% 点击与奥义`;
      return `+${pct}% tap & skills`;
    },
    unlockCost: 2200,
    switchCostBase: 110,
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
    attackStyle: 'hammer_wave',
    primaryAttack: {
      id: 'lightforged_hammer',
      name: { en: 'Lightforged Hammer', 'zh-TW': '聖光重錘擊', 'zh-CN': '圣光重锤击' },
      description: { en: 'Hurls spinning golden warhammer', 'zh-TW': '擲出迴旋黃金戰錘衝擊目標', 'zh-CN': '掷出回旋黄金战锤冲击目标' },
      style: 'hammer_wave',
      color: '#fde047',
      powerMult: 1.2,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'crusader_strike',
        name: { en: 'Judgment', 'zh-TW': '審判之錘', 'zh-CN': '审判之锤' },
        description: { en: 'Golden hammer slam on target', 'zh-TW': '聖光巨錘制裁敵人', 'zh-CN': '圣光巨锤制裁敌人' },
        cooldownSec: 3.3,
        damageMult: 2.3,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'hammer',
        color: '#fde047',
      },
      {
        id: 'consecration',
        name: { en: 'Consecration', 'zh-TW': '奉獻聖盾', 'zh-CN': '奉献圣盾' },
        description: { en: 'Burns all foes & shields Gold', 'zh-TW': '灼燒全場並格擋一次偷幣', 'zh-CN': '灼烧全场并格挡一次偷币' },
        cooldownSec: 8.5,
        damageMult: 2.9,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'consecrate',
        color: '#facc15',
        special: 'shield',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 75 + (rank - 1) * 35;
      if (locale === 'zh-TW') return `+${pct}% 全體傷害`;
      if (locale === 'zh-CN') return `+${pct}% 全体伤害`;
      return `+${pct}% all damage`;
    },
    unlockCost: 5000,
    switchCostBase: 150,
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
    attackStyle: 'moonfire',
    primaryAttack: {
      id: 'starlight_wrath',
      name: { en: 'Starlight Wrath', 'zh-TW': '星光憤怒', 'zh-CN': '星光愤怒' },
      description: { en: 'Emerald lunar beam strikes foe', 'zh-TW': '翠綠星月光束轟落目標', 'zh-CN': '翠绿星月光束轰落目标' },
      style: 'moonfire',
      color: '#4ade80',
      powerMult: 1.2,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'moonfire',
        name: { en: 'Moonfire', 'zh-TW': '月火術', 'zh-CN': '月火术' },
        description: { en: 'Lunar beam drops from above', 'zh-TW': '天降月光柱打擊目標', 'zh-CN': '天降月光柱打击目标' },
        cooldownSec: 2.7,
        damageMult: 2.1,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'moonfire',
        color: '#a5b4fc',
      },
      {
        id: 'starfall',
        name: { en: 'Starfall', 'zh-TW': '星辰墜落', 'zh-CN': '星辰坠落' },
        description: { en: 'Starlight meteors strike all foes', 'zh-TW': '召喚星雨轟炸全場', 'zh-CN': '召唤星雨轰炸全场' },
        cooldownSec: 8.0,
        damageMult: 3.1,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'starfall',
        color: '#4ade80',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 85 + (rank - 1) * 35;
      if (locale === 'zh-TW') return `+${pct}% 傷害與金幣`;
      if (locale === 'zh-CN') return `+${pct}% 伤害与金币`;
      return `+${pct}% dmg & gold`;
    },
    unlockCost: 11500,
    switchCostBase: 210,
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
    attackStyle: 'fel_bolt',
    primaryAttack: {
      id: 'soulfire_bolt',
      name: { en: 'Soulfire Bolt', 'zh-TW': '靈魂烈焰箭', 'zh-CN': '灵魂烈焰箭' },
      description: { en: 'Volatile fel-green cursed bolt', 'zh-TW': '邪能詛咒火球轟爆目標', 'zh-CN': '邪能诅咒火球轰爆目标' },
      style: 'fel_bolt',
      color: '#4ade80',
      powerMult: 1.25,
      baseCost: 10,
    },
    autoSkills: [
      {
        id: 'shadow_bolt',
        name: { en: 'Chaos Bolt', 'zh-TW': '混亂之箭', 'zh-CN': '混乱之箭' },
        description: { en: 'Critical fel-skull blast', 'zh-TW': '必爆邪能顱骨轟擊', 'zh-CN': '必爆邪能颅骨轰击' },
        cooldownSec: 3.1,
        damageMult: 2.6,
        upgradeBaseCost: 30,
        aoe: false,
        effect: 'fel_bolt',
        color: '#4ade80',
        special: 'crit_guaranteed',
      },
      {
        id: 'rain_of_fire',
        name: { en: 'Rain of Fire', 'zh-TW': '火焰之雨', 'zh-CN': '火焰之雨' },
        description: { en: 'Fel meteors scorch every foe', 'zh-TW': '邪能火雨焚燒所有敵人', 'zh-CN': '邪能火雨焚烧所有敌人' },
        cooldownSec: 8.2,
        damageMult: 3.3,
        upgradeBaseCost: 55,
        aoe: true,
        effect: 'rain_of_fire',
        color: '#c084fc',
      },
    ],
    bonusLabel: (rank, locale) => {
      const pct = 120 + (rank - 1) * 45;
      if (locale === 'zh-TW') return `+${pct}% 暴擊與技能`;
      if (locale === 'zh-CN') return `+${pct}% 暴击与技能`;
      return `+${pct}% crit & skills`;
    },
    unlockCost: 26000,
    switchCostBase: 300,
    upgradeBaseCost: 145000,
    upgradeMultiplier: 1.75,
    accent: '#9482c9',
    projectileColor: '#4ade80',
  },
];

export const ENEMY_COUNTER_SKILLS: Record<
  'normal' | 'rare' | 'boss',
  { name: { en: string; 'zh-TW': string; 'zh-CN': string }; cooldownSec: number; stealRatio: number }
> = {
  normal: {
    name: { en: 'Pickpocket', 'zh-TW': '掠奪偷襲', 'zh-CN': '掠夺偷袭' },
    cooldownSec: 9.0,
    stealRatio: 0.06,
  },
  rare: {
    name: { en: 'Shadow Snatch', 'zh-TW': '暗影劫財', 'zh-CN': '暗影劫财' },
    cooldownSec: 6.8,
    stealRatio: 0.09,
  },
  boss: {
    name: { en: 'Boss Plunder', 'zh-TW': '首領重擊劫掠', 'zh-CN': '首领重击劫掠' },
    cooldownSec: 5.8,
    stealRatio: 0.12,
  },
};

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
    chooseRaceLabel: string;
    raceLockedTag: string;
    primaryAtkTag: string;
    skillUpgradeTag: string;
    switchClass: string;
    racialAffinity: string;
    boostBtn: string;
    boostSub: string;
    boostActive: string;
    wardBtn: string;
    wardActive: string;
    hasteBtn: string;
    hasteActive: string;
    reclaimBtn: string;
    bossPenaltyBanner: string;
    bossSecondWindCta: string;
    autoSkillsLabel: string;
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
    adWard: string;
    adHaste: string;
    adReclaim: string;
    adBossWind: string;
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
      { title: 'Pick Race at Start', desc: 'Your race & visual appearance lock in when the quest begins' },
      { title: 'Pay Coins to Switch Class', desc: 'Unlock & train unique primary attacks and 2 class skills' },
      { title: 'Wards, Haste & Recovery', desc: 'Stagger enemy steals, shield coins, or reclaim lost loot' },
    ],
    chooseRaceLabel: 'Choose Your Race (Locked Once Started)',
    raceLockedTag: 'Locked Race',
    primaryAtkTag: 'Primary Attack',
    skillUpgradeTag: 'Class Skill',
    switchClass: 'CHANGE',
    racialAffinity: 'Racial -30%',
    boostBtn: '2X DAMAGE',
    boostSub: 'watch ad',
    boostActive: '2X DMG',
    wardBtn: 'COIN WARD',
    wardActive: 'WARDED',
    hasteBtn: '2X HASTE',
    hasteActive: 'HASTE',
    reclaimBtn: 'RECLAIM',
    bossPenaltyBanner: 'Boss enraged & plundered gold!',
    bossSecondWindCta: 'Second Wind (Ad)',
    autoSkillsLabel: 'CLASS AUTO-SKILLS',
    floorLabel: 'FLOOR',
    bossTag: 'BOSS',
    heroesHeader: 'CLASSES',
    heroesSub: 'Pay coins to switch class mid-run · Appearance adapts to your race',
    raceLabel: 'Race',
    fighting: 'FIGHTING',
    pick: 'CHANGE',
    unlock: 'UNLOCK',
    upgrade: 'RANK UP',
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
      'Choose your Race before starting—your race and hero appearance stay locked for the run, while you can pay coins mid-game to change Classes!',
      'Each of the 9 Classes has a unique Primary Attack, custom attack VFX, and 2 Countdown Auto-Skills that can each be upgraded individually in the Upgrades tab.',
      'Watch enemy cast bars! When an enemy finishes its cooldown skill, it counter-attacks and steals gold. Tap telegraphing foes to stagger them, or activate Coin Ward.',
      'Use Ad Buffs & Recovery: 2X Damage, Coin Ward (blocks coin theft for 5m), 2X Haste (halves auto-skill cooldowns), Reclaim Lost Gold (150% back!), and Boss Second Wind.',
      'Hover over the bottom-left Class Skill icons to inspect skill names and cooldowns.',
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
    adWard: 'Activate 5-Minute Coin Ward (Blocks Gold Theft)',
    adHaste: 'Activate 3-Minute 2X Class Auto-Skill Haste',
    adReclaim: 'Reclaim 150% of Stolen Dungeon Gold',
    adBossWind: 'Second Wind: +15s Boss Timer & 25% Smite',
    adOffline: 'Double Your Offline Raid Loot',
    adWait: 'Summoning reward...',
    adClaim: 'Claim Reward',
    tapDmgShort: 'Tap',
    dpsShort: 'Skill',
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
      { title: '開局選定種族', desc: '開始遊戲後種族與專屬外觀鎖定，無法中途更換種族' },
      { title: '付費轉職與獨立強化', desc: '戰鬥中可花費金幣轉職，個別升級普攻與 2 個職業技能' },
      { title: '護盾、加速與追回獎勵', desc: '打斷敵方偷幣，或看廣告開啟防盜護盾與 150% 追回' },
    ],
    chooseRaceLabel: '選擇你的種族（開始後不可更改）',
    raceLockedTag: '已鎖定種族',
    primaryAtkTag: '職業普攻',
    skillUpgradeTag: '職業技能',
    switchClass: '轉職',
    racialAffinity: '種族 -30%',
    boostBtn: '2倍傷害',
    boostSub: '看廣告',
    boostActive: '2倍傷害',
    wardBtn: '金幣護盾',
    wardActive: '護盾中',
    hasteBtn: '2倍急速',
    hasteActive: '急速中',
    reclaimBtn: '追回失金',
    bossPenaltyBanner: '首領狂暴並掠奪了金幣！',
    bossSecondWindCta: '神聖逆轉 (廣告)',
    autoSkillsLabel: '職業自動技能',
    floorLabel: '第',
    bossTag: '首領',
    heroesHeader: '九大職業',
    heroesSub: '戰鬥中可花費金幣轉職 · 角色外觀隨開局種族變化',
    raceLabel: '種族',
    fighting: '作戰中',
    pick: '轉職',
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
      '開局時須選擇種族，進入遊戲後種族與外觀即鎖定；但在副本中可隨時花費金幣轉換職業！',
      '9 大職業皆有專屬「基礎攻擊」特效與 2 個「自動倒數技能」，可於升級分頁個別獨立強化。',
      '滑鼠移至左下角技能圖示可查看技能名稱與冷卻詳情。',
      '留意怪物頭上的施法警訊！點擊預警中的怪物可推遲偷幣，或看廣告開啟金幣護盾與追回 150% 失金。',
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
    adWard: '啟動 5 分鐘金幣護盾（免疫敵方偷幣）',
    adHaste: '啟動 3 分鐘 2倍職業自動技能急速',
    adReclaim: '追回 150% 被怪物偷走的副本金幣',
    adBossWind: '神聖逆轉：首領限時 +15秒 並重創 25% 血量',
    adOffline: '雙倍領取離線戰利品',
    adWait: '獎勵載入中...',
    adClaim: '領取獎勵',
    tapDmgShort: '點擊',
    dpsShort: '奧義',
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
      { title: '开局选定种族', desc: '开始游戏后种族与专属外观锁定，不可中途更改种族' },
      { title: '付费转职与独立强化', desc: '战斗中可花费金币转职，分别升级普攻与 2 个职业技能' },
      { title: '护盾、急速与追回奖励', desc: '打断敌方偷币，或看广告开启防盗护盾与 150% 追回' },
    ],
    chooseRaceLabel: '选择你的种族（开始后不可更改）',
    raceLockedTag: '已锁定种族',
    primaryAtkTag: '职业普攻',
    skillUpgradeTag: '职业技能',
    switchClass: '转职',
    racialAffinity: '种族 -30%',
    boostBtn: '2倍伤害',
    boostSub: '看广告',
    boostActive: '2倍伤害',
    wardBtn: '金币护盾',
    wardActive: '护盾中',
    hasteBtn: '2倍急速',
    hasteActive: '急速中',
    reclaimBtn: '追回失金',
    bossPenaltyBanner: '首领狂暴并掠夺了金币！',
    bossSecondWindCta: '神圣逆转 (广告)',
    autoSkillsLabel: '职业自动技能',
    floorLabel: '第',
    bossTag: '首领',
    heroesHeader: '九大职业',
    heroesSub: '战斗中可花费金币转职 · 角色外观随开局种族变化',
    raceLabel: '种族',
    fighting: '作战中',
    pick: '转职',
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
      '开局时需选择种族，进入游戏后种族与外观即锁定；但在副本中可随时花费金币切换职业！',
      '9 大职业皆有专属「基础攻击」特效与 2 个「自动倒计时技能」，可在升级页分别独立强化。',
      '鼠标悬停于左下角技能图标可查看技能名称与冷却详情。',
      '留意怪物头上的施法警讯！点击预警中的怪物可延迟偷币，或看广告开启金币护盾与追回 150% 失金。',
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
    adWard: '启动 5 分钟金币护盾（免疫敌方偷币）',
    adHaste: '启动 3 分钟 2倍职业自动技能急速',
    adReclaim: '追回 150% 被怪物偷走的副本金币',
    adBossWind: '神圣逆转：首领限时 +15秒 并重创 25% 血量',
    adOffline: '双倍领取离线战利品',
    adWait: '奖励加载中...',
    adClaim: '领取奖励',
    tapDmgShort: '点击',
    dpsShort: '奥义',
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

export interface ArenaLayout {
  mode: 'side' | 'stacked';
  arenaW: number;
  arenaH: number;
  dockW: number;
  dockH: number;
}

export function getArenaLayout(w: number, h: number): ArenaLayout {
  const safeW = Math.max(320, Math.round(w));
  const safeH = Math.max(320, Math.round(h));

  // Side-by-side on desktop, CrazyGames QA (~940px+), landscape tablets, and landscape phones
  const isWideSide = safeW >= 860 && safeW >= safeH * 0.95;
  const isMobileLandscape = safeW < 860 && safeH < 520 && safeW > safeH * 1.2;

  if (isWideSide || isMobileLandscape) {
    const dockW = isMobileLandscape
      ? Math.min(320, Math.max(250, Math.round(safeW * 0.44)))
      : safeW >= 1120
      ? 430
      : safeW >= 960
      ? 390
      : 350;
    const arenaW = Math.max(280, safeW - dockW);
    return {
      mode: 'side',
      arenaW,
      arenaH: safeH,
      dockW: safeW - arenaW,
      dockH: safeH,
    };
  }

  // Stacked top/bottom for Y8 4:3 (760x570) and mobile/tablet portrait
  const arenaH = Math.round(safeH * 0.52);
  return {
    mode: 'stacked',
    arenaW: safeW,
    arenaH,
    dockW: safeW,
    dockH: Math.max(180, safeH - arenaH),
  };
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

export function getBulkGenericCostQuote(
  baseCost: number,
  costMultiplier: number,
  owned: number,
  gold: number,
  buyAmount: BuyAmount
): { count: number; totalCost: number } {
  const costAt = (lv: number) => Math.floor(baseCost * Math.pow(costMultiplier, Math.max(0, lv)));
  if (buyAmount === 1) {
    return { count: 1, totalCost: costAt(owned) };
  }
  if (buyAmount === 10) {
    let total = 0;
    for (let i = 0; i < 10; i++) total += costAt(owned + i);
    return { count: 10, totalCost: total };
  }
  let count = 0;
  let total = 0;
  let cur = owned;
  while (count < 100) {
    const c = costAt(cur);
    if (total + c > gold) break;
    total += c;
    cur++;
    count++;
  }
  if (count === 0) return { count: 1, totalCost: costAt(owned) };
  return { count, totalCost: total };
}

export function getClassUnlockCost(hero: HeroDef, raceId: RaceId): number {
  if (hero.unlockCost <= 0) return 0;
  const race = getRaceById(raceId);
  const affinity = race.classes.includes(hero.id);
  return Math.max(10, Math.floor(hero.unlockCost * (affinity ? 0.7 : 1)));
}

export function getClassSwitchCost(hero: HeroDef, floor: number, raceId: RaceId): number {
  const race = getRaceById(raceId);
  const affinity = race.classes.includes(hero.id);
  const raw = hero.switchCostBase + Math.max(0, floor - 1) * 14;
  return Math.max(15, Math.floor(raw * (affinity ? 0.7 : 1)));
}

export function getClassAttackLevel(save: SaveState, id: HeroId): number {
  return Math.max(1, save.classAttackLevels?.[id] || 1);
}

export function getClassSkillLevel(save: SaveState, skillId: string): number {
  return Math.max(1, save.classSkillLevels?.[skillId] || 1);
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
