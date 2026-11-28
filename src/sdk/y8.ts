import { soundEngine } from '../audio/synth';
import {
  LeaderboardEntry,
  LeaderboardFetchResult,
  PortalAdapter,
  PortalPlayerInfo,
  RewardedAdCallbacks,
  ScoreRunMeta,
  buildLocalLeaderboardEntries,
  safeStorageGet,
  safeStorageSet,
} from './types';

interface Y8User {
  pid?: string;
  nickname?: string;
  avatar_url?: string;
}

interface Y8LeaderboardRow {
  playerid?: string;
  playername?: string;
  points?: number;
  rank?: number;
}

interface Y8SdkInstance {
  init: (config: {
    appId: string;
    autoLogin?: boolean;
    adConfig?: { preloadAdBreaks?: 'on' | 'off'; sound?: 'on' | 'off' };
  }) => Promise<void>;
  onAuth?: (cb: (user: Y8User | null, err: unknown) => void) => void;
  login?: (lang?: string) => Promise<void>;
  getUser?: () => Y8User | null;
  getToken?: () => { access_token?: string } | null;
  saveData?: (opts: { key: string; value: string; retries?: boolean }) => Promise<void>;
  loadData?: (opts: { key: string }) => Promise<string | null>;
  saveLeaderboardScore?: (opts: {
    table: string;
    points: number;
    allowDuplicates?: boolean;
    highest?: boolean;
    playerName?: string | null;
  }) => Promise<void>;
  getLeaderboardScores?: (opts: {
    table: string;
    page?: number;
    perPage?: number;
    mode?: string;
    highest?: boolean;
  }) => Promise<unknown>;
  showLeaderboard?: (opts?: {
    table?: string | null;
    mode?: string;
    highest?: boolean;
  }) => Promise<void>;
  showAd?: (opts: {
    type?: 'start' | 'pause' | 'next' | 'browse' | 'reward';
    name?: string;
    beforeAd?: (() => void) | null;
    afterAd?: (() => void) | null;
    beforeReward?: ((showAdFn: () => void) => void) | null;
    adDismissed?: (() => void) | null;
    adViewed?: (() => void) | null;
    adBreakDone?: ((info?: { breakStatus?: string }) => void) | null;
  }) => Promise<unknown>;
}

declare global {
  interface Window {
    y8?: {
      sdk: () => Y8SdkInstance;
    };
  }
}

export class Y8Adapter implements PortalAdapter {
  public readonly portalId = 'y8' as const;

  private readonly appId: string;
  private readonly table: string;
  private sdkReady = false;
  private initPromise: Promise<void> | null = null;
  private currentPlayer: PortalPlayerInfo | null = null;
  private playerListeners = new Set<(p: PortalPlayerInfo | null) => void>();
  private adRequestInFlight = false;
  private lastSubmittedScore = 0;
  private lastSubmitAt = 0;

  constructor() {
    const env = import.meta.env as Record<string, string | undefined>;
    this.appId = (env.VITE_Y8_APP_ID || '').trim();
    this.table = (env.VITE_Y8_LEADERBOARD_TABLE || 'Leaderboard').trim() || 'Leaderboard';
  }

