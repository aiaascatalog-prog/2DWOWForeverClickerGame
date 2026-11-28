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

interface CrazyGamesCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown, errorData?: unknown) => void;
}

interface CrazyGamesSDKv3 {
  environment?: 'crazygames' | 'local' | 'disabled';
  init: () => Promise<void>;
  game?: {
    gameplayStart: () => void;
    gameplayStop: () => void;
    happytime: () => void;
  };
  ad?: {
    requestAd: (type: 'midgame' | 'rewarded', callbacks: CrazyGamesCallbacks) => void;
  };
  data?: {
    getItem: (key: string) => Promise<string | null> | string | null;
    setItem: (key: string, value: string) => Promise<void> | void;
  };
  user?: {
    systemInfo?: {
      countryCode?: string;
    };
    getUser?: () => Promise<{ username?: string; profilePictureUrl?: string } | null>;
    submitScore?: (payload: { encryptedScore: string; score: number }) => Promise<void> | void;
  };
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSDKv3;
    };
  }
}

async function encryptCrazyGamesScore(score: number, encryptionKeyBase64: string): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const algorithm: AesGcmParams = { name: 'AES-GCM', iv };
  const binary = atob(encryptionKeyBase64);
  const keyBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    keyBytes[i] = binary.charCodeAt(i);
  }
  const cryptoKey = await window.crypto.subtle.importKey('raw', keyBytes, algorithm, false, [
    'encrypt',
  ]);
  const dataBuffer = new TextEncoder().encode(score.toString());
  const encryptedBuffer = await window.crypto.subtle.encrypt(algorithm, cryptoKey, dataBuffer);
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  let out = '';
  for (let i = 0; i < combined.length; i++) {
    out += String.fromCharCode(combined[i]);
  }
  return btoa(out);
}

export class CrazyGamesAdapter implements PortalAdapter {
  public readonly portalId = 'crazygames' as const;

  private sdkInitPromise: Promise<boolean> | null = null;
  private sdkReady = false;
  private isCrazyGamesEnv = false;
  private pendingGameplayState: 'start' | 'stop' | null = null;
  private adRequestInFlight = false;
  private currentPlayer: PortalPlayerInfo | null = null;
  private readonly leaderboardKey: string;
  private lastSubmittedScore = 0;
  private lastScoreSubmitAt = 0;

  constructor() {
    const env = import.meta.env as Record<string, string | undefined>;
    this.leaderboardKey = (env.VITE_CG_LEADERBOARD_KEY || '').trim();
  }

  private ensureSdkInit(): Promise<boolean> {
    if (this.sdkReady) return Promise.resolve(true);

    const sdk = window.CrazyGames?.SDK;
    if (!sdk || typeof sdk.init !== 'function') {
      return Promise.resolve(false);
    }

    if (!this.sdkInitPromise) {
      this.sdkInitPromise = sdk
        .init()
        .then(async () => {
          const env = sdk.environment;
          if (env === 'disabled') {
            this.sdkReady = false;
            this.isCrazyGamesEnv = false;
            return false;
          }

          this.sdkReady = true;
          this.isCrazyGamesEnv = env === 'crazygames';

          if (this.pendingGameplayState === 'start') {
            this.gameplayStart();
          } else if (this.pendingGameplayState === 'stop') {
            this.gameplayStop();
          }
          this.pendingGameplayState = null;

          try {
            const user = await sdk.user?.getUser?.();
            if (user?.username) {
              this.currentPlayer = {
                name: user.username,
                avatarUrl: user.profilePictureUrl || null,
                loggedIn: true,
              };
            }
          } catch {
            // guest or user module unavailable
          }

          return true;
        })
        .catch(() => {
          this.sdkReady = false;
          this.isCrazyGamesEnv = false;
          this.sdkInitPromise = null;
          return false;
        });
    }

    return this.sdkInitPromise;
  }

