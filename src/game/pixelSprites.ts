// Crisp 2D Pixel-Art Sprite Engine (pre-baked offscreen canvases for 60fps rendering)
import { HeroEvolutionTier } from './types';

export type SpritePalette = Record<string, string>;

const spriteCache = new Map<string, HTMLCanvasElement>();
const hitFlashCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
const OUTLINE_HEX = '#0b0e14';

function adjustHexBrightness(hex: string, delta: number): string {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex;
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const r = Math.max(0, Math.min(255, parseInt(full.slice(1, 3), 16) + delta));
  const g = Math.max(0, Math.min(255, parseInt(full.slice(3, 5), 16) + delta));
  const b = Math.max(0, Math.min(255, parseInt(full.slice(5, 7), 16) + delta));
  return `rgb(${r},${g},${b})`;
}

function upscaleAndShadeMatrix(src: (string | null)[][]): HTMLCanvasElement {
  const h = src.length;
  const w = src[0]?.length ?? 1;
  const outW = w * 2;
  const outH = h * 2;
  const out: (string | null)[][] = Array.from({ length: outH }, () =>
    Array<string | null>(outW).fill(null)
  );

  const at = (x: number, y: number): string | null =>
    x >= 0 && x < w && y >= 0 && y < h ? src[y][x] : null;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = at(x, y);
      const a = at(x, y - 1);
      const b = at(x + 1, y);
      const c = at(x - 1, y);
      const d = at(x, y + 1);

      let c1 = p;
      let c2 = p;
      let c3 = p;
      let c4 = p;

      // Preserve dark outlines while smoothing diagonal silhouettes via EPX
      if (p !== OUTLINE_HEX) {
        if (c === a && c !== d && a !== b) c1 = a;
        if (a === b && a !== c && b !== d) c2 = b;
        if (d === c && d !== b && c !== a) c3 = c;
        if (b === d && b !== a && d !== c) c4 = d;
      } else {
        if (c === a && c !== null && c !== d && a !== b) c1 = a;
        if (a === b && a !== null && a !== c && b !== d) c2 = b;
        if (d === c && d !== null && d !== b && c !== a) c3 = c;
        if (b === d && b !== null && b !== a && d !== c) c4 = d;
      }

      out[y * 2][x * 2] = c1;
      out[y * 2][x * 2 + 1] = c2;
      out[y * 2 + 1][x * 2] = c3;
      out[y * 2 + 1][x * 2 + 1] = c4;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
        const col = out[y][x];
        if (!col) continue;
        let finalColor = col;
        if (col !== OUTLINE_HEX) {
          const above = y > 0 ? out[y - 1][x] : null;
          const below = y + 1 < outH ? out[y + 1][x] : null;
          if (above === OUTLINE_HEX && below !== OUTLINE_HEX) {
            finalColor = adjustHexBrightness(col, 22);
          } else if (below === OUTLINE_HEX && above !== OUTLINE_HEX) {
            finalColor = adjustHexBrightness(col, -24);
          } else if ((x + y) % 7 === 0 && above === col && below === col) {
            finalColor = adjustHexBrightness(col, 8);
          }
        }
        ctx.fillStyle = finalColor;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return canvas;
}

export function getSpriteHitFlash(sprite: HTMLCanvasElement): HTMLCanvasElement {
  const existing = hitFlashCache.get(sprite);
  if (existing) return existing;

  const flash = document.createElement('canvas');
  flash.width = sprite.width;
  flash.height = sprite.height;
  const ctx = flash.getContext('2d');
  if (ctx) {
    ctx.drawImage(sprite, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
    ctx.fillRect(0, 0, flash.width, flash.height);
    ctx.globalCompositeOperation = 'source-over';
  }
  hitFlashCache.set(sprite, flash);
  return flash;
}

function bakePixelSprite(
  key: string,
  grid: string[],
  palette: SpritePalette,
  flipX = false
): HTMLCanvasElement {
  const cacheKey = `${key}_${flipX ? 'L' : 'R'}`;
  const cached = spriteCache.get(cacheKey);
  if (cached) return cached;

  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const matrix: (string | null)[][] = Array.from({ length: h }, () =>
    Array<string | null>(w).fill(null)
  );
  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      const drawX = flipX ? w - 1 - x : x;
      matrix[y][drawX] = color;
    }
  }
  const canvas = upscaleAndShadeMatrix(matrix);
  spriteCache.set(cacheKey, canvas);
  return canvas;
}

// ============================================================================
// 9 HIGH-DETAIL CLASS PALETTES (30x28 Layered Pixel Art -> 60x56 2x EPX)
// ============================================================================

interface HeroClassPalette {
  armorLight: string;
  armorMid: string;
  armorDark: string;
  trimGold: string;
  trimBright: string;
  capeMain: string;
  capeDark: string;
  gemCore: string;
  gemGlow: string;
  weaponMetal: string;
  weaponGlow: string;
  woodOrHilt: string;
}

const HERO_CLASS_PALETTES: Record<string, HeroClassPalette> = {
  druid: {
    armorLight: '#22c55e',
    armorMid: '#15803d',
    armorDark: '#14532d',
    trimGold: '#f59e0b',
    trimBright: '#fde047',
    capeMain: '#166534',
    capeDark: '#052e16',
    gemCore: '#10b981',
    gemGlow: '#a7f3d0',
    weaponMetal: '#fbbf24',
    weaponGlow: '#4ade80',
    woodOrHilt: '#78350f',
  },
  warrior: {
    armorLight: '#cbd5e1',
    armorMid: '#64748b',
    armorDark: '#334155',
    trimGold: '#eab308',
    trimBright: '#fef08a',
    capeMain: '#1d4ed8',
    capeDark: '#1e3a8a',
    gemCore: '#38bdf8',
    gemGlow: '#bae6fd',
    weaponMetal: '#e2e8f0',
    weaponGlow: '#60a5fa',
    woodOrHilt: '#78350f',
  },
  paladin: {
    armorLight: '#fef08a',
    armorMid: '#eab308',
    armorDark: '#a16207',
    trimGold: '#f8fafc',
    trimBright: '#ffffff',
    capeMain: '#2563eb',
    capeDark: '#1e3a8a',
    gemCore: '#38bdf8',
    gemGlow: '#e0f2fe',
    weaponMetal: '#facc15',
    weaponGlow: '#fef9c3',
    woodOrHilt: '#92400e',
  },
  hunter: {
    armorLight: '#4ade80',
    armorMid: '#15803d',
    armorDark: '#365314',
    trimGold: '#d97706',
    trimBright: '#fde68a',
    capeMain: '#14532d',
    capeDark: '#052e16',
    gemCore: '#22d3ee',
    gemGlow: '#cffafe',
    weaponMetal: '#fbbf24',
    weaponGlow: '#86efac',
    woodOrHilt: '#92400e',
  },
  rogue: {
    armorLight: '#475569',
    armorMid: '#1e293b',
    armorDark: '#0f172a',
    trimGold: '#dc2626',
    trimBright: '#f87171',
    capeMain: '#7f1d1d',
    capeDark: '#450a0a',
    gemCore: '#4ade80',
    gemGlow: '#bbf7d0',
    weaponMetal: '#cbd5e1',
    weaponGlow: '#4ade80',
    woodOrHilt: '#451a03',
  },
  mage: {
    armorLight: '#a855f7',
    armorMid: '#7e22ce',
    armorDark: '#4c1d95',
    trimGold: '#facc15',
    trimBright: '#fef08a',
    capeMain: '#581c87',
    capeDark: '#3b0764',
    gemCore: '#22d3ee',
    gemGlow: '#e0f2fe',
    weaponMetal: '#facc15',
    weaponGlow: '#67e8f9',
    woodOrHilt: '#6d28d9',
  },
  warlock: {
    armorLight: '#9333ea',
    armorMid: '#581c87',
    armorDark: '#2e1065',
    trimGold: '#71717a',
    trimBright: '#d4d4d8',
    capeMain: '#3b0764',
    capeDark: '#1e1b4b',
    gemCore: '#22c55e',
    gemGlow: '#bbf7d0',
    weaponMetal: '#94a3b8',
    weaponGlow: '#4ade80',
    woodOrHilt: '#27272a',
  },
  priest: {
    armorLight: '#ffffff',
    armorMid: '#e2e8f0',
    armorDark: '#94a3b8',
    trimGold: '#facc15',
    trimBright: '#fef9c3',
    capeMain: '#f8fafc',
    capeDark: '#cbd5e1',
    gemCore: '#fbbf24',
    gemGlow: '#fef08a',
    weaponMetal: '#facc15',
    weaponGlow: '#fef9c3',
    woodOrHilt: '#b45309',
  },
  shaman: {
    armorLight: '#38bdf8',
    armorMid: '#0369a1',
    armorDark: '#0c4a6e',
    trimGold: '#d97706',
    trimBright: '#fde047',
    capeMain: '#78350f',
    capeDark: '#451a03',
    gemCore: '#22d3ee',
    gemGlow: '#e0f2fe',
    weaponMetal: '#94a3b8',
    weaponGlow: '#38bdf8',
    woodOrHilt: '#78350f',
  },
};

// ============================================================================
// 15 WOW DUNGEON ENEMIES + 5 BOSSES
// ============================================================================

