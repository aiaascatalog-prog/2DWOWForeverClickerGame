export type GameScreen = 'title' | 'playing' | 'paused';
export type Locale = 'en' | 'zh-TW' | 'zh-CN';
export type DockTab = 'upgrades' | 'heroes' | 'skills' | 'quests' | 'relics' | 'ascension';
export type BuyAmount = 1 | 10 | 'max';

export type HeroId =
  | 'warrior'
  | 'paladin'
  | 'hunter'
  | 'rogue'
  | 'priest'
  | 'shaman'
  | 'mage'
  | 'warlock'
  | 'druid';

export type RaceId =
  | 'human'
  | 'dwarf'
  | 'night_elf'
  | 'gnome'
  | 'skyborne_alliance'
  | 'orc'
  | 'undead'
  | 'tauren'
  | 'troll'
  | 'skyborne_horde';

export type Faction = 'Alliance' | 'Horde';
export type EnemyTier = 'normal' | 'elite' | 'rare' | 'rare_elite' | 'boss';
export type SkillId = 'frenzy' | 'gold_rush' | 'smite';

export interface LocalizedText {
  en: string;
  'zh-TW': string;
  'zh-CN': string;
}

export interface UpgradeDef {
  id: string;
  icon: 'sword' | 'auto' | 'fury' | 'greed' | 'clover' | 'titan';
  name: LocalizedText;
  baseCost: number;
  costMultiplier: number;
  kind: 'tap' | 'dps' | 'allDmg' | 'gold' | 'crit' | 'hybrid';
  baseValue: number;
  hasMilestone25?: boolean;
  accent: string;
}

export interface RaceDef {
  id: RaceId;
  name: LocalizedText;
  faction: Faction;
  classes: HeroId[];
  newClassesInForever: HeroId[];
  traitName: LocalizedText;
  traitDesc: LocalizedText;
  bonus: {
    allDmg?: number;
    tapDmg?: number;
    dps?: number;
    gold?: number;
    critChance?: number;
    critDmg?: number;
    bossDmg?: number;
  };
}

export interface HeroDef {
  id: HeroId;
  name: LocalizedText;
  title: LocalizedText;
  defaultRace: RaceId;
  bonusLabel: (rank: number, locale: Locale) => string;
  unlockCost: number;
  upgradeBaseCost: number;
  upgradeMultiplier: number;
  accent: string;
  projectileColor: string;
}

export interface SkillDef {
  id: SkillId;
  hotkey: '1' | '2' | '3';
  name: LocalizedText;
  description: LocalizedText;
  unlockFloor: number;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  cooldownSec: number;
  baseDurationSec: number;
  basePower: number;
  accent: string;
}

export interface QuestDef {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  target: number;
  rewardGold: number;
  rewardShards?: number;
  getProgress: (state: SaveState) => number;
}

export interface RelicDef {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  baseShardCost: number;
  maxRank: number;
  accent: string;
}

export interface EnemyArchetype {
  id: string;
  spriteId: string;
  name: LocalizedText;
  tier?: EnemyTier;
}

export interface DungeonZone {
  index: number;
  kind: 'zone' | 'dungeon' | 'raid10' | 'raid20' | 'raid40';
  levelRange: string;
  name: LocalizedText;
  wallColor: string;
  wallTrim: string;
  floorColor: string;
  floorAccent: string;
  bannerColor: string;
  torchColor: string;
  enemies: EnemyArchetype[];
  rares: EnemyArchetype[];
  boss: EnemyArchetype;
}

export interface SaveState {
  gold: number;
  lifetimeGold: number;
  floor: number;
  maxFloor: number;
  killsOnFloor: number;
  totalKills: number;
  raresSlain: number;
  bossesSlain: number;
  totalClicks: number;
  totalCrits: number;
  soulShards: number;
  emblems: number;
  ascensionCount: number;
  activeHero: HeroId;
  activeRace: RaceId;
  unlockedHeroes: HeroId[];
  heroRanks: Record<HeroId, number>;
  upgrades: Record<string, number>;
  skillLevels: Record<SkillId, number>;
  relics: Record<string, number>;
  claimedQuests: string[];
  lastSavedAt: number;
}

export interface AdModalState {
  type: 'damage2x' | 'offline';
  secondsLeft: number;
  offlineAmount?: number;
}