  public async init(): Promise<void> {
    const initTask = this.ensureSdkInit();
    // Do not block initial UI/cloud load past 2.5s, while still letting sdk.init() finish in background
    await Promise.race([
      initTask,
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2500)),
    ]);
  }

  public isCrazyGames(): boolean {
    return this.isCrazyGamesEnv;
  }

  public getPlayer(): PortalPlayerInfo | null {
    return this.currentPlayer;
  }

  public gameplayStart(): void {
    if (!this.sdkReady) {
      this.pendingGameplayState = 'start';
      return;
    }
    try {
      window.CrazyGames?.SDK?.game?.gameplayStart();
    } catch {
      // ignore outside CrazyGames
    }
  }

  public gameplayStop(): void {
    if (!this.sdkReady) {
      this.pendingGameplayState = 'stop';
      return;
    }
    try {
      window.CrazyGames?.SDK?.game?.gameplayStop();
    } catch {
      // ignore outside CrazyGames
    }
  }

  public happytime(): void {
    if (!this.sdkReady) return;
    try {
      window.CrazyGames?.SDK?.game?.happytime();
    } catch {
      // ignore outside CrazyGames
    }
  }

  public async saveCloudData(key: string, jsonValue: string): Promise<void> {
    safeStorageSet(key, jsonValue);
    if (!this.sdkReady) return;
    try {
      await window.CrazyGames?.SDK?.data?.setItem(key, jsonValue);
    } catch {
      // fallback already stored in localStorage
    }
  }

  public async loadCloudData(key: string): Promise<string | null> {
    if (this.sdkReady) {
      try {
        const cloud = await window.CrazyGames?.SDK?.data?.getItem(key);
        if (cloud) return cloud;
      } catch {
        // fallback to localStorage
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

    void this.runRewardedAd(onReward, onFallbackModal, callbacks);
  }

  private async runRewardedAd(
    onReward: () => void,
    onFallbackModal: () => void,
    { onStart, onError, onDone }: RewardedAdCallbacks
  ): Promise<void> {
    const sdk = window.CrazyGames?.SDK;
    if (sdk && sdk.environment !== 'disabled') {
      if (!this.sdkReady) {
        await Promise.race([
          this.ensureSdkInit(),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 6000)),
        ]);
      }

      const adModule = window.CrazyGames?.SDK?.ad;
      if (this.sdkReady && adModule && typeof adModule.requestAd === 'function') {
        this.adRequestInFlight = true;
        onStart?.();
        this.gameplayStop();
        soundEngine.setAdPaused(true);

        let settled = false;
        const finishAd = (granted: boolean, errorReason?: string) => {
          if (settled) return;
          settled = true;
          this.adRequestInFlight = false;
          soundEngine.setAdPaused(false);
          this.gameplayStart();
          if (granted) {
            onReward();
          } else if (errorReason) {
            onError?.(errorReason);
          }
          onDone?.();
        };

        try {
          adModule.requestAd('rewarded', {
            adStarted: () => {
              soundEngine.setAdPaused(true);
              this.gameplayStop();
            },
            adFinished: () => {
              finishAd(true);
            },
            adError: (error, errorData) => {
              const reason = extractAdErrorReason(error, errorData);
              finishAd(false, reason);
            },
          });
        } catch (error) {
          finishAd(false, extractAdErrorReason(error));
        }
        return;
      }
    }

    onFallbackModal();
  }

  public async submitScore(score: number, _meta: ScoreRunMeta, isRunEnd = false): Promise<void> {
    if (!this.sdkReady || !this.leaderboardKey) return;
    const submitFn = window.CrazyGames?.SDK?.user?.submitScore;
    if (typeof submitFn !== 'function' || typeof window.crypto?.subtle?.encrypt !== 'function') {
      return;
    }

    const cleanScore = Math.max(0, Math.trunc(score));
    if (cleanScore <= 0) return;

    const now = Date.now();
    if (!isRunEnd && cleanScore <= this.lastSubmittedScore) return;
    if (!isRunEnd && now - this.lastScoreSubmitAt < 8000) return;

    this.lastScoreSubmitAt = now;
    try {
      const encryptedScore = await encryptCrazyGamesScore(cleanScore, this.leaderboardKey);
      await submitFn({ encryptedScore, score: cleanScore });
      this.lastSubmittedScore = Math.max(this.lastSubmittedScore, cleanScore);
    } catch {
      // ignore invalid key or transient network error
    }
  }

  public async fetchLeaderboard(
    currentScore: number,
    meta: ScoreRunMeta
  ): Promise<LeaderboardFetchResult> {
    const runMeta = this.currentPlayer?.name
      ? { ...meta, playerName: this.currentPlayer.name }
      : meta;
    const entries = buildLocalLeaderboardEntries('active_run', currentScore, runMeta);

    return {
      portal: 'crazygames',
      entries,
      syncStatus: !this.sdkReady
        ? 'local_only'
        : this.leaderboardKey
        ? 'portal_ui'
        : 'unconfigured',
      lastSubmittedScore: Math.max(this.lastSubmittedScore, Math.trunc(currentScore)),
    };
  }
}

function extractAdErrorReason(error: unknown, errorData?: unknown): string {
  for (const candidate of [errorData, error]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
    if (candidate && typeof candidate === 'object') {
      const obj = candidate as Record<string, unknown>;
      if (typeof obj.code === 'string' && obj.code) return obj.code;
      if (typeof obj.reason === 'string' && obj.reason) return obj.reason;
      if (typeof obj.message === 'string' && obj.message) return obj.message;
    }
  }
  return 'unfilled';
}