const ENEMY_GRIDS: Record<string, { grid: string[]; palette: SpritePalette }> = {
  // Zone 1: Deadmines
  kobold: {
    palette: {
      O: '#0b0e14',
      W: '#fef9c3', // candle wax
      F: '#fb923c', // candle flame
      Y: '#fde047', // flame core
      K: '#92400e', // brown fur
      L: '#b45309', // fur light
      E: '#ef4444', // red eyes
      S: '#94a3b8', // pickaxe metal
      H: '#78350f', // handle
    },
    grid: [
      '......OO........',
      '.....OFYO.......',
      '.....OWWO.......',
      '...OOOWWOOO.....',
      '..OKLLLLLLKO....',
      '.OOKLELLLEKOO...',
      '..OKLLLLLLKO.OO.',
      '..OOKKKKKKOO.SSO',
      '.OOKHHHHHHKOOHO.',
      '.OKKKKKKKKKKSHO.',
      '..OKKKKKKKKOO...',
      '..OHHHHHHHHO....',
      '..OKKO..OKKO....',
      '..OKKO..OKKO....',
      '..OOOO..OOOO....',
    ],
  },
  defias: {
    palette: {
      O: '#0b0e14',
      R: '#dc2626', // Defias red bandana
      D: '#991b1b', // dark red
      F: '#fed7aa', // skin
      E: '#0f172a', // eyes
      L: '#78350f', // brown vest
      K: '#334155', // pants
      S: '#cbd5e1', // daggers
    },
    grid: [
      '....OOOOOO......',
      '...ORRRRRRO.....',
      '..ORRRRRRRRO....',
      '..OROOFFOORO....',
      '..ORFEFFEFRO....',
      '...ORRRRRRO.....',
      '..OOLLLLLLOO....',
      '.OSLLLLLLLLSO...',
      'OOSLLLLLLLLSOO..',
      '...OKKKKKKO.....',
      '...OKKKKKKO.....',
      '...OKKOOKKO.....',
      '...OKKOOKKO.....',
      '...OLLO.OLLO....',
      '...OOOO.OOOO....',
    ],
  },
  murloc: {
    palette: {
      O: '#0b0e14',
      G: '#14b8a6', // murloc teal
      L: '#5eead4', // light scales
      D: '#0f766e', // dark fins
      F: '#fb923c', // dorsal spines
      Y: '#fde047', // bulging eyes
      B: '#fef3c7', // belly
      W: '#78350f', // spear
    },
    grid: [
      '....O.O.O.......',
      '...OFOFOFO......',
      '..OGGGGGGGGO....',
      '.OGYOGGGGOYGO...',
      '.OGGGGGGGGGGO.O.',
      '..OGGLLLLGGO.OSO',
      '..OOGBBBBGOOOWO.',
      '.OGGGBBBBGGOWO..',
      '.OGGGGGGGGGOWO..',
      '..ODDDDDDDDOWO..',
      '..OGGO..OGGOWO..',
      '..OGGO..OGGO.O..',
      '..ODDO..ODDO....',
      '..OOOO..OOOO....',
    ],
  },

  // Zone 2: Shadowfang Keep
  worgen: {
    palette: {
      O: '#0b0e14',
      G: '#64748b', // wolf fur
      D: '#334155', // dark fur
      L: '#cbd5e1', // fangs/claws
      E: '#f59e0b', // glowing amber eyes
      C: '#475569', // tattered cloth
    },
    grid: [
      '..OO......OO....',
      '.OGGOOOOOOGGO...',
      '.OGGGGGGGGGGO...',
      '..OGEOGGOGEGO...',
      '..OGGLLLLLGGO...',
      '..OOGGGGGGOO....',
      '.ODGGGGGGGGDO...',
      'OLGGGGGGGGGGGLO.',
      'OO.ODDDDDDO.OO..',
      '...OCCCCCCCO....',
      '...ODDDDDDDO....',
      '..OGGO..OGGO....',
      '..ODDO..ODDO....',
      '..OLOO..OOLO....',
      '..OOOO..OOOO....',
    ],
  },
  ghoul: {
    palette: {
      O: '#0b0e14',
      G: '#84cc16', // plague green
      D: '#4d7c0f', // dark rot
      B: '#e2e8f0', // exposed ribs
      E: '#ef4444', // red eyes
      C: '#3f3f46', // tattered rags
    },
    grid: [
      '....OOOOOO......',
      '...OGGGGGGO.....',
      '..OGEOGGOEGO....',
      '..OGGGGGGGGO....',
      '...OGBBBBGO.....',
      '..OOGGGGGGOO....',
      '.OGGGBBBBGGGO...',
      'OGG.OGGGGO.GGO..',
      'OO..ODDDDO..OO..',
      '....OCCCCO......',
      '...OGGOOGGO.....',
      '...ODDOODDO.....',
      '...OGGOOGGO.....',
      '...OOOO.OOOO....',
    ],
  },
  acolyte: {
    palette: {
      O: '#0b0e14',
      P: '#581c87', // dark cult robe
      V: '#9333ea', // violet trim
      K: '#1e1b4b', // shadowed face
      E: '#c084fc', // glowing purple eyes
      S: '#e879f9', // shadow orb
    },
    grid: [
      '.....OOOO.......',
      '....OPPPPO......',
      '...OPPPPPPO.....',
      '..OPOKKKKOPO....',
      '..OPKEKKEKPO.OO.',
      '...OPKKKKPO.OSSO',
      '..OOPVVVVPOO.OO.',
      '.OPPPPPPPPPPO...',
      '.OPPVPPPPVPPO...',
      '..OPPPPPPPPO....',
      '..OPPPPPPPPO....',
      '..OPPPVVPPPO....',
      '...OPPOOPPO.....',
      '...OOOOOOOO.....',
    ],
  },

  // Zone 3: Scarlet Bastion
  zealot: {
    palette: {
      O: '#0b0e14',
      R: '#dc2626', // Scarlet crimson
      W: '#f8fafc', // white tabard
      G: '#facc15', // gold trim
      F: '#fed7aa', // skin
      M: '#94a3b8', // mace
    },
    grid: [
      '....OOOOOO......',
      '...ORRRRRRO.....',
      '..ORRRRRRRRO....',
      '..OROOFFOORO....',
      '..ORFFFFFFRO.OO.',
      '...ORRRRRRO.OMMO',
      '..OOWWWWWWO.OMMO',
      '.ORRWWRRWWRO.OO.',
      '.ORRWWWWWWRO.O..',
      '..ORRRRRRRRO....',
      '..OGGGGGGGGO....',
      '..ORRO..ORRO....',
      '..ORRO..ORRO....',
      '..OOOO..OOOO....',
    ],
  },
  houndmaster: {
    palette: {
      O: '#0b0e14',
      S: '#cbd5e1', // steel armor
      R: '#b91c1c', // crimson plume & cape
      G: '#fbbf24', // gold trim
      F: '#fed7aa',
      W: '#94a3b8', // halberd
    },
    grid: [
      '....OORROO......',
      '...ORRRRRRO.....',
      '..OSSSSSSSSO.OO.',
      '..OSOOFFOOSO.WSO',
      '..OSFFFFFFSO.WSO',
      '..OORRRRRROO.WO.',
      '.OSSSSSSSSSSOWO.',
      '.OSRRGGGGSRROWO.',
      '..OSSSSSSSSO.WO.',
      '..OSSRRRRSSO.O..',
      '..OSSO..OSSO....',
      '..ORRO..ORRO....',
      '..OOOO..OOOO....',
    ],
  },
  inquisitor: {
    palette: {
      O: '#0b0e14',
      R: '#991b1b', // deep crimson
      L: '#ef4444', // bright red
      G: '#facc15', // gold
      F: '#fed7aa',
      Y: '#fb923c', // flame
    },
    grid: [
      '....OOOOOO......',
      '...OGGGGGGO.....',
      '..ORRRRRRRRO.OO.',
      '..OROOFFOORO.OYO',
      '..ORFFFFFFRO.OFO',
      '...ORRRRRRO..OGO',
      '..OOLLLLLLOO.OGO',
      '.ORRRGGGGRRROOGO',
      '.ORRRRRRRRRROOGO',
      '..ORRRRRRRRO..O.',
      '..ORRLGGLRRO....',
      '...ORROORRO.....',
      '...OOOOOOOO.....',
    ],
  },

  // Zone 4: Blackrock Foundry
  darkiron: {
    palette: {
      O: '#0b0e14',
      D: '#3f3f46', // dark iron armor
      K: '#52525b', // charcoal skin
      F: '#f97316', // fiery beard/eyes
      Y: '#fde047', // molten core
      S: '#a1a1aa', // axe blade
    },
    grid: [
      '.OO......OO.....',
      'OSSO.OO.OSSO....',
      '.OODDDDDDOO.....',
      '..ODKKKKKDO..OO.',
      '..ODFKKKFDO.OSSO',
      '..ODFFFFFDO.OSYO',
      '..OOFFFFFOO.OSSO',
      '.ODDDDDDDDDDODO.',
      '.ODDDDDDDDDDDO..',
      '..ODDDYYDDDO....',
      '..ODDO..ODDO....',
      '..ODDO..ODDO....',
      '..OOOO..OOOO....',
    ],
  },
  felguard: {
    palette: {
      O: '#0b0e14',
      R: '#b91c1c', // demon skin
      D: '#7f1d1d', // dark muscle
      H: '#18181b', // black horns
      G: '#facc15', // glowing eyes
      M: '#71717a', // iron armor/cleaver
      L: '#4ade80', // fel glow
    },
    grid: [
      'OO........OO....',
      'OHHOOOOOOHHO....',
      '.OHRRRRRRHO.....',
      '..ORGORRGOR..OO.',
      '..ORRRRRRRO.OMMO',
      '.OODDDDDDDOOOMLO',
      'OMMRRRRRRRRMMMO.',
      'OMDRRRRRRRRDMO..',
      '.OODDDDDDDDOO...',
      '..OMMMMMMMMO....',
      '..ORRO..ORRO....',
      '..ODDO..ODDO....',
      '..OMMO..OMMO....',
      '..OOOO..OOOO....',
    ],
  },
  imp: {
    palette: {
      O: '#0b0e14',
      R: '#ef4444', // imp red
      D: '#991b1b', // wing dark
      Y: '#fde047', // eyes & grin
      F: '#fb923c', // fireball
    },
    grid: [
      '..O........O....',
      '.OROO....OORO...',
      '.ORRRRRRRRRRO...',
      '..ORYORRORYO....',
      '..ORRRYYRRRO....',
      'OO.OORRRROO.OO..',
      'ODROORRRROORDO..',
      'ODDORRRRRRODDO..',
      '.OO.ORRRRO.OO...',
      '....OR..RO......',
      '...ORR..RRO.....',
      '...OOO..OOO.....',
    ],
  },

  // Zone 5: Icecrown Citadel
  deathguard: {
    palette: {
      O: '#0b0e14',
      B: '#e2e8f0', // skull bone
      A: '#1e3a8a', // scourge plate
      L: '#3b82f6', // armor highlight
      C: '#38bdf8', // glowing frost eyes/blade
    },
    grid: [
      '....OOOOOO......',
      '...OAAAAAAO.....',
      '..OABBBBBBAO....',
      '..OABCOOCBAO..O.',
      '...OBBBBBBO..OCO',
      '..OOAAAAAAOO.OCO',
      '.OALLLLLLLLAOOCO',
      '.OAAAAAAAAAOOOCO',
      '..OAAACCCAAO.OAO',
      '..OAAAAAAAAO..O.',
      '..OAAO..OAAO....',
      '..OBBO..OBBO....',
      '..OOOO..OOOO....',
    ],
  },
  wyrmling: {
    palette: {
      O: '#0b0e14',
      B: '#cbd5e1', // dragon bone
      C: '#38bdf8', // frost glow
      L: '#bae6fd', // bright ice
      D: '#1e293b', // wing shadow
    },
    grid: [
      'OOO........OOO..',
      'ODBO..OO..OBDO..',
      'ODDBOOBBOOBDDO..',
      '.ODBBBBBBBBDO...',
      '..OOBCBBCBOO....',
      '...OBBBBBBO.....',
      '..OOBLLLLBOO....',
      '...OBCCCCBO.....',
      '....OBBBBO......',
      '...OBO..OBO.....',
      '...OO....OO.....',
    ],
  },
  nerubian: {
    palette: {
      O: '#0b0e14',
      A: '#1e293b', // dark chitin
      B: '#0284c7', // frost blue shell
      C: '#38bdf8', // glowing eyes
      S: '#94a3b8', // claw blades
    },
    grid: [
      '....OOOOOO......',
      '...OBBBBBBO.....',
      '..OBCOCCOOBAO...',
      '..OBBBBBBBBO....',
      '.OOSAAAAAASOO...',
      'OS.OABBBBAO.SO..',
      'O.OOAAAAAAOO.O..',
      '.OS.OAAAOO.SO...',
      'O...OA..AO...O..',
      '...OAO..OAO.....',
      '...OO....OO.....',
    ],
  },

  // ============================================================================
  // 5 DUNGEON BOSSES (20x20 Larger Pixel Grids!)
  // ============================================================================
  boss_edwin: {
    palette: {
      O: '#0b0e14',
      R: '#dc2626', // crimson Defias bandana & cape
      D: '#7f1d1d',
      G: '#facc15', // pirate gold
      K: '#1e293b', // black coat
      F: '#fed7aa', // skin
      E: '#0f172a',
      S: '#e2e8f0', // twin cutlasses
    },
    grid: [
      '.....OOOOOOOO.......',
      '....ORRRRRRRRO......',
      '...ORRRRRRRRRRO.....',
      '...ORROOFFOORRO.....',
      '...ORFEFFFFEFRO.....',
      '....ORRRRRRRRO......',
      '..OOGGGGGGGGGGOO....',
      '.OGGKKKKKKKKKKGGO...',
      'OORKKKKKKKKKKKKROO..',
      'OSRKKKGGGGGGKKKRSO..',
      'OSRKKKGGGGGGKKKRSO..',
      'O.OKKKKKKKKKKKKO.O..',
      '..OKKKKKKKKKKKKO....',
      '..ODDDKKKKKKDDDO....',
      '...OKKKO..OKKKO.....',
      '...OKKKO..OKKKO.....',
      '...OGGGO..OGGGO.....',
      '...OOOOO..OOOOO.....',
    ],
  },
  boss_arugal: {
    palette: {
      O: '#0b0e14',
      P: '#6b21a8', // Archmage purple
      V: '#a855f7',
      D: '#3b0764',
      W: '#94a3b8', // wolf shoulder fur
      C: '#38bdf8', // moon orb
      F: '#e2e8f0', // pale skin
      E: '#facc15', // arcane eyes
    },
    grid: [
      '......OOOOOO........',
      '.....OPPPPPPO.......',
      '....OPPPPPPPPO......',
      '....OPOOFFOOPO...OO.',
      '....OPFEFFEFPO..OCCO',
      '....OOVVVVVVOO..OCCO',
      '..OOWWPPPPPPWWOO.OWO',
      '.OWWWPPPPPPPPWWWOWO.',
      '.OWWPPPVVVVPPPWWOWO.',
      '..OOPPPPPPPPPPOO.OWO',
      '...OPPPPPPPPPPO..OWO',
      '...ODDDDDDDDDDO..OWO',
      '...ODDPVVVVPDDO..OWO',
      '...ODDDDDDDDDDO..OWO',
      '....ODDO..ODDO....O.',
      '....OPPO..OPPO......',
      '....OOOO..OOOO......',
    ],
  },
  boss_mograine: {
    palette: {
      O: '#0b0e14',
      R: '#b91c1c', // Scarlet Commander
      G: '#facc15', // Radiant gold
      Y: '#fef08a', // Ash-blade fire
      S: '#e2e8f0', // Silver plate
      F: '#fed7aa',
      W: '#f8fafc',
    },
    grid: [
      '.....OOOOOOOO.......',
      '....OGGGGGGGGO......',
      '...OGGSSSSSSGGO.....',
      '...OGSOOFFOOSGO..OO.',
      '...OGSFFFFFFSGO..OYO',
      '....OORRRRRROO...OYO',
      '..OOGGGGGGGGGGOO.OYO',
      '.OGGSRRRRRRRRSGGOOGO',
      'OGGYSRWWWWWWRSYGGOOO',
      '.OOGSRWWWWWWRSGO.O..',
      '..OORRRRRRRRRROO....',
      '...OGGGGGGGGGGO.....',
      '...ORRRGGGGGRRO.....',
      '...OSSO....OSSO.....',
      '...OGGO....OGGO.....',
      '...ORRO....ORRO.....',
      '...OOOO....OOOO.....',
    ],
  },
  boss_rend: {
    palette: {
      O: '#0b0e14',
      K: '#27272a', // blackrock plate
      R: '#991b1b', // dragonkin skin
      F: '#f97316', // molten lava glow
      Y: '#fde047', // molten core
      H: '#d4d4d8', // giant horns
      S: '#71717a',
    },
    grid: [
      '.OOO..........OOO...',
      'OHHHO.OOOOOO.OHHHO..',
      '.OHHHOKKKKKKOHHHO...',
      '..OOOKRRRRRRKOOO....',
      '...OKRFOKKOFKRO.....',
      '...OKRRRRRRRRKO..OO.',
      '.OOKKKKKKKKKKKKOOSYO',
      'OSKKKKKKKKKKKKKKOSFO',
      'OYKKKKKKKKKKKKKKOSYO',
      'OSKKKFFFFFFFKKKKOSSO',
      '.OOKKKKKKKKKKKKOO.O.',
      '...OKKKKKKKKKKO.....',
      '...OKKKFFFFKKKO.....',
      '...OKKO....OKKO.....',
      '...ORRO....ORRO.....',
      '...OOOO....OOOO.....',
    ],
  },
  boss_lich: {
    palette: {
      O: '#0b0e14',
      A: '#1e3a8a', // Lich plate
      L: '#3b82f6',
      C: '#38bdf8', // Icecrown frost glow
      I: '#bae6fd', // bright ice
      B: '#cbd5e1', // skull
      K: '#0f172a', // dark cloak
    },
    grid: [
      '..O...OO..OO...O....',
      '.OCO.OCCOOCCO.OCO...',
      '.OCAOAAAAAAAAOACO...',
      '..OOABBBBBBBBAOO....',
      '...OABCOOCBOBAO..OO.',
      '...OABBBBBBBBAO..OCO',
      '..OOAAAAAAAAAAOO.OIO',
      '.OACCCCCCCCCCCAO.OCO',
      'OAAKKKKKKKKKKKKAAOCO',
      'O.OKKKCCCCCCKKKO.OCO',
      '..OKKKKKKKKKKKKO.OAO',
      '..OAAAAAAAAAAAAO..O.',
      '..OAACCCCCCCAAAO....',
      '...OAAO....OAAO.....',
      '...OCCO....OCCO.....',
      '...OOOO....OOOO.....',
    ],
  },
  beast_wolf: {
    palette: {
      O: '#0b0e14',
      B: '#38bdf8', // spectral mystmane fur
      S: '#64748b', // slate fur
      D: '#334155',
      E: '#fde047', // glowing eyes
      W: '#e2e8f0', // fangs
    },
    grid: [
      '..OO....OO......',
      '.OBBOOOOBBO.....',
      '.OBBBBBBBBBO....',
      'OBEBOBBBOBEB....',
      'OBBBWWWWWBBBO...',
      '.OOBBBBBBBBOO...',
      '..OSSSSSSSSSOOO.',
      '.OSSSSSSSSSSSSSO',
      '.OSSDDDDDDDDSSSO',
      '.OSSO..OSSO.OSSO',
      '.ODDO..ODDO.ODDO',
      '.OOOO..OOOO.OOOO',
    ],
  },
  titan_watcher: {
    palette: {
      O: '#0b0e14',
      G: '#eab308', // titan gold
      S: '#64748b', // stone colossus
      D: '#334155',
      C: '#38bdf8', // arcane core
    },
    grid: [
      '....OOOOOO......',
      '...OGGGGGGO.....',
      '..OGSSSSSSGO....',
      '..OSCOOOOCSO....',
      '..OSSSSSSSSO....',
      'OOGGSSSSSSGGOO..',
      'OGGGSSCCSSGGGO..',
      'OSSSCCCCCCSSSO..',
      '.OOSSSSSSSSOO...',
      '..OSSSSSSSSO....',
      '..OSSGGGGSSO....',
      '..OSSO..OSSO....',
      '..ODDO..ODDO....',
      '..OOOO..OOOO....',
    ],
  },
  banshee: {
    palette: {
      O: '#0b0e14',
      P: '#a855f7', // spectral violet
      C: '#c084fc', // wailing aura
      W: '#e2e8f0', // pale spirit
      E: '#38bdf8', // glowing eyes
    },
    grid: [
      '....OOOOOO......',
      '...OWWWWWWO.....',
      '..OWCCCCCCWO....',
      '..OWEOOOOEWO....',
      '..OWWWCCWWWO....',
      '...OOPPPPOO.....',
      '..OPPPPPPPPO....',
      '.OPPPCCCCPPPO...',
      '.OPPPPPPPPPPO...',
      '..OPPPPPPPPO....',
      '..OOPP..PPOO....',
      '...OP....PO.....',
    ],
  },
  anomaly: {
    palette: {
      O: '#0b0e14',
      P: '#7e22ce', // arcane purple
      V: '#c084fc', // mana core
      C: '#38bdf8', // cyan energy
      W: '#f0f9ff',
    },
    grid: [
      '.....OOOO.......',
      '...OOVVVVOO.....',
      '..OVCCCCCCVO....',
      '.OVCCWWWWCCVO...',
      '.OVCWCCCCWCVO...',
      '..OVCCCCCCVO....',
      '...OOVPPVVOO....',
      '..OPPVVVVPPO....',
      '.OP..OPO...PO...',
      '.....OPO........',
      '......O.........',
    ],
  },
  fel_ancient: {
    palette: {
      O: '#0b0e14',
      W: '#3f2e21', // twisted bark
      D: '#271c15',
      F: '#4ade80', // fel leaf/fire
      L: '#bbf7d0',
    },
    grid: [
      '.OO..OOOO..OO...',
      'OFFOOWWWWOOFFO..',
      '.OFLWWWWWWLFO...',
      '..OOWWWWWWO.....',
      '..OWFOWWOFWO....',
      '..OWWWWWWWWO....',
      '.OOWWWFFWWWO....',
      'OWWWWWFFWWWWWO..',
      'O.OWWWWWWWWO.O..',
      '..OWWDDDDWWO....',
      '..OWWO..OWWO....',
      '..ODDO..ODDO....',
      '..OOOO..OOOO....',
    ],
  },
  naga: {
    palette: {
      O: '#0b0e14',
      T: '#0d9488', // naga teal scales
      L: '#5eead4',
      F: '#f59e0b', // gold fins/trident
      E: '#fde047',
      D: '#115e59',
    },
    grid: [
      '...O.OOOO.O.....',
      '..OFOTTTTOFO....',
      '..OOTETETOO..O..',
      '...OTTTTTTO.OFO.',
      '..OOTLLLLTOO.FO.',
      '.OTTTTTTTTTTOFO.',
      '.OTTTLLLLTTTOWO.',
      '..ODDDDDDDDO.WO.',
      '...OTTTTTTO..O..',
      '..OOTTTTTTOO....',
      '.OTTTTDDDDTTO...',
      '.OOOOO....OOO...',
    ],
  },
  crocalisk: {
    palette: {
      O: '#0b0e14',
      G: '#4d7c0f', // undead crocalisk hide
      D: '#365314',
      B: '#e2e8f0', // exposed bone/teeth
      C: '#4ade80', // spirit possession glow
      E: '#38bdf8',
    },
    grid: [
      '......OOOOOO........',
      '....OOGGGGGGOOO.....',
      '...OGGCECCGGGGOO....',
      '..OGGGGGGGGGGGGBO...',
      '.OGGBBGBGBGBGBBBO...',
      '.OGGGGGGGGGGGGGGO...',
      'OOGGGGCCCCCCGGGGO...',
      'OGGGGBBGGGGGBBGGGO..',
      'ODGGGGGGGGGGGGGGDO..',
      '.OODDDDDDDDDDDDOO...',
      '..OGGGO....OGGGO....',
      '..ODDD0....ODDD0....'.replace(/0/g, 'O'),
      '..OOOOO....OOOOO....',
    ],
  },
  onyxia: {
    palette: {
      O: '#0b0e14',
      K: '#18181b', // black dragonscale
      D: '#3f3f46', // dark ridge
      P: '#7e22ce', // purple wing membrane
      F: '#f97316', // dragonfire belly/eyes
      Y: '#fde047', // molten breath
      H: '#d4d4d8', // horns
    },
    grid: [
      'OOO............OOO..',
      'OHHO..OOOOOO..OHHO..',
      '.OHHOKKKKKKKKOHHO...',
      '..OOKKFFKKFFKKOO....',
      'OO..OKKKKKKKKO..OO..',
      'OPKOOKKKYYKKKOOKPO..',
      'OPPKKKKKKKKKKKKPPO..',
      'OPPKKKFFFFFFKKKPPO..',
      '.OOPKKFFFFFFKKPOO...',
      '..OOKKKKKKKKKKOO....',
      '...OKKKKKKKKKKO.....',
      '...OKKKO..OKKKO.....',
      '...ODDD0..ODDD0.....'.replace(/0/g, 'O'),
      '...OOOOO..OOOOO.....',
    ],
  },
};

