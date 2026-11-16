import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  BOSS_TIMER_SEC,
  MONSTERS_PER_FLOOR,
  formatNumber,
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
import { EnemyTier, HeroId } from '../game/types';

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
  kind: 'slash' | 'bolt';
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

export interface GameCanvasHandle {
  triggerPlayerAttack: () => void;
  triggerSmite: (damage: number) => void;
  triggerShake: (intensity: number) => void;
  resetFloorWave: (newFloor: number) => void;
}

interface GameCanvasProps {
  isPlaying: boolean;
  floor: number;
  killsOnFloor: number;
  activeHero: HeroId;
  heroProjectileColor: string;
  tapDamage: number;
  dps: number;
  critChance: number;
  critMultiplier: number;
  goldMultiplier: number;
  bossDmgMultiplier: number;
  frenzyActive: boolean;
  damage2xActive: boolean;
  bossTimerBonusSec: number;
  showOnboardingHand: boolean;
  locale: 'en' | 'zh-TW' | 'zh-CN';
  onTapStats: (isCrit: boolean) => void;
  onEnemySlain: (goldEarned: number, isBoss: boolean, isRare: boolean) => void;
  onBossTimerUpdate: (secondsLeft: number | null) => void;
}

const PARTICLE_POOL = 180;
const TEXT_POOL = 36;
const PROJ_POOL = 24;
const COIN_POOL = 32;
const BOLT_POOL = 6;

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  (
    {
      isPlaying,
      floor,
      killsOnFloor,
      activeHero,
      heroProjectileColor,
      tapDamage,
      dps,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMultiplier,
      frenzyActive,
      damage2xActive,
      bossTimerBonusSec,
      showOnboardingHand,
      locale,
      onTapStats,
      onEnemySlain,
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
      heroProjectileColor,
      tapDamage,
      dps,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMultiplier,
      frenzyActive,
      damage2xActive,
      bossTimerBonusSec,
      showOnboardingHand,
      locale,
    });
    propsRef.current = {
      isPlaying,
      floor,
      killsOnFloor,
      activeHero,
      heroProjectileColor,
      tapDamage,
      dps,
      critChance,
      critMultiplier,
      goldMultiplier,
      bossDmgMultiplier,
      frenzyActive,
      damage2xActive,
      bossTimerBonusSec,
      showOnboardingHand,
      locale,
    };

    const callbacksRef = useRef({
      onTapStats,
      onEnemySlain,
      onBossTimerUpdate,
    });
    callbacksRef.current = { onTapStats, onEnemySlain, onBossTimerUpdate };

    const simRef = useRef({
      uidCounter: 1,
      enemies: [] as CombatEnemy[],
      targetSlot: 0,
      spawnedFloor: -1,
      heroLunge: 0,
      heroSwing: 0,
      shake: 0,
      dpsAccumulator: 0,
      bossTimer: null as number | null,
      lastReportedBossSec: -1,
      pendingRespawns: [0, 0, 0],
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
        kind: 'bolt',
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

    const getArenaRect = (w: number, h: number) => {
      const isDesktop = w >= 920;
      const arenaW = isDesktop ? Math.max(460, w - 430) : w;
      const arenaH = isDesktop ? h : Math.max(300, h * 0.52);
      return { arenaW, arenaH, isDesktop };
    };

    const getHeroPos = (arenaW: number, arenaH: number) => ({
      x: arenaW * 0.18,
      y: arenaH * 0.77,
    });

    const getSlotPos = (slot: number, isBoss: boolean, arenaW: number, arenaH: number) => {
      if (isBoss) {
        return { x: arenaW * 0.67, y: arenaH * 0.74 };
      }
      const coords = [
        { x: arenaW * 0.49, y: arenaH * 0.79 },
        { x: arenaW * 0.67, y: arenaH * 0.71 },
        { x: arenaW * 0.83, y: arenaH * 0.8 },
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
          pool[i].maxLife = 0.8;
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

    const spawnProjectile = (tx: number, ty: number, isCrit: boolean) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const { arenaW, arenaH } = getArenaRect(w, h);
      const heroPos = getHeroPos(arenaW, arenaH);
      const hero = propsRef.current.activeHero;
      const kind =
        hero === 'hunter' ||
        hero === 'mage' ||
        hero === 'warlock' ||
        hero === 'priest' ||
        hero === 'shaman' ||
        hero === 'druid'
          ? 'bolt'
          : 'slash';

      const pool = projRef.current;
      for (let i = 0; i < pool.length; i++) {
        if (!pool[i].active) {
          pool[i].active = true;
          pool[i].x = heroPos.x + 22;
          pool[i].y = heroPos.y - 34;
          pool[i].tx = tx;
          pool[i].ty = ty - 34;
          pool[i].progress = 0;
          pool[i].speed = kind === 'bolt' ? 7.5 : 10;
          pool[i].color = isCrit ? '#facc15' : propsRef.current.heroProjectileColor;
          pool[i].kind = kind;
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
      showFloatText: boolean
    ) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const { arenaW, arenaH } = getArenaRect(w, h);
      const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);

      const effectiveDmg = enemy.isBoss ? rawDamage * propsRef.current.bossDmgMultiplier : rawDamage;
      enemy.hp = Math.max(0, enemy.hp - effectiveDmg);
      enemy.hitFlash = 0.14;
      enemy.knockbackX = isCrit ? 12 : 6;

      if (showFloatText) {
        const text = isCrit ? `CRIT ${formatNumber(effectiveDmg)}!` : `${formatNumber(effectiveDmg)}`;
        const color = isCrit ? '#facc15' : '#ffffff';
        spawnFloatingText(pos.x, pos.y - (enemy.isBoss ? 110 : 72), text, color, isCrit ? 1.35 : 1);
      }

      spawnParticles(
        pos.x,
        pos.y - 36,
        isCrit ? 14 : 6,
        isCrit ? '#facc15' : propsRef.current.heroProjectileColor,
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

        // Remove slain enemy & schedule replacement if same regular floor continues
        const s = simRef.current;
        s.enemies = s.enemies.filter((e) => e.uid !== enemy.uid);

        const nextKills = propsRef.current.killsOnFloor + 1;
        const willAdvanceFloor = enemy.isBoss || nextKills >= MONSTERS_PER_FLOOR;

        if (!willAdvanceFloor && !enemy.isBoss) {
          // Respawn slot in 0.22s (or immediately if none left)
          s.pendingRespawns[enemy.slot] = s.enemies.length === 0 ? 0.05 : 0.22;
        }

        // Auto-select next living enemy
        if (s.enemies.length > 0) {
          s.targetSlot = s.enemies[0].slot;
        }

        callbacksRef.current.onEnemySlain(goldDrop, enemy.isBoss, isRare);
      }
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

      const w = window.innerWidth;
      const h = window.innerHeight;
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
        const w = window.innerWidth;
        const h = window.innerHeight;
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
      triggerShake(intensity: number) {
        simRef.current.shake = Math.max(simRef.current.shake, intensity);
      },
      resetFloorWave(newFloor: number) {
        initFloorWave(newFloor);
      },
    }));

    // Ensure initial wave spawns when floor changes
    useEffect(() => {
      if (simRef.current.spawnedFloor !== floor) {
        initFloorWave(floor);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floor]);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!propsRef.current.isPlaying) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { arenaW, arenaH } = getArenaRect(rect.width, rect.height);

      // Ignore clicks outside the dungeon arena (dock panel handles its own clicks)
      if (px > arenaW || py > arenaH) return;

      // Check if user tapped a specific enemy
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
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      resize();
      window.addEventListener('resize', resize);

      const drawPixelTorch = (x: number, y: number, timeSec: number, color: string) => {
        // Wooden & iron bracket
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 6, y + 6, 12, 8);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 4, y - 4, 8, 12);

        // Warm glow halo
        const flicker = Math.sin(timeSec * 13 + x) * 3;
        const grad = ctx.createRadialGradient(x, y - 10, 4, x, y - 10, 56 + flicker);
        grad.addColorStop(0, `${color}55`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y - 10, 58 + flicker, 0, Math.PI * 2);
        ctx.fill();

        // Pixel flame blocks
        const fShift = Math.round(Math.sin(timeSec * 16 + x) * 2);
        ctx.fillStyle = color;
        ctx.fillRect(x - 6, y - 16, 12, 12);
        ctx.fillRect(x - 4 + fShift, y - 22, 8, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x - 3, y - 14, 6, 8);
        ctx.fillRect(x - 2 + fShift, y - 18, 4, 4);
      };

      const drawDungeonProps = (arenaW: number, groundY: number, zoneBanner: string) => {
        // Wall Banner left
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
        // Pixel skull emblem on banner
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(bx - 10, by + 26, 20, 16);
        ctx.fillRect(bx - 6, by + 42, 12, 8);
        ctx.fillStyle = zoneBanner;
        ctx.fillRect(bx - 6, by + 32, 4, 4);
        ctx.fillRect(bx + 2, by + 32, 4, 4);

        // Wooden crate & barrel on far left floor
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

        // Barrel next to crate
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
        const w = window.innerWidth;
        const h = window.innerHeight;
        const { arenaW, arenaH } = getArenaRect(w, h);
        const groundY = Math.round(arenaH * 0.78);

        // Update simulation
        s.heroLunge = Math.max(0, s.heroLunge - dt * 6);
        s.heroSwing = Math.max(0, s.heroSwing - dt * 5);
        s.shake = Math.max(0, s.shake - dt * 28);

        if (p.isPlaying) {
          // Ensure floor wave exists
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

          // Boss countdown timer
          if (s.bossTimer !== null && s.enemies.length > 0) {
            s.bossTimer -= dt;
            const ceilSec = Math.max(0, Math.ceil(s.bossTimer));
            if (ceilSec !== s.lastReportedBossSec) {
              s.lastReportedBossSec = ceilSec;
              callbacksRef.current.onBossTimerUpdate(ceilSec);
            }
            if (s.bossTimer <= 0) {
              // Boss escaped/enraged -> reset Boss HP & restart timer so player can keep farming
              const boss = s.enemies[0];
              if (boss) {
                boss.hp = boss.maxHp;
                boss.hitFlash = 0.2;
              }
              s.bossTimer = BOSS_TIMER_SEC + p.bossTimerBonusSec;
            }
          }

          // Passive Auto-Attack DPS ticks (5Hz visual strike + damage)
          if (p.dps > 0 && s.enemies.length > 0) {
            s.dpsAccumulator += dt;
            if (s.dpsAccumulator >= 0.25) {
              const stepDmg = p.dps * s.dpsAccumulator;
              s.dpsAccumulator = 0;
              const target = s.enemies.find((e) => e.slot === s.targetSlot) || s.enemies[0];
              if (target) {
                const pos = getSlotPos(target.slot, target.isBoss, arenaW, arenaH);
                spawnProjectile(pos.x, pos.y, false);
                applyDamageToEnemy(target, stepDmg, false, true);
              }
            }
          }
        }

        // Update enemies
        for (const enemy of s.enemies) {
          enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
          enemy.knockbackX = Math.max(0, enemy.knockbackX - dt * 55);
          enemy.spawnAnim = Math.max(0, enemy.spawnAnim - dt * 4.5);
        }

        // Update projectiles
        for (const pr of projRef.current) {
          if (!pr.active) continue;
          pr.progress += dt * pr.speed;
          if (pr.progress >= 1) pr.active = false;
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

        // Full canvas dark frame
        ctx.fillStyle = '#0e1017';
        ctx.fillRect(0, 0, w, h);

        // Clip to Arena Region
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

        // Props & Wall Torches
        drawDungeonProps(arenaW, groundY, zone.bannerColor);
        drawPixelTorch(Math.round(arenaW * 0.1), Math.round(groundY * 0.43), timeSec, zone.torchColor);
        drawPixelTorch(Math.round(arenaW * 0.37), Math.round(groundY * 0.36), timeSec, zone.torchColor);
        drawPixelTorch(Math.round(arenaW * 0.78), Math.round(groundY * 0.39), timeSec, zone.torchColor);

        // 2X Damage or Frenzy ambient floor tint
        if (p.damage2xActive || p.frenzyActive) {
          ctx.fillStyle = p.frenzyActive ? 'rgba(249, 115, 22, 0.08)' : 'rgba(250, 204, 21, 0.06)';
          ctx.fillRect(0, 0, arenaW, arenaH);
        }

        // HERO RENDERING
        const heroPos = getHeroPos(arenaW, arenaH);
        const heroSprite = getHeroSprite(p.activeHero);
        const heroScale = Math.max(4, Math.min(5.5, arenaW / 145));
        const heroDrawW = heroSprite.width * heroScale;
        const heroDrawH = heroSprite.height * heroScale;
        const heroBob = Math.round(Math.sin(timeSec * 4.2) * 2);
        const lungePx = Math.round(s.heroLunge * 22);

        // Hero shadow
        ctx.fillStyle = 'rgba(0,0,0,0.48)';
        ctx.beginPath();
        ctx.ellipse(heroPos.x + lungePx, heroPos.y + 4, heroDrawW * 0.42, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hero buff ring when Frenzy or 2X is active
        if (p.frenzyActive || p.damage2xActive) {
          ctx.strokeStyle = p.frenzyActive ? '#f97316' : '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(heroPos.x + lungePx, heroPos.y + 4, heroDrawW * 0.52, 11, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.drawImage(
          heroSprite,
          Math.round(heroPos.x - heroDrawW / 2 + lungePx),
          Math.round(heroPos.y - heroDrawH + heroBob),
          Math.round(heroDrawW),
          Math.round(heroDrawH)
        );

        // ENEMIES RENDERING
        const sortedEnemies = [...s.enemies].sort((a, b) => a.slot - b.slot);
        for (const enemy of sortedEnemies) {
          const pos = getSlotPos(enemy.slot, enemy.isBoss, arenaW, arenaH);
          const sprite = getEnemySprite(enemy.spriteId);
          const isRare = enemy.tier === 'rare' || enemy.tier === 'rare_elite';
          const baseScale = Math.max(3.8, Math.min(5.2, arenaW / 150));
          const scale =
            baseScale *
            (enemy.isBoss ? 1.45 : isRare ? 1.14 : 1) *
            (1 - enemy.spawnAnim * 0.35);
          const drawW = sprite.width * scale;
          const drawH = sprite.height * scale;
          const bob = Math.round(Math.sin(timeSec * 4 + enemy.bobOffset) * 2.5);
          const ex = Math.round(pos.x + enemy.knockbackX);
          const ey = Math.round(pos.y);

          // Rare / Target Ring under enemy
          const isTarget = enemy.slot === s.targetSlot;
          if (isTarget || isRare) {
            ctx.strokeStyle = enemy.isBoss
              ? '#facc15'
              : enemy.tier === 'rare_elite'
              ? '#c084fc'
              : enemy.tier === 'rare'
              ? '#38bdf8'
              : '#ef4444';
            ctx.lineWidth = isTarget ? 3 : 2;
            ctx.beginPath();
            ctx.ellipse(ex, ey + 4, drawW * 0.54, 11, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Enemy Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.48)';
          ctx.beginPath();
          ctx.ellipse(ex, ey + 4, drawW * 0.4, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Enemy Sprite
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

          // Enemy HP Bar
          const barW = enemy.isBoss ? 136 : isRare ? 88 : 74;
          const barH = enemy.isBoss ? 12 : 9;
          const barX = Math.round(ex - barW / 2);
          const barY = Math.round(ey - drawH - (enemy.isBoss ? 24 : 16));
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
            ctx.fillText(label, ex + 1, barY - 7);
            ctx.fillStyle = enemy.isBoss
              ? '#fde047'
              : enemy.tier === 'rare_elite'
              ? '#e879f9'
              : '#7dd3fc';
            ctx.fillText(label, ex, barY - 8);
          }
        }

        // Onboarding Pixel Hand pointing at front enemy
        if (p.showOnboardingHand && s.enemies.length > 0) {
          const target = s.enemies.find((e) => e.slot === s.targetSlot) || s.enemies[0];
          const tPos = getSlotPos(target.slot, target.isBoss, arenaW, arenaH);
          const hand = getHandPointerSprite();
          const hBob = Math.round(Math.sin(timeSec * 7) * 7);
          ctx.drawImage(hand, Math.round(tPos.x - 16), Math.round(tPos.y - 115 + hBob), 44, 48);
        }

        // Projectiles / Slash Arcs
        for (const pr of projRef.current) {
          if (!pr.active) continue;
          if (pr.kind === 'bolt') {
            const cx = pr.x + (pr.tx - pr.x) * pr.progress;
            const cy = pr.y + (pr.ty - pr.y) * pr.progress;
            ctx.fillStyle = '#0b0e14';
            ctx.fillRect(Math.round(cx - 7), Math.round(cy - 7), 14, 14);
            ctx.fillStyle = pr.color;
            ctx.fillRect(Math.round(cx - 5), Math.round(cy - 5), 10, 10);
          } else {
            // Crisp pixel slash arc over target
            const alpha = 1 - pr.progress;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = pr.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(pr.tx, pr.ty, 26 + pr.progress * 14, -Math.PI * 0.7, Math.PI * 0.25);
            ctx.stroke();
            ctx.restore();
          }
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
