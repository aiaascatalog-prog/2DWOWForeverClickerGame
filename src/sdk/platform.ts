import { BountyBoardAdapter } from './bountyboard';
import { CrazyGamesAdapter } from './crazygames';
import {
  LeaderboardFetchResult,
  PortalAdapter,
  PortalId,
  PortalPlayerInfo,
  RewardedAdCallbacks,
  ScoreRunMeta,
  buildLocalLeaderboardEntries,
  safeStorageGet,
  safeStorageSet,
} from './types';
import { Y8Adapter } from './y8';

class GenericPortalAdapter implements PortalAdapter {
  public readonly portalId = 'generic' as const;

  public async init(): Promise<void> {}
  public gameplayStart(): void {}
  public gameplayStop(): void {}
  public happytime(): void {}

  public async saveCloudData(key: string, jsonValue: string): Promise<void> {
    safeStorageSet(key, jsonValue);
  }

  public async loadCloudData(key: string): Promise<string | null> {
    return safeStorageGet(key);
  }

  public requestRewardedAd(
    _onReward: () => void,
    onFallbackModal: () => void,
    _doneOrOptions?: (() => void) | RewardedAdCallbacks
  ): void {
    onFallbackModal();
  }

  public getPlayer(): PortalPlayerInfo | null {
    return null;
  }

  public async submitScore(_score: number, _meta: ScoreRunMeta): Promise<void> {}

  public async fetchLeaderboard(
    currentScore: number,
    meta: ScoreRunMeta
  ): Promise<LeaderboardFetchResult> {
    return {
      portal: 'generic',
      entries: buildLocalLeaderboardEntries('active_run', currentScore, meta),
      syncStatus: 'local_only',
    };
  }
}

function resolvePortalAdapter(): PortalAdapter {
  const env = import.meta.env as Record<string, string | undefined>;
  const configuredPortal = (env.VITE_PORTAL || '').trim().toLowerCase() as PortalId | '';

  if (configuredPortal === 'crazygames') {
    return new CrazyGamesAdapter();
  }
  if (configuredPortal === 'bountyboard') {
    return new BountyBoardAdapter();
  }
  if (configuredPortal === 'y8') {
    return new Y8Adapter();
  }

  if (typeof window !== 'undefined') {
    if (window.BBArcade) return new BountyBoardAdapter();
    if (window.CrazyGames?.SDK) return new CrazyGamesAdapter();
    if (window.y8) return new Y8Adapter();
  }

  return new GenericPortalAdapter();
}

export const platformSDK: PortalAdapter = resolvePortalAdapter();
