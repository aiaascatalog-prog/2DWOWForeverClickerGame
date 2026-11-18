import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Globe,
  Lock,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { soundEngine } from './audio/synth';
import { ClassSkillTimerState, GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { PixelIcon, PixelIconName, PixelSpriteThumb, SkillPixelIcon } from './components/PixelIcon';
import {
  ASCENSION_MIN_FLOOR,
  BOSS_TIMER_SEC,
  DAMAGE_BOOST_DURATION_SEC,
  EMBLEM_DMG_BONUS,
  EMBLEM_GOLD_BONUS,
  HEROES,
  LOCALE_STORAGE_KEY,
  MONSTERS_PER_FLOOR,
  QUESTS,
  RACES,
  RELICS,
  SAVE_KEY,
  SKILLS,
  UI_COPY,
  UPGRADES,
  calculatePendingEmblems,
  detectDefaultLocale,
  formatNumber,
  getArenaLayout,
  getBulkGenericCostQuote,
  getBulkUpgradeQuote,
  getClassAttackLevel,
  getClassSkillLevel,
  getClassSwitchCost,
  getClassUnlockCost,
  getHeroRank,
  getHeroUpgradeCost,
  getRaceById,
  getRelicCost,
  getSkillLevel,
  getSkillMetrics,
  getSkillUpgradeCost,
  getZoneForFloor,
  isBossFloor,
} from './game/constants';
import {
  AdModalState,
  BuyAmount,
  DockTab,
  GameScreen,
  HeroId,
  Locale,
  RaceId,
  SaveState,
  SkillId,
} from './game/types';
import { platformSDK } from './sdk/crazygames';

const DEFAULT_HERO_RANKS: Record<HeroId, number> = {
  warrior: 1,
  paladin: 1,
  hunter: 1,
  rogue: 1,
  priest: 1,
  shaman: 1,
  mage: 1,
  warlock: 1,
  druid: 1,
};

const DEFAULT_CLASS_ATTACK_LEVELS: Record<HeroId, number> = {
  warrior: 1,
  paladin: 1,
  hunter: 1,
  rogue: 1,
  priest: 1,
  shaman: 1,
  mage: 1,
  warlock: 1,
  druid: 1,
};

const DEFAULT_CLASS_SKILL_LEVELS: Record<string, number> = Object.fromEntries(
  HEROES.flatMap((h) => h.autoSkills.map((sk) => [sk.id, 1]))
);

function createFreshSave(overrides: Partial<SaveState> = {}): SaveState {
  return {
    gold: 0,
    lifetimeGold: 0,
    stolenGoldBank: 0,
    floor: 1,
    maxFloor: 1,
    killsOnFloor: 0,
    totalKills: 0,
    raresSlain: 0,
    bossesSlain: 0,
    totalClicks: 0,
    totalCrits: 0,
    soulShards: 0,
    emblems: 0,
    ascensionCount: 0,
    activeHero: 'warrior',
    activeRace: 'human',
    raceLocked: false,
    unlockedHeroes: ['warrior'],
    heroRanks: { ...DEFAULT_HERO_RANKS },
    classAttackLevels: { ...DEFAULT_CLASS_ATTACK_LEVELS },
    classSkillLevels: { ...DEFAULT_CLASS_SKILL_LEVELS },
    upgrades: {},
    skillLevels: {
      frenzy: 0,
      gold_rush: 0,
      smite: 0,
    },
    relics: {},
    claimedQuests: [],
    lastSavedAt: Date.now(),
    ...overrides,
  };
}

function loadLocalSave(): SaveState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveState>;
      if (typeof parsed.gold === 'number') {
        const activeHero: HeroId = parsed.activeHero ?? 'warrior';
        const activeDef = HEROES.find((h) => h.id === activeHero) || HEROES[0];
        const legacyBladeLv = parsed.upgrades?.sharp_blade ?? 1;
        const legacyAutoLv = parsed.upgrades?.auto_attack ?? 0;

        const classAttackLevels: Record<HeroId, number> = {
          ...DEFAULT_CLASS_ATTACK_LEVELS,
          ...(parsed.classAttackLevels ?? {}),
        };
        if (!parsed.classAttackLevels && legacyBladeLv > 1) {
          classAttackLevels[activeHero] = legacyBladeLv;
        }

        const classSkillLevels: Record<string, number> = {
          ...DEFAULT_CLASS_SKILL_LEVELS,
          ...(parsed.classSkillLevels ?? {}),
        };
        if (!parsed.classSkillLevels && legacyAutoLv > 0) {
          for (const sk of activeDef.autoSkills) {
            classSkillLevels[sk.id] = 1 + legacyAutoLv;
          }
        }

        const inferredRaceLocked =
          typeof parsed.raceLocked === 'boolean'
            ? parsed.raceLocked
            : (parsed.totalKills ?? 0) > 0 ||
              (parsed.floor ?? 1) > 1 ||
              (parsed.totalClicks ?? 0) > 0 ||
              (parsed.ascensionCount ?? 0) > 0;

        return createFreshSave({
          ...parsed,
          activeHero,
          raceLocked: inferredRaceLocked,
          stolenGoldBank: typeof parsed.stolenGoldBank === 'number' ? parsed.stolenGoldBank : 0,
          unlockedHeroes:
            Array.isArray(parsed.unlockedHeroes) && parsed.unlockedHeroes.length > 0
              ? parsed.unlockedHeroes
              : ['warrior'],
          heroRanks: {
            ...DEFAULT_HERO_RANKS,
            ...(parsed.heroRanks ?? {}),
          },
          classAttackLevels,
          classSkillLevels,
          upgrades: parsed.upgrades ?? {},
          skillLevels: {
            frenzy: 0,
            gold_rush: 0,
            smite: 0,
            ...(parsed.skillLevels ?? {}),
          },
          relics: parsed.relics ?? {},
          claimedQuests: Array.isArray(parsed.claimedQuests) ? parsed.claimedQuests : [],
        });
      }
    }
  } catch {
    // ignore corrupted save
  }
  return createFreshSave();
}

const TAB_ORDER: { id: DockTab; icon: PixelIconName; label: string }[] = [
  { id: 'upgrades', icon: 'tab_upgrades', label: 'Upgrades' },
  { id: 'heroes', icon: 'tab_heroes', label: 'Heroes' },
  { id: 'skills', icon: 'tab_skills', label: 'Skills' },
  { id: 'quests', icon: 'tab_quests', label: 'Quests' },
  { id: 'relics', icon: 'tab_relics', label: 'Relics' },
  { id: 'ascension', icon: 'tab_ascension', label: 'Ascension' },
];

