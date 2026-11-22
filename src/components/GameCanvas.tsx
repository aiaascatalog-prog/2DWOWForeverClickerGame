import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { soundEngine } from '../audio/synth';
import {
  BOSS_TIMER_SEC,
  ENEMY_COUNTER_SKILLS,
  MONSTERS_PER_FLOOR,
  formatNumber,
  getArenaLayout,
  getMonsterGold,
  getMonsterHp,
  getZoneForFloor,
  isBossFloor,
} from '../game/constants';
import {
  getCoinSprite,
  getEnemySprite,
  getHandPointerSprite,
  getHeroSprite,
  getSpriteHitFlash,
} from '../game/pixelSprites';
import { ClassAttackStyle, ClassAutoSkillDef, EnemyTier, HeroId, RaceId } from '../game/types';

export interface CombatEnemy {
  uid: number;
  slot: number;
  archetypeId: string;
  spriteId: string;
  name: string;
  tier: EnemyTier;
  isBoss: boolean;
  hp: number;
  maxHp: number;
  hitFlash: number;
  knockbackX: number;
  spawnAnim: number;
  bobOffset: number;
  skillCd: number;
  skillMaxCd: number;
  skillName: string;
  stealRatio: number;
  staggerCount: number;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  scale: number;
}

interface Projectile {
  active: boolean;
  x: number;
  y: number;
  tx: number;
  ty: number;
  progress: number;
  speed: number;
  color: string;
  style: ClassAttackStyle | 'enemy_counter';
}

interface ArenaEffect {
  active: boolean;
  kind: 'ring' | 'beam' | 'meteor' | 'chain';
  x: number;
  y: number;
  tx: number;
  ty: number;
  life: number;
  maxLife: number;
  color: string;
  radius: number;
}

interface CoinDrop {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  magnetized: boolean;
}

interface LightningBolt {
  active: boolean;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

export interface ClassSkillTimerState {
  cd: number;
  maxCd: number;
}

export interface GameCanvasHandle {
  triggerPlayerAttack: () => void;
  triggerSmite: (damage: number) => void;
  triggerBossSecondWind: () => void;
  triggerShake: (intensity: number) => void;
  resetFloorWave: (newFloor: number) => void;
  spawnGoldLostPopup: (goldLost: number) => void;
}

interface GameCanvasProps {
  isPlaying: boolean;
  floor: number;
  killsOnFloor: number;
  activeHero: HeroId;
  activeRace: RaceId;
  attackStyle: ClassAttackStyle;
  autoSkills: [ClassAutoSkillDef, ClassAutoSkillDef];
  heroProjectileColor: string;
  tapDamage: number;
  skillPowers: [number, number];
  skillCdScales: [number, number];
  critChance: number;
  critMultiplier: number;
  goldMultiplier: number;
  bossDmgMultiplier: number;
  cdScale: number;
  frenzyActive: boolean;
  damage2xActive: boolean;
  coinWardActive: boolean;
  haste2xActive: boolean;
  bossTimerBonusSec: number;
  showOnboardingHand: boolean;
  locale: 'en' | 'zh-TW' | 'zh-CN';
  onTapStats: (isCrit: boolean) => void;
  onEnemySlain: (goldEarned: number, isBoss: boolean, isRare: boolean) => void;
  onEnemyCounterAttack: (stealRatio: number, enemyName: string, isBoss: boolean) => void;
  onBossTimeoutPenalty: (stealRatio: number) => void;
  onClassSkillBonusGold: (goldBonus: number) => void;
  onClassSkillTimers: (timers: ClassSkillTimerState[]) => void;
  onBossTimerUpdate: (secondsLeft: number | null) => void;
}

const PARTICLE_POOL = 200;
const TEXT_POOL = 42;
const PROJ_POOL = 32;
const EFFECT_POOL = 28;
const COIN_POOL = 36;
const BOLT_POOL = 6;

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  (
    {
      isPlaying,
      floor,
      killsOnFloor,
      activeHero,
      activeRace,
      attackStyle,
      autoSkills,
      heroProjectileColor,
      tapDamage,
      skillPowers,
      skillCdScales,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMultiplier,
      cdScale,
      frenzyActive,
      damage2xActive,
      coinWardActive,
      haste2xActive,
      bossTimerBonusSec,
      showOnboardingHand,
      locale,
      onTapStats,
      onEnemySlain,
      onEnemyCounterAttack,
      onBossTimeoutPenalty,
      onClassSkillBonusGold,
      onClassSkillTimers,
      onBossTimerUpdate,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const propsRef = useRef({
      isPlaying,
      floor,
      killsOnFloor,
      activeHero,
      activeRace,
      attackStyle,
      autoSkills,
      heroProjectileColor,
      tapDamage,
      skillPowers,
      skillCdScales,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMultiplier,
      cdScale,
      frenzyActive,
      damage2xActive,
      coinWardActive,
      haste2xActive,
      bossTimerBonusSec,
      showOnboardingHand,
      locale,
    });
    propsRef.current = {
      isPlaying,
      floor,
      killsOnFloor,
      activeHero,
      activeRace,
      attackStyle,
      autoSkills,
      heroProjectileColor,
      tapDamage,
      skillPowers,
      skillCdScales,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMultiplier,
      cdScale,
      frenzyActive,
      damage2xActive,
      coinWardActive,
      haste2xActive,
      bossTimerBonusSec,
      showOnboardingHand,
      locale,
    };

    const callbacksRef = useRef({
      onTapStats,
      onEnemySlain,
      onEnemyCounterAttack,
      onBossTimeoutPenalty,
      onClassSkillBonusGold,
      onClassSkillTimers,
      onBossTimerUpdate,
    });
    callbacksRef.current = {
      onTapStats,
      onEnemySlain,
      onEnemyCounterAttack,
      onBossTimeoutPenalty,
      onClassSkillBonusGold,
      onClassSkillTimers,
      onBossTimerUpdate,
    };

    const simRef = useRef({
      uidCounter: 1,
      enemies: [] as CombatEnemy[],
      targetSlot: 0,
      spawnedFloor: -1,
      heroLunge: 0,
      heroSwing: 0,
      heroHitFlash: 0,
      shake: 0,
      bossTimer: null as number | null,
      lastReportedBossSec: -1,
      pendingRespawns: [0, 0, 0],
      trackedHero: activeHero,
      classSkillCds: [autoSkills[0].cooldownSec, autoSkills[1].cooldownSec],
      timerReportAccum: 0,
      paladinShieldCharges: 0,
    });

    const bonusChestRef = useRef({
      active: false,
      x: 0,
      y: 0,
      life: 0,
      maxLife: 9,
      nextSpawnTimer: 16,
      bobPhase: 0,
    });

    const bgCacheRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(null);

    const motesRef = useRef(
      Array.from({ length: 20 }, (_, idx) => ({
        nx: ((idx * 37) % 97) / 100,
        ny: ((idx * 53) % 89) / 100,
        speedY: 0.015 + (idx % 4) * 0.008,
        drift: 0.5 + (idx % 5) * 0.35,
        size: idx % 3 === 0 ? 2.5 : 1.5,
      }))
    );

    const particlesRef = useRef<Particle[]>(
      Array.from({ length: PARTICLE_POOL }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.5,
        size: 4,
        color: '#facc15',
        gravity: 200,
      }))
    );

    const textsRef = useRef<FloatingText[]>(
      Array.from({ length: TEXT_POOL }, () => ({
        active: false,
        x: 0,
        y: 0,
        vy: -60,
        life: 0,
        maxLife: 0.85,
        text: '',
        color: '#ffffff',
        scale: 1,
      }))
    );

    const projRef = useRef<Projectile[]>(
      Array.from({ length: PROJ_POOL }, () => ({
        active: false,
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        progress: 0,
        speed: 6,
        color: '#93c5fd',
        style: 'cleave',
      }))
    );

    const effectsRef = useRef<ArenaEffect[]>(
      Array.from({ length: EFFECT_POOL }, () => ({
        active: false,
        kind: 'ring',
        x: 0,
        y: 0,
        tx: 0,
        ty: 0,
        life: 0,
        maxLife: 0.4,
        color: '#facc15',
        radius: 40,
      }))
    );

