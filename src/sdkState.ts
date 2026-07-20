export interface IdoSdkState {
  state: string;
  debugPin?: string;
  expiresAt: number;
}

const STATE_EXPIRATION_MS = 300000;

export class SdkState {
  public static LOCAL_STORAGE_KEY = 'idoSdkState';

  public static getState() {
    const state = sessionStorage.getItem(SdkState.LOCAL_STORAGE_KEY);

    if (state) {
      const parsedState: IdoSdkState = JSON.parse(state);

      if (parsedState.expiresAt > new Date().getTime()) {
        return parsedState;
      } else {
        SdkState.clearSessionStorage();
      }
    }
  }

  public static async setState(debugPin?: string) {
    const newState: IdoSdkState = {
      state: window.tsPlatform.ido.serializeState(),
      expiresAt: new Date().getTime() + STATE_EXPIRATION_MS,
      debugPin,
    };

    sessionStorage.setItem(SdkState.LOCAL_STORAGE_KEY, JSON.stringify(newState));
  }

  public static clearSessionStorage() {
    sessionStorage.removeItem(SdkState.LOCAL_STORAGE_KEY);
  }
}
