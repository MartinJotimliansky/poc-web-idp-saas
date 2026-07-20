import { IdoSdk } from './sdk_interfaces';

export declare global {
  interface Window {
    tsPlatform: {
      ido: IdoSdk;
      drs: any;
      webauthn: any;
      initialize: any;
    };
    VanillaOTP: typeof VanillaOTP;
  }
}