interface RaceVisualProfile {
  skin: string;
  skinDark: string;
  eye: string;
  hair: string;
  trim: string;
  feature:
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
}

const RACE_VISUALS: Record<string, RaceVisualProfile> = {
  human: {
    skin: '#fed7aa',
    skinDark: '#fdba74',
    eye: '#0f172a',
    hair: '#b45309',
    trim: '#3b82f6',
    feature: 'human',
  },
  dwarf: {
    skin: '#fdba74',
    skinDark: '#ea580c',
    eye: '#0f172a',
    hair: '#d97706',
    trim: '#f59e0b',
    feature: 'dwarf',
  },
  night_elf: {
    skin: '#c4b5fd',
    skinDark: '#8b5cf6',
    eye: '#67e8f9',
    hair: '#10b981',
    trim: '#34d399',
    feature: 'night_elf',
  },
  gnome: {
    skin: '#fecdd3',
    skinDark: '#fda4af',
    eye: '#0ea5e9',
    hair: '#f472b6',
    trim: '#38bdf8',
    feature: 'gnome',
  },
  skyborne_alliance: {
    skin: '#e0f2fe',
    skinDark: '#bae6fd',
    eye: '#fde047',
    hair: '#f8fafc',
    trim: '#38bdf8',
    feature: 'skyborne_alliance',
  },
  orc: {
    skin: '#4ade80',
    skinDark: '#16a34a',
    eye: '#ef4444',
    hair: '#1e293b',
    trim: '#dc2626',
    feature: 'orc',
  },
  undead: {
    skin: '#94a3b8',
    skinDark: '#64748b',
    eye: '#facc15',
    hair: '#475569',
    trim: '#a855f7',
    feature: 'undead',
  },
  tauren: {
    skin: '#92400e',
    skinDark: '#78350f',
    eye: '#fde047',
    hair: '#451a03',
    trim: '#d97706',
    feature: 'tauren',
  },
  troll: {
    skin: '#2dd4bf',
    skinDark: '#0d9488',
    eye: '#fde047',
    hair: '#ef4444',
    trim: '#f97316',
    feature: 'troll',
  },
  skyborne_horde: {
    skin: '#bae6fd',
    skinDark: '#7dd3fc',
    eye: '#fb923c',
    hair: '#4c1d95',
    trim: '#f59e0b',
    feature: 'skyborne_horde',
  },
};