    const coinsRef = useRef<CoinDrop[]>(
      Array.from({ length: COIN_POOL }, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1.05,
        magnetized: false,
      }))
    );

    const boltsRef = useRef<LightningBolt[]>(
      Array.from({ length: BOLT_POOL }, () => ({
        active: false,
        x: 0,
        y: 0,
        life: 0,
        maxLife: 0.35,
      }))
    );

    const getViewportSize = () => {
      const c = canvasRef.current;
      return {
        w: c && c.clientWidth > 0 ? c.clientWidth : window.innerWidth,
        h: c && c.clientHeight > 0 ? c.clientHeight : window.innerHeight,
      };
    };

    const getArenaRect = (w: number, h: number) => {
      const layout = getArenaLayout(w, h);
      return {
        arenaW: layout.arenaW,
        arenaH: layout.arenaH,
        isDesktop: layout.mode === 'side',
      };
    };

    const getHeroPos = (arenaW: number, arenaH: number) => ({
      x: arenaW * 0.17,
      y: arenaH * 0.75,
    });

    const getSlotPos = (slot: number, isBoss: boolean, arenaW: number, arenaH: number) => {
      if (isBoss) {
        return { x: arenaW * 0.66, y: arenaH * 0.73 };
      }
      const coords = [
        { x: arenaW * 0.48, y: arenaH * 0.77 },
        { x: arenaW * 0.67, y: arenaH * 0.70 },
        { x: arenaW * 0.84, y: arenaH * 0.78 },
      ];
      return coords[slot % 3];
    };

    const spawnParticles = (x: number, y: number, count: number, color: string, gravity = 280) => {
      const pool = particlesRef.current;
      let n = 0;
      for (let i = 0; i < pool.length && n < count; i++) {
        if (!pool[i].active) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 60 + Math.random() * 190;
          pool[i].active = true;
          pool[i].x = x;
          pool[i].y = y;
          pool[i].vx = Math.cos(angle) * speed;
          pool[i].vy = Math.sin(angle) * speed - 65;
          pool[i].life = 0;
          pool[i].maxLife = 0.35 + Math.random() * 0.3;
          pool[i].size = 3 + Math.floor(Math.random() * 4);
          pool[i].color = color;
          pool[i].gravity = gravity;
          n++;
        }
      }
    };

    const spawnFloatingText = (x: number, y: number, text: string, color: string, scale = 1) => {
      const pool = textsRef.current;
      for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
          pool[i].active = true;
          pool[i].x = x + (Math.random() - 0.5) * 26;
          pool[i].y = y - 16;
          pool[i].vy = -68 - Math.random() * 18;
          pool[i].life = 0;
          pool[i].maxLife = 0.82;
          pool[i].text = text;
          pool[i].color = color;
          pool[i].scale = scale;
          break;
        }
      }
    };

    const spawnCoins = (x: number, y: number, count: number) => {
      const pool = coinsRef.current;
      let spawned = 0;
      for (let i = 0; i < pool.length && spawned < count; i++) {
        if (!pool[i].active) {
          pool[i].active = true;
          pool[i].x = x;
          pool[i].y = y - 20;
          pool[i].vx = (Math.random() - 0.5) * 150;
          pool[i].vy = -170 - Math.random() * 90;
          pool[i].life = 0;
          pool[i].maxLife = 1.02 + Math.random() * 0.18;
          pool[i].magnetized = false;
          spawned++;
        }
      }
    };

    const spawnArenaEffect = (
      kind: ArenaEffect['kind'],
      x: number,
      y: number,
      tx: number,
      ty: number,
      color: string,
      radius = 42,
      maxLife = 0.38
    ) => {
      const pool = effectsRef.current;
      for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
          pool[i].active = true;
          pool[i].kind = kind;
          pool[i].x = x;
          pool[i].y = y;
          pool[i].tx = tx;
          pool[i].ty = ty;
          pool[i].life = 0;
          pool[i].maxLife = maxLife;
          pool[i].color = color;
          pool[i].radius = radius;
          break;
        }
      }
    };

    const spawnProjectile = (
      tx: number,
      ty: number,
      isCrit: boolean,
      overrideStyle?: ClassAttackStyle | 'enemy_counter',
      overrideColor?: string,
      fromX?: number,
      fromY?: number
    ) => {
      const { w, h } = getViewportSize();
      const { arenaW, arenaH } = getArenaRect(w, h);
      const heroPos = getHeroPos(arenaW, arenaH);
      const style = overrideStyle ?? propsRef.current.attackStyle;
      const color =
        overrideColor ?? (isCrit ? '#facc15' : propsRef.current.heroProjectileColor);

      // Instant / impact ring & beam effects per class primary attack
      if (style === 'holy_beam' || style === 'moonfire') {
        spawnArenaEffect('beam', tx, 0, tx, ty - 14, color, isCrit ? 22 : 14, 0.32);
        spawnArenaEffect('ring', tx, ty - 14, tx, ty - 14, color, isCrit ? 48 : 34, 0.28);
      } else if (style === 'lightning') {
        spawnArenaEffect('chain', heroPos.x + 22, heroPos.y - 36, tx, ty - 34, color, 8, 0.28);
        spawnArenaEffect('ring', tx, ty - 28, tx, ty - 28, '#bae6fd', 32, 0.24);
      } else if (style === 'hammer_wave') {
        spawnArenaEffect('ring', tx, ty - 14, tx, ty - 14, '#facc15', isCrit ? 52 : 36, 0.3);
      }

      const pool = projRef.current;
      for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
          pool[i].active = true;
          pool[i].x = fromX ?? heroPos.x + 22;
          pool[i].y = fromY ?? heroPos.y - 34;
          pool[i].tx = tx;
          pool[i].ty = ty - 34;
          pool[i].progress = 0;
          pool[i].speed =
            style === 'arrow'
              ? 11
              : style === 'cleave' || style === 'dual_slash' || style === 'hammer_wave'
              ? 9.5
              : style === 'enemy_counter'
              ? 4.8
              : 7.5;
          pool[i].color = color;
          pool[i].style = style;
          break;
        }
      }
    };

    const createEnemy = (floorNum: number, slot: number, forceBoss = false): CombatEnemy => {
      const { zone } = getZoneForFloor(floorNum);
      const boss = forceBoss || isBossFloor(floorNum);
      let arch = boss ? zone.boss : zone.enemies[(floorNum + slot) % zone.enemies.length];
      let tier: EnemyTier = boss ? 'boss' : 'normal';

      if (!boss && zone.rares.length > 0 && Math.random() < 0.14) {
        const rarePick = zone.rares[Math.floor(Math.random() * zone.rares.length)];
        arch = rarePick;
        tier = rarePick.tier || 'rare';
      }

      const isRare = tier === 'rare' || tier === 'rare_elite';
      const maxHp = getMonsterHp(floorNum, boss, isRare);
      const counterDef =
        ENEMY_COUNTER_SKILLS[boss ? 'boss' : isRare ? 'rare' : 'normal'];
      const cdJitter = boss ? 0 : (slot * 1.4 + Math.random() * 1.8);
      const maxCd = Math.max(4.8, counterDef.cooldownSec + cdJitter - Math.min(1.5, floorNum * 0.02));

      return {
        uid: simRef.current.uidCounter++,
        slot,
        archetypeId: arch.id,
        spriteId: arch.spriteId,
        name: arch.name[propsRef.current.locale],
        tier,
        isBoss: boss,
        hp: maxHp,
        maxHp,
        hitFlash: 0,
        knockbackX: 0,
        spawnAnim: 1,
        bobOffset: slot * 1.9 + Math.random() * 1.2,
        skillCd: maxCd * (0.65 + Math.random() * 0.35),
        skillMaxCd: maxCd,
        skillName: counterDef.name[propsRef.current.locale],
        stealRatio: counterDef.stealRatio,
        staggerCount: 0,
      };
    };

    const initFloorWave = (floorNum: number) => {
      const s = simRef.current;
      s.spawnedFloor = floorNum;
      s.pendingRespawns = [0, 0, 0];
      if (isBossFloor(floorNum)) {
        s.enemies = [createEnemy(floorNum, 0, true)];
        s.targetSlot = 0;
        s.bossTimer = BOSS_TIMER_SEC + propsRef.current.bossTimerBonusSec;
        callbacksRef.current.onBossTimerUpdate(Math.ceil(s.bossTimer));
      } else {
        s.enemies = [
          createEnemy(floorNum, 0, false),
          createEnemy(floorNum, 1, false),
          createEnemy(floorNum, 2, false),
        ];
        s.targetSlot = 0;
        s.bossTimer = null;
        callbacksRef.current.onBossTimerUpdate(null);
      }
    };

    const applyDamageToEnemy = (
      enemy: CombatEnemy,
      rawDamage: number,
      isCrit: boolean,
      showFloatText: boolean,
      vfxColor?: string
    ) => {
      const { w, h } = getViewportSize();
      const { arenaW, arenaH } = getArenaRect(w, h);
      const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);

      const effectiveDmg = enemy.isBoss ? rawDamage * propsRef.current.bossDmgMultiplier : rawDamage;
      enemy.hp = Math.max(0, enemy.hp - effectiveDmg);
      enemy.hitFlash = 0.14;
      enemy.knockbackX = isCrit ? 12 : 6;

      if (showFloatText) {
        const text = isCrit ? `CRIT ${formatNumber(effectiveDmg)}!` : `${formatNumber(effectiveDmg)}`;
        const color = isCrit ? '#facc15' : vfxColor || '#ffffff';
        spawnFloatingText(pos.x, pos.y - (enemy.isBoss ? 110 : 72), text, color, isCrit ? 1.32 : 1);
      }

      spawnParticles(
        pos.x,
        pos.y - 36,
        isCrit ? 14 : 6,
        vfxColor || (isCrit ? '#facc15' : propsRef.current.heroProjectileColor),
        320
      );

      if (enemy.hp <= 0) {
        const currentFloor = propsRef.current.floor;
        const isRare = enemy.tier === 'rare' || enemy.tier === 'rare_elite';
        const goldDrop = Math.max(
          1,
          Math.floor(getMonsterGold(currentFloor, enemy.isBoss, isRare) * propsRef.current.goldMultiplier)
        );

        spawnParticles(pos.x, pos.y - 36, enemy.isBoss ? 38 : isRare ? 26 : 18, '#fbbf24', 360);
        spawnCoins(pos.x, pos.y - 16, enemy.isBoss ? 12 : isRare ? 7 : 4);
        spawnFloatingText(pos.x, pos.y - 96, `+${formatNumber(goldDrop)}g`, '#fde047', 1.15);

        if (enemy.isBoss) {
          simRef.current.shake = Math.max(simRef.current.shake, 11);
        }

        const s = simRef.current;
        s.enemies = s.enemies.filter((e) => e.uid !== enemy.uid);

        const nextKills = propsRef.current.killsOnFloor + 1;
        const willAdvanceFloor = enemy.isBoss || nextKills >= MONSTERS_PER_FLOOR;

        if (!willAdvanceFloor && !enemy.isBoss) {
          s.pendingRespawns[enemy.slot] = s.enemies.length === 0 ? 0.05 : 0.22;
        }

        if (s.enemies.length > 0) {
          s.targetSlot = s.enemies[0].slot;
        }

        callbacksRef.current.onEnemySlain(goldDrop, enemy.isBoss, isRare);
      }
    };

    const triggerClassAutoSkill = (
      skill: ClassAutoSkillDef,
      skillIndex: number,
      arenaW: number,
      arenaH: number
    ) => {
      const s = simRef.current;
      const p = propsRef.current;
      if (s.enemies.length === 0) return;

      const heroPos = getHeroPos(arenaW, arenaH);
      soundEngine.playClassAutoSkill(skill.aoe);
      s.heroLunge = Math.max(s.heroLunge, 0.8);
      s.heroSwing = Math.max(s.heroSwing, 0.9);

      spawnFloatingText(heroPos.x, heroPos.y - 92, `${skill.name[p.locale]}!`, skill.color, 0.95);

      const targets = skill.aoe
        ? [...s.enemies]
        : [s.enemies.find((e) => e.slot === s.targetSlot) || s.enemies[0]];

      // Apply special utility perks
      if (skill.special === 'shield') {
        s.paladinShieldCharges = Math.min(2, s.paladinShieldCharges + 1);
        spawnFloatingText(heroPos.x, heroPos.y - 114, 'WARD +1', '#fde047', 0.9);
      }
      if (skill.special === 'gold_steal') {
        const bonus = Math.max(2, Math.floor(getMonsterGold(p.floor, false, false) * p.goldMultiplier * 0.65));
        callbacksRef.current.onClassSkillBonusGold(bonus);
        spawnCoins(heroPos.x + 12, heroPos.y - 36, 4);
        spawnFloatingText(heroPos.x, heroPos.y - 114, `+${formatNumber(bonus)}g`, '#fde047', 0.95);
      }

      // Render skill-specific pixel VFX + damage
      if (skill.effect === 'whirlwind' || skill.effect === 'consecrate' || skill.effect === 'shadow_aoe') {
        const center = getSlotPos(1, false, arenaW, arenaH);
        spawnArenaEffect('ring', center.x, center.y - 18, center.x, center.y - 18, skill.color, 130, 0.42);
      }

      const baseSkillPower = p.skillPowers[skillIndex] ?? p.skillPowers[0];

      targets.forEach((enemy, idx) => {
        const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);
        const isCrit = skill.special === 'crit_guaranteed' || Math.random() < p.critChance;
        let dmg = Math.max(2, baseSkillPower * skill.damageMult);
        if (isCrit) dmg *= p.critMultiplier;
        if (skill.special === 'boss_bonus' && enemy.isBoss) dmg *= 1.4;

        if (skill.effect === 'rain_of_fire' || skill.effect === 'starfall') {
          spawnArenaEffect('meteor', pos.x - 45, 0, pos.x, pos.y - 30, skill.color, 18, 0.38);
        } else if (skill.effect === 'moonfire' || skill.effect === 'holy') {
          spawnArenaEffect('beam', pos.x, 0, pos.x, pos.y - 10, skill.color, 18, 0.35);
        } else if (skill.effect === 'lightning') {
          const prev = idx === 0 ? { x: heroPos.x + 22, y: heroPos.y - 36 } : getSlotPos(targets[idx - 1].slot, targets[idx - 1].isBoss, arenaW, arenaH);
          spawnArenaEffect('chain', prev.x, prev.y - (idx === 0 ? 0 : 30), pos.x, pos.y - 30, skill.color, 10, 0.3);
        } else if (skill.effect === 'lava') {
          spawnArenaEffect('ring', pos.x, pos.y - 14, pos.x, pos.y - 14, '#f97316', 54, 0.38);
          spawnParticles(pos.x, pos.y - 24, 18, '#fb923c', 360);
        } else {
          spawnProjectile(pos.x, pos.y, isCrit, p.attackStyle, skill.color);
        }

        if (skill.special === 'chill') {
          enemy.skillCd = Math.min(enemy.skillMaxCd, enemy.skillCd + 2.2);
          spawnFloatingText(pos.x, pos.y - 98, 'CHILL', '#7dd3fc', 0.85);
        }

        applyDamageToEnemy(enemy, dmg, isCrit, true, skill.color);
      });
    };

    const performTapAttack = (preferredSlot?: number) => {
      const s = simRef.current;
      if (!propsRef.current.isPlaying) return;
      if (s.enemies.length === 0) return;

      let target =
        preferredSlot !== undefined
          ? s.enemies.find((e) => e.slot === preferredSlot)
          : s.enemies.find((e) => e.slot === s.targetSlot);

      if (!target) {
        target = s.enemies[0];
      }
      s.targetSlot = target.slot;

      // Interrupt / stagger enemy cast bar slightly if player actively clicks a telegraphing enemy
      if (target.skillCd <= 1.8 && target.staggerCount < 3) {
        target.skillCd = Math.min(target.skillMaxCd, target.skillCd + 0.45);
        target.staggerCount += 1;
        const { w, h } = getViewportSize();
        const { arenaW, arenaH } = getArenaRect(w, h);
        const tPos = getSlotPos(target.slot, target.isBoss, arenaW, arenaH);
        spawnFloatingText(tPos.x, tPos.y - 102, 'STAGGER!', '#38bdf8', 0.85);
      }

      const isCrit = Math.random() < propsRef.current.critChance;
      const dmg = Math.max(
        1,
        propsRef.current.tapDamage * (isCrit ? propsRef.current.critMultiplier : 1)
      );

      s.heroLunge = 1;
      s.heroSwing = 1;
      if (isCrit) {
        s.shake = Math.max(s.shake, 6);
      }

      const { w, h } = getViewportSize();
      const { arenaW, arenaH } = getArenaRect(w, h);
      const pos = getSlotPos(target.slot, target.isBoss, arenaW, arenaH);
      spawnProjectile(pos.x, pos.y, isCrit);

      callbacksRef.current.onTapStats(isCrit);
      applyDamageToEnemy(target, dmg, isCrit, true);
    };

    useImperativeHandle(ref, () => ({
      triggerPlayerAttack() {
        performTapAttack();
      },
      triggerSmite(damage: number) {
        const s = simRef.current;
        if (s.enemies.length === 0) return;
        const { w, h } = getViewportSize();
        const { arenaW, arenaH } = getArenaRect(w, h);
        s.shake = Math.max(s.shake, 13);

        const targets = [...s.enemies];
        targets.forEach((enemy, idx) => {
          const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);
          const bolt = boltsRef.current[idx % BOLT_POOL];
          bolt.active = true;
          bolt.x = pos.x;
          bolt.y = pos.y;
          bolt.life = 0;
          bolt.maxLife = 0.36;
          spawnParticles(pos.x, pos.y - 30, 18, '#38bdf8', 220);
          applyDamageToEnemy(enemy, damage, true, true);
        });
      },
      triggerBossSecondWind() {
        const s = simRef.current;
        if (s.bossTimer !== null) {
          s.bossTimer += 15;
          callbacksRef.current.onBossTimerUpdate(Math.ceil(s.bossTimer));
        }
        const boss = s.enemies.find((e) => e.isBoss);
        if (boss) {
          const { w, h } = getViewportSize();
          const { arenaW, arenaH } = getArenaRect(w, h);
          const pos = getSlotPos(boss.slot, true, arenaW, arenaH);
          spawnArenaEffect('beam', pos.x, 0, pos.x, pos.y - 10, '#fde047', 26, 0.45);
          s.shake = Math.max(s.shake, 10);
          applyDamageToEnemy(boss, Math.max(10, boss.maxHp * 0.25), true, true, '#fde047');
        }
      },
      triggerShake(intensity: number) {
        simRef.current.shake = Math.max(simRef.current.shake, intensity);
      },
      resetFloorWave(newFloor: number) {
        initFloorWave(newFloor);
      },
      spawnGoldLostPopup(goldLost: number) {
        if (goldLost <= 0) return;
        const { w, h } = getViewportSize();
        const { arenaW, arenaH } = getArenaRect(w, h);
        const heroPos = getHeroPos(arenaW, arenaH);
        spawnFloatingText(heroPos.x, heroPos.y - 104, `-${formatNumber(goldLost)}g`, '#f87171', 1.2);
        spawnParticles(heroPos.x, heroPos.y - 42, 14, '#ef4444', 320);
      },
    }));

    // Ensure initial wave spawns when floor changes
    useEffect(() => {
      if (simRef.current.spawnedFloor !== floor) {
        initFloorWave(floor);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floor]);

    // Reset Class Auto-Skill cooldowns when player switches active Hero Class
    useEffect(() => {
      const s = simRef.current;
      if (s.trackedHero !== activeHero) {
        s.trackedHero = activeHero;
        s.paladinShieldCharges = 0;
        const max0 = Math.max(1.0, autoSkills[0].cooldownSec * skillCdScales[0]);
        const max1 = Math.max(1.0, autoSkills[1].cooldownSec * skillCdScales[1]);
        s.classSkillCds = [max0 * 0.6, max1 * 0.8];
        callbacksRef.current.onClassSkillTimers([
          { cd: s.classSkillCds[0], maxCd: max0 },
          { cd: s.classSkillCds[1], maxCd: max1 },
        ]);
      }
    }, [activeHero, autoSkills, skillCdScales]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!propsRef.current.isPlaying) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { arenaW, arenaH } = getArenaRect(rect.width, rect.height);

      if (px > arenaW || py > arenaH) return;

      // Check interactive Golden Treasure Chest first
      const chest = bonusChestRef.current;
      if (chest.active) {
        const cdx = px - chest.x;
        const cdy = py - (chest.y - 14);
        if (cdx * cdx + cdy * cdy <= 38 * 38) {
          chest.active = false;
          chest.nextSpawnTimer = 20 + Math.random() * 8;
          const p = propsRef.current;
          const bonus = Math.max(
            25,
            Math.floor(getMonsterGold(p.floor, false, true) * p.goldMultiplier * 2.2)
          );
          soundEngine.playGoldenCatch();
          spawnParticles(chest.x, chest.y - 16, 26, '#facc15', 300);
          spawnCoins(chest.x, chest.y - 14, 9);
          spawnFloatingText(chest.x, chest.y - 46, `+${formatNumber(bonus)}g TREASURE!`, '#fde047', 1.2);
          callbacksRef.current.onClassSkillBonusGold(bonus);
          return;
        }
      }

      const s = simRef.current;
      let hitSlot: number | undefined;
      for (const enemy of s.enemies) {
        const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);
        const radius = enemy.isBoss ? 72 : 52;
        const dx = px - pos.x;
        const dy = py - (pos.y - 38);
        if (dx * dx + dy * dy <= radius * radius) {
          hitSlot = enemy.slot;
          break;
        }
      }
      performTapAttack(hitSlot);
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animId = 0;
      let lastTime = performance.now();

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, canvas.clientWidth || window.innerWidth);
        const h = Math.max(1, canvas.clientHeight || window.innerHeight);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      resize();
      window.addEventListener('resize', resize);
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
      ro?.observe(canvas);

      const bakeDungeonBackdrop = (
        arenaW: number,
        arenaH: number,
        groundY: number,
        zone: ReturnType<typeof getZoneForFloor>['zone']
      ): HTMLCanvasElement => {
        const cacheKey = `${zone.index}_${Math.round(arenaW)}_${Math.round(arenaH)}`;
        if (bgCacheRef.current && bgCacheRef.current.key === cacheKey) {
          return bgCacheRef.current.canvas;
        }

        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.round(arenaW));
        off.height = Math.max(1, Math.round(arenaH));
        const b = off.getContext('2d');
        if (!b) return off;

        // 1. Deep atmospheric wall gradient
        const wallGrad = b.createLinearGradient(0, 0, 0, groundY);
        wallGrad.addColorStop(0, '#090b10');
        wallGrad.addColorStop(0.28, zone.wallColor);
        wallGrad.addColorStop(1, zone.wallColor);
        b.fillStyle = wallGrad;
        b.fillRect(0, 0, arenaW, groundY);

        // 2. Weathered staggered masonry blocks with bevel highlights & cracks
        const brickW = 48;
        const brickH = 24;
        for (let row = 0; row * brickH < groundY; row++) {
          const offset = (row % 2) * (brickW / 2);
          for (let col = -1; col * brickW < arenaW + brickW; col++) {
            const bx = Math.round(col * brickW + offset);
            const by = Math.round(row * brickH);
            const seed = Math.abs(Math.sin(row * 19.7 + col * 43.3));

            if (seed > 0.62) {
              b.fillStyle = 'rgba(255, 255, 255, 0.045)';
              b.fillRect(bx + 2, by + 2, brickW - 4, brickH - 4);
            } else if (seed < 0.25) {
              b.fillStyle = 'rgba(0, 0, 0, 0.18)';
              b.fillRect(bx + 2, by + 2, brickW - 4, brickH - 4);
            }

            // Top bevel highlight + dark mortar joint
            b.fillStyle = 'rgba(255, 255, 255, 0.045)';
            b.fillRect(bx + 1, by + 1, brickW - 3, 2);
            b.fillStyle = zone.wallTrim;
            b.fillRect(bx, by + brickH - 2, brickW, 2);
            b.fillRect(bx, by, 2, brickH);

            // Subtle stone weathering crack
            if (seed > 0.87) {
              b.fillStyle = 'rgba(0, 0, 0, 0.35)';
              b.fillRect(bx + 14, by + 6, 2, 7);
              b.fillRect(bx + 16, by + 11, 5, 2);
            }
          }
        }

        // 3. Recessed Dungeon Prison Alcove on Right Wall
        if (arenaW >= 420) {
          const gx = Math.round(arenaW * 0.84);
          const gy = Math.round(groundY * 0.26);
          const gw = 54;
          const gh = Math.round(groundY * 0.44);
          b.fillStyle = '#07090e';
          b.fillRect(gx, gy, gw, gh);
          b.fillStyle = zone.wallTrim;
          b.fillRect(gx - 4, gy - 4, gw + 8, 5);
          b.fillRect(gx - 4, gy, 4, gh);
          b.fillRect(gx + gw, gy, 4, gh);
          b.fillRect(gx - 4, gy + gh, gw + 8, 5);
          // Iron bars
          for (let ix = gx + 9; ix < gx + gw - 4; ix += 11) {
            b.fillStyle = '#334155';
            b.fillRect(ix, gy, 3, gh);
            b.fillStyle = '#64748b';
            b.fillRect(ix, gy, 1, gh);
          }
          b.fillStyle = '#1e293b';
          b.fillRect(gx, gy + Math.round(gh * 0.48), gw, 4);
        }

        // 4. Curved Gothic Keystone Archway (misty corridor depth + portcullis)
        const archX = Math.round(arenaW * 0.52);
        const archW = Math.min(184, Math.round(arenaW * 0.29));
        const archH = Math.round(groundY * 0.66);
        const archTopY = groundY - archH;
        const archRadius = Math.round(archW / 2);
        const springY = archTopY + archRadius;

        // Outer carved stone pillar & curved arch surround
        b.fillStyle = '#0b0d14';
        b.beginPath();
        b.arc(archX, springY, archRadius + 14, Math.PI, 0);
        b.lineTo(archX + archRadius + 14, groundY);
        b.lineTo(archX - archRadius - 14, groundY);
        b.closePath();
        b.fill();

        b.fillStyle = zone.wallTrim;
        b.beginPath();
        b.arc(archX, springY, archRadius + 11, Math.PI, 0);
        b.lineTo(archX + archRadius + 11, groundY);
        b.lineTo(archX - archRadius - 11, groundY);
        b.closePath();
        b.fill();

        // Dark recessed doorway gradient
        const doorGrad = b.createLinearGradient(0, archTopY, 0, groundY);
        doorGrad.addColorStop(0, '#040509');
        doorGrad.addColorStop(0.65, '#090c14');
        doorGrad.addColorStop(1, '#121826');
        b.fillStyle = doorGrad;
        b.beginPath();
        b.arc(archX, springY, archRadius - 2, Math.PI, 0);
        b.lineTo(archX + archRadius - 2, groundY);
        b.lineTo(archX - archRadius + 2, groundY);
        b.closePath();
        b.fill();

        // Subtle misty steps inside doorway
        b.fillStyle = 'rgba(148, 163, 184, 0.08)';
        b.fillRect(archX - archRadius + 14, groundY - 22, archW - 28, 6);
        b.fillRect(archX - archRadius + 8, groundY - 12, archW - 16, 12);

        // Raised iron portcullis teeth at arch top
        b.save();
        b.beginPath();
        b.arc(archX, springY, archRadius - 2, Math.PI, 0);
        b.lineTo(archX + archRadius - 2, archTopY + Math.round(archH * 0.34));
        b.lineTo(archX - archRadius + 2, archTopY + Math.round(archH * 0.34));
        b.closePath();
        b.clip();
        for (let px = archX - archRadius + 12; px < archX + archRadius - 8; px += 16) {
          b.fillStyle = '#1e293b';
          b.fillRect(px, archTopY, 4, Math.round(archH * 0.34));
          b.fillStyle = '#475569';
          b.fillRect(px, archTopY, 1, Math.round(archH * 0.34));
        }
        b.fillStyle = '#1e293b';
        b.fillRect(archX - archRadius, archTopY + Math.round(archH * 0.25), archW, 4);
        b.restore();

        // Stone pillar plinths & keystone accent
        b.fillStyle = '#475569';
        b.fillRect(archX - archRadius - 14, groundY - 14, 18, 14);
        b.fillRect(archX + archRadius - 4, groundY - 14, 18, 14);
        b.fillStyle = '#64748b';
        b.fillRect(archX - 8, archTopY - 12, 16, 15);

        // 5. Perspective Stone Flagstone Floor
        const floorGrad = b.createLinearGradient(0, groundY, 0, arenaH);
        floorGrad.addColorStop(0, zone.floorAccent);
        floorGrad.addColorStop(0.22, zone.floorColor);
        floorGrad.addColorStop(1, '#090b10');
        b.fillStyle = floorGrad;
        b.fillRect(0, groundY, arenaW, arenaH - groundY);

        // Wall-floor ambient occlusion & curb stone edge
        const aoGrad = b.createLinearGradient(0, groundY, 0, groundY + 18);
        aoGrad.addColorStop(0, 'rgba(0,0,0,0.48)');
        aoGrad.addColorStop(1, 'rgba(0,0,0,0)');
        b.fillStyle = aoGrad;
        b.fillRect(0, groundY, arenaW, 18);

        b.fillStyle = 'rgba(255,255,255,0.09)';
        b.fillRect(0, groundY, arenaW, 2);

        b.strokeStyle = 'rgba(0,0,0,0.34)';
        b.lineWidth = 2;
        for (let rowY = groundY + 26; rowY < arenaH; rowY += 32) {
          b.beginPath();
          b.moveTo(0, rowY);
          b.lineTo(arenaW, rowY);
          b.stroke();
        }
        const centerFloorX = arenaW * 0.5;
        for (let fx = -40; fx <= arenaW + 40; fx += 64) {
          const skew = (fx - centerFloorX) * 0.22;
          b.beginPath();
          b.moveTo(fx, groundY + 2);
          b.lineTo(fx + skew, arenaH);
          b.stroke();
        }

        // 6. Hanging Crest Banner with Iron Chains & Shaded Folds
        const bx = Math.round(arenaW * 0.23);
        const by = Math.round(groundY * 0.16);
        // Iron rod & brackets
        b.fillStyle = '#0b0e14';
        b.fillRect(bx - 36, by - 4, 72, 8);
        b.fillStyle = '#64748b';
        b.fillRect(bx - 34, by - 2, 68, 4);
        b.fillStyle = '#94a3b8';
        b.fillRect(bx - 32, by - 2, 64, 1);

        // Swallowtail banner cloth + shadow fold
        b.fillStyle = '#090b10';
        b.beginPath();
        b.moveTo(bx - 29, by + 4);
        b.lineTo(bx + 29, by + 4);
        b.lineTo(bx + 29, by + 84);
        b.lineTo(bx, by + 70);
        b.lineTo(bx - 29, by + 84);
        b.closePath();
        b.fill();

        b.fillStyle = zone.bannerColor;
        b.beginPath();
        b.moveTo(bx - 26, by + 5);
        b.lineTo(bx + 26, by + 5);
        b.lineTo(bx + 26, by + 80);
        b.lineTo(bx, by + 67);
        b.lineTo(bx - 26, by + 80);
        b.closePath();
        b.fill();

        b.fillStyle = 'rgba(0, 0, 0, 0.22)';
        b.fillRect(bx, by + 5, 26, 66);

        // Gold border trim & crest skull
        b.fillStyle = '#facc15';
        b.fillRect(bx - 26, by + 5, 52, 3);
        b.fillRect(bx - 26, by + 5, 3, 73);
        b.fillRect(bx + 23, by + 5, 3, 73);

        b.fillStyle = '#f8fafc';
        b.fillRect(bx - 9, by + 23, 18, 14);
        b.fillRect(bx - 6, by + 37, 12, 6);
        b.fillStyle = '#090b10';
        b.fillRect(bx - 6, by + 28, 4, 4);
        b.fillRect(bx + 2, by + 28, 4, 4);
        b.fillRect(bx - 2, by + 39, 1, 3);
        b.fillRect(bx + 1, by + 39, 1, 3);

        // 7. Grounded Left Crate & Iron-Hooped Barrel
        const cx = Math.round(arenaW * 0.04);
        const cy = Math.round(groundY - 42);
        b.fillStyle = 'rgba(0,0,0,0.48)';
        b.beginPath();
        b.ellipse(cx + 22, groundY + 3, 26, 6, 0, 0, Math.PI * 2);
        b.fill();

        b.fillStyle = '#0b0e14';
        b.fillRect(cx - 2, cy - 2, 46, 46);
        b.fillStyle = '#78350f';
        b.fillRect(cx, cy, 42, 42);
        b.fillStyle = '#92400e';
        b.fillRect(cx + 4, cy + 4, 34, 34);
        b.fillStyle = '#b45309';
        b.fillRect(cx + 4, cy + 4, 34, 4);
        b.fillStyle = '#451a03';
        b.fillRect(cx + 4, cy + 19, 34, 4);
        b.fillRect(cx + 19, cy + 4, 4, 34);
        // Diagonal crate brace
        b.strokeStyle = '#5c280a';
        b.lineWidth = 4;
        b.beginPath();
        b.moveTo(cx + 6, cy + 36);
        b.lineTo(cx + 36, cy + 6);
        b.stroke();

        const barX = cx + 48;
        const barY = Math.round(groundY - 36);
        b.fillStyle = 'rgba(0,0,0,0.48)';
        b.beginPath();
        b.ellipse(barX + 15, groundY + 3, 18, 5, 0, 0, Math.PI * 2);
        b.fill();

        b.fillStyle = '#0b0e14';
        b.fillRect(barX - 2, barY - 2, 34, 38);
        b.fillStyle = '#854d0e';
        b.fillRect(barX, barY, 30, 34);
        b.fillStyle = '#a16207';
        b.fillRect(barX + 6, barY + 2, 10, 30);
        b.fillStyle = '#475569';
        b.fillRect(barX, barY + 6, 30, 4);
        b.fillRect(barX, barY + 23, 30, 4);

        // 8. Soft Framing Vignette
        const vig = b.createRadialGradient(
          arenaW * 0.5,
          arenaH * 0.55,
          arenaW * 0.28,
          arenaW * 0.5,
          arenaH * 0.55,
          Math.max(arenaW, arenaH) * 0.78
        );
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(5, 7, 12, 0.45)');
        b.fillStyle = vig;
        b.fillRect(0, 0, arenaW, arenaH);

        bgCacheRef.current = { key: cacheKey, canvas: off };
        return off;
      };

      const drawPixelTorch = (x: number, y: number, timeSec: number, color: string) => {
        // Sconce iron bracket
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 6, y + 5, 12, 7);
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 5, y + 5, 10, 2);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 3, y - 4, 6, 11);

        const flicker = Math.sin(timeSec * 12 + x * 0.1) * 3.5;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const halo = ctx.createRadialGradient(x, y - 10, 3, x, y - 10, 74 + flicker);
        halo.addColorStop(0, `${color}50`);
        halo.addColorStop(0.45, `${color}1e`);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y - 10, 76 + flicker, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const fShift = Math.round(Math.sin(timeSec * 16 + x) * 2);
        ctx.fillStyle = color;
        ctx.fillRect(x - 5, y - 15, 10, 11);
        ctx.fillRect(x - 3 + fShift, y - 21, 6, 7);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x - 2, y - 13, 4, 7);
        ctx.fillRect(x - 1 + fShift, y - 17, 3, 4);
      };

      const loop = (now: number) => {
        const rawDt = (now - lastTime) / 1000;
        lastTime = now;
        const dt = Math.min(rawDt, 0.05);
        const timeSec = now / 1000;

        const p = propsRef.current;
        const s = simRef.current;
        const { w, h } = getViewportSize();
        const { arenaW, arenaH } = getArenaRect(w, h);
        const groundY = Math.round(arenaH * 0.76);

        // Decay animations
        s.heroLunge = Math.max(0, s.heroLunge - dt * 6);
        s.heroSwing = Math.max(0, s.heroSwing - dt * 5);
        s.heroHitFlash = Math.max(0, s.heroHitFlash - dt);
        s.shake = Math.max(0, s.shake - dt * 28);

        if (p.isPlaying) {
          if (s.spawnedFloor !== p.floor) {
            initFloorWave(p.floor);
          }

          // Respawn pending slots
          for (let slot = 0; slot < 3; slot++) {
            if (s.pendingRespawns[slot] > 0) {
              s.pendingRespawns[slot] -= dt;
              if (s.pendingRespawns[slot] <= 0 && !isBossFloor(p.floor)) {
                s.pendingRespawns[slot] = 0;
                const spawned = createEnemy(p.floor, slot, false);
                s.enemies.push(spawned);
                if (s.enemies.length === 1) {
                  s.targetSlot = spawned.slot;
                }
              }
            }
          }

          // Boss countdown timer & penalty on timeout
          if (s.bossTimer !== null && s.enemies.length > 0) {
            s.bossTimer -= dt;
            const ceilSec = Math.max(0, Math.ceil(s.bossTimer));
            if (ceilSec !== s.lastReportedBossSec) {
              s.lastReportedBossSec = ceilSec;
              callbacksRef.current.onBossTimerUpdate(ceilSec);
            }
            if (s.bossTimer <= 0) {
              const boss = s.enemies[0];
              if (boss) {
                boss.hp = boss.maxHp;
                boss.hitFlash = 0.25;
              }
              s.bossTimer = BOSS_TIMER_SEC + p.bossTimerBonusSec;
              s.shake = Math.max(s.shake, 10);
              if (p.coinWardActive) {
                const heroPos = getHeroPos(arenaW, arenaH);
                spawnFloatingText(heroPos.x, heroPos.y - 96, 'WARDED!', '#38bdf8', 1.1);
                soundEngine.playShieldBlock();
              } else {
                soundEngine.playEnemyCounter();
                callbacksRef.current.onBossTimeoutPenalty(0.15);
              }
            }
          }

          // Class Countdown Auto-Skills (each class skill scales independently!)
          const maxCd0 = Math.max(1.0, p.autoSkills[0].cooldownSec * p.skillCdScales[0]);
          const maxCd1 = Math.max(1.0, p.autoSkills[1].cooldownSec * p.skillCdScales[1]);
          const maxCds = [maxCd0, maxCd1];
          if (s.enemies.length > 0) {
            for (let i = 0; i < 2; i++) {
              const sk = p.autoSkills[i];
              s.classSkillCds[i] -= dt;
              if (s.classSkillCds[i] <= 0) {
                s.classSkillCds[i] = maxCds[i];
                triggerClassAutoSkill(sk, i, arenaW, arenaH);
              }
            }
          }

          s.timerReportAccum += dt;
          if (s.timerReportAccum >= 0.1) {
            s.timerReportAccum = 0;
            callbacksRef.current.onClassSkillTimers([
              {
                cd: Math.max(0, s.classSkillCds[0]),
                maxCd: maxCd0,
              },
              {
                cd: Math.max(0, s.classSkillCds[1]),
                maxCd: maxCd1,
              },
            ]);
          }

          // Enemy Counter-Attack Cooldown Skills (steal coins!)
          const heroPos = getHeroPos(arenaW, arenaH);
          for (const enemy of s.enemies) {
            enemy.skillCd -= dt;
            if (enemy.skillCd <= 0) {
              enemy.skillCd = enemy.skillMaxCd;
              enemy.staggerCount = 0;
              enemy.knockbackX = -10;

              const ePos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);
              spawnFloatingText(ePos.x, ePos.y - (enemy.isBoss ? 115 : 82), `${enemy.skillName}!`, '#fb7185', 0.9);
              spawnProjectile(
                heroPos.x,
                heroPos.y,
                false,
                'enemy_counter',
                '#f43f5e',
                ePos.x - 18,
                ePos.y - 34
              );

              if (p.coinWardActive || s.paladinShieldCharges > 0) {
                if (!p.coinWardActive && s.paladinShieldCharges > 0) {
                  s.paladinShieldCharges -= 1;
                }
                soundEngine.playShieldBlock();
                spawnFloatingText(heroPos.x, heroPos.y - 92, 'BLOCKED!', '#38bdf8', 1.05);
                spawnParticles(heroPos.x + 12, heroPos.y - 38, 10, '#38bdf8', 180);
              } else {
                s.heroHitFlash = 0.2;
                s.shake = Math.max(s.shake, enemy.isBoss ? 9 : 5);
                soundEngine.playEnemyCounter();
                callbacksRef.current.onEnemyCounterAttack(enemy.stealRatio, enemy.name, enemy.isBoss);
              }
            }
          }
        }

        // Update enemies
        for (const enemy of s.enemies) {
          enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
          if (enemy.knockbackX > 0) {
            enemy.knockbackX = Math.max(0, enemy.knockbackX - dt * 55);
          } else if (enemy.knockbackX < 0) {
            enemy.knockbackX = Math.min(0, enemy.knockbackX + dt * 55);
          }
          enemy.spawnAnim = Math.max(0, enemy.spawnAnim - dt * 4.5);
        }

        // Update projectiles
        for (const pr of projRef.current) {
          if (!pr.active) continue;
          pr.progress += dt * pr.speed;
          if (pr.progress >= 1) pr.active = false;
        }

        // Update arena effects
        for (const ef of effectsRef.current) {
          if (!ef.active) continue;
          ef.life += dt;
          if (ef.life >= ef.maxLife) ef.active = false;
        }

        // Bonus Golden Chest periodic spawn & timer
        const chest = bonusChestRef.current;
        if (p.isPlaying) {
          if (chest.active) {
            chest.life -= dt;
            chest.bobPhase += dt * 4.5;
            if (chest.life <= 0) {
              chest.active = false;
              chest.nextSpawnTimer = 20 + Math.random() * 8;
            }
          } else {
            chest.nextSpawnTimer -= dt;
            if (chest.nextSpawnTimer <= 0) {
              chest.active = true;
              chest.x = Math.round(arenaW * (0.3 + Math.random() * 0.44));
              chest.y = Math.round(groundY + 26);
              chest.life = chest.maxLife;
              chest.bobPhase = 0;
            }
          }
        }

        // Update coins (floor bounce -> magnet arc to top-center Gold counter)
        const goldTargetX = arenaW * 0.5;
        const goldTargetY = 26;
        for (const c of coinsRef.current) {
          if (!c.active) continue;
          c.life += dt;
          if (c.life >= c.maxLife) {
            c.active = false;
            continue;
          }
          if (!c.magnetized && c.life > 0.34) {
            c.magnetized = true;
          }
          if (c.magnetized) {
            const dx = goldTargetX - c.x;
            const dy = goldTargetY - c.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 16) {
              c.active = false;
              continue;
            }
            const pull = 10 + (c.life - 0.34) * 14;
            c.x += (dx / Math.max(1, dist)) * pull * 55 * dt;
            c.y += (dy / Math.max(1, dist)) * pull * 55 * dt;
          } else {
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.vy += 580 * dt;
            if (c.y > groundY) {
              c.y = groundY;
              c.vy *= -0.45;
              c.vx *= 0.7;
            }
          }
        }

        // Update particles
        for (const pt of particlesRef.current) {
          if (!pt.active) continue;
          pt.life += dt;
          if (pt.life >= pt.maxLife) {
            pt.active = false;
            continue;
          }
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.vy += pt.gravity * dt;
        }

        // Update floating texts
        for (const ft of textsRef.current) {
          if (!ft.active) continue;
          ft.life += dt;
          if (ft.life >= ft.maxLife) {
            ft.active = false;
            continue;
          }
          ft.y += ft.vy * dt;
        }

        // Update lightning bolts
        for (const lb of boltsRef.current) {
          if (!lb.active) continue;
          lb.life += dt;
          if (lb.life >= lb.maxLife) lb.active = false;
        }

        // ================= RENDER =================
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        if (s.shake > 0.2) {
          ctx.translate((Math.random() - 0.5) * s.shake * 1.8, (Math.random() - 0.5) * s.shake * 1.8);
        }

        const { zone } = getZoneForFloor(p.floor);

        ctx.fillStyle = '#0e1017';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, arenaW, arenaH);
        ctx.clip();

        // Cached Procedural Dungeon Backdrop
        const backdrop = bakeDungeonBackdrop(arenaW, arenaH, groundY, zone);
        ctx.drawImage(backdrop, 0, 0, arenaW, arenaH);

        // Flickering Wall Torches + Light Pools
        drawPixelTorch(Math.round(arenaW * 0.1), Math.round(groundY * 0.43), timeSec, zone.torchColor);
        drawPixelTorch(Math.round(arenaW * 0.37), Math.round(groundY * 0.36), timeSec, zone.torchColor);
        drawPixelTorch(Math.round(arenaW * 0.78), Math.round(groundY * 0.39), timeSec, zone.torchColor);

        // Ambient Drifting Dungeon Dust Motes
        ctx.fillStyle = `${zone.torchColor}66`;
        for (const m of motesRef.current) {
          const my = ((m.ny - timeSec * m.speedY) % 1 + 1) % 1;
          const mx = (m.nx + Math.sin(timeSec * m.drift + m.ny * 10) * 0.025 + 1) % 1;
          ctx.fillRect(Math.round(mx * arenaW), Math.round(my * arenaH * 0.9), m.size, m.size);
        }

        if (p.damage2xActive || p.frenzyActive) {
          ctx.fillStyle = p.frenzyActive ? 'rgba(249, 115, 22, 0.08)' : 'rgba(250, 204, 21, 0.06)';
          ctx.fillRect(0, 0, arenaW, arenaH);
        }

        // Interactive Golden Treasure Chest
        if (chest.active && p.isPlaying) {
          const cBob = Math.round(Math.sin(chest.bobPhase) * 2.5);
          const cx = Math.round(chest.x);
          const cy = Math.round(chest.y + cBob);
          const pulse = 0.45 + Math.sin(timeSec * 8) * 0.25;

          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.beginPath();
          ctx.ellipse(cx, chest.y + 4, 20, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy - 12, 24, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#090b10';
          ctx.fillRect(cx - 16, cy - 24, 32, 24);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(cx - 14, cy - 22, 28, 20);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(cx - 14, cy - 22, 28, 4);
          ctx.fillRect(cx - 14, cy - 14, 28, 3);
          ctx.fillRect(cx - 3, cy - 15, 6, 7);

          ctx.font = '700 10px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#090b10';
          ctx.fillText('LOOT!', cx + 1, cy - 30);
          ctx.fillStyle = '#fde047';
          ctx.fillText('LOOT!', cx, cy - 31);
        }

        // HERO RENDERING (2x EPX Sprites + Squash-and-Stretch + Safari-Safe Hit Flash)
        const heroPos = getHeroPos(arenaW, arenaH);
        const heroSprite = getHeroSprite(p.activeHero, p.activeRace);
        const heroScale = Math.max(1.3, Math.min(2.5, arenaW / 320, arenaH / 216));
        const heroDrawW = heroSprite.width * heroScale;
        const heroDrawH = heroSprite.height * heroScale;
        const heroBob = Math.round(Math.sin(timeSec * 4.2) * 2);
        const lungePx = Math.round(s.heroLunge * 22);
        const heroStretchX = 1 + s.heroLunge * 0.09;
        const heroStretchY = 1 - s.heroLunge * 0.06;

        ctx.fillStyle = 'rgba(0,0,0,0.48)';
        ctx.beginPath();
        ctx.ellipse(heroPos.x + lungePx, heroPos.y + 4, heroDrawW * 0.42, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (p.frenzyActive || p.damage2xActive) {
          ctx.strokeStyle = p.frenzyActive ? '#f97316' : '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(heroPos.x + lungePx, heroPos.y + 4, heroDrawW * 0.52, 11, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Coin Ward or Paladin Shield Dome around Hero
        if (p.coinWardActive || s.paladinShieldCharges > 0) {
          ctx.save();
          ctx.strokeStyle = p.coinWardActive ? '#38bdf8' : '#fde047';
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.65 + Math.sin(timeSec * 6) * 0.2;
          ctx.beginPath();
          ctx.arc(heroPos.x + lungePx, heroPos.y - heroDrawH * 0.45, heroDrawW * 0.62, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        ctx.translate(Math.round(heroPos.x + lungePx), Math.round(heroPos.y + heroBob));
        ctx.scale(heroStretchX, heroStretchY);
        ctx.drawImage(
          heroSprite,
          Math.round(-heroDrawW / 2),
          Math.round(-heroDrawH),
          Math.round(heroDrawW),
          Math.round(heroDrawH)
        );
        if (s.heroHitFlash > 0) {
          ctx.globalAlpha = Math.min(0.85, s.heroHitFlash * 4.5);
          ctx.drawImage(
            getSpriteHitFlash(heroSprite),
            Math.round(-heroDrawW / 2),
            Math.round(-heroDrawH),
            Math.round(heroDrawW),
            Math.round(heroDrawH)
          );
        }
        ctx.restore();

        // ENEMIES RENDERING (2x EPX Sprites + Squash-and-Stretch + Safari-Safe Hit Flash)
        const sortedEnemies = [...s.enemies].sort((a, b) => a.slot - b.slot);
        for (const enemy of sortedEnemies) {
          const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);
          const sprite = getEnemySprite(enemy.spriteId);
          const isRare = enemy.tier === 'rare' || enemy.tier === 'rare_elite';
          const baseScale = Math.max(1.4, Math.min(2.6, arenaW / 300, arenaH / 204));
          const scale =
            baseScale *
            (enemy.isBoss ? 1.42 : isRare ? 1.14 : 1) *
            (1 - enemy.spawnAnim * 0.35);
          const drawW = sprite.width * scale;
          const drawH = sprite.height * scale;
          const bob = Math.round(Math.sin(timeSec * 4 + enemy.bobOffset) * 2.5);
          const ex = Math.round(pos.x + enemy.knockbackX);
          const ey = Math.round(pos.y);
          const isTelegraphing = enemy.skillCd <= 1.8;

          const isTarget = enemy.slot === s.targetSlot;
          if (isTarget || isRare || isTelegraphing) {
            ctx.strokeStyle = isTelegraphing
              ? '#fb7185'
              : enemy.isBoss
              ? '#facc15'
              : enemy.tier === 'rare_elite'
              ? '#c084fc'
              : enemy.tier === 'rare'
              ? '#38bdf8'
              : '#ef4444';
            ctx.lineWidth = isTelegraphing ? 3.5 : isTarget ? 3 : 2;
            ctx.beginPath();
            ctx.ellipse(ex, ey + 4, drawW * 0.54, 11, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = 'rgba(0,0,0,0.48)';
          ctx.beginPath();
          ctx.ellipse(ex, ey + 4, drawW * 0.4, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          const squashAmt = enemy.hitFlash > 0 ? enemy.hitFlash * 0.7 : 0;
          ctx.save();
          ctx.translate(ex, ey + bob);
          ctx.scale(1 - squashAmt, 1 + squashAmt * 0.75);
          ctx.drawImage(
            sprite,
            Math.round(-drawW / 2),
            Math.round(-drawH),
            Math.round(drawW),
            Math.round(drawH)
          );
          if (enemy.hitFlash > 0) {
            ctx.globalAlpha = Math.min(0.85, enemy.hitFlash * 6);
            ctx.drawImage(
              getSpriteHitFlash(sprite),
              Math.round(-drawW / 2),
              Math.round(-drawH),
              Math.round(drawW),
              Math.round(drawH)
            );
          }
          ctx.restore();

          // Enemy HP Bar + Counter-Skill Cooldown Bar underneath
          const barW = enemy.isBoss ? 136 : isRare ? 88 : 74;
          const barH = enemy.isBoss ? 12 : 9;
          const barX = Math.round(ex - barW / 2);
          const barY = Math.round(ey - drawH - (enemy.isBoss ? 28 : 20));
          const hpRatio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

          ctx.fillStyle = '#090b10';
          ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = enemy.isBoss
            ? '#f59e0b'
            : enemy.tier === 'rare_elite'
            ? '#c084fc'
            : enemy.tier === 'rare'
            ? '#38bdf8'
            : '#ef4444';
          ctx.fillRect(barX, barY, Math.round(barW * hpRatio), barH);

          // Enemy Counter-Attack Cast Progress Bar (right below HP bar)
          const castProgress = Math.max(0, Math.min(1, 1 - enemy.skillCd / enemy.skillMaxCd));
          const castBarY = barY + barH + 2;
          ctx.fillStyle = '#090b10';
          ctx.fillRect(barX - 1, castBarY - 1, barW + 2, 5);
          ctx.fillStyle = isTelegraphing ? '#fb7185' : '#a855f7';
          ctx.fillRect(barX, castBarY, Math.round(barW * castProgress), 3);

          if (isTelegraphing) {
            ctx.font = '800 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#090b10';
            ctx.fillText(`! ${enemy.skillCd.toFixed(1)}s`, ex + 1, barY - (enemy.isBoss || isRare ? 19 : 6));
            ctx.fillStyle = '#fda4af';
            ctx.fillText(`! ${enemy.skillCd.toFixed(1)}s`, ex, barY - (enemy.isBoss || isRare ? 20 : 7));
          }

          if (enemy.isBoss || isRare) {
            const label =
              enemy.tier === 'rare_elite'
                ? `★ ${enemy.name}`
                : enemy.tier === 'rare'
                ? `◆ ${enemy.name}`
                : enemy.name;
            ctx.font = `700 ${enemy.isBoss ? 13 : 11}px "Plus Jakarta Sans", system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#090b10';
            ctx.fillText(label, ex + 1, barY - 6);
            ctx.fillStyle = enemy.isBoss
              ? '#fde047'
              : enemy.tier === 'rare_elite'
              ? '#e879f9'
              : '#7dd3fc';
            ctx.fillText(label, ex, barY - 7);
          }
        }

        // Onboarding Pixel Hand
        if (p.showOnboardingHand && s.enemies.length > 0) {
          const target = s.enemies.find((e) => e.slot === s.targetSlot) || s.enemies[0];
          const tPos = getSlotPos(target.slot, target.isBoss, arenaW, arenaH);
          const hand = getHandPointerSprite();
          const hBob = Math.round(Math.sin(timeSec * 7) * 7);
          ctx.drawImage(hand, Math.round(tPos.x - 16), Math.round(tPos.y - 115 + hBob), 38, 42);
        }

        // Arena Effects (Beams, Whirlwind Rings, Meteors, Chain Lightning)
        for (const ef of effectsRef.current) {
          if (!ef.active) continue;
          const progress = ef.life / ef.maxLife;
          const alpha = Math.max(0, 1 - progress);
          ctx.save();
          ctx.globalAlpha = alpha;
          if (ef.kind === 'ring') {
            ctx.strokeStyle = ef.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(
              ef.x,
              ef.y,
              Math.max(8, ef.radius * (0.4 + progress * 0.8)),
              Math.max(4, ef.radius * 0.25 * (0.4 + progress * 0.8)),
              0,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          } else if (ef.kind === 'beam') {
            ctx.fillStyle = ef.color;
            ctx.fillRect(Math.round(ef.tx - ef.radius * 0.45), 0, Math.round(ef.radius * 0.9), Math.round(ef.ty));
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(ef.tx - 3), 0, 6, Math.round(ef.ty));
          } else if (ef.kind === 'meteor') {
            const mx = ef.x + (ef.tx - ef.x) * Math.min(1, progress * 1.4);
            const my = ef.y + (ef.ty - ef.y) * Math.min(1, progress * 1.4);
            ctx.fillStyle = ef.color;
            ctx.fillRect(Math.round(mx - 7), Math.round(my - 7), 14, 14);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(Math.round(mx - 4), Math.round(my - 4), 8, 8);
          } else if (ef.kind === 'chain') {
            ctx.strokeStyle = ef.color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            const midX = (ef.x + ef.tx) / 2;
            const midY = (ef.y + ef.ty) / 2 - 18;
            ctx.moveTo(ef.x, ef.y);
            ctx.lineTo(midX - 10, midY);
            ctx.lineTo(midX + 12, midY + 14);
            ctx.lineTo(ef.tx, ef.ty);
            ctx.stroke();
          }
          ctx.restore();
        }

        // Per-Class Projectiles & Primary Attack VFX
        for (const pr of projRef.current) {
          if (!pr.active) continue;
          const cx = pr.x + (pr.tx - pr.x) * pr.progress;
          const cy = pr.y + (pr.ty - pr.y) * pr.progress;
          const alpha = Math.max(0, 1 - pr.progress * 0.65);
          ctx.save();
          ctx.globalAlpha = alpha;

          if (pr.style === 'cleave') {
            const r = 28 + pr.progress * 18;
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(pr.tx - r * 0.7, pr.ty - r * 0.9);
            ctx.quadraticCurveTo(pr.tx + r * 0.9, pr.ty - r * 0.1, pr.tx + r * 0.35, pr.ty + r * 0.85);
            ctx.stroke();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(pr.tx - r * 0.65, pr.ty - r * 0.85);
            ctx.quadraticCurveTo(pr.tx + r * 0.85, pr.ty - r * 0.1, pr.tx + r * 0.3, pr.ty + r * 0.8);
            ctx.stroke();
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(pr.tx - r * 0.55, pr.ty - r * 0.72);
            ctx.quadraticCurveTo(pr.tx + r * 0.78, pr.ty - r * 0.1, pr.tx + r * 0.25, pr.ty + r * 0.7);
            ctx.stroke();
          } else if (pr.style === 'dual_slash') {
            const sz = 22 + pr.progress * 12;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(pr.tx - sz, pr.ty - sz);
            ctx.quadraticCurveTo(pr.tx + 6, pr.ty - 6, pr.tx + sz, pr.ty + sz);
            ctx.stroke();
            ctx.strokeStyle = '#fda4af';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(pr.tx + sz, pr.ty - sz);
            ctx.quadraticCurveTo(pr.tx - 6, pr.ty - 6, pr.tx - sz, pr.ty + sz);
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(pr.tx - sz * 0.7, pr.ty - sz * 0.7);
            ctx.lineTo(pr.tx + sz * 0.7, pr.ty + sz * 0.7);
            ctx.stroke();
          } else if (pr.style === 'hammer_wave') {
            ctx.translate(cx, cy);
            ctx.rotate(pr.progress * Math.PI * 4);
            ctx.fillStyle = '#0b0e14';
            ctx.fillRect(-10, -10, 20, 20);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-8, -8, 16, 9);
            ctx.fillStyle = '#92400e';
            ctx.fillRect(-2, 1, 4, 9);
          } else if (pr.style === 'arrow') {
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(Math.round(cx - 18), Math.round(cy - 1), 12, 2);
            ctx.fillStyle = '#a16207';
            ctx.fillRect(Math.round(cx - 8), Math.round(cy - 2), 18, 4);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(Math.round(cx + 8), Math.round(cy - 4), 7, 8);
          } else if (pr.style === 'frost_orb') {
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(Math.round(cx - 10), Math.round(cy - 10), 20, 20);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(Math.round(cx - 7), Math.round(cy - 7), 14, 14);
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(Math.round(cx - 3), Math.round(cy - 3), 6, 6);
          } else if (pr.style === 'fel_bolt') {
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(Math.round(cx - 12), Math.round(cy - 8), 16, 16);
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(Math.round(cx - 8), Math.round(cy - 8), 16, 16);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(Math.round(cx - 5), Math.round(cy - 5), 10, 10);
            ctx.fillStyle = '#dcfce7';
            ctx.fillRect(Math.round(cx - 2), Math.round(cy - 2), 4, 4);
          } else if (pr.style === 'moonfire') {
            ctx.fillStyle = '#a5b4fc';
            ctx.fillRect(Math.round(pr.tx - 10), Math.round(pr.ty - 10), 20, 20);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(Math.round(pr.tx - 6), Math.round(pr.ty - 6), 12, 12);
          } else if (pr.style === 'holy_beam') {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(Math.round(pr.tx - 11), Math.round(pr.ty - 11), 22, 22);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(pr.tx - 5), Math.round(pr.ty - 5), 10, 10);
          } else if (pr.style === 'enemy_counter') {
            ctx.fillStyle = '#090b10';
            ctx.fillRect(Math.round(cx - 8), Math.round(cy - 8), 16, 16);
            ctx.fillStyle = '#f43f5e';
            ctx.fillRect(Math.round(cx - 5), Math.round(cy - 5), 10, 10);
          } else {
            // Lightning spark core
            ctx.fillStyle = '#bae6fd';
            ctx.fillRect(Math.round(pr.tx - 8), Math.round(pr.ty - 8), 16, 16);
            ctx.fillStyle = pr.color;
            ctx.fillRect(Math.round(pr.tx - 4), Math.round(pr.ty - 4), 8, 8);
          }
          ctx.restore();
        }

        // Arcane Smite Pixel Lightning Bolts
        for (const lb of boltsRef.current) {
          if (!lb.active) continue;
          const alpha = 1 - lb.life / lb.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(Math.round(lb.x - 8), 0, 16, Math.round(lb.y - 10));
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(Math.round(lb.x - 14), 0, 6, Math.round(lb.y - 10));
          ctx.fillRect(Math.round(lb.x + 8), 0, 6, Math.round(lb.y - 10));
          ctx.restore();
        }

        // Coin Drops
        const coinImg = getCoinSprite();
        for (const c of coinsRef.current) {
          if (!c.active) continue;
          const alpha = c.life > c.maxLife * 0.78 ? 1 - (c.life - c.maxLife * 0.78) / (c.maxLife * 0.22) : 1;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.drawImage(coinImg, Math.round(c.x - 9), Math.round(c.y - 9), 18, 18);
        }
        ctx.globalAlpha = 1;

        // Pixel Particles
        for (const pt of particlesRef.current) {
          if (!pt.active) continue;
          const alpha = 1 - pt.life / pt.maxLife;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        }
        ctx.globalAlpha = 1;

        // Floating Damage & Gold Texts
        for (const ft of textsRef.current) {
          if (!ft.active) continue;
          const alpha = 1 - ft.life / ft.maxLife;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.font = `800 ${Math.round(16 * ft.scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#090b10';
          ctx.fillText(ft.text, Math.round(ft.x + 2), Math.round(ft.y + 2));
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
        }
        ctx.globalAlpha = 1;

        ctx.restore();
        ctx.restore();

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', resize);
        ro?.disconnect();
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="fixed inset-0 block w-full h-full cursor-pointer select-none touch-none"
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
