import { soundEngine } from '../audio/synth';
import {
  LeaderboardFetchResult,
  PortalAdapter,
  PortalPlayerInfo,
  RewardedAdCallbacks,
  ScoreRunMeta,
  buildLocalLeaderboardEntries,
  safeStorageGet,
  safeStorageSet,
} from './types';

interface BBArcadePlayer {
  name: string;
  avatarUrl: string | null;
}

type BBArcadeAdStatus =
  | 'viewed'
  | 'dismissed'
  | 'unavailable'
  | 'unsupported'
  | 'error'
  | 'timeout';

interface BBArcadeRewardedAdResult {
  status: BBArcadeAdStatus;
  placement?: string;
  reward?: string;
  error?: unknown;
}

interface BBArcadePreparedRewardedAd {
  status: 'ready';
  placement: string;
  reward: string;
  adBreakId: string;
  show: () => Promise<BBArcadeRewardedAdResult>;
}

interface BBArcadePrepareFailure {
  status: Exclude<BBArcadeAdStatus, 'ready' | 'viewed'>;
}

type BBArcadePreparation = BBArcadePreparedRewardedAd | BBArcadePrepareFailure;

interface BBArcadeSDK {
  init: (options?: {
    rewardedAds?: {
      enabled?: boolean;
      testMode?: boolean;
      preload?: boolean;
      loadTimeoutMs?: number;
    };
  }) => Promise<void>;
  ready?: () => void;
  gameLoadingFinished?: () => void;
  gameplayStart?: () => void;
  gameplayStop?: () => void;
  submitScore?: (score: number, opts?: { mode?: 'daily' }) => void;
  gameOver?: (score: number, opts?: { mode?: 'daily' }) => void;
  rewardedAd?: (options?: {
    placement?: string;
    reward?: string;
    loadTimeoutMs?: number;
    beforeReward?: (showAd: () => void) => void;
    adViewed?: (res: BBArcadeRewardedAdResult) => void;
    adDismissed?: (res: BBArcadeRewardedAdResult) => void;
    onDone?: (res: BBArcadeRewardedAdResult) => void;
    onError?: (res: BBArcadeRewardedAdResult) => void;
    onUnavailable?: (res: BBArcadeRewardedAdResult) => void;
  }) => Promise<BBArcadeRewardedAdResult>;
  prepareRewardedAd?: (options?: {
    placement?: string;
    reward?: string;
    loadTimeoutMs?: number;
    onStart?: () => void;
  }) => Promise<BBArcadePreparation>;
  preloadRewardedAds?: (options?: { preload?: boolean }) => Promise<boolean>;
  save?: (blob: string) => Promise<void>;
  load?: () => Promise<string | null>;
  storage?: {
    install: () => 'native' | 'cloud' | 'memory';
    ready: () => Promise<'native' | 'cloud' | 'memory'>;
    flush?: () => Promise<void>;
    mode?: 'native' | 'cloud' | 'memory';
  };
  getPlayer?: () => Promise<BBArcadePlayer | null>;
  onPlayerChange?: (handler: (player: BBArcadePlayer | null) => void) => () => void;
}

declare global {
  interface Window {
    BBArcade?: BBArcadeSDK;
  }
}

export class BountyBoardAdapter implements PortalAdapter {
  public readonly portalId = 'bountyboard' as const;

  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private currentPlayer: PortalPlayerInfo | null = null;
  private playerListeners = new Set<(p: PortalPlayerInfo | null) => void>();
  private preparedAd: BBArcadePreparedRewardedAd | null = null;
  private preparingAd = false;
  private adRequestInFlight = false;
  private lastCloudSaveAt = 0;
  private lastSubmittedScore = 0;
  private lastScoreSentAt = 0;
  private unsubPlayerChange: (() => void) | null = null;

  public async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const sdk = window.BBArcade;
      if (!sdk) {
        this.initialized = true;
        return;
      }

      try {
        sdk.storage?.install();
      } catch {
        // ignore if already installed
      }

