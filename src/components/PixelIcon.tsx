import React, { useEffect, useRef } from 'react';
import { getCoinSprite, getEnemySprite, getHeroSprite } from '../game/pixelSprites';
import { AutoSkillVisual, ClassAttackStyle, HeroEvolutionTier } from '../game/types';

interface PixelSpriteThumbProps {
  kind: 'hero' | 'enemy' | 'coin';
  id?: string;
  raceId?: string;
  tier?: HeroEvolutionTier;
  size?: number;
  className?: string;
}

export const PixelSpriteThumb: React.FC<PixelSpriteThumbProps> = ({
  kind,
  id = 'warrior',
  raceId = 'human',
  tier = 1,
  size = 44,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const sprite =
      kind === 'coin'
        ? getCoinSprite()
        : kind === 'enemy'
        ? getEnemySprite(id)
        : getHeroSprite(id, raceId, tier);
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(sprite, 0, 0);
  }, [kind, id, raceId, tier]);

  return (
    <canvas
      ref={ref}
      style={{ width: size, height: size }}
      className={`pixelated shrink-0 ${className}`}
    />
  );
};

// Crisp pixel-art SVG icons (16x16 viewBox, integer rects, shapeRendering="crispEdges")
export type PixelIconName =
  | 'tab_upgrades'
  | 'tab_heroes'
  | 'tab_skills'
  | 'tab_quests'
  | 'tab_relics'
  | 'tab_ascension'
  | 'sword'
  | 'auto'
  | 'fury'
  | 'greed'
  | 'clover'
  | 'titan'
  | 'coin'
  | 'shard'
  | 'gear'
  | 'help'
  | 'lock'
  | 'skull';