function mpx(matrix: (string | null)[][], x: number, y: number, color: string, w = 1, h = 1) {
  for (let dy = 0; dy < h; dy++) {
    const ry = y + dy;
    if (ry < 0 || ry >= matrix.length) continue;
    for (let dx = 0; dx < w; dx++) {
      const rx = x + dx;
      if (rx < 0 || rx >= matrix[ry].length) continue;
      matrix[ry][rx] = color;
    }
  }
}

function applyAutoOutline(matrix: (string | null)[][]): void {
  const h = matrix.length;
  const w = matrix[0]?.length ?? 0;
  const outlinePoints: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (matrix[y][x] !== null) continue;
      const hasNeighbor =
        (y > 0 && matrix[y - 1][x] !== null && matrix[y - 1][x] !== OUTLINE_HEX) ||
        (y + 1 < h && matrix[y + 1][x] !== null && matrix[y + 1][x] !== OUTLINE_HEX) ||
        (x > 0 && matrix[y][x - 1] !== null && matrix[y][x - 1] !== OUTLINE_HEX) ||
        (x + 1 < w && matrix[y][x + 1] !== null && matrix[y][x + 1] !== OUTLINE_HEX);
      if (hasNeighbor) outlinePoints.push([x, y]);
    }
  }
  for (const [x, y] of outlinePoints) {
    matrix[y][x] = OUTLINE_HEX;
  }
}