  private async waitForY8Global(): Promise<Y8SdkInstance | null> {
    if (window.y8 && typeof window.y8.sdk === 'function') {
      return window.y8.sdk();
    }
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        window.removeEventListener('y8sdk.ready', finish);
        resolve(window.y8 && typeof window.y8.sdk === 'function' ? window.y8.sdk() : null);
      };
      window.addEventListener('y8sdk.ready', finish);
      setTimeout(finish, 1800);
    });
  }

  public async init(): Promise<void> {
    if (this.sdkReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const sdk = await this.waitForY8Global();
      if (!sdk || !this.appId) return;

      try {
        sdk.onAuth?.((user) => {
          this.updateUser(user);
        });
        await Promise.race([
          sdk.init({
            appId: this.appId,
            autoLogin: true,
            adConfig: { preloadAdBreaks: 'on' },
          }),
          new Promise<void>((resolve) => setTimeout(resolve, 2500)),
        ]);
        this.sdkReady = true;
        this.updateUser(sdk.getUser?.() ?? null);
      } catch {
        this.sdkReady = false;
      }
    })();

    return this.initPromise;
  }

  private updateUser(user: Y8User | null): void {
    const mapped: PortalPlayerInfo | null = user?.nickname
      ? {
          name: user.nickname,
          avatarUrl: user.avatar_url || null,
          loggedIn: true,
        }
      : null;
    this.currentPlayer = mapped;
    this.playerListeners.forEach((cb) => cb(mapped));
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

  public async signIn(): Promise<void> {
    if (!this.sdkReady || !window.y8) return;
    try {
      await window.y8.sdk().login?.();
    } catch {
      // ignore cancelled login
    }
  }

  public gameplayStart(): void {
    // Y8 minimal SDK does not require gameplayStart brackets
  }

  public gameplayStop(): void {
    // Y8 minimal SDK does not require gameplayStop brackets
  }

  public happytime(): void {
    // Y8 minimal SDK has no happytime hook
  }

  public async saveCloudData(key: string, jsonValue: string): Promise<void> {
    safeStorageSet(key, jsonValue);
    if (!this.sdkReady || !window.y8) return;
    const sdk = window.y8.sdk();
    if (!sdk.getToken?.()?.access_token) return;
    try {
      await sdk.saveData?.({ key, value: jsonValue, retries: true });
    } catch {
      // fallback already saved in localStorage
    }
  }

  public async loadCloudData(key: string): Promise<string | null> {
    if (this.sdkReady && window.y8) {
      const sdk = window.y8.sdk();
      if (sdk.getToken?.()?.access_token && sdk.loadData) {
        try {
          const val = await sdk.loadData({ key });
          if (val) return val;
        } catch {
          // fallback below
        }
      }
    }
    return safeStorageGet(key);
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

    if (!this.sdkReady || !window.y8) {
      onFallbackModal();
      return;
    }

    const sdk = window.y8.sdk();
    if (typeof sdk.showAd !== 'function') {
      onFallbackModal();
      return;
    }

    this.adRequestInFlight = true;
    onStart?.();
    soundEngine.setAdPaused(true);

    let settled = false;
    let viewed = false;
    const finish = (granted: boolean, errorReason?: string) => {
      if (settled) return;
      settled = true;
      this.adRequestInFlight = false;
      soundEngine.setAdPaused(false);
      if (granted) {
        onReward();
      } else if (errorReason) {
        onError?.(errorReason);
      }
      onDone?.();
    };

    try {
      void sdk
        .showAd({
          type: 'reward',
          name: 'dungeon-reward',
          beforeAd: () => {
            soundEngine.setAdPaused(true);
          },
          beforeReward: (showAdFn) => {
            try {
              showAdFn();
            } catch {
              finish(false, 'unavailable');
            }
          },
          adViewed: () => {
            viewed = true;
            finish(true);
          },
          adDismissed: () => {
            finish(false);
          },
          afterAd: () => {
            soundEngine.setAdPaused(false);
          },
          adBreakDone: (info) => {
            if (settled) return;
            if (viewed || info?.breakStatus === 'viewed') {
              finish(true);
            } else if (info?.breakStatus === 'dismissed') {
              finish(false);
            } else {
              onDone?.();
              settled = true;
              this.adRequestInFlight = false;
              soundEngine.setAdPaused(false);
              onFallbackModal();
            }
          },
        })
        .catch(() => {
          if (!settled) {
            settled = true;
            this.adRequestInFlight = false;
            soundEngine.setAdPaused(false);
            onDone?.();
            onFallbackModal();
          }
        });
    } catch {
      this.adRequestInFlight = false;
      soundEngine.setAdPaused(false);
      onFallbackModal();
    }
  }

  public async submitScore(score: number): Promise<void> {
    if (!this.sdkReady || !window.y8) return;
    const sdk = window.y8.sdk();
    if (!sdk.getToken?.()?.access_token || typeof sdk.saveLeaderboardScore !== 'function') return;

    const cleanScore = Math.max(0, Math.trunc(score));
    const now = Date.now();
    if (cleanScore <= 0) return;
    if (cleanScore <= this.lastSubmittedScore && now - this.lastSubmitAt < 15000) return;
    if (now - this.lastSubmitAt < 5000) return;

    this.lastSubmitAt = now;
    try {
      await sdk.saveLeaderboardScore({
        table: this.table,
        points: cleanScore,
        allowDuplicates: false,
        highest: true,
        playerName: this.currentPlayer?.name ?? null,
      });
      this.lastSubmittedScore = Math.max(this.lastSubmittedScore, cleanScore);
    } catch {
      // ignore transient network errors
    }
  }

  public async fetchLeaderboard(
    currentScore: number,
    meta: ScoreRunMeta
  ): Promise<LeaderboardFetchResult> {
    const runMeta = this.currentPlayer?.name
      ? { ...meta, playerName: this.currentPlayer.name }
      : meta;
    const localEntries = buildLocalLeaderboardEntries('active_run', currentScore, runMeta);

    if (!this.sdkReady || !this.appId || !window.y8) {
      return {
        portal: 'y8',
        entries: localEntries,
        syncStatus: this.appId ? 'guest' : 'unconfigured',
        canOpenPortalModal: Boolean(this.appId && window.y8),
        canSignIn: Boolean(this.appId && window.y8),
      };
    }

    const sdk = window.y8.sdk();
    const myPid = sdk.getUser?.()?.pid;

    try {
      const raw = await sdk.getLeaderboardScores?.({
        table: this.table,
        page: 1,
        perPage: 15,
        mode: 'alltime',
        highest: true,
      });

      const list: Y8LeaderboardRow[] = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { scores?: unknown[] } | null)?.scores)
        ? ((raw as { scores: Y8LeaderboardRow[] }).scores ?? [])
        : [];

      if (list.length > 0) {
        const mapped: LeaderboardEntry[] = list.map((row, idx) => ({
          rank: typeof row.rank === 'number' ? row.rank : idx + 1,
          name: (row.playername || 'Adventurer').trim(),
          score: Math.trunc(Number(row.points) || 0),
          isCurrentPlayer: Boolean(myPid && row.playerid === myPid),
          source: 'portal',
        }));

        return {
          portal: 'y8',
          entries: mapped,
          syncStatus: this.currentPlayer?.loggedIn ? 'synced' : 'guest',
          canOpenPortalModal: true,
          canSignIn: !this.currentPlayer?.loggedIn,
          lastSubmittedScore: this.lastSubmittedScore,
        };
      }
    } catch {
      // Fall back cleanly to local entries
    }

    return {
      portal: 'y8',
      entries: localEntries,
      syncStatus: this.currentPlayer?.loggedIn ? 'synced' : 'guest',
      canOpenPortalModal: true,
      canSignIn: !this.currentPlayer?.loggedIn,
      lastSubmittedScore: this.lastSubmittedScore,
    };
  }

  public async openPortalLeaderboard(): Promise<void> {
    if (!this.sdkReady || !window.y8) return;
    try {
      await window.y8.sdk().showLeaderboard?.({
        table: this.table,
        mode: 'alltime',
        highest: true,
      });
    } catch {
      // ignore if popup blocked
    }
  }
}