export const PixelIcon: React.FC<{ name: PixelIconName; size?: number; className?: string }> = ({
  name,
  size = 24,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {name === 'tab_upgrades' && (
        <>
          <rect x="6" y="1" width="4" height="2" fill="#14532d" />
          <rect x="4" y="3" width="8" height="2" fill="#14532d" />
          <rect x="2" y="5" width="12" height="3" fill="#14532d" />
          <rect x="5" y="8" width="6" height="7" fill="#14532d" />
          <rect x="7" y="2" width="2" height="2" fill="#86efac" />
          <rect x="5" y="4" width="6" height="2" fill="#4ade80" />
          <rect x="3" y="6" width="10" height="1" fill="#22c55e" />
          <rect x="6" y="7" width="4" height="7" fill="#22c55e" />
          <rect x="7" y="7" width="2" height="6" fill="#4ade80" />
        </>
      )}

      {name === 'tab_heroes' && (
        <>
          <rect x="3" y="2" width="4" height="4" fill="#fed7aa" />
          <rect x="2" y="1" width="6" height="2" fill="#92400e" />
          <rect x="1" y="7" width="8" height="6" fill="#dc2626" />
          <rect x="9" y="3" width="4" height="4" fill="#fed7aa" />
          <rect x="8" y="2" width="6" height="2" fill="#f59e0b" />
          <rect x="7" y="8" width="8" height="6" fill="#2563eb" />
          <rect x="3" y="8" width="4" height="5" fill="#f97316" />
          <rect x="9" y="9" width="4" height="4" fill="#60a5fa" />
        </>
      )}

      {name === 'tab_skills' && (
        <>
          <rect x="5" y="1" width="6" height="2" fill="#f97316" />
          <rect x="3" y="3" width="10" height="4" fill="#facc15" />
          <rect x="2" y="6" width="11" height="5" fill="#f59e0b" />
          <rect x="4" y="4" width="2" height="4" fill="#fef08a" />
          <rect x="7" y="4" width="2" height="4" fill="#fef08a" />
          <rect x="10" y="4" width="2" height="4" fill="#fef08a" />
          <rect x="5" y="11" width="6" height="4" fill="#b45309" />
        </>
      )}

      {name === 'tab_quests' && (
        <>
          <rect x="3" y="1" width="10" height="2" fill="#92400e" />
          <rect x="2" y="3" width="12" height="10" fill="#fef3c7" />
          <rect x="3" y="13" width="10" height="2" fill="#92400e" />
          <rect x="4" y="5" width="8" height="1" fill="#78350f" />
          <rect x="4" y="7" width="6" height="1" fill="#78350f" />
          <rect x="4" y="9" width="7" height="1" fill="#78350f" />
          <rect x="10" y="10" width="2" height="2" fill="#dc2626" />
        </>
      )}

      {name === 'tab_relics' && (
        <>
          <rect x="7" y="1" width="2" height="2" fill="#bae6fd" />
          <rect x="5" y="3" width="6" height="3" fill="#38bdf8" />
          <rect x="3" y="6" width="10" height="6" fill="#0284c7" />
          <rect x="5" y="7" width="6" height="5" fill="#7dd3fc" />
          <rect x="7" y="9" width="2" height="3" fill="#f0f9ff" />
          <rect x="5" y="12" width="6" height="2" fill="#0369a1" />
        </>
      )}

      {name === 'tab_ascension' && (
        <>
          <rect x="4" y="1" width="8" height="2" fill="#fde047" />
          <rect x="3" y="2" width="2" height="2" fill="#f59e0b" />
          <rect x="11" y="2" width="2" height="2" fill="#f59e0b" />
          <rect x="1" y="6" width="5" height="2" fill="#f8fafc" />
          <rect x="2" y="8" width="4" height="3" fill="#cbd5e1" />
          <rect x="10" y="6" width="5" height="2" fill="#f8fafc" />
          <rect x="10" y="8" width="4" height="3" fill="#cbd5e1" />
          <rect x="6" y="7" width="4" height="6" fill="#38bdf8" />
          <rect x="7" y="8" width="2" height="4" fill="#bae6fd" />
        </>
      )}

      {name === 'sword' && (
        <>
          <rect x="11" y="1" width="4" height="4" fill="#e2e8f0" />
          <rect x="9" y="3" width="4" height="4" fill="#cbd5e1" />
          <rect x="7" y="5" width="4" height="4" fill="#94a3b8" />
          <rect x="5" y="7" width="4" height="4" fill="#64748b" />
          <rect x="10" y="2" width="3" height="1" fill="#38bdf8" />
          <rect x="3" y="8" width="5" height="2" fill="#facc15" />
          <rect x="2" y="11" width="3" height="3" fill="#78350f" />
          <rect x="1" y="13" width="2" height="2" fill="#facc15" />
        </>
      )}

      {name === 'auto' && (
        <>
          <rect x="2" y="4" width="3" height="8" fill="#38bdf8" />
          <rect x="5" y="2" width="6" height="2" fill="#38bdf8" />
          <rect x="11" y="4" width="3" height="8" fill="#60a5fa" />
          <rect x="5" y="12" width="6" height="2" fill="#60a5fa" />
          <rect x="6" y="5" width="4" height="6" fill="#e2e8f0" />
          <rect x="7" y="4" width="2" height="8" fill="#93c5fd" />
        </>
      )}

      {name === 'fury' && (
        <>
          <rect x="6" y="1" width="4" height="3" fill="#ef4444" />
          <rect x="4" y="4" width="8" height="4" fill="#f97316" />
          <rect x="2" y="7" width="12" height="6" fill="#dc2626" />
          <rect x="5" y="6" width="6" height="5" fill="#fde047" />
          <rect x="7" y="8" width="2" height="3" fill="#fff7ed" />
        </>
      )}

      {name === 'greed' && (
        <>
          <rect x="4" y="2" width="6" height="4" fill="#facc15" />
          <rect x="5" y="3" width="4" height="2" fill="#fef08a" />
          <rect x="2" y="6" width="6" height="5" fill="#f59e0b" />
          <rect x="7" y="5" width="7" height="5" fill="#facc15" />
          <rect x="4" y="10" width="8" height="4" fill="#d97706" />
          <rect x="5" y="11" width="6" height="2" fill="#fde047" />
        </>
      )}

      {name === 'clover' && (
        <>
          <rect x="4" y="2" width="3" height="4" fill="#22c55e" />
          <rect x="9" y="2" width="3" height="4" fill="#4ade80" />
          <rect x="2" y="5" width="4" height="4" fill="#16a34a" />
          <rect x="10" y="5" width="4" height="4" fill="#22c55e" />
          <rect x="5" y="5" width="6" height="5" fill="#4ade80" />
          <rect x="7" y="10" width="2" height="5" fill="#15803d" />
        </>
      )}

      {name === 'titan' && (
        <>
          <rect x="3" y="2" width="10" height="5" fill="#94a3b8" />
          <rect x="4" y="3" width="8" height="3" fill="#c084fc" />
          <rect x="7" y="7" width="2" height="8" fill="#78350f" />
          <rect x="6" y="13" width="4" height="2" fill="#facc15" />
        </>
      )}

      {name === 'coin' && (
        <>
          <rect x="5" y="1" width="6" height="14" fill="#b45309" />
          <rect x="3" y="3" width="10" height="10" fill="#b45309" />
          <rect x="5" y="2" width="6" height="12" fill="#f59e0b" />
          <rect x="4" y="4" width="8" height="8" fill="#facc15" />
          <rect x="7" y="5" width="2" height="6" fill="#fef08a" />
        </>
      )}

      {name === 'shard' && (
        <>
          <rect x="7" y="1" width="2" height="2" fill="#e0f2fe" />
          <rect x="5" y="3" width="6" height="4" fill="#38bdf8" />
          <rect x="4" y="7" width="8" height="4" fill="#0284c7" />
          <rect x="6" y="4" width="2" height="6" fill="#bae6fd" />
          <rect x="6" y="11" width="4" height="4" fill="#0369a1" />
        </>
      )}

      {name === 'gear' && (
        <>
          <rect x="6" y="1" width="4" height="14" fill="#cbd5e1" />
          <rect x="1" y="6" width="14" height="4" fill="#cbd5e1" />
          <rect x="3" y="3" width="10" height="10" fill="#94a3b8" />
          <rect x="4" y="4" width="8" height="8" fill="#cbd5e1" />
          <rect x="6" y="6" width="4" height="4" fill="#1e293b" />
        </>
      )}

      {name === 'help' && (
        <>
          <rect x="3" y="2" width="10" height="12" fill="#2563eb" />
          <rect x="2" y="4" width="12" height="8" fill="#3b82f6" />
          <rect x="5" y="4" width="6" height="2" fill="#ffffff" />
          <rect x="9" y="6" width="2" height="2" fill="#ffffff" />
          <rect x="7" y="8" width="2" height="2" fill="#ffffff" />
          <rect x="7" y="11" width="2" height="2" fill="#ffffff" />
        </>
      )}

      {name === 'lock' && (
        <>
          <rect x="5" y="2" width="6" height="2" fill="#94a3b8" />
          <rect x="4" y="4" width="2" height="3" fill="#94a3b8" />
          <rect x="10" y="4" width="2" height="3" fill="#94a3b8" />
          <rect x="3" y="7" width="10" height="7" fill="#f59e0b" />
          <rect x="4" y="8" width="8" height="5" fill="#fbbf24" />
          <rect x="7" y="9" width="2" height="3" fill="#451a03" />
        </>
      )}

      {name === 'skull' && (
        <>
          <rect x="4" y="2" width="8" height="7" fill="#e2e8f0" />
          <rect x="3" y="4" width="10" height="4" fill="#cbd5e1" />
          <rect x="5" y="5" width="2" height="2" fill="#0f172a" />
          <rect x="9" y="5" width="2" height="2" fill="#0f172a" />
          <rect x="5" y="9" width="6" height="4" fill="#e2e8f0" />
          <rect x="6" y="11" width="1" height="2" fill="#0f172a" />
          <rect x="9" y="11" width="1" height="2" fill="#0f172a" />
        </>
      )}
    </svg>
  );
};

