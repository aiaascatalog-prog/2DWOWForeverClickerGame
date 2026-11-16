import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from './audio/synth';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { PixelIcon, PixelIconName, PixelSpriteThumb } from './components/PixelIcon';
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
  RELICS,
  SAVE_KEY,
  SKILLS,
  UI_COPY,
  UPGRADES,
  calculatePendingEmblems,
  detectDefaultLocale,
  formatNumber,
  getBulkUpgradeQuote,
  getHeroRank,
  getHeroUpgradeCost,
  getRaceById,
  getRacesForClass,
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

function createFreshSave(overrides: Partial<SaveState> = {}): SaveState {
  return {
    gold: 0,
    lifetimeGold: 0,
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
    unlockedHeroes: ['warrior'],
    heroRanks: { ...DEFAULT_HERO_RANKS },
    upgrades: { sharp_blade: 1 },
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
        return createFreshSave({
          ...parsed,
          unlockedHeroes:
            Array.isArray(parsed.unlockedHeroes) && parsed.unlockedHeroes.length > 0
              ? parsed.unlockedHeroes
              : ['warrior'],
          heroRanks: {
            ...DEFAULT_HERO_RANKS,
            ...(parsed.heroRanks ?? {}),
          },
          upgrades: parsed.upgrades ?? { sharp_blade: 1 },
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

  const canvasRef = useRef<GameCanvasHandle | null>(null);
  const comboRef = useRef(0);
  const lastClickRef = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;

  const t = UI_COPY[locale];

  // Derived RPG Combat Stats
  const stats = useMemo(() => {
    const bladeLv = save.upgrades.sharp_blade || 0;
    const autoLv = save.upgrades.auto_attack || 0;
    const furyLv = save.upgrades.fury || 0;
    const greedLv = save.upgrades.greed || 0;
    const critLv = save.upgrades.crit_luck || 0;
    const titanLv = save.upgrades.titan_grip || 0;

    // 25-level milestone multipliers
    const bladeMilestone = Math.pow(2, Math.floor(bladeLv / 25));
    const autoMilestone = Math.pow(2, Math.floor(autoLv / 25));
    const titanMilestone = Math.pow(2, Math.floor(titanLv / 25));

    let baseTap = 1 + bladeLv * 1.6 * bladeMilestone + titanLv * 32 * titanMilestone;
    let baseDps = autoLv * 4 * autoMilestone + titanLv * 48 * titanMilestone;

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
    const dps = baseDps * heroDpsMult * (1 + kirinRank * 0.5) * allDmgMult;

    const critChance = Math.min(0.8, 0.05 + critLv * 0.03 + heroCritBonus);
    const critMultiplier = 5 + heroCritDmgBonus;
    const goldMultiplier =
      (1 + greedLv * 0.25) *
      heroGoldMult *
      (1 + coinRank * 0.4) *
      emblemGoldMult *
      goldRushMult;

    const cdScale = Math.max(0.35, 1 - heartRank * 0.08);
    const bossTimerBonusSec = heartRank * 3;

    return {
      tapDamage,
      dps,
      allDmgMult,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMult: heroBossDmgMult,
      cdScale,
      bossTimerBonusSec,
    };
  }, [save, damage2xLeft, skillActiveLeft.frenzy, skillActiveLeft.gold_rush]);

  const activeHeroDef = useMemo(
    () => HEROES.find((h) => h.id === save.activeHero) || HEROES[0],
    [save.activeHero]
  );

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

  // Buff & Skill cooldown tick (10Hz)
  useEffect(() => {
    if (screen !== 'playing' || adModal || offlinePending || showHelp) return;
    const id = setInterval(() => {
      setDamage2xLeft((prev) => (prev > 0 ? Math.max(0, prev - 0.1) : 0));
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

  const enterGame = useCallback(() => {
    setScreen('playing');
    soundEngine.playUpgrade();
    platformSDK.gameplayStart();
  }, []);

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

  const selectOrUnlockHero = useCallback((heroId: HeroId) => {
    const def = HEROES.find((h) => h.id === heroId);
    if (!def) return;
    setSave((prev) => {
      const curRace = getRaceById(prev.activeRace);
      const nextRace = curRace.classes.includes(heroId) ? prev.activeRace : def.defaultRace;

      if (prev.unlockedHeroes.includes(heroId)) {
        if (prev.activeHero !== heroId) {
          soundEngine.playUpgrade();
          return { ...prev, activeHero: heroId, activeRace: nextRace };
        }
        return prev;
      }
      if (prev.gold < def.unlockCost) return prev;
      soundEngine.playAchievement();
      platformSDK.happytime();
      return {
        ...prev,
        gold: prev.gold - def.unlockCost,
        unlockedHeroes: [...prev.unlockedHeroes, heroId],
        activeHero: heroId,
        activeRace: nextRace,
      };
    });
  }, []);

  const selectRace = useCallback((raceId: RaceId) => {
    soundEngine.playUpgrade();
    setSave((prev) => ({
      ...prev,
      activeRace: raceId,
    }));
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
    setSkillActiveLeft({ frenzy: 0, gold_rush: 0, smite: 0 });
    setSkillCdLeft({ frenzy: 0, gold_rush: 0, smite: 0 });
    setConfirmReset(false);
    platformSDK.saveCloudData(SAVE_KEY, JSON.stringify(fresh));
    canvasRef.current?.resetFloorWave(1);
    setScreen('playing');
    platformSDK.gameplayStart();
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

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden bg-[#0e1017] text-slate-100 select-none ${
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
        heroProjectileColor={activeHeroDef.projectileColor}
        tapDamage={stats.tapDamage}
        dps={stats.dps}
        critChance={stats.critChance}
        critMultiplier={stats.critMultiplier}
        goldMultiplier={stats.goldMultiplier}
        bossDmgMultiplier={stats.bossDmgMult}
        frenzyActive={skillActiveLeft.frenzy > 0}
        damage2xActive={damage2xLeft > 0}
        bossTimerBonusSec={stats.bossTimerBonusSec}
        showOnboardingHand={save.totalClicks < 3 && screen === 'playing' && !isTrailerMode}
        locale={locale}
        onTapStats={handleTapStats}
        onEnemySlain={handleEnemySlain}
        onBossTimerUpdate={setBossSecondsLeft}
      />

      {/* TITLE SCREEN */}
      {screen === 'title' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/60 backdrop-blur-[2px]">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={cycleLocale}
              className="pixel-card px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:brightness-110 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              {locale === 'en' ? 'EN' : locale === 'zh-TW' ? '繁中' : '简中'}
            </button>
          </div>

          <div className="pixel-panel rounded-2xl p-6 sm:p-8 max-w-md w-full flex flex-col items-center text-center gap-5">
            <div className="flex items-center gap-3">
              <PixelSpriteThumb kind="hero" id="warrior" size={52} />
              <PixelSpriteThumb kind="hero" id="shaman" size={52} />
              <PixelSpriteThumb kind="hero" id="druid" size={52} />
              <PixelSpriteThumb kind="hero" id="priest" size={52} />
            </div>

            <div>
              <h1 className="font-pixel text-3xl sm:text-4xl font-bold text-amber-300 tracking-wide pixel-text-shadow">
                {t.gameTitle}
              </h1>
              <p className="font-pixel text-sm text-sky-300 tracking-widest mt-1">
                {t.subtitle}
              </p>
            </div>

            <button
              onClick={enterGame}
              className="pixel-btn-gold w-full py-3.5 rounded-xl font-pixel text-xl font-bold text-slate-950 tracking-wide cursor-pointer"
            >
              {t.playCta}
            </button>

            <p className="text-xs text-slate-300 leading-relaxed">{t.controlsHint}</p>
          </div>
        </div>
      )}

      {/* ACTIVE GAME HUD + SPLIT DOCK */}
      {screen !== 'title' && (
        <div className="fixed inset-0 z-10 pointer-events-none flex flex-col lg:flex-row">
          {/* LEFT ARENA HUD OVERLAY */}
          <div className="relative flex-1 h-[52%] lg:h-full flex flex-col justify-between p-3 sm:p-4">
            {/* Top Row inside Arena */}
            <div className="flex items-start justify-between gap-2">
              {/* Top-Left: 2X DAMAGE Banner */}
              <button
                onClick={startDamage2xAd}
                disabled={damage2xLeft > 0}
                className={`pointer-events-auto pixel-btn-gold rounded-xl px-3 py-2 flex items-center gap-2.5 cursor-pointer transition ${
                  damage2xLeft > 0 ? 'opacity-95' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900/90 border border-amber-950 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-pixel text-sm sm:text-base font-bold text-white pixel-text-shadow whitespace-nowrap">
                    {damage2xLeft > 0 ? t.boostActive : t.boostBtn}
                  </div>
                  <div className="text-[11px] font-bold text-slate-950 font-mono-num">
                    {damage2xLeft > 0
                      ? `${Math.floor(damage2xLeft / 60)}:${String(Math.floor(damage2xLeft % 60)).padStart(2, '0')}`
                      : t.boostSub}
                  </div>
                </div>
              </button>

              {/* Top-Center: Gold + Floor + Progress Bar */}
              <div className="flex flex-col items-center text-center mx-auto">
                <div className="flex items-center gap-2">
                  <PixelIcon name="coin" size={30} />
                  <span className="font-pixel text-3xl sm:text-4xl font-bold text-amber-300 pixel-text-shadow font-mono-num">
                    {formatNumber(save.gold)}
                  </span>
                </div>

                <div className="mt-0.5 font-pixel text-lg sm:text-xl font-bold text-white pixel-text-shadow tracking-wide">
                  {locale === 'en' ? `${t.floorLabel} ${save.floor}` : `${t.floorLabel} ${save.floor} 層`}
                </div>
                <div className="text-xs font-semibold text-slate-300 pixel-text-shadow -mt-0.5">
                  {currentZone.name[locale]} · {currentZone.levelRange}
                  {zoneTier > 1 ? ` · Tier ${zoneTier}` : ''}
                </div>

                {/* Floor Kills / Boss Timer Bar */}
                <div className="mt-1.5 relative w-44 sm:w-64 h-5 rounded-full bg-[#1a1d2b] border-2 border-[#090b10] overflow-hidden shadow-md">
                  <div
                    className={`h-full transition-all duration-150 ${
                      bossFloor
                        ? 'bg-gradient-to-b from-amber-400 to-orange-600'
                        : 'bg-gradient-to-b from-emerald-400 to-green-600'
                    }`}
                    style={{ width: `${floorProgressPct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center font-pixel text-xs font-bold text-white pixel-text-shadow font-mono-num">
                    {bossFloor
                      ? `${t.bossTag} · ${bossSecondsLeft ?? BOSS_TIMER_SEC}s`
                      : `${save.killsOnFloor}/${MONSTERS_PER_FLOOR}`}
                  </div>
                </div>
              </div>

              {/* Top-Right of Arena: Settings & Help */}
              <div className="pointer-events-auto flex flex-col gap-2">
                <button
                  onClick={togglePause}
                  aria-label="Settings"
                  className="pixel-card w-11 h-11 rounded-xl flex items-center justify-center hover:brightness-115 cursor-pointer"
                >
                  <PixelIcon name="gear" size={24} />
                </button>
                <button
                  onClick={() => setShowHelp(true)}
                  aria-label="Help"
                  className="pixel-card w-11 h-11 rounded-xl flex items-center justify-center hover:brightness-115 cursor-pointer"
                >
                  <PixelIcon name="help" size={24} />
                </button>
              </div>
            </div>

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

            {/* Bottom Row inside Arena: Skill Hotbar (1, 2, 3) + Compact DPS badge */}
            <div className="flex items-end justify-between gap-2">
              <div className="pointer-events-auto flex items-center gap-2">
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
                      className={`relative w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition ${
                        active
                          ? 'bg-amber-500 border-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.7)] scale-105'
                          : ready
                          ? 'bg-[#252a3b] border-amber-400 hover:brightness-115 active:scale-95'
                          : 'bg-[#161924] border-slate-700 opacity-80 cursor-not-allowed'
                      }`}
                    >
                      <PixelIcon
                        name={sk.id === 'frenzy' ? 'fury' : sk.id === 'gold_rush' ? 'greed' : 'titan'}
                        size={22}
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-slate-600 font-pixel text-[11px] font-bold text-slate-200 flex items-center justify-center">
                        {sk.hotkey}
                      </span>
                      {(active || cd > 0) && (
                        <span className="absolute inset-0 rounded-full bg-black/55 flex items-center justify-center font-mono-num text-[11px] font-extrabold text-amber-300">
                          {Math.ceil(active ? skillActiveLeft[sk.id] : cd)}s
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Compact Combat Readout */}
              <div className="pixel-card px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs font-mono-num">
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
          <div className="pointer-events-auto w-full lg:w-[430px] h-[48%] lg:h-full p-2 sm:p-3 flex flex-col">
            <div className="pixel-panel rounded-2xl flex-1 flex flex-col overflow-hidden p-2.5 sm:p-3 gap-2.5">
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
                    {UPGRADES.map((u) => {
                      const owned = save.upgrades[u.id] || 0;
                      const { count, totalCost } = getBulkUpgradeQuote(u, owned, save.gold, buyAmount);
                      const canAfford = save.gold >= totalCost;
                      const nextMilestone = Math.floor(owned / 25 + 1) * 25;

                      let subline = '';
                      if (u.kind === 'tap') {
                        subline = `${formatNumber(stats.tapDamage)} damage per tap`;
                      } else if (u.kind === 'dps') {
                        subline = `${formatNumber(stats.dps)} damage per sec`;
                      } else if (u.kind === 'allDmg') {
                        subline = `x${(1 + owned * u.baseValue).toFixed(2)} all damage`;
                      } else if (u.kind === 'gold') {
                        subline = `x${(1 + owned * u.baseValue).toFixed(2)} gold`;
                      } else if (u.kind === 'crit') {
                        subline = `${Math.round(stats.critChance * 100)}% crit for x${stats.critMultiplier.toFixed(0)}`;
                      } else {
                        subline = `+${formatNumber(owned * 32)} tap & +${formatNumber(owned * 48)} dps`;
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

              {/* TAB 2: HEROES (All 9 WoW: Forever Classes & 9 Races) */}
              {dockTab === 'heroes' && (
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <div className="text-center">
                    <div className="font-pixel text-lg font-bold text-amber-300">
                      {t.heroesHeader} {save.unlockedHeroes.length} / {HEROES.length}
                    </div>
                    <div className="text-[11px] text-slate-300">{t.heroesSub}</div>
                  </div>

                  {/* Active Race & Faction Selector for current Hero Class */}
                  {(() => {
                    const validRaces = getRacesForClass(save.activeHero);
                    const curRace = getRaceById(save.activeRace);
                    const isNewCombo = curRace.newClassesInForever.includes(save.activeHero);
                    return (
                      <div className="pixel-card rounded-xl p-2 flex flex-col gap-1.5 shrink-0">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-pixel font-bold text-slate-200">
                            {t.raceLabel}:{' '}
                            <span
                              className={
                                curRace.faction === 'Alliance' ? 'text-sky-400' : 'text-rose-400'
                              }
                            >
                              {curRace.name[locale]} ({curRace.faction})
                            </span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400">
                            {curRace.traitName[locale]}: {curRace.traitDesc[locale]}
                            {isNewCombo ? ' · ★' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {validRaces.map((r) => {
                            const selected = r.id === save.activeRace;
                            const isForeverNew = r.newClassesInForever.includes(save.activeHero);
                            return (
                              <button
                                key={r.id}
                                onClick={() => selectRace(r.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border transition ${
                                  selected
                                    ? r.faction === 'Alliance'
                                      ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                                      : 'bg-rose-500/25 border-rose-400 text-rose-200'
                                    : 'bg-[#171a26] border-[#32394f] text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                {r.name[locale]}
                                {isForeverNew ? ' ★' : ''}
                              </button>
                            );
                          })}
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
                      const canUnlock = !unlocked && save.gold >= hero.unlockCost;
                      const canUpgrade = unlocked && save.gold >= upgCost;

                      return (
                        <div
                          key={hero.id}
                          onClick={() => selectOrUnlockHero(hero.id)}
                          className={`relative rounded-xl p-2 flex flex-col items-center text-center justify-between gap-1.5 border-2 transition cursor-pointer ${
                            isFighting
                              ? 'bg-[#26332c] border-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.28)]'
                              : unlocked
                              ? 'bg-[#232838] border-[#3d4661] hover:border-sky-400'
                              : 'bg-[#191c28] border-[#2d3347]'
                          }`}
                        >
                          {!unlocked && (
                            <div className="absolute top-1.5 right-1.5">
                              <PixelIcon name="lock" size={16} />
                            </div>
                          )}

                          <div className={`mt-1 ${!unlocked ? 'opacity-45 grayscale' : ''}`}>
                            <PixelSpriteThumb kind="hero" id={hero.id} size={46} />
                          </div>

                          <div>
                            <div className="font-pixel text-sm font-bold text-white leading-tight">
                              {hero.name[locale]} {unlocked ? `Lv.${rank}` : ''}
                            </div>
                            <div className="text-[11px] font-bold text-sky-300 leading-tight mt-0.5">
                              {hero.bonusLabel(rank, locale)}
                            </div>
                          </div>

                          {unlocked ? (
                            <div className="w-full flex flex-col gap-1">
                              <div
                                className={`font-pixel text-xs font-bold tracking-wider ${
                                  isFighting ? 'text-emerald-400' : 'text-sky-400'
                                }`}
                              >
                                {isFighting ? t.fighting : t.pick}
                              </div>
                              <button
                                onClick={(e) => upgradeHero(hero.id, e)}
                                disabled={!canUpgrade}
                                className={`w-full py-1 rounded-lg font-pixel text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer ${
                                  canUpgrade
                                    ? 'pixel-btn-green text-white'
                                    : 'pixel-btn-slate text-slate-300 opacity-75 cursor-not-allowed'
                                }`}
                              >
                                <PixelIcon name="coin" size={12} />
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
                              className={`w-full py-1.5 rounded-lg font-pixel text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                                canUnlock
                                  ? 'pixel-btn-gold text-slate-950'
                                  : 'pixel-btn-slate text-slate-400 opacity-75 cursor-not-allowed'
                              }`}
                            >
                              <PixelIcon name="coin" size={13} />
                              <span className="font-mono-num">{formatNumber(hero.unlockCost)}</span>
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
              onClick={() => setShowHelp(false)}
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
              {adModal.type === 'damage2x' ? t.adDamage : t.adOffline}
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
