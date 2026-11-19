import { soundEngine } from '../audio/synth';

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
  };
}

export interface RewardedAdCallbacks {
  onStart?: () => void;
  onError?: (reason: string) => void;
  onDone?: () => void;
}

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: CrazyGamesSDKv3;
    };
  }
}

class PlatformSDK {
  private sdkInitPromise: Promise<boolean> | null = null;
  private sdkReady = false;
  private isCrazyGamesEnv = false;
  private pendingGameplayState: 'start' | 'stop' | null = null;
  private adRequestInFlight = false;

  private ensureSdkInit(): Promise<boolean> {
    if (this.sdkReady) return Promise.resolve(true);

    const sdk = window.CrazyGames?.SDK;
    if (!sdk || typeof sdk.init !== 'function') {
      return Promise.resolve(false);
    }

    if (!this.sdkInitPromise) {
      this.sdkInitPromise = sdk
        .init()
        .then(() => {
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
    localStorage.setItem(key, jsonValue);
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
    return localStorage.getItem(key);
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

export const platformSDK = new PlatformSDK();