export const SkillPixelIcon: React.FC<{
  visual: AutoSkillVisual | ClassAttackStyle;
  size?: number;
  className?: string;
}> = ({ visual, size = 24, className = '' }) => {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {visual === 'cleave' && (
        <>
          <rect x="10" y="1" width="4" height="4" fill="#ef4444" />
          <rect x="8" y="3" width="4" height="4" fill="#e2e8f0" />
          <rect x="6" y="5" width="4" height="4" fill="#cbd5e1" />
          <rect x="4" y="7" width="4" height="4" fill="#94a3b8" />
          <rect x="2" y="10" width="4" height="2" fill="#facc15" />
          <rect x="1" y="12" width="3" height="3" fill="#78350f" />
          <rect x="3" y="2" width="5" height="2" fill="#f87171" />
        </>
      )}
      {visual === 'whirlwind' && (
        <>
          <rect x="4" y="2" width="8" height="2" fill="#f87171" />
          <rect x="2" y="4" width="3" height="4" fill="#ef4444" />
          <rect x="11" y="4" width="3" height="4" fill="#ef4444" />
          <rect x="5" y="5" width="6" height="6" fill="#e2e8f0" />
          <rect x="7" y="7" width="2" height="2" fill="#ef4444" />
          <rect x="2" y="8" width="3" height="4" fill="#fca5a5" />
          <rect x="11" y="8" width="3" height="4" fill="#fca5a5" />
          <rect x="4" y="12" width="8" height="2" fill="#f87171" />
        </>
      )}
      {(visual === 'arrow' || visual === 'volley') && (
        <>
          <rect x="10" y="2" width="4" height="4" fill="#86efac" />
          <rect x="11" y="1" width="4" height="2" fill="#e2e8f0" />
          <rect x="13" y="3" width="2" height="3" fill="#e2e8f0" />
          <rect x="7" y="5" width="4" height="4" fill="#a16207" />
          <rect x="4" y="8" width="4" height="4" fill="#92400e" />
          <rect x="1" y="11" width="4" height="4" fill="#4ade80" />
          {visual === 'volley' && (
            <>
              <rect x="2" y="2" width="4" height="2" fill="#4ade80" />
              <rect x="10" y="10" width="4" height="2" fill="#86efac" />
            </>
          )}
        </>
      )}
      {(visual === 'holy_beam' || visual === 'holy') && (
        <>
          <rect x="6" y="1" width="4" height="14" fill="#fef08a" />
          <rect x="7" y="1" width="2" height="14" fill="#ffffff" />
          <rect x="2" y="5" width="12" height="2" fill="#facc15" />
          <rect x="4" y="11" width="8" height="3" fill="#fde047" />
        </>
      )}
      {visual === 'shadow_aoe' && (
        <>
          <rect x="5" y="2" width="6" height="2" fill="#c084fc" />
          <rect x="3" y="4" width="10" height="8" fill="#7e22ce" />
          <rect x="5" y="5" width="6" height="6" fill="#e879f9" />
          <rect x="6" y="6" width="4" height="4" fill="#1e1b4b" />
          <rect x="5" y="12" width="6" height="2" fill="#c084fc" />
        </>
      )}
      {(visual === 'frost_orb' || visual === 'frost') && (
        <>
          <rect x="5" y="1" width="6" height="2" fill="#bae6fd" />
          <rect x="3" y="3" width="10" height="10" fill="#0284c7" />
          <rect x="4" y="4" width="8" height="8" fill="#38bdf8" />
          <rect x="6" y="5" width="4" height="4" fill="#e0f2fe" />
          <rect x="1" y="7" width="2" height="2" fill="#7dd3fc" />
          <rect x="13" y="7" width="2" height="2" fill="#7dd3fc" />
        </>
      )}
      {visual === 'arcane_barrage' && (
        <>
          <rect x="2" y="2" width="4" height="4" fill="#818cf8" />
          <rect x="10" y="2" width="4" height="4" fill="#c084fc" />
          <rect x="6" y="6" width="4" height="4" fill="#e0e7ff" />
          <rect x="2" y="10" width="4" height="4" fill="#a855f7" />
          <rect x="10" y="10" width="4" height="4" fill="#6366f1" />
        </>
      )}
      {(visual === 'dual_slash' || visual === 'dual') && (
        <>
          <rect x="2" y="2" width="3" height="3" fill="#4ade80" />
          <rect x="4" y="4" width="3" height="3" fill="#e2e8f0" />
          <rect x="11" y="2" width="3" height="3" fill="#fb7185" />
          <rect x="9" y="4" width="3" height="3" fill="#e2e8f0" />
          <rect x="6" y="6" width="4" height="4" fill="#facc15" />
          <rect x="4" y="9" width="3" height="3" fill="#cbd5e1" />
          <rect x="9" y="9" width="3" height="3" fill="#cbd5e1" />
          <rect x="2" y="11" width="3" height="3" fill="#78350f" />
          <rect x="11" y="11" width="3" height="3" fill="#78350f" />
        </>
      )}
      {visual === 'fan_knives' && (
        <>
          <rect x="7" y="1" width="2" height="6" fill="#e2e8f0" />
          <rect x="2" y="3" width="3" height="5" fill="#fda4af" />
          <rect x="11" y="3" width="3" height="5" fill="#fda4af" />
          <rect x="5" y="7" width="6" height="3" fill="#facc15" />
          <rect x="7" y="10" width="2" height="5" fill="#78350f" />
        </>
      )}
      {visual === 'lightning' && (
        <>
          <rect x="8" y="1" width="4" height="3" fill="#7dd3fc" />
          <rect x="6" y="4" width="4" height="3" fill="#38bdf8" />
          <rect x="4" y="7" width="7" height="2" fill="#e0f2fe" />
          <rect x="7" y="9" width="4" height="3" fill="#38bdf8" />
          <rect x="5" y="12" width="3" height="3" fill="#0284c7" />
        </>
      )}
      {visual === 'lava' && (
        <>
          <rect x="6" y="1" width="4" height="3" fill="#fde047" />
          <rect x="4" y="4" width="8" height="4" fill="#f97316" />
          <rect x="2" y="7" width="12" height="6" fill="#dc2626" />
          <rect x="5" y="8" width="6" height="4" fill="#facc15" />
        </>
      )}
      {(visual === 'hammer_wave' || visual === 'hammer') && (
        <>
          <rect x="3" y="2" width="10" height="5" fill="#facc15" />
          <rect x="4" y="3" width="8" height="3" fill="#fef08a" />
          <rect x="7" y="7" width="2" height="7" fill="#92400e" />
          <rect x="6" y="13" width="4" height="2" fill="#f59e0b" />
        </>
      )}
      {visual === 'consecrate' && (
        <>
          <rect x="6" y="1" width="4" height="3" fill="#fef08a" />
          <rect x="3" y="4" width="10" height="3" fill="#facc15" />
          <rect x="2" y="10" width="12" height="3" fill="#f59e0b" />
          <rect x="4" y="11" width="8" height="2" fill="#fef08a" />
          <rect x="7" y="5" width="2" height="7" fill="#ffffff" />
        </>
      )}
      {visual === 'moonfire' && (
        <>
          <rect x="6" y="1" width="4" height="10" fill="#a5b4fc" />
          <rect x="7" y="2" width="2" height="9" fill="#e0e7ff" />
          <rect x="3" y="10" width="10" height="4" fill="#6366f1" />
          <rect x="5" y="11" width="6" height="2" fill="#c7d2fe" />
        </>
      )}
      {visual === 'starfall' && (
        <>
          <rect x="2" y="2" width="3" height="3" fill="#4ade80" />
          <rect x="10" y="1" width="4" height="4" fill="#fde047" />
          <rect x="6" y="6" width="4" height="4" fill="#86efac" />
          <rect x="3" y="11" width="4" height="4" fill="#22c55e" />
          <rect x="11" y="10" width="3" height="3" fill="#a5b4fc" />
        </>
      )}
      {visual === 'fel_bolt' && (
        <>
          <rect x="5" y="2" width="6" height="2" fill="#bbf7d0" />
          <rect x="3" y="4" width="10" height="8" fill="#16a34a" />
          <rect x="5" y="5" width="6" height="6" fill="#4ade80" />
          <rect x="6" y="6" width="4" height="4" fill="#dcfce7" />
          <rect x="4" y="12" width="8" height="2" fill="#9333ea" />
        </>
      )}
      {visual === 'rain_of_fire' && (
        <>
          <rect x="2" y="2" width="3" height="5" fill="#4ade80" />
          <rect x="7" y="1" width="3" height="6" fill="#c084fc" />
          <rect x="11" y="3" width="3" height="5" fill="#4ade80" />
          <rect x="4" y="9" width="4" height="5" fill="#a855f7" />
          <rect x="9" y="9" width="4" height="5" fill="#22c55e" />
        </>
      )}
    </svg>
  );
};