export default function App() {
  const isTrailerMode = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('trailer') === '1',
    []
  );

  const [locale, setLocale] = useState<Locale>(() => detectDefaultLocale());
  const [screen, setScreen] = useState<GameScreen>(() => (isTrailerMode ? 'playing' : 'title'));
  const [save, setSave] = useState<SaveState>(() => loadLocalSave());
  const [muted, setMuted] = useState(false);
  const [dockTab, setDockTab] = useState<DockTab>('upgrades');
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [damage2xLeft, setDamage2xLeft] = useState(0);
  const [coinWardLeft, setCoinWardLeft] = useState(0);
  const [haste2xLeft, setHaste2xLeft] = useState(0);
  const [bossSecondWindLeft, setBossSecondWindLeft] = useState(0);
  const [classSkillTimers, setClassSkillTimers] = useState<ClassSkillTimerState[]>([]);
  const [skillActiveLeft, setSkillActiveLeft] = useState<Record<SkillId, number>>({
    frenzy: 0,
    gold_rush: 0,
    smite: 0,
  });
  const [skillCdLeft, setSkillCdLeft] = useState<Record<SkillId, number>>({
    frenzy: 0,
    gold_rush: 0,
    smite: 0,
  });
  const [bossSecondsLeft, setBossSecondsLeft] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [adModal, setAdModal] = useState<AdModalState | null>(null);
  const [offlinePending, setOfflinePending] = useState<number | null>(null);
  const [toastTitle, setToastTitle] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [viewport, setViewport] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));

  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<GameCanvasHandle | null>(null);
  const comboRef = useRef(0);
  const lastClickRef = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;

  const t = UI_COPY[locale];

  const activeHeroDef = useMemo(
    () => HEROES.find((h) => h.id === save.activeHero) || HEROES[0],
    [save.activeHero]
  );

  // Derived RPG Combat Stats
  const stats = useMemo(() => {
    const primaryLv = getClassAttackLevel(save, save.activeHero);
    const furyLv = save.upgrades.fury || 0;
    const greedLv = save.upgrades.greed || 0;
    const critLv = save.upgrades.crit_luck || 0;
    const titanLv = save.upgrades.titan_grip || 0;

    // 25-level milestone multipliers
    const primaryMilestone = Math.pow(2, Math.floor(primaryLv / 25));
    const titanMilestone = Math.pow(2, Math.floor(titanLv / 25));

    const baseTap =
      (1 + primaryLv * 1.8 * primaryMilestone + titanLv * 32 * titanMilestone) *
      activeHeroDef.primaryAttack.powerMult;

    // Hero Class Aura (from active FIGHTING class among all 9 classes)
    const activeHeroRank = getHeroRank(save, save.activeHero);
    let heroTapMult = 1;
    let heroDpsMult = 1;
    let heroAllDmgMult = 1;
    let heroGoldMult = 1;
    let heroCritBonus = 0;
    let heroCritDmgBonus = 0;
    let heroBossDmgMult = 1;

    if (save.activeHero === 'warrior') {
      heroTapMult += 0.3 + (activeHeroRank - 1) * 0.15;
    } else if (save.activeHero === 'hunter') {
      heroCritBonus += 0.1 + (activeHeroRank - 1) * 0.02;
    } else if (save.activeHero === 'priest') {
      heroBossDmgMult += 0.45 + (activeHeroRank - 1) * 0.25;
    } else if (save.activeHero === 'mage') {
      heroDpsMult += 0.6 + (activeHeroRank - 1) * 0.3;
    } else if (save.activeHero === 'rogue') {
      heroGoldMult += 0.6 + (activeHeroRank - 1) * 0.25;
    } else if (save.activeHero === 'shaman') {
      const val = 0.5 + (activeHeroRank - 1) * 0.25;
      heroTapMult += val;
      heroDpsMult += val;
    } else if (save.activeHero === 'paladin') {
      heroAllDmgMult += 0.75 + (activeHeroRank - 1) * 0.35;
    } else if (save.activeHero === 'druid') {
      const val = 0.85 + (activeHeroRank - 1) * 0.35;
      heroAllDmgMult += val;
      heroGoldMult += val * 0.6;
    } else if (save.activeHero === 'warlock') {
      heroCritDmgBonus += 1.2 + (activeHeroRank - 1) * 0.45;
    }

    // Active Race Trait Bonus
    const race = getRaceById(save.activeRace);
    heroTapMult += race.bonus.tapDmg || 0;
    heroDpsMult += race.bonus.dps || 0;
    heroAllDmgMult += race.bonus.allDmg || 0;
    heroGoldMult += race.bonus.gold || 0;
    heroCritBonus += race.bonus.critChance || 0;
    heroCritDmgBonus += race.bonus.critDmg || 0;
    heroBossDmgMult += race.bonus.bossDmg || 0;

    // Relics
    const totemRank = save.relics.warchief_totem || 0;
    const coinRank = save.relics.gadgetzan_coin || 0;
    const frostRank = save.relics.runeblade_shard || 0;
    const kirinRank = save.relics.kirin_crystal || 0;
    const heartRank = save.relics.heart_azeroth || 0;

    const emblemDmgMult = 1 + save.emblems * EMBLEM_DMG_BONUS;
    const emblemGoldMult = 1 + save.emblems * EMBLEM_GOLD_BONUS;

    const allDmgMult =
      (1 + furyLv * 0.25) *
      heroAllDmgMult *
      (1 + totemRank * 0.4) *
      emblemDmgMult *
      (damage2xLeft > 0 ? 2 : 1);

    const frenzyMetrics = getSkillMetrics(SKILLS[0], getSkillLevel(save, 'frenzy'));
    const frenzyMult = skillActiveLeft.frenzy > 0 ? frenzyMetrics.power : 1;

    const goldRushMetrics = getSkillMetrics(SKILLS[1], getSkillLevel(save, 'gold_rush'));
    const goldRushMult = skillActiveLeft.gold_rush > 0 ? goldRushMetrics.power : 1;

    const tapDamage =
      baseTap * heroTapMult * (1 + frostRank * 0.5) * allDmgMult * frenzyMult;

    const critChance = Math.min(0.8, 0.05 + critLv * 0.03 + heroCritBonus);
    const critMultiplier = 5 + heroCritDmgBonus;
    const goldMultiplier =
      (1 + greedLv * 0.25) *
      heroGoldMult *
      (1 + coinRank * 0.4) *
      emblemGoldMult *
      goldRushMult;

    const cdScale = Math.max(0.35, 1 - heartRank * 0.08);
    const hasteMult = haste2xLeft > 0 ? 0.5 : 1;

    // Independent scaling for each of the active class's 2 countdown skills
    const computeSkillSlot = (idx: 0 | 1) => {
      const sk = activeHeroDef.autoSkills[idx];
      const skLv = getClassSkillLevel(save, sk.id);
      const skMilestone = Math.pow(2, Math.floor(skLv / 25));
      const baseSkPower = 3 + (skLv - 1) * 4.5 * skMilestone + titanLv * 48 * titanMilestone;
      const power = baseSkPower * heroDpsMult * (1 + kirinRank * 0.5) * allDmgMult;
      const lvCdBonus = Math.max(0.75, 1 - (skLv - 1) * 0.015);
      const effCdScale = Math.max(0.25, cdScale * lvCdBonus * hasteMult);
      return { power, effCdScale };
    };

    const slot0 = computeSkillSlot(0);
    const slot1 = computeSkillSlot(1);
    const skillPowers: [number, number] = [slot0.power, slot1.power];
    const skillCdScales: [number, number] = [slot0.effCdScale, slot1.effCdScale];

    const dps = ([0, 1] as const).reduce<number>((acc, idx) => {
      const sk = activeHeroDef.autoSkills[idx];
      const effMult = sk.aoe ? sk.damageMult * 2.1 : sk.damageMult;
      const critEv =
        sk.special === 'crit_guaranteed'
          ? critMultiplier
          : 1 + critChance * (critMultiplier - 1);
      const avgHit = skillPowers[idx] * effMult * critEv;
      return acc + avgHit / Math.max(0.4, sk.cooldownSec * skillCdScales[idx]);
    }, 0);

    const bossTimerBonusSec = heartRank * 3;

    return {
      tapDamage,
      skillPowers,
      skillCdScales,
      dps,
      allDmgMult,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMult: heroBossDmgMult,
      cdScale,
      bossTimerBonusSec,
    };
  }, [save, activeHeroDef, damage2xLeft, haste2xLeft, skillActiveLeft.frenzy, skillActiveLeft.gold_rush]);

  const { zone: currentZone, tier: zoneTier } = useMemo(
    () => getZoneForFloor(save.floor),
    [save.floor]
  );

  const claimableQuestsCount = useMemo(() => {
    const claimed = new Set(save.claimedQuests);
    return QUESTS.filter((q) => !claimed.has(q.id) && q.getProgress(save) >= q.target).length;
  }, [save]);

  const pendingEmblems = useMemo(() => calculatePendingEmblems(save), [save]);

  // CrazyGames SDK init
  useEffect(() => {
    let active = true;
    platformSDK.init().then(async () => {
      if (!active) return;
      const cloudRaw = await platformSDK.loadCloudData(SAVE_KEY);
      if (cloudRaw && active) {
        try {
          const parsed = JSON.parse(cloudRaw) as SaveState;
          if (typeof parsed.lifetimeGold === 'number' && parsed.lifetimeGold > saveRef.current.lifetimeGold) {
            setSave(createFreshSave(parsed));
          }
        } catch {
          // ignore
        }
      }
      if (isTrailerMode) platformSDK.gameplayStart();
    });
    return () => {
      active = false;
    };
  }, [isTrailerMode]);

  // Offline Gold check on mount
  useEffect(() => {
    if (isTrailerMode) return;
    const elapsedSec = Math.floor((Date.now() - save.lastSavedAt) / 1000);
    if (elapsedSec >= 25 && stats.dps > 0) {
      const capped = Math.min(elapsedSec, 8 * 3600);
      const estGold = Math.floor(capped * (stats.dps / Math.max(10, save.floor * 5)) * 2.5);
      if (estGold >= 20) setOfflinePending(estGold);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save every 5s
  useEffect(() => {
    const id = setInterval(() => {
      const payload = JSON.stringify({ ...saveRef.current, lastSavedAt: Date.now() });
      platformSDK.saveCloudData(SAVE_KEY, payload);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Clear toast
  useEffect(() => {
    if (!toastTitle) return;
    const id = setTimeout(() => setToastTitle(null), 3000);
    return () => clearTimeout(id);
  }, [toastTitle]);

  // Pause Web Audio automatically when tab/iframe loses visibility (CrazyGames / Y8 QA)
  useEffect(() => {
    const handleVisibility = () => {
      soundEngine.setAdPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Buff & Skill cooldown tick (10Hz)
  useEffect(() => {
    if (screen !== 'playing' || adModal || offlinePending || showHelp) return;
    const id = setInterval(() => {
      setDamage2xLeft((prev) => (prev > 0 ? Math.max(0, prev - 0.1) : 0));
      setCoinWardLeft((prev) => (prev > 0 ? Math.max(0, prev - 0.1) : 0));
      setHaste2xLeft((prev) => (prev > 0 ? Math.max(0, prev - 0.1) : 0));
      setBossSecondWindLeft((prev) => (prev > 0 ? Math.max(0, prev - 0.1) : 0));
      setSkillActiveLeft((prev) => ({
        frenzy: prev.frenzy > 0 ? Math.max(0, prev.frenzy - 0.1) : 0,
        gold_rush: prev.gold_rush > 0 ? Math.max(0, prev.gold_rush - 0.1) : 0,
        smite: 0,
      }));
      setSkillCdLeft((prev) => ({
        frenzy: prev.frenzy > 0 ? Math.max(0, prev.frenzy - 0.1) : 0,
        gold_rush: prev.gold_rush > 0 ? Math.max(0, prev.gold_rush - 0.1) : 0,
        smite: prev.smite > 0 ? Math.max(0, prev.smite - 0.1) : 0,
      }));
    }, 100);
    return () => clearInterval(id);
  }, [screen, adModal, offlinePending, showHelp]);

  // Fallback Ad modal countdown
  useEffect(() => {
    if (!adModal || adModal.secondsLeft <= 0) return;
    const id = setTimeout(() => {
      setAdModal((prev) => (prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null));
    }, 1000);
    return () => clearTimeout(id);
  }, [adModal]);

  // Sync viewport size with root container (CrazyGames QA iframe, mobile rotation, fullscreen)
  useEffect(() => {
    const updateSize = () => {
      const el = rootRef.current;
      const w = el && el.clientWidth > 0 ? el.clientWidth : window.innerWidth;
      const h = el && el.clientHeight > 0 ? el.clientHeight : window.innerHeight;
      setViewport((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    if (rootRef.current) ro?.observe(rootRef.current);
    return () => {
      window.removeEventListener('resize', updateSize);
      ro?.disconnect();
    };
  }, []);

  const enterGame = useCallback(() => {
    setSave((prev) => (prev.raceLocked ? prev : { ...prev, raceLocked: true }));
    setScreen('playing');
    soundEngine.playUpgrade();
    if (offlinePending === null) {
      platformSDK.gameplayStart();
    } else {
      platformSDK.gameplayStop();
    }
  }, [offlinePending]);

  const openHelp = useCallback(() => {
    setShowHelp(true);
    if (screen === 'playing') platformSDK.gameplayStop();
  }, [screen]);

  const closeHelp = useCallback(() => {
    setShowHelp(false);
    if (screen === 'playing') platformSDK.gameplayStart();
  }, [screen]);

  const togglePause = useCallback(() => {
    setScreen((prev) => {
      const next = prev === 'playing' ? 'paused' : 'playing';
      if (next === 'paused') platformSDK.gameplayStop();
      else platformSDK.gameplayStart();
      setConfirmReset(false);
      return next;
    });
  }, []);

  const handleTapStats = useCallback((isCrit: boolean) => {
    const now = performance.now();
    if (now - lastClickRef.current < 450) {
      comboRef.current = Math.min(comboRef.current + 1, 18);
    } else {
      comboRef.current = 0;
    }
    lastClickRef.current = now;
    soundEngine.playClick(isCrit, comboRef.current);

    setSave((prev) => ({
      ...prev,
      totalClicks: prev.totalClicks + 1,
      totalCrits: prev.totalCrits + (isCrit ? 1 : 0),
    }));
  }, []);

  const handleEnemySlain = useCallback((goldEarned: number, isBoss: boolean, isRare: boolean) => {
    soundEngine.playEnemyDefeat(isBoss);
    if (isBoss || isRare) {
      platformSDK.happytime();
    }
    if (isBoss) {
      setBossSecondWindLeft(0);
    }

    setSave((prev) => {
      const nextKillsOnFloor = prev.killsOnFloor + 1;
      const bossFloor = isBossFloor(prev.floor);
      const floorDone = bossFloor ? isBoss : nextKillsOnFloor >= MONSTERS_PER_FLOOR;
      const nextFloor = floorDone ? prev.floor + 1 : prev.floor;
      const shardsGained = isBoss ? Math.max(1, Math.floor(prev.floor / 5)) : isRare ? 1 : 0;

      if (isBoss && shardsGained > 0) {
        setToastTitle(`Boss Slain! +${shardsGained} Soul Shard${shardsGained > 1 ? 's' : ''}`);
      } else if (isRare) {
        setToastTitle('Rare Elite Slain! +1 Soul Shard');
      }

      return {
        ...prev,
        gold: prev.gold + goldEarned,
        lifetimeGold: prev.lifetimeGold + goldEarned,
        floor: nextFloor,
        maxFloor: Math.max(prev.maxFloor, nextFloor),
        killsOnFloor: floorDone ? 0 : nextKillsOnFloor,
        totalKills: prev.totalKills + 1,
        raresSlain: prev.raresSlain + (isRare ? 1 : 0),
        bossesSlain: prev.bossesSlain + (isBoss ? 1 : 0),
        soulShards: prev.soulShards + shardsGained,
      };
    });
  }, []);

  const handleEnemyCounterAttack = useCallback(
    (stealRatio: number, enemyName: string, isBoss: boolean) => {
      setSave((prev) => {
        const lost = prev.gold > 0 ? Math.max(1, Math.floor(prev.gold * stealRatio)) : 0;
        if (lost > 0) {
          canvasRef.current?.spawnGoldLostPopup(lost);
          setToastTitle(
            locale === 'en'
              ? `${enemyName} stole ${formatNumber(lost)}g!`
              : `${enemyName} 偷走了 ${formatNumber(lost)} 金幣！`
          );
        }
        return {
          ...prev,
          gold: Math.max(0, prev.gold - lost),
          stolenGoldBank: prev.stolenGoldBank + lost,
        };
      });
      if (isBoss) {
        canvasRef.current?.triggerShake(9);
      }
    },
    [locale]
  );

  const handleBossTimeoutPenalty = useCallback((stealRatio: number) => {
    setBossSecondWindLeft(10);
    setSave((prev) => {
      const lost = prev.gold > 0 ? Math.max(1, Math.floor(prev.gold * stealRatio)) : 0;
      if (lost > 0) {
        canvasRef.current?.spawnGoldLostPopup(lost);
      }
      return {
        ...prev,
        gold: Math.max(0, prev.gold - lost),
        stolenGoldBank: prev.stolenGoldBank + lost,
      };
    });
  }, []);

  const handleClassSkillBonusGold = useCallback((goldBonus: number) => {
    if (goldBonus <= 0) return;
    setSave((prev) => ({
      ...prev,
      gold: prev.gold + goldBonus,
      lifetimeGold: prev.lifetimeGold + goldBonus,
    }));
  }, []);

  const buyUpgrade = useCallback(
    (id: string) => {
      const def = UPGRADES.find((u) => u.id === id);
      if (!def) return;
      setSave((prev) => {
        const owned = prev.upgrades[id] || 0;
        const { count, totalCost } = getBulkUpgradeQuote(def, owned, prev.gold, buyAmount);
        if (prev.gold < totalCost || count <= 0) return prev;
        soundEngine.playUpgrade();
        return {
          ...prev,
          gold: prev.gold - totalCost,
          upgrades: { ...prev.upgrades, [id]: owned + count },
        };
      });
    },
    [buyAmount]
  );

  const buyPrimaryAttack = useCallback(() => {
    setSave((prev) => {
      const hero = HEROES.find((h) => h.id === prev.activeHero) || HEROES[0];
      const curLv = getClassAttackLevel(prev, hero.id);
      const { count, totalCost } = getBulkGenericCostQuote(
        hero.primaryAttack.baseCost,
        1.15,
        curLv - 1,
        prev.gold,
        buyAmount
      );
      if (prev.gold < totalCost || count <= 0) return prev;
      soundEngine.playUpgrade();
      return {
        ...prev,
        gold: prev.gold - totalCost,
        classAttackLevels: {
          ...prev.classAttackLevels,
          [hero.id]: curLv + count,
        },
      };
    });
  }, [buyAmount]);

  const buyClassSkill = useCallback(
    (skillIndex: 0 | 1) => {
      setSave((prev) => {
        const hero = HEROES.find((h) => h.id === prev.activeHero) || HEROES[0];
        const sk = hero.autoSkills[skillIndex];
        const curLv = getClassSkillLevel(prev, sk.id);
        const { count, totalCost } = getBulkGenericCostQuote(
          sk.upgradeBaseCost,
          1.17,
          curLv - 1,
          prev.gold,
          buyAmount
        );
        if (prev.gold < totalCost || count <= 0) return prev;
        soundEngine.playUpgrade();
        return {
          ...prev,
          gold: prev.gold - totalCost,
          classSkillLevels: {
            ...prev.classSkillLevels,
            [sk.id]: curLv + count,
          },
        };
      });
    },
    [buyAmount]
  );

  const selectOrUnlockHero = useCallback((heroId: HeroId) => {
    const def = HEROES.find((h) => h.id === heroId);
    if (!def) return;
    setSave((prev) => {
      if (prev.activeHero === heroId) return prev;

      if (prev.unlockedHeroes.includes(heroId)) {
        const switchCost = getClassSwitchCost(def, prev.floor, prev.activeRace);
        if (prev.gold < switchCost) return prev;
        soundEngine.playUpgrade();
        return {
          ...prev,
          gold: prev.gold - switchCost,
          activeHero: heroId,
        };
      }

      const unlockCost = getClassUnlockCost(def, prev.activeRace);
      if (prev.gold < unlockCost) return prev;
      soundEngine.playAchievement();
      platformSDK.happytime();
      return {
        ...prev,
        gold: prev.gold - unlockCost,
        unlockedHeroes: [...prev.unlockedHeroes, heroId],
        activeHero: heroId,
      };
    });
  }, []);

  const selectRace = useCallback((raceId: RaceId) => {
    setSave((prev) => {
      if (prev.raceLocked) return prev;
      soundEngine.playUpgrade();
      return {
        ...prev,
        activeRace: raceId,
      };
    });
  }, []);

  const upgradeHero = useCallback((heroId: HeroId, e: React.MouseEvent) => {
    e.stopPropagation();
    const def = HEROES.find((h) => h.id === heroId);
    if (!def) return;
    setSave((prev) => {
      if (!prev.unlockedHeroes.includes(heroId)) return prev;
      const curRank = getHeroRank(prev, heroId);
      const cost = getHeroUpgradeCost(def, curRank);
      if (prev.gold < cost) return prev;
      soundEngine.playUpgrade();
      return {
        ...prev,
        gold: prev.gold - cost,
        heroRanks: { ...prev.heroRanks, [heroId]: curRank + 1 },
      };
    });
  }, []);

  const upgradeSkill = useCallback((skillId: SkillId) => {
    const def = SKILLS.find((s) => s.id === skillId);
    if (!def) return;
    setSave((prev) => {
      const curLv = getSkillLevel(prev, skillId);
      if (prev.maxFloor < def.unlockFloor || curLv >= def.maxLevel) return prev;
      const cost = getSkillUpgradeCost(def, curLv);
      if (prev.gold < cost) return prev;
      soundEngine.playUpgrade();
      return {
        ...prev,
        gold: prev.gold - cost,
        skillLevels: { ...prev.skillLevels, [skillId]: curLv + 1 },
      };
    });
  }, []);

  const castSkill = useCallback(
    (skillId: SkillId) => {
      const def = SKILLS.find((s) => s.id === skillId);
      if (!def) return;
      const lv = getSkillLevel(saveRef.current, skillId);
      if (lv <= 0 || skillCdLeft[skillId] > 0) return;

      const metrics = getSkillMetrics(def, lv);
      soundEngine.playSkillCast();

      const cd = Math.max(5, Math.round(def.cooldownSec * stats.cdScale));
      setSkillCdLeft((prev) => ({ ...prev, [skillId]: cd }));

      if (skillId === 'smite') {
        const burstDmg = Math.max(10, stats.tapDamage * metrics.power);
        canvasRef.current?.triggerSmite(burstDmg);
      } else {
        setSkillActiveLeft((prev) => ({ ...prev, [skillId]: metrics.duration }));
        canvasRef.current?.triggerShake(8);
      }
    },
    [skillCdLeft, stats.cdScale, stats.tapDamage]
  );

  const claimQuest = useCallback((questId: string) => {
    const q = QUESTS.find((item) => item.id === questId);
    if (!q) return;
    setSave((prev) => {
      if (prev.claimedQuests.includes(questId) || q.getProgress(prev) < q.target) return prev;
      soundEngine.playAchievement();
      platformSDK.happytime();
      return {
        ...prev,
        gold: prev.gold + q.rewardGold,
        lifetimeGold: prev.lifetimeGold + q.rewardGold,
        soulShards: prev.soulShards + (q.rewardShards || 0),
        claimedQuests: [...prev.claimedQuests, questId],
      };
    });
  }, []);

  const buyRelic = useCallback((relicId: string) => {
    const r = RELICS.find((item) => item.id === relicId);
    if (!r) return;
    setSave((prev) => {
      const curRank = prev.relics[relicId] || 0;
      if (curRank >= r.maxRank) return prev;
      const cost = getRelicCost(r.baseShardCost, curRank);
      if (prev.soulShards < cost) return prev;
      soundEngine.playAchievement();
      return {
        ...prev,
        soulShards: prev.soulShards - cost,
        relics: { ...prev.relics, [relicId]: curRank + 1 },
      };
    });
  }, []);

  const triggerAscension = useCallback(() => {
    if (pendingEmblems <= 0) return;
    soundEngine.playPrestige();
    platformSDK.happytime();
    canvasRef.current?.triggerShake(12);
    canvasRef.current?.resetFloorWave(1);
    setSave((prev) => {
      const gained = calculatePendingEmblems(prev);
      if (gained <= 0) return prev;
      return createFreshSave({
        emblems: prev.emblems + gained,
        ascensionCount: prev.ascensionCount + 1,
        soulShards: prev.soulShards,
        relics: prev.relics,
        unlockedHeroes: prev.unlockedHeroes,
        activeHero: prev.activeHero,
        activeRace: prev.activeRace,
        raceLocked: true,
        heroRanks: prev.heroRanks,
        claimedQuests: prev.claimedQuests,
        totalKills: prev.totalKills,
        raresSlain: prev.raresSlain,
        bossesSlain: prev.bossesSlain,
        totalClicks: prev.totalClicks,
        totalCrits: prev.totalCrits,
        maxFloor: prev.maxFloor,
      });
    });
    setSkillActiveLeft({ frenzy: 0, gold_rush: 0, smite: 0 });
    setSkillCdLeft({ frenzy: 0, gold_rush: 0, smite: 0 });
    setCoinWardLeft(0);
    setHaste2xLeft(0);
    setBossSecondWindLeft(0);
    setDockTab('upgrades');
    setToastTitle(`Ascended! +${pendingEmblems} Heroic Emblem${pendingEmblems > 1 ? 's' : ''}`);
  }, [pendingEmblems]);

  const startDamage2xAd = useCallback(() => {
    if (damage2xLeft > 0) return;
    if (isTrailerMode) {
      setDamage2xLeft(DAMAGE_BOOST_DURATION_SEC);
      soundEngine.playSkillCast();
      return;
    }
    platformSDK.requestRewardedAd(
      () => {
        setDamage2xLeft(DAMAGE_BOOST_DURATION_SEC);
        soundEngine.playSkillCast();
        platformSDK.happytime();
      },
      () => {
        platformSDK.gameplayStop();
        setAdModal({ type: 'damage2x', secondsLeft: 3 });
      }
    );
  }, [damage2xLeft, isTrailerMode]);

  const startCoinWardAd = useCallback(() => {
    if (coinWardLeft > 0) return;
    if (isTrailerMode) {
      setCoinWardLeft(DAMAGE_BOOST_DURATION_SEC);
      soundEngine.playShieldBlock();
      return;
    }
    platformSDK.requestRewardedAd(
      () => {
        setCoinWardLeft(DAMAGE_BOOST_DURATION_SEC);
        soundEngine.playShieldBlock();
        platformSDK.happytime();
      },
      () => {
        platformSDK.gameplayStop();
        setAdModal({ type: 'coin_ward', secondsLeft: 3 });
      }
    );
  }, [coinWardLeft, isTrailerMode]);

  const startHaste2xAd = useCallback(() => {
    if (haste2xLeft > 0) return;
    if (isTrailerMode) {
      setHaste2xLeft(180);
      soundEngine.playSkillCast();
      return;
    }
    platformSDK.requestRewardedAd(
      () => {
        setHaste2xLeft(180);
        soundEngine.playSkillCast();
        platformSDK.happytime();
      },
      () => {
        platformSDK.gameplayStop();
        setAdModal({ type: 'haste2x', secondsLeft: 3 });
      }
    );
  }, [haste2xLeft, isTrailerMode]);

  const startReclaimGoldAd = useCallback(() => {
    const bank = saveRef.current.stolenGoldBank;
    if (bank <= 0) return;
    const reclaimAmount = Math.max(15, Math.ceil(bank * 1.5));
    if (isTrailerMode) {
      soundEngine.playGoldenCatch();
      setSave((prev) => ({
        ...prev,
        gold: prev.gold + reclaimAmount,
        lifetimeGold: prev.lifetimeGold + reclaimAmount,
        stolenGoldBank: 0,
      }));
      setToastTitle(`+${formatNumber(reclaimAmount)}g Reclaimed!`);
      return;
    }
    platformSDK.requestRewardedAd(
      () => {
        soundEngine.playGoldenCatch();
        platformSDK.happytime();
        setSave((prev) => ({
          ...prev,
          gold: prev.gold + reclaimAmount,
          lifetimeGold: prev.lifetimeGold + reclaimAmount,
          stolenGoldBank: 0,
        }));
        setToastTitle(`+${formatNumber(reclaimAmount)}g Reclaimed!`);
      },
      () => {
        platformSDK.gameplayStop();
        setAdModal({ type: 'reclaim_gold', secondsLeft: 3, reclaimAmount });
      }
    );
  }, [isTrailerMode]);

  const startBossSecondWindAd = useCallback(() => {
    if (isTrailerMode) {
      canvasRef.current?.triggerBossSecondWind();
      setBossSecondWindLeft(0);
      soundEngine.playSkillCast();
      return;
    }
    platformSDK.requestRewardedAd(
      () => {
        canvasRef.current?.triggerBossSecondWind();
        setBossSecondWindLeft(0);
        soundEngine.playSkillCast();
        platformSDK.happytime();
      },
      () => {
        platformSDK.gameplayStop();
        setAdModal({ type: 'boss_second_wind', secondsLeft: 3 });
      }
    );
  }, [isTrailerMode]);

  const startOfflineDoubleAd = useCallback(() => {
    if (!offlinePending) return;
    const amount = offlinePending;
    platformSDK.requestRewardedAd(
      () => {
        soundEngine.playGoldenCatch();
        setSave((prev) => ({
          ...prev,
          gold: prev.gold + amount * 2,
          lifetimeGold: prev.lifetimeGold + amount * 2,
        }));
        setOfflinePending(null);
      },
      () => {
        platformSDK.gameplayStop();
        setAdModal({ type: 'offline', secondsLeft: 3, offlineAmount: amount });
      }
    );
  }, [offlinePending]);

  const claimAdReward = useCallback(() => {
    if (!adModal || adModal.secondsLeft > 0) return;
    if (adModal.type === 'damage2x') {
      setDamage2xLeft(DAMAGE_BOOST_DURATION_SEC);
      soundEngine.playSkillCast();
      platformSDK.happytime();
    } else if (adModal.type === 'coin_ward') {
      setCoinWardLeft(DAMAGE_BOOST_DURATION_SEC);
      soundEngine.playShieldBlock();
      platformSDK.happytime();
    } else if (adModal.type === 'haste2x') {
      setHaste2xLeft(180);
      soundEngine.playSkillCast();
      platformSDK.happytime();
    } else if (adModal.type === 'reclaim_gold' && adModal.reclaimAmount) {
      const amount = adModal.reclaimAmount;
      soundEngine.playGoldenCatch();
      platformSDK.happytime();
      setSave((prev) => ({
        ...prev,
        gold: prev.gold + amount,
        lifetimeGold: prev.lifetimeGold + amount,
        stolenGoldBank: 0,
      }));
      setToastTitle(`+${formatNumber(amount)}g Reclaimed!`);
    } else if (adModal.type === 'boss_second_wind') {
      canvasRef.current?.triggerBossSecondWind();
      setBossSecondWindLeft(0);
      soundEngine.playSkillCast();
      platformSDK.happytime();
    } else if (adModal.type === 'offline' && adModal.offlineAmount) {
      const doubled = adModal.offlineAmount * 2;
      soundEngine.playGoldenCatch();
      setSave((prev) => ({
        ...prev,
        gold: prev.gold + doubled,
        lifetimeGold: prev.lifetimeGold + doubled,
      }));
      setOfflinePending(null);
    }
    setAdModal(null);
    platformSDK.gameplayStart();
  }, [adModal]);

  const claimOfflineNormal = useCallback(() => {
    if (!offlinePending) return;
    soundEngine.playUpgrade();
    setSave((prev) => ({
      ...prev,
      gold: prev.gold + offlinePending,
      lifetimeGold: prev.lifetimeGold + offlinePending,
    }));
    setOfflinePending(null);
    platformSDK.gameplayStart();
  }, [offlinePending]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const cycleLocale = useCallback(() => {
    setLocale((prev) => {
      const next: Locale = prev === 'en' ? 'zh-TW' : prev === 'zh-TW' ? 'zh-CN' : 'en';
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resetSave = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const fresh = createFreshSave();
    setSave(fresh);
    setDamage2xLeft(0);
    setCoinWardLeft(0);
    setHaste2xLeft(0);
    setBossSecondWindLeft(0);
    setSkillActiveLeft({ frenzy: 0, gold_rush: 0, smite: 0 });
    setSkillCdLeft({ frenzy: 0, gold_rush: 0, smite: 0 });
    setConfirmReset(false);
    platformSDK.saveCloudData(SAVE_KEY, JSON.stringify(fresh));
    canvasRef.current?.resetFloorWave(1);
    setScreen('title');
    platformSDK.gameplayStop();
  }, [confirmReset]);

  const cycleTab = (dir: -1 | 1) => {
    const idx = TAB_ORDER.findIndex((item) => item.id === dockTab);
    const nextIdx = (idx + dir + TAB_ORDER.length) % TAB_ORDER.length;
    setDockTab(TAB_ORDER[nextIdx].id);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.repeat) return;

      if (screen === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') enterGame();
        return;
      }

      if (e.code === 'Escape') {
        if (showHelp) setShowHelp(false);
        else togglePause();
        return;
      }

      if (screen !== 'playing' || adModal || offlinePending || showHelp) return;

      if (e.code === 'Space') {
        canvasRef.current?.triggerPlayerAttack();
      } else if (e.key === '1') {
        castSkill('frenzy');
      } else if (e.key === '2') {
        castSkill('gold_rush');
      } else if (e.key === '3') {
        castSkill('smite');
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, adModal, offlinePending, showHelp, enterGame, togglePause, castSkill]);

  const bossFloor = isBossFloor(save.floor);
  const floorProgressPct = bossFloor
    ? Math.max(0, Math.min(100, ((bossSecondsLeft ?? BOSS_TIMER_SEC) / (BOSS_TIMER_SEC + stats.bossTimerBonusSec)) * 100))
    : Math.min(100, (save.killsOnFloor / MONSTERS_PER_FLOOR) * 100);

  const hasSavedProgress =
    save.raceLocked || save.totalKills > 0 || save.floor > 1 || save.ascensionCount > 0;
  const activeRaceDef = getRaceById(save.activeRace);
  const arenaLayout = getArenaLayout(viewport.w, viewport.h);
  const isCompactArena = arenaLayout.arenaH < 360 || arenaLayout.arenaW < 460;

  return (
    <div
      ref={rootRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full h-dvh overflow-hidden bg-[#0e1017] text-slate-100 select-none ${
        isTrailerMode ? '[&_*]:!cursor-none !cursor-none' : ''
      }`}
    >
      {/* 2D Pixel-Art Dungeon Stage */}
      <GameCanvas
        ref={canvasRef}
        isPlaying={screen === 'playing' && !adModal && !offlinePending && !showHelp}
        floor={save.floor}
        killsOnFloor={save.killsOnFloor}
        activeHero={save.activeHero}
        activeRace={save.activeRace}
        attackStyle={activeHeroDef.attackStyle}
        autoSkills={activeHeroDef.autoSkills}
        heroProjectileColor={activeHeroDef.projectileColor}
        tapDamage={stats.tapDamage}
        skillPowers={stats.skillPowers}
        skillCdScales={stats.skillCdScales}
        critChance={stats.critChance}
        critMultiplier={stats.critMultiplier}
        goldMultiplier={stats.goldMultiplier}
        bossDmgMultiplier={stats.bossDmgMult}
        cdScale={stats.cdScale}
        frenzyActive={skillActiveLeft.frenzy > 0}
        damage2xActive={damage2xLeft > 0}
        coinWardActive={coinWardLeft > 0}
        haste2xActive={haste2xLeft > 0}
        bossTimerBonusSec={stats.bossTimerBonusSec}
        showOnboardingHand={save.totalClicks < 3 && screen === 'playing' && !isTrailerMode}
        locale={locale}
        onTapStats={handleTapStats}
        onEnemySlain={handleEnemySlain}
        onEnemyCounterAttack={handleEnemyCounterAttack}
        onBossTimeoutPenalty={handleBossTimeoutPenalty}
        onClassSkillBonusGold={handleClassSkillBonusGold}
        onClassSkillTimers={setClassSkillTimers}
        onBossTimerUpdate={setBossSecondsLeft}
      />

      {/* START GAME SCREEN */}
      {screen === 'title' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-[#090b10]/75 via-[#0b0e16]/55 to-[#090b10]/90">
          {/* Top-right Audio & Language Controls */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-2">
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="pixel-card min-h-[40px] px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:brightness-115 cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="hidden sm:inline">{muted ? 'Muted' : 'Sound'}</span>
            </button>
            <button
              onClick={cycleLocale}
              className="pixel-card min-h-[40px] px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:brightness-115 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              {locale === 'en' ? 'EN' : locale === 'zh-TW' ? '繁中' : '简中'}
            </button>
          </div>

          <div className="pixel-panel rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto custom-scroll flex flex-col items-center text-center gap-3.5 sm:gap-4">
            {/* Pixel Hero Party (reflects currently selected Race!) vs Raid Dragon Showcase */}
            <div className="w-full rounded-xl bg-gradient-to-b from-[#171c2b] to-[#10131e] border-2 border-[#2d344a] px-3 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 overflow-hidden">
              <div className="flex items-end gap-1.5 sm:gap-2.5">
                <PixelSpriteThumb kind="hero" id="warrior" raceId={save.activeRace} size={46} />
                <PixelSpriteThumb kind="hero" id="paladin" raceId={save.activeRace} size={46} />
                <PixelSpriteThumb kind="hero" id="mage" raceId={save.activeRace} size={46} />
                <div className="hidden sm:block">
                  <PixelSpriteThumb kind="hero" id="shaman" raceId={save.activeRace} size={44} />
                </div>
                <div className="hidden sm:block">
                  <PixelSpriteThumb kind="hero" id="druid" raceId={save.activeRace} size={44} />
                </div>
              </div>
              <div className="font-pixel text-sm sm:text-base font-bold text-amber-400/90 px-1 shrink-0">
                VS
              </div>
              <div className="flex items-end gap-1.5">
                <PixelSpriteThumb kind="enemy" id="anomaly" size={44} />
                <PixelSpriteThumb kind="enemy" id="onyxia" size={56} />
              </div>
            </div>

            {/* Title Lockup */}
            <div className="flex flex-col items-center gap-1">
              <h1 className="font-pixel text-3xl sm:text-5xl font-bold text-amber-300 tracking-wide leading-none pixel-text-shadow">
                {t.gameTitle}
              </h1>
              <div className="font-pixel text-base sm:text-xl font-bold text-sky-300 tracking-[0.18em] pixel-text-shadow">
                {t.gameTitleEdition}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-0.5">
                {t.subtitle}
              </p>
            </div>

            {/* Locked Progress Card (returning run) OR Starting Race Picker (new run) */}
            {hasSavedProgress ? (
              <div className="w-full pixel-card rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <PixelSpriteThumb kind="hero" id={save.activeHero} raceId={save.activeRace} size={40} />
                  <div>
                    <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>
                        {activeRaceDef.name[locale]} ({activeRaceDef.faction}) · {activeHeroDef.name[locale]}
                      </span>
                    </div>
                    <div className="font-pixel text-base sm:text-lg font-bold text-white">
                      {locale === 'en' ? `Floor ${save.floor}` : `第 ${save.floor} 層`} ·{' '}
                      <span className="text-sky-300">{currentZone.name[locale]}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-pixel text-lg font-bold text-amber-300 font-mono-num">
                  <PixelIcon name="coin" size={20} />
                  {formatNumber(save.gold)}
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between px-1">
                  <span className="font-pixel text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
                    {t.chooseRaceLabel}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      activeRaceDef.faction === 'Alliance' ? 'text-sky-400' : 'text-rose-400'
                    }`}
                  >
                    {activeRaceDef.faction} · {activeRaceDef.traitDesc[locale]}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {RACES.map((r) => {
                    const selected = r.id === save.activeRace;
                    const isAlliance = r.faction === 'Alliance';
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectRace(r.id)}
                        className={`rounded-xl p-1.5 flex items-center gap-1.5 border-2 text-left cursor-pointer transition ${
                          selected
                            ? isAlliance
                              ? 'bg-sky-500/25 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.28)]'
                              : 'bg-rose-500/25 border-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.28)]'
                            : 'bg-[#171b28] border-[#2d354b] hover:border-slate-500'
                        }`}
                      >
                        <PixelSpriteThumb kind="hero" id="warrior" raceId={r.id} size={28} />
                        <div className="min-w-0">
                          <div className="font-pixel text-[11px] font-bold text-white leading-tight truncate">
                            {r.name[locale]}
                          </div>
                          <div
                            className={`text-[9px] font-bold leading-tight truncate ${
                              isAlliance ? 'text-sky-300' : 'text-rose-300'
                            }`}
                          >
                            {r.traitDesc[locale]}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Primary & Secondary Actions */}
            <div className="w-full flex flex-col sm:flex-row items-stretch gap-2.5">
              <button
                onClick={enterGame}
                className="pixel-btn-gold flex-1 min-h-[48px] py-3 px-6 rounded-xl font-pixel text-xl font-bold text-slate-950 tracking-wide flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{hasSavedProgress ? t.continueCta : t.playCta}</span>
              </button>
              <button
                onClick={openHelp}
                className="pixel-btn-slate min-h-[48px] py-3 px-5 rounded-xl font-pixel text-base font-bold text-slate-100 flex items-center justify-center gap-2 hover:brightness-110 cursor-pointer shrink-0"
              >
                <PixelIcon name="help" size={18} />
                <span>{t.howToPlayCta}</span>
              </button>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
              {t.controlsHint}
            </p>
          </div>
        </div>
      )}

      {/* ACTIVE GAME HUD + SPLIT DOCK (Synchronized 1:1 with GameCanvas via arenaLayout) */}
      {screen !== 'title' && (
        <div
          className="fixed inset-0 z-10 pointer-events-none flex"
          style={{ flexDirection: arenaLayout.mode === 'side' ? 'row' : 'column' }}
        >
          {/* LEFT / TOP ARENA HUD OVERLAY */}
          <div
            className="relative flex flex-col justify-between p-2 sm:p-3.5 shrink-0"
            style={{ width: arenaLayout.arenaW, height: arenaLayout.arenaH }}
          >
            {/* Top Row inside Arena */}
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              {/* Top-Left: Ad Buffs & Recovery Stack */}
              <div className="pointer-events-auto flex flex-col gap-1 items-start max-w-[140px] sm:max-w-[200px]">
                <button
                  onClick={startDamage2xAd}
                  disabled={damage2xLeft > 0}
                  className={`pixel-btn-gold rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition ${
                    damage2xLeft > 0 ? 'opacity-95' : ''
                  }`}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-950 border border-amber-950 flex items-center justify-center shrink-0">
                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] sm:text-xs font-extrabold tracking-tight text-slate-950 whitespace-nowrap">
                      {damage2xLeft > 0 ? t.boostActive : t.boostBtn}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-amber-950 font-mono-num">
                      {damage2xLeft > 0
                        ? `${Math.floor(damage2xLeft / 60)}:${String(Math.floor(damage2xLeft % 60)).padStart(2, '0')}`
                        : t.boostSub}
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={startCoinWardAd}
                    disabled={coinWardLeft > 0}
                    className={`rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1 border text-[10px] sm:text-[11px] font-bold cursor-pointer transition ${
                      coinWardLeft > 0
                        ? 'bg-sky-500/30 border-sky-300 text-sky-100'
                        : 'pixel-card text-sky-300 hover:brightness-115'
                    }`}
                  >
                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {coinWardLeft > 0
                        ? `${t.wardActive} ${Math.floor(coinWardLeft / 60)}:${String(Math.floor(coinWardLeft % 60)).padStart(2, '0')}`
                        : t.wardBtn}
                    </span>
                  </button>

                  <button
                    onClick={startHaste2xAd}
                    disabled={haste2xLeft > 0}
                    className={`rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1 border text-[10px] sm:text-[11px] font-bold cursor-pointer transition ${
                      haste2xLeft > 0
                        ? 'bg-violet-500/30 border-violet-300 text-violet-100'
                        : 'pixel-card text-violet-300 hover:brightness-115'
                    }`}
                  >
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {haste2xLeft > 0
                        ? `${t.hasteActive} ${Math.floor(haste2xLeft / 60)}:${String(Math.floor(haste2xLeft % 60)).padStart(2, '0')}`
                        : t.hasteBtn}
                    </span>
                  </button>

                  {save.stolenGoldBank > 0 && (
                    <button
                      onClick={startReclaimGoldAd}
                      className="pixel-btn-green rounded-lg px-1.5 py-0.5 sm:px-2 sm:py-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold text-white cursor-pointer animate-pulse"
                    >
                      <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 shrink-0" />
                      <span className="whitespace-nowrap">
                        {t.reclaimBtn} +{formatNumber(Math.max(15, Math.ceil(save.stolenGoldBank * 1.5)))}g
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Top-Center: Gold + Floor + Progress Bar */}
              <div className="flex flex-col items-center text-center mx-auto shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <PixelIcon name="coin" size={isCompactArena ? 22 : 28} />
                  <span className="font-pixel text-2xl sm:text-4xl font-semibold text-amber-300 pixel-text-shadow font-mono-num leading-none">
                    {formatNumber(save.gold)}
                  </span>
                </div>

                <div className="mt-0.5 font-pixel text-base sm:text-xl font-semibold text-white pixel-text-shadow tracking-wide leading-tight">
                  {locale === 'en' ? `${t.floorLabel} ${save.floor}` : `${t.floorLabel} ${save.floor} 層`}
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-200 pixel-text-shadow -mt-0.5">
                  {currentZone.name[locale]} · {currentZone.levelRange}
                  {zoneTier > 1 ? ` · Tier ${zoneTier}` : ''}
                </div>

                {/* Floor Kills / Boss Timer Bar */}
                <div className="mt-1 relative w-36 sm:w-56 h-4 sm:h-5 rounded-full bg-[#1a1d2b] border-2 border-[#090b10] overflow-hidden shadow-md">
                  <div
                    className={`h-full transition-all duration-150 ${
                      bossFloor
                        ? 'bg-gradient-to-b from-amber-400 to-orange-600'
                        : 'bg-gradient-to-b from-emerald-400 to-green-600'
                    }`}
                    style={{ width: `${floorProgressPct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-extrabold text-white pixel-text-shadow font-mono-num">
                    {bossFloor
                      ? `${t.bossTag} · ${bossSecondsLeft ?? BOSS_TIMER_SEC}s`
                      : `${save.killsOnFloor}/${MONSTERS_PER_FLOOR}`}
                  </div>
                </div>
              </div>

              {/* Top-Right of Arena: Settings & Help */}
              <div className="pointer-events-auto flex flex-col gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={togglePause}
                  aria-label="Settings"
                  className="pixel-card w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center hover:brightness-115 cursor-pointer"
                >
                  <PixelIcon name="gear" size={isCompactArena ? 20 : 24} />
                </button>
                <button
                  onClick={openHelp}
                  aria-label="Help"
                  className="pixel-card w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center hover:brightness-115 cursor-pointer"
                >
                  <PixelIcon name="help" size={isCompactArena ? 20 : 24} />
                </button>
              </div>
            </div>

            {/* Boss Timeout Penalty & Second Wind Recovery Prompt */}
            {bossSecondWindLeft > 0 && bossFloor && (
              <div className="pointer-events-auto self-center pixel-panel border-rose-500/80 rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-lg">
                <span className="font-pixel text-xs sm:text-sm font-bold text-rose-300">
                  {t.bossPenaltyBanner}
                </span>
                <button
                  onClick={startBossSecondWindAd}
                  className="pixel-btn-gold px-3 py-1 rounded-lg font-pixel text-xs font-bold text-slate-950 cursor-pointer shrink-0"
                >
                  {t.bossSecondWindCta}
                </button>
              </div>
            )}

            {/* Toast Banner */}
            {toastTitle && (
              <div className="self-center pixel-btn-gold px-4 py-1.5 rounded-lg font-pixel text-sm font-bold text-slate-950 shadow-lg">
                {toastTitle}
              </div>
            )}

            {/* Onboarding hint */}
            {save.totalClicks < 3 && !isTrailerMode && (
              <div className="self-center pixel-card px-3.5 py-1.5 rounded-lg font-pixel text-xs sm:text-sm text-amber-300 animate-bounce">
                {t.onboardingHint}
              </div>
            )}

            {/* Bottom Row inside Arena: Active Skills (1, 2, 3) + Class Countdown Auto-Skills + Compact Readout */}
            <div className="flex items-end justify-between gap-1.5 sm:gap-2 flex-wrap">
              <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {SKILLS.map((sk) => {
                    const lv = getSkillLevel(save, sk.id);
                    if (lv <= 0) return null;
                    const active = skillActiveLeft[sk.id] > 0;
                    const cd = skillCdLeft[sk.id];
                    const ready = cd <= 0;
                    return (
                      <button
                        key={sk.id}
                        onClick={() => castSkill(sk.id)}
                        disabled={!ready && !active}
                        title={`${sk.name[locale]} (${sk.hotkey})`}
                        className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition ${
                          active
                            ? 'bg-amber-500 border-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.7)] scale-105'
                            : ready
                            ? 'bg-[#252a3b] border-amber-400 hover:brightness-115 active:scale-95'
                            : 'bg-[#161924] border-slate-700 opacity-80 cursor-not-allowed'
                        }`}
                      >
                        <PixelIcon
                          name={sk.id === 'frenzy' ? 'fury' : sk.id === 'gold_rush' ? 'greed' : 'titan'}
                          size={isCompactArena ? 18 : 22}
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-950 border border-slate-600 font-pixel text-[10px] sm:text-[11px] font-bold text-slate-200 flex items-center justify-center">
                          {sk.hotkey}
                        </span>
                        {(active || cd > 0) && (
                          <span className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center font-mono-num text-[10px] sm:text-[11px] font-extrabold text-amber-300">
                            {Math.ceil(active ? skillActiveLeft[sk.id] : cd)}s
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Class Countdown Auto-Skills Icon Strip (hover/focus shows skill name) */}
                <div className="pixel-card rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 flex items-center gap-1.5 sm:gap-2">
                  {activeHeroDef.autoSkills.map((sk, idx) => {
                    const timer = classSkillTimers[idx];
                    const maxCd = timer?.maxCd || Math.max(0.4, sk.cooldownSec * stats.skillCdScales[idx]);
                    const cd = timer?.cd ?? maxCd;
                    const pct = Math.max(0, Math.min(100, ((maxCd - cd) / Math.max(0.1, maxCd)) * 100));
                    const skLv = getClassSkillLevel(save, sk.id);
                    return (
                      <div
                        key={sk.id}
                        tabIndex={0}
                        title={sk.name[locale]}
                        aria-label={sk.name[locale]}
                        className="relative group w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#151824] border-2 flex items-center justify-center cursor-help outline-none"
                        style={{ borderColor: `${sk.color}88` }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 opacity-25 pointer-events-none transition-all duration-100 rounded-b-lg"
                          style={{ height: `${pct}%`, backgroundColor: sk.color }}
                        />
                        <SkillPixelIcon visual={sk.effect} size={isCompactArena ? 20 : 24} className="relative z-10" />
                        <span className="absolute -top-1.5 -right-1.5 px-1 rounded bg-slate-950 border border-slate-700 font-mono-num text-[9px] font-bold text-amber-300 z-20">
                          {skLv}
                        </span>
                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 rounded bg-slate-950/95 border border-slate-700 font-mono-num text-[9px] font-bold text-slate-100 z-20 leading-tight">
                          {cd.toFixed(1)}s
                        </span>

                        {/* Hover / Focus Tooltip revealing Skill Name */}
                        <div className="hidden group-hover:flex group-focus-within:flex flex-col gap-0.5 absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-48 pixel-panel rounded-xl px-2.5 py-2 z-30 pointer-events-none text-left shadow-xl">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-pixel text-xs font-bold leading-tight" style={{ color: sk.color }}>
                              {sk.name[locale]}
                            </span>
                            <span className="font-mono-num text-[10px] font-bold text-amber-300 shrink-0">
                              Lv.{skLv}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-300 leading-snug">
                            {sk.description[locale]}
                          </div>
                          <div className="text-[10px] font-mono-num text-slate-400">
                            {maxCd.toFixed(1)}s CD · x{sk.damageMult.toFixed(1)} DMG
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compact Combat Readout */}
              <div className="pixel-card px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono-num">
                <span className="text-sky-300 font-bold">
                  {t.tapDmgShort}: {formatNumber(stats.tapDamage)}
                </span>
                <span className="text-emerald-400 font-bold">
                  {t.dpsShort}: {formatNumber(stats.dps)}/s
                </span>
                {save.soulShards > 0 && (
                  <span className="flex items-center gap-1 text-cyan-300 font-bold">
                    <PixelIcon name="shard" size={14} />
                    {save.soulShards}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT / BOTTOM RPG CONTROL DOCK */}
          <div
            className="pointer-events-auto p-1.5 sm:p-2.5 flex flex-col shrink-0"
            style={{ width: arenaLayout.dockW, height: arenaLayout.dockH }}
          >
            <div className="pixel-panel rounded-2xl flex-1 flex flex-col overflow-hidden p-2 sm:p-3 gap-2">
              {/* 6-Tab Bar with < > Arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => cycleTab(-1)}
                  aria-label="Previous Tab"
                  className="p-1.5 text-amber-400 hover:text-amber-300 cursor-pointer shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-6 gap-1.5 flex-1">
                  {TAB_ORDER.map((tab) => {
                    const active = dockTab === tab.id;
                    const hasBadge =
                      (tab.id === 'quests' && claimableQuestsCount > 0) ||
                      (tab.id === 'ascension' && pendingEmblems > 0);
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDockTab(tab.id)}
                        title={tab.label}
                        className={`relative h-11 rounded-xl border-2 flex items-center justify-center cursor-pointer transition ${
                          active
                            ? 'bg-[#363d54] border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                            : 'bg-[#222636] border-[#343b52] hover:border-slate-500'
                        }`}
                      >
                        <PixelIcon name={tab.icon} size={24} />
                        {hasBadge && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-950 text-[9px] font-extrabold text-slate-950 flex items-center justify-center">
                            !
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => cycleTab(1)}
                  aria-label="Next Tab"
                  className="p-1.5 text-amber-400 hover:text-amber-300 cursor-pointer shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* TAB 1: UPGRADES */}
              {dockTab === 'upgrades' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-pixel text-xs text-slate-400">
                      CRIT {(stats.critChance * 100).toFixed(0)}% · x{stats.critMultiplier.toFixed(1)}
                    </span>
                    <div className="flex items-center gap-1">
                      {([1, 10, 'max'] as BuyAmount[]).map((amt) => (
                        <button
                          key={String(amt)}
                          onClick={() => setBuyAmount(amt)}
                          className={`px-2 py-0.5 rounded font-pixel text-xs font-bold cursor-pointer border ${
                            buyAmount === amt
                              ? 'bg-amber-400 text-slate-950 border-amber-200'
                              : 'bg-[#222636] text-slate-300 border-[#38405a]'
                          }`}
                        >
                          {amt === 'max' ? 'MAX' : `x${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-2">
                    {/* Active Class Unique Primary Attack Upgrade */}
                    {(() => {
                      const atk = activeHeroDef.primaryAttack;
                      const atkLv = getClassAttackLevel(save, save.activeHero);
                      const { count, totalCost } = getBulkGenericCostQuote(
                        atk.baseCost,
                        1.15,
                        atkLv - 1,
                        save.gold,
                        buyAmount
                      );
                      const canAfford = save.gold >= totalCost;
                      const nextMilestone = Math.floor(atkLv / 25 + 1) * 25;
                      return (
                        <div className="pixel-card rounded-xl px-3 py-2.5 flex items-center justify-between gap-2.5 border-sky-400/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-lg bg-[#151824] border-2 flex items-center justify-center shrink-0"
                              style={{ borderColor: `${atk.color}88` }}
                            >
                              <SkillPixelIcon visual={atk.style} size={28} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-pixel text-base font-bold text-white leading-tight truncate">
                                  {atk.name[locale]}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-[9px] font-bold text-sky-300 shrink-0">
                                  {t.primaryAtkTag}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-sky-300 truncate">
                                {formatNumber(stats.tapDamage)} dmg/tap · x{atk.powerMult.toFixed(2)}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                Lv. {atkLv} · x2 at Lv. {nextMilestone}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={buyPrimaryAttack}
                            disabled={!canAfford}
                            className={`shrink-0 min-w-[104px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-pixel text-base font-bold cursor-pointer transition ${
                              canAfford
                                ? 'pixel-btn-green text-white pixel-text-shadow'
                                : 'pixel-btn-slate text-slate-300 opacity-75 cursor-not-allowed'
                            }`}
                          >
                            <PixelIcon name="coin" size={18} />
                            <span className="font-mono-num">
                              {formatNumber(totalCost)}
                              {count > 1 ? ` (x${count})` : ''}
                            </span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Individual Upgrades for Active Class's 2 Countdown Auto-Skills */}
                    {([0, 1] as const).map((idx) => {
                      const sk = activeHeroDef.autoSkills[idx];
                      const skLv = getClassSkillLevel(save, sk.id);
                      const { count, totalCost } = getBulkGenericCostQuote(
                        sk.upgradeBaseCost,
                        1.17,
                        skLv - 1,
                        save.gold,
                        buyAmount
                      );
                      const canAfford = save.gold >= totalCost;
                      const nextMilestone = Math.floor(skLv / 25 + 1) * 25;
                      const estDmg = stats.skillPowers[idx] * sk.damageMult;
                      const effCd = Math.max(0.4, sk.cooldownSec * stats.skillCdScales[idx]);

                      return (
                        <div
                          key={sk.id}
                          className="pixel-card rounded-xl px-3 py-2.5 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-lg bg-[#151824] border-2 flex items-center justify-center shrink-0"
                              style={{ borderColor: `${sk.color}88` }}
                            >
                              <SkillPixelIcon visual={sk.effect} size={28} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="font-pixel text-base font-bold leading-tight truncate"
                                  style={{ color: sk.color }}
                                >
                                  {sk.name[locale]}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-400/40 text-[9px] font-bold text-violet-200 shrink-0">
                                  {t.skillUpgradeTag} #{idx + 1}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-emerald-300 truncate">
                                {formatNumber(estDmg)} {sk.aoe ? 'AoE' : 'DMG'} · {effCd.toFixed(1)}s CD
                              </div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                Lv. {skLv} · x2 at Lv. {nextMilestone}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => buyClassSkill(idx)}
                            disabled={!canAfford}
                            className={`shrink-0 min-w-[104px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-pixel text-base font-bold cursor-pointer transition ${
                              canAfford
                                ? 'pixel-btn-green text-white pixel-text-shadow'
                                : 'pixel-btn-slate text-slate-300 opacity-75 cursor-not-allowed'
                            }`}
                          >
                            <PixelIcon name="coin" size={18} />
                            <span className="font-mono-num">
                              {formatNumber(totalCost)}
                              {count > 1 ? ` (x${count})` : ''}
                            </span>
                          </button>
                        </div>
                      );
                    })}

                    {/* Shared Attribute Upgrades */}
                    {UPGRADES.map((u) => {
                      const owned = save.upgrades[u.id] || 0;
                      const { count, totalCost } = getBulkUpgradeQuote(u, owned, save.gold, buyAmount);
                      const canAfford = save.gold >= totalCost;
                      const nextMilestone = Math.floor(owned / 25 + 1) * 25;

                      let subline = '';
                      if (u.kind === 'allDmg') {
                        subline = `x${(1 + owned * u.baseValue).toFixed(2)} all damage`;
                      } else if (u.kind === 'gold') {
                        subline = `x${(1 + owned * u.baseValue).toFixed(2)} gold`;
                      } else if (u.kind === 'crit') {
                        subline = `${Math.round(stats.critChance * 100)}% crit for x${stats.critMultiplier.toFixed(0)}`;
                      } else {
                        subline = `+${formatNumber(owned * 32)} tap & +${formatNumber(owned * 48)} skill`;
                      }

                      return (
                        <div
                          key={u.id}
                          className="pixel-card rounded-xl px-3 py-2.5 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg bg-[#151824] border border-[#343b52] flex items-center justify-center shrink-0">
                              <PixelIcon name={u.icon} size={28} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-pixel text-base font-bold text-white leading-tight truncate">
                                {u.name[locale]}
                              </div>
                              <div className="text-xs font-bold text-sky-300 truncate">{subline}</div>
                              <div className="text-[11px] font-semibold text-slate-400">
                                Lv. {owned}
                                {u.hasMilestone25 ? ` · x2 at Lv. ${nextMilestone}` : ''}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => buyUpgrade(u.id)}
                            disabled={!canAfford}
                            className={`shrink-0 min-w-[104px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 font-pixel text-base font-bold cursor-pointer transition ${
                              canAfford
                                ? 'pixel-btn-green text-white pixel-text-shadow'
                                : 'pixel-btn-slate text-slate-300 opacity-75 cursor-not-allowed'
                            }`}
                          >
                            <PixelIcon name="coin" size={18} />
                            <span className="font-mono-num">
                              {formatNumber(totalCost)}
                              {count > 1 ? ` (x${count})` : ''}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: HEROES (Locked Race + Coin-Paid Class Switching among 9 WoW: Forever Classes) */}
              {dockTab === 'heroes' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="text-center">
                    <div className="font-pixel text-lg font-bold text-amber-300">
                      {t.heroesHeader} {save.unlockedHeroes.length} / {HEROES.length}
                    </div>
                    <div className="text-[11px] text-slate-300">{t.heroesSub}</div>
                  </div>

                  {/* Locked Race Info + Active Class Icon Kit (Skill names via mouseover tooltip) */}
                  {(() => {
                    const curRace = getRaceById(save.activeRace);
                    const isAffinity = curRace.classes.includes(save.activeHero);
                    return (
                      <div className="pixel-card rounded-xl p-2 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <PixelSpriteThumb
                            kind="hero"
                            id={save.activeHero}
                            raceId={save.activeRace}
                            size={34}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-[11px] font-pixel font-bold text-slate-200 truncate">
                              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span
                                className={
                                  curRace.faction === 'Alliance' ? 'text-sky-400' : 'text-rose-400'
                                }
                              >
                                {curRace.name[locale]}
                              </span>
                              <span className="text-slate-400">· {activeHeroDef.name[locale]}</span>
                              {isAffinity && (
                                <span className="text-emerald-400 text-[10px]">★</span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-emerald-400 truncate">
                              {curRace.traitName[locale]}: {curRace.traitDesc[locale]}
                            </div>
                          </div>
                        </div>

                        {/* Icon-only Class Primary Attack + 2 Auto-Skills with mouseover name tooltips */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div
                            tabIndex={0}
                            title={activeHeroDef.primaryAttack.name[locale]}
                            className="relative group w-8 h-8 rounded-lg bg-[#151824] border flex items-center justify-center cursor-help outline-none"
                            style={{ borderColor: `${activeHeroDef.primaryAttack.color}88` }}
                          >
                            <SkillPixelIcon visual={activeHeroDef.primaryAttack.style} size={20} />
                            <div className="hidden group-hover:flex group-focus-within:flex flex-col gap-0.5 absolute top-full right-0 mt-2 w-44 pixel-panel rounded-lg px-2 py-1.5 z-30 pointer-events-none text-left shadow-xl">
                              <span className="font-pixel text-[11px] font-bold text-sky-300">
                                {activeHeroDef.primaryAttack.name[locale]}
                              </span>
                              <span className="text-[10px] text-slate-300 leading-snug">
                                {activeHeroDef.primaryAttack.description[locale]}
                              </span>
                            </div>
                          </div>

                          {activeHeroDef.autoSkills.map((sk) => (
                            <div
                              key={sk.id}
                              tabIndex={0}
                              title={sk.name[locale]}
                              className="relative group w-8 h-8 rounded-lg bg-[#151824] border flex items-center justify-center cursor-help outline-none"
                              style={{ borderColor: `${sk.color}88` }}
                            >
                              <SkillPixelIcon visual={sk.effect} size={20} />
                              <div className="hidden group-hover:flex group-focus-within:flex flex-col gap-0.5 absolute top-full right-0 mt-2 w-44 pixel-panel rounded-lg px-2 py-1.5 z-30 pointer-events-none text-left shadow-xl">
                                <span
                                  className="font-pixel text-[11px] font-bold"
                                  style={{ color: sk.color }}
                                >
                                  {sk.name[locale]} ({sk.cooldownSec}s)
                                </span>
                                <span className="text-[10px] text-slate-300 leading-snug">
                                  {sk.description[locale]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex-1 overflow-y-auto custom-scroll pr-1 grid grid-cols-3 gap-1.5">
                    {HEROES.map((hero) => {
                      const unlocked = save.unlockedHeroes.includes(hero.id);
                      const isFighting = save.activeHero === hero.id;
                      const rank = getHeroRank(save, hero.id);
                      const upgCost = getHeroUpgradeCost(hero, rank);
                      const unlockCost = getClassUnlockCost(hero, save.activeRace);
                      const switchCost = getClassSwitchCost(hero, save.floor, save.activeRace);
                      const hasAffinity = activeRaceDef.classes.includes(hero.id);
                      const canUnlock = !unlocked && save.gold >= unlockCost;
                      const canSwitch = unlocked && !isFighting && save.gold >= switchCost;
                      const canUpgrade = unlocked && save.gold >= upgCost;

                      return (
                        <div
                          key={hero.id}
                          onClick={() => selectOrUnlockHero(hero.id)}
                          className={`relative rounded-xl p-2 flex flex-col items-center text-center justify-between gap-1.5 border-2 transition cursor-pointer ${
                            isFighting
                              ? 'bg-[#26332c] border-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.28)]'
                              : unlocked
                              ? 'bg-[#232838] border-[#3d4661] hover:border-amber-400'
                              : 'bg-[#191c28] border-[#2d3347]'
                          }`}
                        >
                          {hasAffinity && !isFighting && (
                            <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-emerald-500/20 border border-emerald-400/50 text-[8px] font-bold text-emerald-300">
                              -30%
                            </span>
                          )}
                          {!unlocked && (
                            <div className="absolute top-1.5 right-1.5">
                              <PixelIcon name="lock" size={15} />
                            </div>
                          )}

                          <div className={`mt-1 ${!unlocked ? 'opacity-45 grayscale' : ''}`}>
                            <PixelSpriteThumb
                              kind="hero"
                              id={hero.id}
                              raceId={save.activeRace}
                              size={46}
                            />
                          </div>

                          <div>
                            <div className="font-pixel text-sm font-bold text-white leading-tight">
                              {hero.name[locale]} {unlocked ? `Lv.${rank}` : ''}
                            </div>
                            <div className="text-[10px] font-bold text-sky-300 leading-tight mt-0.5">
                              {hero.bonusLabel(rank, locale)}
                            </div>
                          </div>

                          {unlocked ? (
                            <div className="w-full flex flex-col gap-1">
                              {isFighting ? (
                                <div className="font-pixel text-xs font-bold tracking-wider text-emerald-400 py-0.5">
                                  {t.fighting}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectOrUnlockHero(hero.id);
                                  }}
                                  disabled={!canSwitch}
                                  className={`w-full py-1 rounded-lg font-pixel text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                                    canSwitch
                                      ? 'pixel-btn-gold text-slate-950'
                                      : 'pixel-btn-slate text-slate-400 opacity-75 cursor-not-allowed'
                                  }`}
                                >
                                  <span>{t.switchClass}</span>
                                  <PixelIcon name="coin" size={11} />
                                  <span className="font-mono-num">{formatNumber(switchCost)}</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => upgradeHero(hero.id, e)}
                                disabled={!canUpgrade}
                                className={`w-full py-1 rounded-lg font-pixel text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                                  canUpgrade
                                    ? 'pixel-btn-green text-white'
                                    : 'pixel-btn-slate text-slate-300 opacity-75 cursor-not-allowed'
                                }`}
                              >
                                <span>{t.upgrade}</span>
                                <PixelIcon name="coin" size={11} />
                                <span className="font-mono-num">{formatNumber(upgCost)}</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                selectOrUnlockHero(hero.id);
                              }}
                              disabled={!canUnlock}
                              className={`w-full py-1.5 rounded-lg font-pixel text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                                canUnlock
                                  ? 'pixel-btn-gold text-slate-950'
                                  : 'pixel-btn-slate text-slate-400 opacity-75 cursor-not-allowed'
                              }`}
                            >
                              <PixelIcon name="coin" size={12} />
                              <span className="font-mono-num">{formatNumber(unlockCost)}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: SKILLS */}
              {dockTab === 'skills' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="text-center">
                    <div className="font-pixel text-lg font-bold text-amber-300">{t.skillsTitle}</div>
                    <div className="text-xs text-slate-300">{t.skillsSub}</div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-2.5">
                    {SKILLS.map((sk) => {
                      const lv = getSkillLevel(save, sk.id);
                      const unlockedFloor = save.maxFloor >= sk.unlockFloor;
                      const maxed = lv >= sk.maxLevel;
                      const cost = getSkillUpgradeCost(sk, lv);
                      const canBuy = unlockedFloor && !maxed && save.gold >= cost;
                      const curM = getSkillMetrics(sk, Math.max(1, lv));
                      const nextM = getSkillMetrics(sk, Math.min(sk.maxLevel, lv + 1));

                      const summary =
                        sk.id === 'frenzy'
                          ? `Taps hit x${curM.power.toFixed(2)} for ${curM.duration}s · ${sk.cooldownSec}s CD`
                          : sk.id === 'gold_rush'
                          ? `x${curM.power.toFixed(2)} gold for ${curM.duration}s · ${sk.cooldownSec}s CD`
                          : `Blast all foes for ${curM.power.toFixed(0)}x Tap · ${sk.cooldownSec}s CD`;

                      const nextSummary =
                        sk.id === 'frenzy'
                          ? `${t.nextLevel}: Taps x${nextM.power.toFixed(2)} for ${nextM.duration}s`
                          : sk.id === 'gold_rush'
                          ? `${t.nextLevel}: x${nextM.power.toFixed(2)} gold for ${nextM.duration}s`
                          : `${t.nextLevel}: ${nextM.power.toFixed(0)}x Tap burst`;

                      return (
                        <div key={sk.id} className="pixel-card rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex flex-col items-center shrink-0">
                                <div className="w-11 h-11 rounded-full bg-[#151824] border-2 border-[#3c455e] flex items-center justify-center">
                                  <PixelIcon
                                    name={sk.id === 'frenzy' ? 'fury' : sk.id === 'gold_rush' ? 'greed' : 'titan'}
                                    size={24}
                                  />
                                </div>
                                <span className="font-pixel text-[11px] text-slate-300 mt-0.5">
                                  Lv. {lv}/{sk.maxLevel}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-pixel text-base font-bold text-white leading-tight">
                                  {sk.name[locale]} ({sk.hotkey})
                                </div>
                                <div className="text-xs text-slate-300">{sk.description[locale]}</div>
                                <div className="text-xs font-bold text-sky-300 mt-0.5">{summary}</div>
                                {!unlockedFloor && (
                                  <div className="font-pixel text-xs font-bold text-rose-400 mt-0.5">
                                    {t.opensOnFloor} {sk.unlockFloor}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => upgradeSkill(sk.id)}
                              disabled={!canBuy}
                              className={`shrink-0 min-w-[96px] px-3 py-2 rounded-xl font-pixel text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                                maxed
                                  ? 'pixel-btn-slate text-emerald-300 cursor-default'
                                  : canBuy
                                  ? 'pixel-btn-green text-white'
                                  : 'pixel-btn-slate text-slate-400 opacity-75 cursor-not-allowed'
                              }`}
                            >
                              {maxed ? (
                                t.maxed
                              ) : (
                                <>
                                  <PixelIcon name="coin" size={16} />
                                  <span className="font-mono-num">{formatNumber(cost)}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {!maxed && (
                            <div className="text-[11px] font-semibold text-slate-400 border-t border-slate-700/60 pt-1">
                              {nextSummary}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: QUESTS */}
              {dockTab === 'quests' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="text-center font-pixel text-lg font-bold text-amber-300">
                    {t.questsTitle} ({save.claimedQuests.length}/{QUESTS.length})
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-2">
                    {QUESTS.map((q) => {
                      const claimed = save.claimedQuests.includes(q.id);
                      const prog = Math.min(q.target, q.getProgress(save));
                      const ready = !claimed && prog >= q.target;
                      const pct = Math.min(100, (prog / q.target) * 100);

                      return (
                        <div
                          key={q.id}
                          className={`pixel-card rounded-xl p-2.5 flex items-center justify-between gap-2 ${
                            claimed ? 'opacity-55' : ready ? 'border-amber-400' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-pixel text-sm font-bold text-white truncate">
                              {q.name[locale]}
                            </div>
                            <div className="text-[11px] text-slate-300 truncate">{q.description[locale]}</div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden">
                                <div
                                  className={`h-full ${ready || claimed ? 'bg-emerald-400' : 'bg-sky-400'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="font-mono-num text-[10px] text-slate-300">
                                {prog}/{q.target}
                              </span>
                            </div>
                          </div>

                          {claimed ? (
                            <span className="font-pixel text-xs font-bold text-emerald-400 px-2">
                              {t.claimed}
                            </span>
                          ) : (
                            <button
                              onClick={() => claimQuest(q.id)}
                              disabled={!ready}
                              className={`shrink-0 px-3 py-2 rounded-xl font-pixel text-xs font-bold flex flex-col items-center cursor-pointer ${
                                ready
                                  ? 'pixel-btn-gold text-slate-950'
                                  : 'pixel-btn-slate text-slate-300 opacity-75 cursor-not-allowed'
                              }`}
                            >
                              <span>{ready ? t.claim : `+${formatNumber(q.rewardGold)}g`}</span>
                              {q.rewardShards && (
                                <span className="text-[10px]">+{q.rewardShards} Shards</span>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: RELICS / SOUL FORGE */}
              {dockTab === 'relics' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <div className="font-pixel text-base font-bold text-sky-300">{t.relicsTitle}</div>
                      <div className="text-[11px] text-slate-400">{t.relicsSub}</div>
                    </div>
                    <div className="pixel-card px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-pixel text-sm font-bold text-cyan-300 shrink-0">
                      <PixelIcon name="shard" size={16} />
                      <span className="font-mono-num">{save.soulShards}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scroll pr-1 flex flex-col gap-2">
                    {RELICS.map((r) => {
                      const rank = save.relics[r.id] || 0;
                      const maxed = rank >= r.maxRank;
                      const cost = getRelicCost(r.baseShardCost, rank);
                      const canBuy = !maxed && save.soulShards >= cost;

                      return (
                        <div
                          key={r.id}
                          className="pixel-card rounded-xl p-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-pixel text-sm font-bold text-white">
                              {r.name[locale]}{' '}
                              <span className="text-xs text-sky-300">
                                Lv.{rank}/{r.maxRank}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300">{r.description[locale]}</div>
                          </div>

                          <button
                            onClick={() => buyRelic(r.id)}
                            disabled={!canBuy}
                            className={`shrink-0 min-w-[84px] px-3 py-2 rounded-xl font-pixel text-sm font-bold flex items-center justify-center gap-1 cursor-pointer ${
                              maxed
                                ? 'pixel-btn-slate text-emerald-300'
                                : canBuy
                                ? 'pixel-btn-green text-white'
                                : 'pixel-btn-slate text-slate-400 opacity-75 cursor-not-allowed'
                            }`}
                          >
                            {maxed ? (
                              t.maxed
                            ) : (
                              <>
                                <PixelIcon name="shard" size={15} />
                                <span className="font-mono-num">{cost}</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: SPIRIT ASCENSION */}
              {dockTab === 'ascension' && (
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scroll pr-1">
                  <div className="pixel-card rounded-xl p-4 flex flex-col gap-3 text-center">
                    <div className="mx-auto">
                      <PixelIcon name="tab_ascension" size={44} />
                    </div>
                    <div className="font-pixel text-xl font-bold text-amber-300">
                      {t.ascensionTitle}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{t.ascensionDesc}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono-num bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-slate-400">Emblems</div>
                        <div className="font-pixel text-lg font-bold text-amber-300">
                          {save.emblems}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">{t.emblemBonus}</div>
                        <div className="font-pixel text-lg font-bold text-emerald-400">
                          +{Math.round(save.emblems * EMBLEM_DMG_BONUS * 100)}% DMG
                        </div>
                      </div>
                    </div>

                    {pendingEmblems > 0 ? (
                      <button
                        onClick={triggerAscension}
                        className="pixel-btn-gold w-full py-3 rounded-xl font-pixel text-base font-bold text-slate-950 cursor-pointer"
                      >
                        {t.ascensionBtn} (+{pendingEmblems} Emblems)
                      </button>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-sky-400 transition-all"
                            style={{
                              width: `${Math.min(100, (save.maxFloor / ASCENSION_MIN_FLOOR) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-pixel text-xs text-slate-400">
                          {t.ascensionNeed} ({save.maxFloor}/{ASCENSION_MIN_FLOOR})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS / PAUSE MODAL */}
      {screen === 'paused' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
          <div className="pixel-panel w-full max-w-sm rounded-2xl p-6 flex flex-col gap-3.5 text-center">
            <h2 className="font-pixel text-2xl font-bold text-amber-300">{t.pausedTitle}</h2>
            <p className="text-xs text-slate-300 font-mono-num">
              Max Floor: {save.maxFloor} · Total Kills: {save.totalKills}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleMute}
                className="pixel-card py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-200 hover:brightness-110 cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                {muted ? 'Muted' : 'Sound On'}
              </button>
              <button
                onClick={cycleLocale}
                className="pixel-card py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-sky-300 hover:brightness-110 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                {locale === 'en' ? 'English' : locale === 'zh-TW' ? '繁體中文' : '简体中文'}
              </button>
            </div>

            <button
              onClick={togglePause}
              className="pixel-btn-green w-full py-3 rounded-xl font-pixel text-base font-bold text-white cursor-pointer"
            >
              {t.resume}
            </button>

            <button
              onClick={resetSave}
              className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border-2 border-rose-500/50 text-rose-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {confirmReset ? t.resetConfirm : t.reset}
            </button>
          </div>
        </div>
      )}

      {/* HELP MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
          <div className="pixel-panel w-full max-w-md rounded-2xl p-6 flex flex-col gap-3.5">
            <h2 className="font-pixel text-2xl font-bold text-sky-300 text-center">{t.helpTitle}</h2>
            <ul className="flex flex-col gap-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
              {t.helpLines.map((line, idx) => (
                <li key={idx} className="pixel-card rounded-lg px-3 py-2">
                  {line}
                </li>
              ))}
            </ul>
            <button
              onClick={closeHelp}
              className="pixel-btn-gold w-full py-2.5 rounded-xl font-pixel text-base font-bold text-slate-950 cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* OFFLINE LOOT MODAL */}
      {offlinePending !== null && screen === 'playing' && !adModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4">
          <div className="pixel-panel w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-pixel text-2xl font-bold text-amber-300">{t.offlineTitle}</h2>
            <p className="text-xs text-slate-300">{t.offlineDesc}</p>
            <div className="flex items-center justify-center gap-2 font-pixel text-3xl font-bold text-amber-300 font-mono-num">
              <PixelIcon name="coin" size={28} />+{formatNumber(offlinePending)}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={startOfflineDoubleAd}
                className="pixel-btn-gold w-full py-3 rounded-xl font-pixel text-base font-bold text-slate-950 cursor-pointer"
              >
                {t.offlineDouble} (+{formatNumber(offlinePending * 2)})
              </button>
              <button
                onClick={claimOfflineNormal}
                className="pixel-btn-slate w-full py-2.5 rounded-xl font-pixel text-sm font-bold text-slate-200 cursor-pointer"
              >
                {t.offlineClaim}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REWARDED AD FALLBACK MODAL */}
      {adModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4">
          <div className="pixel-panel w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 text-center">
            <div className="font-pixel text-xs uppercase tracking-widest text-sky-300">
              {t.adTitle}
            </div>
            <h3 className="font-pixel text-lg font-bold text-white">
              {adModal.type === 'damage2x'
                ? t.adDamage
                : adModal.type === 'coin_ward'
                ? t.adWard
                : adModal.type === 'haste2x'
                ? t.adHaste
                : adModal.type === 'reclaim_gold'
                ? t.adReclaim
                : adModal.type === 'boss_second_wind'
                ? t.adBossWind
                : t.adOffline}
            </h3>
            <div className="pixel-card py-6 rounded-xl font-pixel text-base text-amber-300">
              {adModal.secondsLeft > 0 ? `${t.adWait} ${adModal.secondsLeft}s` : t.adClaim}
            </div>
            <button
              onClick={claimAdReward}
              disabled={adModal.secondsLeft > 0}
              className={`w-full py-3 rounded-xl font-pixel text-base font-bold transition ${
                adModal.secondsLeft > 0
                  ? 'pixel-btn-slate text-slate-400 cursor-not-allowed'
                  : 'pixel-btn-green text-white cursor-pointer'
              }`}
            >
              {adModal.secondsLeft > 0 ? `${adModal.secondsLeft}s` : t.adClaim}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
