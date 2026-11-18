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
        maxLife: 0.85,
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
          pool[i].vx = (Math.random() - 0.5) * 140;
          pool[i].vy = -160 - Math.random() * 90;
          pool[i].life = 0;
          pool[i].maxLife = 0.75 + Math.random() * 0.25;
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

      const drawPixelTorch = (x: number, y: number, timeSec: number, color: string) => {
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 6, y + 6, 12, 8);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 4, y - 4, 8, 12);

        const flicker = Math.sin(timeSec * 13 + x) * 3;
        const grad = ctx.createRadialGradient(x, y - 10, 4, x, y - 10, 56 + flicker);
        grad.addColorStop(0, `${color}55`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y - 10, 58 + flicker, 0, Math.PI * 2);
        ctx.fill();

        const fShift = Math.round(Math.sin(timeSec * 16 + x) * 2);
        ctx.fillStyle = color;
        ctx.fillRect(x - 6, y - 16, 12, 12);
        ctx.fillRect(x - 4 + fShift, y - 22, 8, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x - 3, y - 14, 6, 8);
        ctx.fillRect(x - 2 + fShift, y - 18, 4, 4);
      };

      const drawDungeonProps = (arenaW: number, groundY: number, zoneBanner: string) => {
        const bx = Math.round(arenaW * 0.24);
        const by = Math.round(groundY * 0.2);
        ctx.fillStyle = '#0b0e14';
        ctx.fillRect(bx - 34, by - 4, 68, 8);
        ctx.fillStyle = zoneBanner;
        ctx.fillRect(bx - 28, by + 4, 56, 84);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx - 28, by + 4, 56, 4);
        ctx.fillRect(bx - 28, by + 4, 4, 80);
        ctx.fillRect(bx + 24, by + 4, 4, 80);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(bx - 10, by + 26, 20, 16);
        ctx.fillRect(bx - 6, by + 42, 12, 8);
        ctx.fillStyle = zoneBanner;
        ctx.fillRect(bx - 6, by + 32, 4, 4);
        ctx.fillRect(bx + 2, by + 32, 4, 4);

        const cx = Math.round(arenaW * 0.04);
        const cy = Math.round(groundY - 46);
        ctx.fillStyle = '#0b0e14';
        ctx.fillRect(cx - 2, cy - 2, 48, 48);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx, cy, 44, 44);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(cx + 4, cy + 4, 36, 36);
        ctx.fillStyle = '#5c280a';
        ctx.fillRect(cx + 4, cy + 19, 36, 5);
        ctx.fillRect(cx + 19, cy + 4, 5, 36);

        const barX = cx + 50;
        const barY = Math.round(groundY - 38);
        ctx.fillStyle = '#0b0e14';
        ctx.fillRect(barX - 2, barY - 2, 34, 40);
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(barX, barY, 30, 36);
        ctx.fillStyle = '#475569';
        ctx.fillRect(barX, barY + 6, 30, 4);
        ctx.fillRect(barX, barY + 24, 30, 4);
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

        // Update coins
        for (const c of coinsRef.current) {
          if (!c.active) continue;
          c.life += dt;
          if (c.life >= c.maxLife) {
            c.active = false;
            continue;
          }
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.vy += 580 * dt;
          if (c.y > groundY) {
            c.y = groundY;
            c.vy *= -0.45;
            c.vx *= 0.7;
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

        // Dungeon Wall
        ctx.fillStyle = zone.wallColor;
        ctx.fillRect(0, 0, arenaW, groundY);

        // Pixel Brick Texture
        ctx.fillStyle = zone.wallTrim;
        const brickW = 44;
        const brickH = 22;
        for (let row = 0; row * brickH < groundY; row++) {
          const offset = (row % 2) * (brickW / 2);
          for (let col = -1; col * brickW < arenaW; col++) {
            const bx = col * brickW + offset;
            const by = row * brickH;
            ctx.fillRect(bx, by, brickW - 3, 2);
            ctx.fillRect(bx, by, 2, brickH - 2);
          }
        }

        // Central Stone Archway
        const archX = Math.round(arenaW * 0.52);
        const archW = Math.min(180, arenaW * 0.28);
        const archH = groundY * 0.62;
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(archX - archW / 2, groundY - archH, archW, archH);
        ctx.fillStyle = zone.wallTrim;
        ctx.fillRect(archX - archW / 2 - 12, groundY - archH - 12, archW + 24, 14);
        ctx.fillRect(archX - archW / 2 - 12, groundY - archH, 12, archH);
        ctx.fillRect(archX + archW / 2, groundY - archH, 12, archH);

        // Dungeon Stone Floor
        ctx.fillStyle = zone.floorColor;
        ctx.fillRect(0, groundY, arenaW, arenaH - groundY);
        ctx.fillStyle = zone.floorAccent;
        ctx.fillRect(0, groundY, arenaW, 4);
        for (let fx = 0; fx < arenaW; fx += 56) {
          ctx.fillRect(fx, groundY, 3, arenaH - groundY);
        }
        ctx.fillRect(0, groundY + 34, arenaW, 3);
        ctx.fillRect(0, groundY + 74, arenaW, 3);

        drawDungeonProps(arenaW, groundY, zone.bannerColor);
        drawPixelTorch(Math.round(arenaW * 0.1), Math.round(groundY * 0.43), timeSec, zone.torchColor);
        drawPixelTorch(Math.round(arenaW * 0.37), Math.round(groundY * 0.36), timeSec, zone.torchColor);
        drawPixelTorch(Math.round(arenaW * 0.78), Math.round(groundY * 0.39), timeSec, zone.torchColor);

        if (p.damage2xActive || p.frenzyActive) {
          ctx.fillStyle = p.frenzyActive ? 'rgba(249, 115, 22, 0.08)' : 'rgba(250, 204, 21, 0.06)';
          ctx.fillRect(0, 0, arenaW, arenaH);
        }

        // HERO RENDERING (with Racial Appearance!)
        const heroPos = getHeroPos(arenaW, arenaH);
        const heroSprite = getHeroSprite(p.activeHero, p.activeRace);
        const heroScale = Math.max(2.6, Math.min(5.0, arenaW / 160, arenaH / 108));
        const heroDrawW = heroSprite.width * heroScale;
        const heroDrawH = heroSprite.height * heroScale;
        const heroBob = Math.round(Math.sin(timeSec * 4.2) * 2);
        const lungePx = Math.round(s.heroLunge * 22);

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
        if (s.heroHitFlash > 0) {
          ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(4)';
        }
        ctx.drawImage(
          heroSprite,
          Math.round(heroPos.x - heroDrawW / 2 + lungePx),
          Math.round(heroPos.y - heroDrawH + heroBob),
          Math.round(heroDrawW),
          Math.round(heroDrawH)
        );
        ctx.restore();

        // ENEMIES RENDERING
        const sortedEnemies = [...s.enemies].sort((a, b) => a.slot - b.slot);
        for (const enemy of sortedEnemies) {
          const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);
          const sprite = getEnemySprite(enemy.spriteId);
          const isRare = enemy.tier === 'rare' || enemy.tier === 'rare_elite';
          const baseScale = Math.max(2.8, Math.min(5.2, arenaW / 150, arenaH / 102));
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

          ctx.save();
          if (enemy.hitFlash > 0) {
            ctx.filter = 'brightness(2.4)';
          }
          ctx.drawImage(
            sprite,
            Math.round(ex - drawW / 2),
            Math.round(ey - drawH + bob),
            Math.round(drawW),
            Math.round(drawH)
          );
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
            ctx.font = '700 10px "Pixelify Sans", monospace';
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
            ctx.font = `700 ${enemy.isBoss ? 13 : 11}px "Pixelify Sans", monospace`;
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
          ctx.drawImage(hand, Math.round(tPos.x - 16), Math.round(tPos.y - 115 + hBob), 44, 48);
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
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(pr.tx, pr.ty, 30 + pr.progress * 18, -Math.PI * 0.8, Math.PI * 0.35);
            ctx.stroke();
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(pr.tx, pr.ty, 27 + pr.progress * 18, -Math.PI * 0.72, Math.PI * 0.25);
            ctx.stroke();
          } else if (pr.style === 'dual_slash') {
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 5;
            const sz = 22 + pr.progress * 12;
            ctx.beginPath();
            ctx.moveTo(pr.tx - sz, pr.ty - sz);
            ctx.lineTo(pr.tx + sz, pr.ty + sz);
            ctx.stroke();
            ctx.strokeStyle = '#fda4af';
            ctx.beginPath();
            ctx.moveTo(pr.tx + sz, pr.ty - sz);
            ctx.lineTo(pr.tx - sz, pr.ty + sz);
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
          const alpha = c.life > c.maxLife * 0.7 ? 1 - (c.life - c.maxLife * 0.7) / (c.maxLife * 0.3) : 1;
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.drawImage(coinImg, Math.round(c.x - 10), Math.round(c.y - 10), 20, 20);
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
          ctx.font = `700 ${Math.round(17 * ft.scale)}px "Pixelify Sans", monospace`;
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
