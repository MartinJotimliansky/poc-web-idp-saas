import { IdentityProvider } from './types';
import { IdoServiceResponse, ClientResponseOptionType } from '../types/sdk_interfaces';

export class TransmitSecurityProvider implements IdentityProvider {
  readonly name = 'transmit-security';
  private clientId: string = '';
  private serverUrl: string = '';

  async initialize(config: Record<string, any>): Promise<void> {
    this.clientId = config.client_id || '';
    this.serverUrl = config.server_url || 'https://api.transmitsecurity.io/ido';

    if (!window.tsPlatform) {
      throw new Error('Transmit Security SDK no está cargado. Verifica la conexión.');
    }

    await window.tsPlatform.initialize({
      clientId: this.clientId,
      ido: { serverPath: this.serverUrl },
      drs: { enabled: false },
    });
  }

  async startJourney(journeyId: string, options?: { additionalParams?: any; correlationId?: string }): Promise<IdoServiceResponse> {
    return window.tsPlatform.ido.startJourney(journeyId, options || {});
  }

  async startSsoJourney(interactionId: string): Promise<IdoServiceResponse> {
    return window.tsPlatform.ido.startSsoJourney(interactionId);
  }

  async submitClientResponse(
    optionId: ClientResponseOptionType | string,
    data?: any
  ): Promise<IdoServiceResponse> {
    return window.tsPlatform.ido.submitClientResponse(optionId, data);
  }
}