export function getHeroSprite(
  heroId: string,
  raceId = 'human',
  tier: HeroEvolutionTier = 1
): HTMLCanvasElement {
  const cacheKey = `hero_v2_${heroId}_${raceId}_t${tier}`;
  const cached = spriteCache.get(cacheKey);
  if (cached) return cached;

  const pal = HERO_CLASS_PALETTES[heroId] || HERO_CLASS_PALETTES.warrior;
  const race = RACE_VISUALS[raceId] || RACE_VISUALS.human;

  // 30x28 base matrix -> 60x56 2x EPX shaded sprite
  const W = 30;
  const H = 28;
  const matrix: (string | null)[][] = Array.from({ length: H }, () =>
    Array<string | null>(W).fill(null)
  );

  // Center of hero body (cx = 12, head x=9..15, weapon on right x=18..28)
  const cx = 12;
  const headY = 7;
  const torsoY = 14;
  const isRobeClass =
    heroId === 'mage' || heroId === 'warlock' || heroId === 'priest' || heroId === 'druid';
  const eyeColor = tier >= 3 ? pal.trimBright : race.eye;

  // ------------------------------------------------------------------------
  // 1. BACK LAYER: Skyborne Wings & Heroic Billowing Cape (Tier 2+)
  // ------------------------------------------------------------------------
  if (race.feature === 'skyborne_alliance' || race.feature === 'skyborne_horde') {
    const wMain = race.feature === 'skyborne_alliance' ? '#f8fafc' : '#6b21a8';
    const wShade = race.feature === 'skyborne_alliance' ? '#bae6fd' : '#3b0764';
    const wTip = race.feature === 'skyborne_alliance' ? '#38bdf8' : '#fb923c';
    const span = tier >= 3 ? 2 : 0;
    // Left wing
    mpx(matrix, 2 - Math.min(1, span), 10 - span, wTip, 3 + Math.min(1, span), 2);
    mpx(matrix, 3 - Math.min(1, span), 12 - span, wMain, 4 + Math.min(1, span), 4 + span);
    mpx(matrix, 4, 16, wShade, 4, 3);
    // Right wing
    mpx(matrix, 18, 10 - span, wTip, 3 + Math.min(1, span), 2);
    mpx(matrix, 17, 12 - span, wMain, 4 + Math.min(1, span), 4 + span);
    mpx(matrix, 16, 16, wShade, 3, 3);
  }

  if (tier >= 2) {
    const capeTop = torsoY;
    const capeLen = tier === 2 ? 7 : tier === 3 ? 10 : 11;
    const flare = tier >= 3 ? 2 : 1;
    for (let dy = 0; dy < capeLen; dy++) {
      const expand = Math.floor((dy / Math.max(1, capeLen - 1)) * flare);
      mpx(
        matrix,
        cx - 4 - expand,
        capeTop + dy,
        dy % 3 === 0 ? pal.capeDark : pal.capeMain,
        9 + expand * 2,
        1
      );
    }
    if (tier >= 3) {
      // Flowing cloak edge trim (like the cover Arch-Druid's emerald/gold cape)
      mpx(matrix, cx - 4 - flare, capeTop + capeLen - 1, pal.trimGold, 9 + flare * 2, 1);
    }
  }

  // ------------------------------------------------------------------------
  // 2. LEGS, BOOTS, TASSETS & ROBES
  // ------------------------------------------------------------------------
  const legStartY = torsoY + 6; // y = 20
  if (isRobeClass && tier >= 2) {
    // Layered battle-robe + center split showing boots at bottom
    mpx(matrix, cx - 3, legStartY, pal.armorDark, 7, 3);
    mpx(matrix, cx - 2, legStartY, pal.armorMid, 5, 3);
    mpx(matrix, cx, legStartY, pal.trimGold, 1, 3);
    // Boots peeking below robe
    mpx(matrix, cx - 3, legStartY + 3, pal.woodOrHilt, 2, 2);
    mpx(matrix, cx + 2, legStartY + 3, pal.woodOrHilt, 2, 2);
    mpx(matrix, cx - 3, legStartY + 4, pal.armorDark, 2, 1);
    mpx(matrix, cx + 2, legStartY + 4, pal.armorDark, 2, 1);
  } else {
    // Pants + sturdy cuffed fantasy boots (matches cover Druid)
    mpx(matrix, cx - 3, legStartY, pal.armorDark, 2, 2);
    mpx(matrix, cx + 2, legStartY, pal.armorDark, 2, 2);
    // Knee plates / cuffs (Tier 2+)
    mpx(
      matrix,
      cx - 3,
      legStartY + 2,
      tier >= 2 ? pal.trimGold : pal.woodOrHilt,
      2,
      1
    );
    mpx(
      matrix,
      cx + 2,
      legStartY + 2,
      tier >= 2 ? pal.trimGold : pal.woodOrHilt,
      2,
      1
    );
    // Boots
    mpx(matrix, cx - 3, legStartY + 3, pal.woodOrHilt, 2, 2);
    mpx(matrix, cx + 2, legStartY + 3, pal.woodOrHilt, 2, 2);
    if (tier >= 3) {
      mpx(matrix, cx - 4, legStartY + 4, pal.armorDark, 3, 1);
      mpx(matrix, cx + 2, legStartY + 4, pal.armorDark, 3, 1);
    }
  }

  // ------------------------------------------------------------------------
  // 3. TORSO, CHESTPLATE, BELT & HEROIC GEM CLASP
  // ------------------------------------------------------------------------
  mpx(matrix, cx - 3, torsoY, pal.armorMid, 7, 6);
  mpx(matrix, cx - 2, torsoY + 1, pal.armorLight, 5, 3);
  // Shaded torso sides
  mpx(matrix, cx - 3, torsoY + 1, pal.armorDark, 1, 4);
  mpx(matrix, cx + 3, torsoY + 1, pal.armorDark, 1, 4);

  // Class chest emblem / leather straps
  if (tier === 1) {
    mpx(matrix, cx - 1, torsoY + 1, pal.woodOrHilt, 3, 2);
    mpx(matrix, cx, torsoY + 1, pal.gemCore, 1, 1);
  } else {
    // Gold/metal chest trim & radiant chest crystal
    mpx(matrix, cx - 2, torsoY, pal.trimGold, 5, 1);
    mpx(matrix, cx - 1, torsoY + 1, pal.trimGold, 3, 2);
    mpx(matrix, cx, torsoY + 1, pal.gemCore, 1, 2);
    mpx(matrix, cx, torsoY + 1, pal.gemGlow, 1, 1);
    if (tier >= 3) {
      // Tabard/tasset front drape
      mpx(matrix, cx - 1, torsoY + 5, pal.armorMid, 3, 3);
      mpx(matrix, cx, torsoY + 6, pal.trimBright, 1, 2);
    }
  }

  // Belt & Buckle (y = torsoY + 4 = 18)
  mpx(matrix, cx - 3, torsoY + 4, pal.woodOrHilt, 7, 1);
  mpx(matrix, cx - 1, torsoY + 4, tier >= 2 ? pal.trimGold : '#cbd5e1', 3, 1);
  if (tier >= 2) {
    mpx(matrix, cx, torsoY + 4, pal.gemGlow, 1, 1);
  }

  // Gauntlets / Hands
  mpx(matrix, cx - 5, torsoY + 2, tier >= 2 ? pal.armorMid : race.skin, 2, 2);
  mpx(matrix, cx + 4, torsoY + 2, tier >= 2 ? pal.armorMid : race.skin, 2, 2);
  if (tier >= 3) {
    mpx(matrix, cx - 5, torsoY + 2, pal.trimGold, 2, 1);
    mpx(matrix, cx + 4, torsoY + 2, pal.trimGold, 2, 1);
  }

  // ------------------------------------------------------------------------
  // 4. SHOULDER PAULDRONS (Evolves dramatically Tier 1 -> Tier 4!)
  // ------------------------------------------------------------------------
  if (tier === 1) {
    // Light novice leafy/cloth shoulders
    mpx(matrix, cx - 4, torsoY, pal.armorLight, 2, 2);
    mpx(matrix, cx + 3, torsoY, pal.armorLight, 2, 2);
  } else if (tier === 2) {
    // Layered veteran pauldrons with trim
    mpx(matrix, cx - 5, torsoY - 1, pal.armorMid, 3, 3);
    mpx(matrix, cx - 5, torsoY - 1, pal.trimGold, 3, 1);
    mpx(matrix, cx + 3, torsoY - 1, pal.armorMid, 3, 3);
    mpx(matrix, cx + 3, torsoY - 1, pal.trimGold, 3, 1);
  } else {
    // Tier 3 & 4: Grand sculpted spiked/feathered pauldrons with glowing orbs!
    // Left pauldron
    mpx(matrix, cx - 6, torsoY - 1, pal.armorDark, 4, 3);
    mpx(matrix, cx - 6, torsoY - 2, pal.armorLight, 3, 2);
    mpx(matrix, cx - 7, torsoY - 2, pal.trimGold, 2, 2); // outer horn/spike
    mpx(matrix, cx - 6, torsoY - 3, pal.trimBright, 1, 1);
    mpx(matrix, cx - 4, torsoY, pal.gemCore, 2, 1);
    mpx(matrix, cx - 4, torsoY - 1, pal.gemGlow, 1, 1);

    // Right pauldron
    mpx(matrix, cx + 3, torsoY - 1, pal.armorDark, 4, 3);
    mpx(matrix, cx + 4, torsoY - 2, pal.armorLight, 3, 2);
    mpx(matrix, cx + 6, torsoY - 2, pal.trimGold, 2, 2); // outer horn/spike
    mpx(matrix, cx + 7, torsoY - 3, pal.trimBright, 1, 1);
    mpx(matrix, cx + 3, torsoY, pal.gemCore, 2, 1);
    mpx(matrix, cx + 4, torsoY - 1, pal.gemGlow, 1, 1);

    if (tier === 4) {
      // Mythic blazing shoulder tips
      mpx(matrix, cx - 7, torsoY - 4, pal.weaponGlow, 1, 2);
      mpx(matrix, cx + 7, torsoY - 4, pal.weaponGlow, 1, 2);
    }
  }

  // ------------------------------------------------------------------------
  // 5. EXPRESSIVE HEAD, FACE & RACIAL SILHOUETTE
  // ------------------------------------------------------------------------
  // Head block (x = 9..15, y = 7..12)
  mpx(matrix, cx - 3, headY, race.skinDark, 7, 6);
  mpx(matrix, cx - 2, headY + 1, race.skin, 5, 4);
  // Subtle brow & eyes (x = 10..14)
  mpx(matrix, cx - 2, headY + 2, race.hair, 2, 1);
  mpx(matrix, cx + 1, headY + 2, race.hair, 2, 1);
  // Crisp RPG eyes (glowing in Tier 3-4)
  mpx(matrix, cx - 2, headY + 3, eyeColor, 1, 1);
  mpx(matrix, cx + 2, headY + 3, eyeColor, 1, 1);
  if (tier >= 3) {
    mpx(matrix, cx - 1, headY + 3, '#ffffff', 1, 1);
    mpx(matrix, cx + 1, headY + 3, '#ffffff', 1, 1);
  } else {
    mpx(matrix, cx - 1, headY + 3, '#f8fafc', 1, 1);
    mpx(matrix, cx + 1, headY + 3, '#f8fafc', 1, 1);
  }
  // Hair framing face (like cover Novice Druid's bangs/locks)
  mpx(matrix, cx - 3, headY + 1, race.hair, 1, 4);
  mpx(matrix, cx + 3, headY + 1, race.hair, 1, 4);

  // Racial facial overlays (always legible across classes)
  if (race.feature === 'night_elf') {
    // Long pointed elven ears sweeping diagonally up-out (exact cover Druid look!)
    mpx(matrix, cx - 5, headY + 2, race.skin, 2, 1);
    mpx(matrix, cx - 6, headY + 1, race.skinDark, 2, 1);
    mpx(matrix, cx + 4, headY + 2, race.skin, 2, 1);
    mpx(matrix, cx + 5, headY + 1, race.skinDark, 2, 1);
  } else if (race.feature === 'dwarf') {
    // Braided beard + golden clasp
    mpx(matrix, cx - 2, headY + 5, race.hair, 5, 2);
    mpx(matrix, cx - 1, headY + 7, race.hair, 3, 1);
    mpx(matrix, cx, headY + 6, '#facc15', 1, 1);
  } else if (race.feature === 'gnome') {
    // Glowing cyan engineer goggles on forehead
    mpx(matrix, cx - 2, headY + 1, '#38bdf8', 2, 1);
    mpx(matrix, cx + 1, headY + 1, '#38bdf8', 2, 1);
    mpx(matrix, cx, headY + 1, '#facc15', 1, 1);
  } else if (race.feature === 'orc') {
    // Upward ivory tusks + crimson shoulder mark
    mpx(matrix, cx - 2, headY + 5, '#f8fafc', 1, 1);
    mpx(matrix, cx + 2, headY + 5, '#f8fafc', 1, 1);
    mpx(matrix, cx - 2, headY + 4, race.skinDark, 5, 1);
  } else if (race.feature === 'undead') {
    // Hollow pale jaw + glowing eye sockets
    mpx(matrix, cx - 2, headY + 5, '#cbd5e1', 5, 1);
    mpx(matrix, cx - 2, headY + 3, race.eye, 1, 1);
    mpx(matrix, cx + 2, headY + 3, race.eye, 1, 1);
  } else if (race.feature === 'tauren') {
    // Snout + broad curving ivory bull horns
    mpx(matrix, cx - 1, headY + 5, '#451a03', 3, 1);
    mpx(matrix, cx - 6, headY + 1, '#e2e8f0', 3, 1);
    mpx(matrix, cx - 7, headY - 1, '#f8fafc', 1, 2);
    mpx(matrix, cx + 4, headY + 1, '#e2e8f0', 3, 1);
    mpx(matrix, cx + 7, headY - 1, '#f8fafc', 1, 2);
  } else if (race.feature === 'troll') {
    // Pointed ears + tusks + tall fiery mohawk
    mpx(matrix, cx - 5, headY + 2, race.skin, 2, 1);
    mpx(matrix, cx + 4, headY + 2, race.skin, 2, 1);
    mpx(matrix, cx - 2, headY + 5, '#f8fafc', 1, 1);
    mpx(matrix, cx + 2, headY + 5, '#f8fafc', 1, 1);
    mpx(matrix, cx - 1, headY - 3, race.hair, 3, 3);
    mpx(matrix, cx, headY - 5, '#fb923c', 1, 2);
  }

  // ------------------------------------------------------------------------
  // 6. CLASS HEADGEAR / CROWN / ANTLERS / HELM (Evolves Tier 1 -> 4!)
  // ------------------------------------------------------------------------
  if (heroId === 'druid') {
    if (tier === 1) {
      // Novice Hood + forehead emerald gem (faithful to left cover Druid!)
      mpx(matrix, cx - 3, headY - 1, pal.armorMid, 7, 2);
      mpx(matrix, cx - 2, headY - 2, pal.armorLight, 5, 1);
      mpx(matrix, cx - 1, headY - 3, pal.armorMid, 3, 1);
      mpx(matrix, cx, headY + 1, pal.gemGlow, 1, 1);
    } else if (tier === 2) {
      // Bark crown hood + budding stag antlers
      mpx(matrix, cx - 3, headY - 1, pal.armorMid, 7, 2);
      mpx(matrix, cx - 2, headY - 2, pal.trimGold, 5, 1);
      mpx(matrix, cx, headY, pal.gemGlow, 1, 2);
      // Budding antlers
      mpx(matrix, cx - 5, headY - 3, '#b45309', 2, 2);
      mpx(matrix, cx - 6, headY - 4, '#d97706', 1, 2);
      mpx(matrix, cx + 4, headY - 3, '#b45309', 2, 2);
      mpx(matrix, cx + 6, headY - 4, '#d97706', 1, 2);
    } else {
      // Tier 3 & 4: Grand Arch-Druid Golden Crescent Helm + Giant Branching Stag Antlers!
      mpx(matrix, cx - 3, headY - 1, pal.armorMid, 7, 2);
      mpx(matrix, cx - 2, headY - 2, pal.trimGold, 5, 2);
      mpx(matrix, cx, headY - 1, pal.gemGlow, 1, 2);
      // Golden Crescent Moon Horns flanking brow
      mpx(matrix, cx - 3, headY - 4, pal.trimBright, 1, 3);
      mpx(matrix, cx + 3, headY - 4, pal.trimBright, 1, 3);
      // Massive multi-branched stag antlers
      mpx(matrix, cx - 5, headY - 2, '#92400e', 2, 1);
      mpx(matrix, cx - 7, headY - 4, '#b45309', 2, 2);
      mpx(matrix, cx - 8, headY - 6, '#d97706', 2, 2);
      mpx(matrix, cx - 5, headY - 5, '#d97706', 1, 2);
      mpx(matrix, cx + 4, headY - 2, '#92400e', 2, 1);
      mpx(matrix, cx + 6, headY - 4, '#b45309', 2, 2);
      mpx(matrix, cx + 7, headY - 6, '#d97706', 2, 2);
      mpx(matrix, cx + 5, headY - 5, '#d97706', 1, 2);
      if (tier === 4) {
        mpx(matrix, cx - 9, headY - 7, pal.trimBright, 1, 2);
        mpx(matrix, cx + 9, headY - 7, pal.trimBright, 1, 2);
        mpx(matrix, cx, headY - 5, pal.gemGlow, 1, 1);
      }
    }
  } else if (heroId === 'warrior') {
    mpx(matrix, cx - 3, headY - 1, pal.armorMid, 7, 2);
    mpx(matrix, cx - 2, headY - 2, pal.armorLight, 5, 1);
    mpx(matrix, cx, headY, pal.trimGold, 1, 2);
    if (tier >= 2) {
      // Helm wings / horns
      mpx(matrix, cx - 5, headY - 2, pal.trimGold, 2, 2);
      mpx(matrix, cx + 4, headY - 2, pal.trimGold, 2, 2);
    }
    if (tier >= 3) {
      mpx(matrix, cx - 1, headY - 4, pal.trimBright, 3, 2);
      mpx(matrix, cx - 6, headY - 4, pal.armorLight, 1, 3);
      mpx(matrix, cx + 6, headY - 4, pal.armorLight, 1, 3);
    }
    if (tier === 4) {
      mpx(matrix, cx - 7, headY - 6, pal.trimBright, 1, 2);
      mpx(matrix, cx + 7, headY - 6, pal.trimBright, 1, 2);
    }
  } else if (heroId === 'paladin') {
    if (tier === 1) {
      mpx(matrix, cx - 3, headY - 1, race.hair, 7, 2);
      mpx(matrix, cx - 2, headY, pal.armorMid, 5, 1);
    } else {
      mpx(matrix, cx - 3, headY - 1, pal.armorMid, 7, 2);
      mpx(matrix, cx - 2, headY - 2, pal.armorLight, 5, 1);
      mpx(matrix, cx, headY, pal.gemCore, 1, 2);
      mpx(matrix, cx - 5, headY - 3, '#f8fafc', 2, 2);
      mpx(matrix, cx + 4, headY - 3, '#f8fafc', 2, 2);
    }
    if (tier >= 3) {
      // Floating radiant golden halo
      mpx(matrix, cx - 3, headY - 5, pal.trimBright, 7, 1);
      mpx(matrix, cx - 4, headY - 4, pal.armorMid, 1, 1);
      mpx(matrix, cx + 4, headY - 4, pal.armorMid, 1, 1);
    }
    if (tier === 4) {
      mpx(matrix, cx - 6, headY - 5, pal.trimBright, 2, 2);
      mpx(matrix, cx + 5, headY - 5, pal.trimBright, 2, 2);
    }
  } else if (heroId === 'hunter') {
    mpx(matrix, cx - 3, headY - 1, pal.armorMid, 7, 2);
    mpx(matrix, cx - 2, headY - 2, pal.armorLight, 5, 1);
    if (tier >= 2) {
      mpx(matrix, cx - 4, headY - 3, pal.trimGold, 2, 2);
    }
    if (tier >= 3) {
      mpx(matrix, cx - 5, headY - 4, pal.trimBright, 2, 2);
      mpx(matrix, cx + 4, headY - 4, pal.trimBright, 2, 2);
      mpx(matrix, cx, headY, pal.gemGlow, 1, 1);
    }
    if (tier === 4) {
      mpx(matrix, cx - 6, headY - 6, pal.weaponGlow, 1, 2);
      mpx(matrix, cx + 6, headY - 6, pal.weaponGlow, 1, 2);
    }
  } else if (heroId === 'rogue') {
    mpx(matrix, cx - 3, headY - 1, pal.armorMid, 7, 2);
    mpx(matrix, cx - 2, headY - 2, pal.armorDark, 5, 1);
    // Crimson assassin face mask
    mpx(matrix, cx - 2, headY + 4, pal.trimGold, 5, 2);
    if (tier >= 2) {
      // Trailing crimson scarf on left
      mpx(matrix, cx - 5, headY + 4, pal.trimGold, 2, 2);
      mpx(matrix, cx - 6, headY + 5, pal.trimBright, 1, 2);
    }
    if (tier >= 3) {
      // Bloodfang horns
      mpx(matrix, cx - 4, headY - 4, pal.trimGold, 1, 3);
      mpx(matrix, cx + 4, headY - 4, pal.trimGold, 1, 3);
      mpx(matrix, cx, headY, pal.gemCore, 1, 1);
    }
    if (tier === 4) {
      mpx(matrix, cx - 5, headY - 5, pal.gemGlow, 1, 2);
      mpx(matrix, cx + 5, headY - 5, pal.gemGlow, 1, 2);
    }
  } else if (heroId === 'mage') {
    // Iconic pointed Kirin Tor mage hat
    mpx(matrix, cx - 4, headY, pal.trimGold, 9, 1);
    mpx(matrix, cx - 3, headY - 2, pal.armorMid, 7, 2);
    mpx(matrix, cx - 2, headY - 4, pal.armorLight, 5, 2);
    mpx(matrix, cx - 1, headY - 5, pal.armorMid, 3, 1);
    if (tier >= 2) {
      mpx(matrix, cx, headY - 1, pal.gemGlow, 1, 1);
    }
    if (tier >= 3) {
      mpx(matrix, cx - 5, headY - 2, pal.trimBright, 1, 2);
      mpx(matrix, cx + 5, headY - 2, pal.trimBright, 1, 2);
    }
    if (tier === 4) {
      mpx(matrix, cx, headY - 7, pal.gemGlow, 2, 2);
    }
  } else if (heroId === 'warlock') {
    mpx(matrix, cx - 3, headY - 1, pal.armorDark, 7, 2);
    mpx(matrix, cx - 2, headY - 2, pal.armorMid, 5, 1);
    if (tier >= 2) {
      mpx(matrix, cx - 5, headY - 3, pal.trimGold, 2, 2);
      mpx(matrix, cx + 4, headY - 3, pal.trimGold, 2, 2);
    }
    if (tier >= 3) {
      // Sweeping Dreadlord Horns + Fel brow jewel
      mpx(matrix, cx - 6, headY - 5, pal.trimBright, 2, 3);
      mpx(matrix, cx + 5, headY - 5, pal.trimBright, 2, 3);
      mpx(matrix, cx, headY, pal.gemGlow, 1, 1);
    }
    if (tier === 4) {
      mpx(matrix, cx - 7, headY - 7, pal.weaponGlow, 1, 2);
      mpx(matrix, cx + 7, headY - 7, pal.weaponGlow, 1, 2);
    }
  } else if (heroId === 'priest') {
    mpx(matrix, cx - 3, headY - 1, pal.armorLight, 7, 2);
    mpx(matrix, cx - 2, headY - 2, pal.trimGold, 5, 1);
    if (tier >= 2) {
      mpx(matrix, cx - 3, headY - 4, pal.trimBright, 7, 1);
    }
    if (tier >= 3) {
      mpx(matrix, cx - 5, headY - 3, '#ffffff', 2, 2);
      mpx(matrix, cx + 4, headY - 3, '#ffffff', 2, 2);
      mpx(matrix, cx, headY - 5, pal.gemGlow, 1, 1);
    }
    if (tier === 4) {
      mpx(matrix, cx - 2, headY - 6, pal.trimBright, 5, 1);
    }
  } else if (heroId === 'shaman') {
    // Wolf-pelt spirit headdress
    mpx(matrix, cx - 3, headY - 1, '#94a3b8', 7, 2);
    mpx(matrix, cx - 2, headY - 2, '#cbd5e1', 5, 1);
    if (tier >= 2) {
      // Wolf ears + glowing storm trim
      mpx(matrix, cx - 4, headY - 3, '#64748b', 2, 2);
      mpx(matrix, cx + 3, headY - 3, '#64748b', 2, 2);
      mpx(matrix, cx, headY - 1, pal.gemGlow, 1, 1);
    }
    if (tier >= 3) {
      mpx(matrix, cx - 5, headY - 4, pal.weaponGlow, 1, 2);
      mpx(matrix, cx + 5, headY - 4, pal.weaponGlow, 1, 2);
    }
    if (tier === 4) {
      mpx(matrix, cx - 6, headY - 6, pal.trimBright, 1, 2);
      mpx(matrix, cx + 6, headY - 6, pal.trimBright, 1, 2);
    }
  }

  // ------------------------------------------------------------------------
  // 7. TIERED CLASS WEAPONS (x = 19..28) — Evolves dramatically Tier 1 -> 4!
  // ------------------------------------------------------------------------
  const wx = 21;
  if (heroId === 'druid') {
    // Shaft
    mpx(matrix, wx, 9, pal.woodOrHilt, 1, 16);
    if (tier === 1) {
      // Novice wooden branch twig with 2 cute leaves (matches left cover Druid!)
      mpx(matrix, wx - 1, 7, pal.woodOrHilt, 2, 3);
      mpx(matrix, wx + 1, 6, pal.armorLight, 2, 2);
      mpx(matrix, wx - 2, 8, pal.armorLight, 1, 1);
    } else if (tier === 2) {
      // Leaf-wrapped emerald gem staff
      mpx(matrix, wx - 1, 7, pal.armorMid, 3, 2);
      mpx(matrix, wx, 5, pal.gemCore, 2, 3);
      mpx(matrix, wx, 6, pal.gemGlow, 1, 1);
    } else {
      // Tier 3 & 4: Golden Crescent Moon Staff cradling glowing Emerald Diamond!
      mpx(matrix, wx - 1, 10, pal.trimGold, 3, 1);
      mpx(matrix, wx + 1, 4, pal.trimGold, 2, 1);
      mpx(matrix, wx - 1, 5, pal.trimGold, 2, 1);
      mpx(matrix, wx - 2, 6, pal.trimGold, 1, 3);
      mpx(matrix, wx - 1, 9, pal.trimGold, 2, 1);
      mpx(matrix, wx + 1, 9, pal.trimBright, 2, 1);
      // Glowing emerald diamond core inside crescent
      mpx(matrix, wx + 1, 6, pal.gemCore, 2, 2);
      mpx(matrix, wx + 1, 6, pal.gemGlow, 1, 1);
      if (tier === 4) {
        // Golden fire / nature aura around crescent moon staff (exact cover Arch-Druid!)
        mpx(matrix, wx - 3, 5, '#fb923c', 1, 2);
        mpx(matrix, wx + 3, 4, '#fde047', 1, 2);
        mpx(matrix, wx + 4, 7, '#fb923c', 1, 2);
      }
    }
  } else if (heroId === 'warrior') {
    mpx(matrix, wx, 18, pal.woodOrHilt, 1, 4);
    mpx(matrix, wx - 2, 17, pal.trimGold, 5, 1);
    const bladeTop = tier === 1 ? 10 : tier === 2 ? 7 : 4;
    const bladeW = tier >= 3 ? 2 : 1;
    mpx(matrix, wx, bladeTop, pal.weaponMetal, bladeW, 17 - bladeTop);
    if (tier >= 2) {
      mpx(matrix, wx, bladeTop + 2, pal.weaponGlow, 1, 5);
    }
    if (tier === 4) {
      mpx(matrix, wx - 1, bladeTop + 1, pal.trimBright, 1, 3);
      mpx(matrix, wx + 2, bladeTop + 2, pal.weaponGlow, 1, 4);
    }
  } else if (heroId === 'paladin') {
    mpx(matrix, wx, 9, pal.woodOrHilt, 1, 15);
    const hTop = tier === 1 ? 7 : 5;
    mpx(matrix, wx - 2, hTop, pal.armorMid, 5, 4);
    mpx(matrix, wx - 1, hTop + 1, pal.trimBright, 3, 2);
    if (tier >= 3) {
      mpx(matrix, wx - 3, hTop, pal.gemCore, 1, 4);
      mpx(matrix, wx + 3, hTop, pal.gemCore, 1, 4);
      mpx(matrix, wx, hTop - 2, pal.trimBright, 1, 2);
    }
    if (tier === 4) {
      mpx(matrix, wx - 4, hTop + 1, pal.weaponGlow, 1, 2);
      mpx(matrix, wx + 4, hTop + 1, pal.weaponGlow, 1, 2);
    }
  } else if (heroId === 'hunter') {
    const bowH = tier >= 3 ? 13 : 10;
    const bTop = 14 - Math.floor(bowH / 2);
    // Bowstring
    mpx(matrix, wx - 1, bTop + 1, '#e2e8f0', 1, bowH - 2);
    // Curved bow limbs
    mpx(matrix, wx, bTop, pal.woodOrHilt, 2, 2);
    mpx(matrix, wx + 1, bTop + 2, tier >= 2 ? pal.trimGold : pal.woodOrHilt, 1, bowH - 4);
    mpx(matrix, wx, bTop + bowH - 2, pal.woodOrHilt, 2, 2);
    // Nocked glowing arrow
    mpx(matrix, wx - 2, 14, tier >= 2 ? pal.weaponGlow : '#cbd5e1', 5, 1);
    if (tier >= 3) {
      mpx(matrix, wx + 3, 13, pal.trimBright, 1, 3);
    }
  } else if (heroId === 'rogue') {
    // Dual wield blades (left off-hand + right main-hand!)
    const bladeLen = tier === 1 ? 4 : tier === 2 ? 6 : 8;
    // Left off-hand blade pointing down-left
    mpx(matrix, 5, 16, pal.weaponMetal, 2, 1);
    mpx(matrix, 4 - (tier >= 3 ? 1 : 0), 17, tier >= 2 ? pal.weaponGlow : pal.weaponMetal, 2, bladeLen - 2);
    // Right main-hand blade
    mpx(matrix, wx - 1, 16, pal.trimGold, 3, 1);
    mpx(matrix, wx, 16 - bladeLen, pal.weaponMetal, tier >= 3 ? 2 : 1, bladeLen);
    if (tier >= 2) {
      mpx(matrix, wx + 1, 16 - bladeLen, pal.weaponGlow, 1, bladeLen - 2);
    }
  } else if (heroId === 'mage') {
    mpx(matrix, wx, 10, pal.woodOrHilt, 1, 15);
    mpx(matrix, wx - 1, 8, pal.trimGold, 3, 2);
    mpx(matrix, wx - 1, 5, pal.gemCore, 3, 3);
    mpx(matrix, wx, 6, '#ffffff', 1, 1);
    if (tier >= 3) {
      mpx(matrix, wx - 2, 4, pal.trimBright, 1, 3);
      mpx(matrix, wx + 2, 4, pal.trimBright, 1, 3);
    }
    if (tier === 4) {
      mpx(matrix, wx, 2, pal.weaponGlow, 1, 2);
    }
  } else if (heroId === 'warlock') {
    mpx(matrix, wx, 10, pal.woodOrHilt, 1, 15);
    // Skull topper
    mpx(matrix, wx - 1, 7, '#e2e8f0', 3, 3);
    mpx(matrix, wx, 8, pal.weaponGlow, 1, 1);
    if (tier >= 2) {
      mpx(matrix, wx - 2, 6, pal.trimGold, 1, 2);
      mpx(matrix, wx + 2, 6, pal.trimGold, 1, 2);
    }
    if (tier >= 3) {
      // Fel flame crowning the skull staff
      mpx(matrix, wx - 1, 4, pal.weaponGlow, 3, 3);
      mpx(matrix, wx, 3, pal.gemGlow, 1, 2);
    }
    if (tier === 4) {
      mpx(matrix, wx + 2, 4, pal.gemGlow, 1, 2);
    }
  } else if (heroId === 'priest') {
    mpx(matrix, wx, 9, pal.woodOrHilt, 1, 16);
    mpx(matrix, wx - 1, 7, pal.trimGold, 3, 2);
    mpx(matrix, wx, 5, pal.gemGlow, 2, 2);
    if (tier >= 3) {
      // Angelic Benediction wings on staff
      mpx(matrix, wx - 2, 5, '#ffffff', 1, 3);
      mpx(matrix, wx + 2, 5, '#ffffff', 1, 3);
      mpx(matrix, wx, 3, pal.trimBright, 1, 2);
    }
  } else if (heroId === 'shaman') {
    mpx(matrix, wx, 9, pal.woodOrHilt, 1, 16);
    const axeH = tier >= 3 ? 6 : 4;
    mpx(matrix, wx + 1, 8, pal.weaponMetal, 3, axeH);
    mpx(matrix, wx + 3, 8, tier >= 2 ? pal.weaponGlow : '#e2e8f0', 1, axeH);
    if (tier >= 3) {
      mpx(matrix, wx - 2, 9, pal.weaponGlow, 2, 3);
      mpx(matrix, wx + 2, 6, pal.trimBright, 1, 2);
    }
  }

  // ------------------------------------------------------------------------
  // 8. AUTO-OUTLINE & 2x EPX SHADING BAKE
  // ------------------------------------------------------------------------
  applyAutoOutline(matrix);
  const canvas = upscaleAndShadeMatrix(matrix);
  spriteCache.set(cacheKey, canvas);
  return canvas;
}

