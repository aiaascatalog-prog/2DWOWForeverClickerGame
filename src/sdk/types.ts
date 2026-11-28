export type PortalId = 'crazygames' | 'bountyboard' | 'y8' | 'generic';

export interface RewardedAdCallbacks {
  onStart?: () => void;
  onError?: (reason: string) => void;
  onDone?: () => void;
}

export interface PortalPlayerInfo {
  name: string;
  avatarUrl?: string | null;
  loggedIn: boolean;
}

export interface ScoreRunMeta {
  floor: number;
  bossesSlain: number;
  raresSlain: number;
  ascensions: number;
  heroId: string;
  raceId: string;
  playerName?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  floor?: number;
  hero?: string;
  race?: string;
  isCurrentPlayer?: boolean;
  source: 'portal' | 'local';
}

export type LeaderboardSyncStatus =
  | 'synced'
  | 'guest'
  | 'portal_ui'
  | 'unconfigured'
  | 'local_only';

export interface LeaderboardFetchResult {
  portal: PortalId;
  entries: LeaderboardEntry[];
  syncStatus: LeaderboardSyncStatus;
  canOpenPortalModal?: boolean;
  canSignIn?: boolean;
  lastSubmittedScore?: number;
}

export interface PortalAdapter {
  readonly portalId: PortalId;
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  happytime(): void;
  saveCloudData(key: string, jsonValue: string): Promise<void>;
  loadCloudData(key: string): Promise<string | null>;
  requestRewardedAd(
    onReward: () => void,
    onFallbackModal: () => void,
    doneOrOptions?: (() => void) | RewardedAdCallbacks
  ): void;
  getPlayer(): PortalPlayerInfo | null;
  onPlayerChange?(cb: (player: PortalPlayerInfo | null) => void): () => void;
  signIn?(): Promise<void>;
  submitScore(score: number, meta: ScoreRunMeta, isRunEnd?: boolean): Promise<void>;
  fetchLeaderboard(currentScore: number, meta: ScoreRunMeta): Promise<LeaderboardFetchResult>;
  openPortalLeaderboard?(): Promise<void>;
}

const LOCAL_HALL_KEY = 'wod_forever_hall_of_fame_v1';

export interface LocalHallRecord {
  id: string;
  name: string;
  score: number;
  floor: number;
  hero: string;
  race: string;
  ascensions: number;
  updatedAt: number;
}

export function safeStorageGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Opaque origins (or full quota) may reject native localStorage
  }
}

export function readLocalHallOfFame(): LocalHallRecord[] {
  const raw = safeStorageGet(LOCAL_HALL_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is LocalHallRecord =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.score === 'number' &&
          typeof item.floor === 'number'
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function recordLocalHallRun(
  runId: string,
  score: number,
  meta: ScoreRunMeta
): LocalHallRecord[] {
  const cleanScore = Math.max(0, Math.trunc(score));
  const list = readLocalHallOfFame();
  const displayName = (meta.playerName || '').trim() || 'You (Current Run)';
  const idx = list.findIndex((r) => r.id === runId);
  const nextRecord: LocalHallRecord = {
    id: runId,
    name: displayName,
    score: cleanScore,
    floor: meta.floor,
    hero: meta.heroId,
    race: meta.raceId,
    ascensions: meta.ascensions,
    updatedAt: Date.now(),
  };

  if (idx >= 0) {
    if (cleanScore >= list[idx].score) {
      list[idx] = nextRecord;
    } else {
      list[idx] = { ...list[idx], name: displayName };
    }
  } else if (cleanScore > 0) {
    list.push(nextRecord);
  }

  const sorted = list.sort((a, b) => b.score - a.score).slice(0, 12);
  safeStorageSet(LOCAL_HALL_KEY, JSON.stringify(sorted));
  return sorted;
}

export function buildLocalLeaderboardEntries(
  currentRunId: string,
  currentScore: number,
  meta: ScoreRunMeta
): LeaderboardEntry[] {
  const records = recordLocalHallRun(currentRunId, currentScore, meta);
  return records.map((rec, i) => ({
    rank: i + 1,
    name: rec.name,
    score: rec.score,
    floor: rec.floor,
    hero: rec.hero,
    race: rec.race,
    isCurrentPlayer: rec.id === currentRunId,
    source: 'local',
  }));
}
