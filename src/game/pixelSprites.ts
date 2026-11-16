// Crisp 2D Pixel-Art Sprite Engine (pre-baked offscreen canvases for 60fps rendering)

export type SpritePalette = Record<string, string>;

const spriteCache = new Map<string, HTMLCanvasElement>();

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
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < h; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        const drawX = flipX ? w - 1 - x : x;
        ctx.fillRect(drawX, y, 1, 1);
      }
    }
  }
  spriteCache.set(cacheKey, canvas);
  return canvas;
}

// ============================================================================
// 6 WORLD OF WARCRAFT INSPIRED HERO CLASSES (16x16 Pixel Grids)
// ============================================================================

const HERO_GRIDS: Record<string, { grid: string[]; palette: SpritePalette }> = {
  warrior: {
    palette: {
      O: '#0b0e14', // dark outline
      S: '#cbd5e1', // steel light
      M: '#64748b', // steel mid
      D: '#334155', // steel dark
      G: '#facc15', // Stormwind gold
      B: '#2563eb', // Alliance blue
      F: '#fed7aa', // skin
      E: '#0f172a', // eyes
      W: '#e2e8f0', // sword blade
      H: '#92400e', // leather/hilt
    },
    grid: [
      '....OOOOOO......',
      '...OGSSSSGO.....',
      '..OSSSSSSSSO....',
      '..OSOOFFOOSO....',
      '..OSFEFFEFSO....',
      '...OFFFFFFO.....',
      '.OOGBBBBBBGOO...',
      'OGBSSSSSSSSBGO..',
      'OBBSSSSSSSSBBO.O',
      'OBBGSSSSSSGBBOOW',
      '.OOBBGGGGGBBOOOW',
      '..OSSMMMMMSSOHW.',
      '..OSDDDDDDDSOHO.',
      '..OSSO..OSSO....',
      '..ODDO..ODDO....',
      '..OOOO..OOOO....',
    ],
  },
  hunter: {
    palette: {
      O: '#0b0e14',
      C: '#15803d', // ranger cloak
      L: '#22c55e', // bright green trim
      D: '#14532d', // dark green
      F: '#fde68a', // elf skin
      E: '#38bdf8', // glowing elven eyes
      H: '#fbbf24', // golden hair/bow trim
      W: '#92400e', // bow wood
      S: '#e2e8f0', // bowstring/arrow tip
      B: '#78350f', // leather boots/chest
    },
    grid: [
      '....OOOOOO......',
      '...OCCCCCCCO....',
      '..OCCCCCCCCLO...',
      '..OCOOFFOOCO....',
      '..OCFEFFEFCO.O..',
      '...OFFFFFFO..WO.',
      '..OOCCCCCCOO.WSO',
      '.OCLLBBBBLLCOWSO',
      '.OCBBBBBBBBCOHSO',
      '.OCDDGGGGDDCOWSO',
      '..OBBBBBBBBO.WSO',
      '..ODDDDDDDDO.WO.',
      '..OBBO..OBBO.O..',
      '..OCCO..OCCO....',
      '..ODDO..ODDO....',
      '..OOOO..OOOO....',
    ],
  },
  mage: {
    palette: {
      O: '#0b0e14',
      P: '#7e22ce', // Kirin Tor violet
      V: '#a855f7', // bright violet
      D: '#4c1d95', // dark robe
      G: '#facc15', // gold trim
      F: '#fed7aa', // skin
      E: '#38bdf8', // arcane eyes
      C: '#67e8f9', // arcane crystal orb
      W: '#78350f', // staff shaft
    },
    grid: [
      '.....OOOO.......',
      '....OPPPPO......',
      '...OPPPPPPO.....',
      '..OGGGGGGGGO..OO',
      '..O..OFFO..O.OCC',
      '....OFEFO....OCC',
      '....OFFFO....OWO',
      '...OPVVVVPO..OWO',
      '..OPPPPPPPPO.OWO',
      '..OPPGPPGPPO.OWO',
      '..ODDDDDDDDO.OWO',
      '..ODDPGGPDDO.OWO',
      '..ODDDDDDDDO.OWO',
      '...ODDOODDO...O.',
      '...ODDOODDO.....',
      '...OOOOOOOO.....',
    ],
  },
  rogue: {
    palette: {
      O: '#0b0e14',
      K: '#1e293b', // shadow leather
      D: '#0f172a', // dark cloth
      R: '#dc2626', // crimson bandana/sash
      F: '#fed7aa', // skin
      E: '#facc15', // sharp eyes
      P: '#4ade80', // venom dagger glow
      S: '#cbd5e1', // steel blade
    },
    grid: [
      '....OOOOOO......',
      '...OKKKKKKO.....',
      '..OKKKKKKKKO....',
      '..OKOOFFOOKO....',
      '..OKFEFFEFKO....',
      '...ORRRRRRO.....',
      '..OOKKKKKKOO....',
      '.OPSKKKKKKSPO...',
      'OOSKKKKKKKKSOO..',
      'O..OKRRRRKO..O..',
      '...OKKKKKKO.....',
      '...ODDDDDDO.....',
      '..OKKO..OKKO....',
      '..OKKO..OKKO....',
      '..ODDO..ODDO....',
      '..OOOO..OOOO....',
    ],
  },
  paladin: {
    palette: {
      O: '#0b0e14',
      G: '#facc15', // radiant gold plate
      Y: '#fef08a', // bright highlight
      W: '#f8fafc', // silver/white cloth
      B: '#3b82f6', // Silver Hand blue
      F: '#fed7aa', // skin
      H: '#fbbf24', // blond hair
      E: '#0f172a',
      M: '#94a3b8', // hammer iron
    },
    grid: [
      '....OOOOOO......',
      '...OHHHHHHO.....',
      '..OHHHHHHHHO....',
      '..OHHOFFOHHO.OOO',
      '..OHFEFFEFHOOGYG',
      '...OFFFFFFO.OGYG',
      'OOGGGGGGGGGGOOGO',
      'OGYGGWWWWGGYGOOO',
      'OGGGGWWWWGGGGOO.',
      '.OOGGBBBBGGGOHO.',
      '..OGGGGGGGGGOHO.',
      '..OWWGGGGWWOOHO.',
      '..OGGO..OGGO.O..',
      '..OGGO..OGGO....',
      '..OBBO..OBBO....',
      '..OOOO..OOOO....',
    ],
  },
  warlock: {
    palette: {
      O: '#0b0e14',
      P: '#3b0764', // obsidian purple
      V: '#6b21a8', // dark violet
      F: '#4ade80', // fel green flame
      L: '#bbf7d0', // fel core
      H: '#71717a', // demon horns
      R: '#e2e8f0', // skull staff
      W: '#27272a', // dark shaft
    },
    grid: [
      '.OO........OO...',
      'OHHO.OOOO.OHHO..',
      '.OHHOPPPPOHHO...',
      '..OOPPPPPPOO..OF',
      '...OPOFFOPO..OFL',
      '...OPPPPPPO..ORR',
      '..OPPVVVVPPO.OWO',
      '.OPPPPPPPPPPOOWO',
      '.OPPPFFFFPPPOOWO',
      '..OPPPPPPPPO.OWO',
      '..OVVVVVVVVO.OWO',
      '..OVVPPPPVVOOOWO',
      '..OVVVVVVVVO.OWO',
      '...OVVOOVVO...O.',
      '...OPPOOPPO.....',
      '...OOOOOOOO.....',
    ],
  },
  priest: {
    palette: {
      O: '#0b0e14',
      W: '#f8fafc', // holy vestments
      S: '#cbd5e1', // silver shadow
      G: '#facc15', // halo & gold trim
      Y: '#fef08a', // holy orb
      F: '#fed7aa', // skin
      E: '#38bdf8', // radiant eyes
      H: '#92400e', // staff wood
    },
    grid: [
      '....OGGGGO......',
      '...OGYYYYGO.....',
      '...OOWWWWOO.....',
      '..OWWOFFOWWO.OO.',
      '..OWFEFFEFWO.YYO',
      '...OWFFFFWO..GYO',
      '..OOGGGGGGOO.OHO',
      '.OWWWWWWWWWWOOH.',
      '.OWWWGGGGWWWOOH.',
      '..OWWWWWWWWWOOH.',
      '..OSSGGGGSSOOOH.',
      '..OWWWWWWWWWO.O.',
      '..OWWGGGGWWWO...',
      '...OWWOOWWO.....',
      '...OSSO.OSSO....',
      '...OOOOOOOO.....',
    ],
  },
  shaman: {
    palette: {
      O: '#0b0e14',
      B: '#0284c7', // storm blue
      C: '#38bdf8', // lightning cyan
      W: '#94a3b8', // wolf headdress fur
      L: '#78350f', // leather kilt
      F: '#fed7aa', // skin
      Y: '#facc15', // lightning spark
      M: '#64748b', // storm axe
    },
    grid: [
      '..OO......OO....',
      '.OWWO.OO.OWWO...',
      '.OWWWWWWWWWWO...',
      '..OWOOFFOOWO..OO',
      '..OWFEFFEFWO.OCC',
      '...OFFFFFFO..OMC',
      '..OOBBBBBBOO.OMO',
      '.OWWBBBBBBWWOOMO',
      '.OBBCCCCCCBBOMO.',
      '..OBBBBBBBBO.O..',
      '..OLLGGGGLLO....',
      '..OLLLLLLLLO....',
      '..OBBO..OBBO....',
      '..OLLO..OLLO....',
      '..OOOO..OOOO....',
    ],
  },
  druid: {
    palette: {
      O: '#0b0e14',
      A: '#d97706', // stag antlers
      G: '#15803d', // wild emerald robes
      L: '#4ade80', // glowing nature leaf
      W: '#78350f', // bark & staff
      F: '#fed7aa', // skin
      E: '#fde047', // moon eyes
    },
    grid: [
      'O..O......O..O..',
      'OAAO.OOOO.OAAO..',
      '.OAAOGGGGAAAO...',
      '..OOGOFFOGOO..OO',
      '...OGEFFEGO..OLL',
      '...OGGGGGGO..OLL',
      '..OOWWWWWWO..OWO',
      '.OGGWGGGGWGGOOWO',
      '.OGGGGGGGGGGOOWO',
      '..OGGLLLLGGO.OWO',
      '..OWWWWWWWWO.OWO',
      '..OGGGGGGGGO.OWO',
      '...OGGOOGGO...O.',
      '...OWWOOWWO.....',
      '...OOOOOOOO.....',
    ],
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

export function getHeroSprite(heroId: string): HTMLCanvasElement {
  const def = HERO_GRIDS[heroId] || HERO_GRIDS.warrior;
  return bakePixelSprite(`hero_${heroId}`, def.grid, def.palette, false);
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