export function getEnemySprite(enemyId: string): HTMLCanvasElement {
  const def = ENEMY_GRIDS[enemyId] || ENEMY_GRIDS.kobold;
  return bakePixelSprite(`enemy_${enemyId}`, def.grid, def.palette, true);
}

export const COIN_SPRITE_GRID = [
  '..OOOO..',
  '.OYYYYO.',
  'OYGGGGYO',
  'OYGYYGYO',
  'OYGYYGYO',
  'OYGGGGYO',
  '.OGGGGO.',
  '..OOOO..',
];

export const COIN_PALETTE: SpritePalette = {
  O: '#451a03',
  Y: '#fef08a',
  G: '#f59e0b',
};

export function getCoinSprite(): HTMLCanvasElement {
  return bakePixelSprite('gold_coin', COIN_SPRITE_GRID, COIN_PALETTE, false);
}

export const HAND_POINTER_GRID = [
  '...OO.......',
  '..OWWO......',
  '..OWWO......',
  '..OWWO......',
  '..OWWOOOO...',
  '..OWWOWWOO..',
  '.OOWWOWWWOO.',
  'OWWWOWWWWWOO',
  'OWWWWWWWWWWO',
  '.OWWWWWWWWO.',
  '..OGGGGGGO..',
  '..OYYYYYYO..',
  '...OOOOOO...',
];

export const HAND_PALETTE: SpritePalette = {
  O: '#0b0e14',
  W: '#f8fafc',
  G: '#f59e0b',
  Y: '#fde047',
};

export function getHandPointerSprite(): HTMLCanvasElement {
  return bakePixelSprite('hand_pointer', HAND_POINTER_GRID, HAND_PALETTE, false);
}