      // Never gate game boot on host handshake; race at 2s max
      await Promise.race([
        Promise.all([
          typeof sdk.init === 'function'
            ? sdk
                .init({
                  rewardedAds: {
                    enabled: true,
                    preload: true,
                    loadTimeoutMs: 8000,
                  },
                })
                .catch(() => {})
            : Promise.resolve(),
          sdk.storage?.ready ? sdk.storage.ready().catch(() => 'native') : Promise.resolve('native'),
        ]),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);

      try {
        if (typeof sdk.gameLoadingFinished === 'function') sdk.gameLoadingFinished();
        else if (typeof sdk.ready === 'function') sdk.ready();
      } catch {
        // ignore
      }

      await this.refreshPlayer();

      if (typeof sdk.onPlayerChange === 'function' && !this.unsubPlayerChange) {
        this.unsubPlayerChange = sdk.onPlayerChange((player) => {
          this.setPlayer(player);
        });
      }

      this.initialized = true;
      void this.prepareNextAd();
    })();

    return this.initPromise;
  }

  private setPlayer(player: BBArcadePlayer | null): void {
    const mapped: PortalPlayerInfo | null = player
      ? { name: player.name, avatarUrl: player.avatarUrl, loggedIn: true }
      : null;
    this.currentPlayer = mapped;
    this.playerListeners.forEach((cb) => cb(mapped));
  }

  private async refreshPlayer(): Promise<PortalPlayerInfo | null> {
    const sdk = window.BBArcade;
    if (!sdk || typeof sdk.getPlayer !== 'function') return null;
    try {
      const player = await Promise.race([
        sdk.getPlayer(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      this.setPlayer(player);
      return this.currentPlayer;
    } catch {
      return null;
    }
  }

  public getPlayer(): PortalPlayerInfo | null {
    return this.currentPlayer;
  }

  public onPlayerChange(cb: (player: PortalPlayerInfo | null) => void): () => void {
    this.playerListeners.add(cb);
    return () => {
      this.playerListeners.delete(cb);
    };
  }

  public gameplayStart(): void {
    try {
      window.BBArcade?.gameplayStart?.();
    } catch {
      // ignore
    }
  }

  public gameplayStop(): void {
    try {
      window.BBArcade?.gameplayStop?.();
    } catch {
      // ignore
    }
  }

  public happytime(): void {
    // BountyBoard does not use happytime
  }

  public async saveCloudData(key: string, jsonValue: string): Promise<void> {
    safeStorageSet(key, jsonValue);
    const sdk = window.BBArcade;
    if (!sdk || typeof sdk.save !== 'function') return;
    if (!this.currentPlayer?.loggedIn) return;

    const now = Date.now();
    if (now - this.lastCloudSaveAt < 3500) return;
    this.lastCloudSaveAt = now;

    try {
      await sdk.save(jsonValue);
    } catch {
      // Unsupported outside Bounty hosted upload or rate-limited; local/shim already stored
    }
  }

  public async loadCloudData(key: string): Promise<string | null> {
    const sdk = window.BBArcade;
    if (sdk) {
      try {
        if (sdk.storage?.ready) {
          await Promise.race([
            sdk.storage.ready(),
            new Promise<void>((resolve) => setTimeout(resolve, 1500)),
          ]);
        }
        const player = this.currentPlayer?.loggedIn ? this.currentPlayer : await this.refreshPlayer();
        if (player?.loggedIn && typeof sdk.load === 'function') {
          const cloudBlob = await sdk.load();
          if (cloudBlob) return cloudBlob;
        }
      } catch {
        // Fallback to shim/localStorage below
      }
    }
    return safeStorageGet(key);
  }

  private async prepareNextAd(): Promise<void> {
    const sdk = window.BBArcade;
    if (!sdk || typeof sdk.prepareRewardedAd !== 'function') return;
    if (this.preparingAd || this.preparedAd) return;

    this.preparingAd = true;
    try {
      if (typeof sdk.preloadRewardedAds === 'function') {
        await sdk.preloadRewardedAds({ preload: true }).catch(() => false);
      }
      const res = await sdk.prepareRewardedAd({
        placement: 'dungeon_reward',
        reward: 'dungeon_boost',
        loadTimeoutMs: 8000,
      });
      if (res && res.status === 'ready' && typeof res.show === 'function') {
        this.preparedAd = res;
      }
    } catch {
      // Ignore prepare failure; retry lazily on next interaction
    } finally {
      this.preparingAd = false;
    }
  }

  public requestRewardedAd(
    onReward: () => void,
    onFallbackModal: () => void,
    doneOrOptions?: (() => void) | RewardedAdCallbacks
  ): void {
    if (this.adRequestInFlight) return;

    const callbacks: RewardedAdCallbacks =
      typeof doneOrOptions === 'function' ? { onDone: doneOrOptions } : doneOrOptions ?? {};
    const { onStart, onError, onDone } = callbacks;

    const sdk = window.BBArcade;
    if (!sdk) {
      onFallbackModal();
      return;
    }

    // 1. Preferred path: synchronously call ready.show() inside player's click/tap gesture!
    const prepared = this.preparedAd;
    if (prepared && prepared.status === 'ready') {
      this.preparedAd = null;
      this.adRequestInFlight = true;
      onStart?.();
      this.gameplayStop();
      soundEngine.setAdPaused(true);

      let showPromise: Promise<BBArcadeRewardedAdResult>;
      try {
        showPromise = prepared.show();
      } catch {
        this.adRequestInFlight = false;
        soundEngine.setAdPaused(false);
        this.gameplayStart();
        onError?.('error');
        onDone?.();
        void this.prepareNextAd();
        return;
      }

      showPromise
        .then((result) => {
          this.adRequestInFlight = false;
          soundEngine.setAdPaused(false);
          this.gameplayStart();
          if (result?.status === 'viewed') {
            onReward();
          } else if (result?.status === 'unsupported') {
            onDone?.();
            onFallbackModal();
            return;
          } else if (result?.status !== 'dismissed') {
            onError?.(result?.status || 'unavailable');
          }
          onDone?.();
          void this.prepareNextAd();
        })
        .catch(() => {
          this.adRequestInFlight = false;
          soundEngine.setAdPaused(false);
          this.gameplayStart();
          onError?.('error');
          onDone?.();
          void this.prepareNextAd();
        });
      return;
    }

    // 2. Fallback if user clicked before prepareRewardedAd completed: try low-level rewardedAd()
    if (typeof sdk.rewardedAd === 'function') {
      this.adRequestInFlight = true;
      onStart?.();
      this.gameplayStop();
      soundEngine.setAdPaused(true);

      let settled = false;
      const finish = (status: BBArcadeAdStatus) => {
        if (settled) return;
        settled = true;
        this.adRequestInFlight = false;
        soundEngine.setAdPaused(false);
        this.gameplayStart();
        if (status === 'viewed') {
          onReward();
        } else if (status === 'unsupported') {
          onDone?.();
          onFallbackModal();
          void this.prepareNextAd();
          return;
        } else if (status !== 'dismissed') {
          onError?.(status || 'unavailable');
        }
        onDone?.();
        void this.prepareNextAd();
      };

      try {
        sdk
          .rewardedAd({
            placement: 'dungeon_reward',
            reward: 'dungeon_boost',
            loadTimeoutMs: 6000,
            beforeReward: (showAd) => {
              try {
                showAd();
              } catch {
                // ignore if activation expired
              }
            },
            adViewed: () => finish('viewed'),
            adDismissed: () => finish('dismissed'),
            onUnavailable: (res) => finish(res?.status || 'unavailable'),
            onError: (res) => finish(res?.status || 'error'),
          })
          .then((res) => finish(res?.status || 'unavailable'))
          .catch(() => finish('error'));
      } catch {
        finish('error');
      }
      return;
    }

    onFallbackModal();
  }

  public async submitScore(score: number, _meta: ScoreRunMeta, isRunEnd = false): Promise<void> {
    const sdk = window.BBArcade;
    if (!sdk) return;
    const cleanScore = Math.max(0, Math.trunc(score));
    const now = Date.now();

    if (cleanScore > 0 && (cleanScore > this.lastSubmittedScore || now - this.lastScoreSentAt >= 5000)) {
      if (now - this.lastScoreSentAt >= 2000 || isRunEnd) {
        try {
          sdk.submitScore?.(cleanScore);
          this.lastSubmittedScore = Math.max(this.lastSubmittedScore, cleanScore);
          this.lastScoreSentAt = now;
        } catch {
          // ignore
        }
      }
    }

    if (isRunEnd && cleanScore > 0) {
      try {
        sdk.gameOver?.(cleanScore);
      } catch {
        // ignore
      }
    }
  }

  public async fetchLeaderboard(
    currentScore: number,
    meta: ScoreRunMeta
  ): Promise<LeaderboardFetchResult> {
    const player = await this.refreshPlayer();
    const runMeta = player?.name ? { ...meta, playerName: player.name } : meta;
    const entries = buildLocalLeaderboardEntries('active_run', currentScore, runMeta);

    return {
      portal: 'bountyboard',
      entries,
      syncStatus: player?.loggedIn ? 'portal_ui' : 'guest',
      lastSubmittedScore: Math.max(this.lastSubmittedScore, Math.trunc(currentScore)),
    };
  }
}
