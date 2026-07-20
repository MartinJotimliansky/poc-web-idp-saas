import { StepHandlers, UiStepType } from './stepHandlers';
import { getElement, setMainContent, sanitizeHtml } from './common';
import { getActiveProvider } from './app';
import { IdoJourneyActionType, IdoServiceResponse, ClientResponseOptionType } from './types/sdk_interfaces';
import { SdkState } from './sdkState';
import { getQueryParam } from './router';
import { InformationComponent } from './components/informationComponent';

export class SsoJourneyExecutor {
  public async startSsoJourney(): Promise<void> {
    const interactionId =
      getQueryParam('src_interaction') ||
      getQueryParam('interaction_id') ||
      getQueryParam('interactionId');

    if (!interactionId) {
      console.warn('No se encontro interaction_id en la URL. Redirigiendo a /.');
      window.location.href = '/';
      return;
    }

    console.log('[SSO] Iniciando SSO Journey con interactionId:', interactionId);

    try {
      const provider = getActiveProvider();

      if (!provider.startSsoJourney) {
        throw new Error('El proveedor no soporta SSO Journey');
      }

      const idoResponse = await provider.startSsoJourney(interactionId);
      let debugPin: string | undefined;

      if (this.isJourneyActive(idoResponse.journeyStepId)) {
        debugPin = await window.tsPlatform.ido.generateDebugPin();
      }

      await this.executeJourney(idoResponse, debugPin);
    } catch (e: any) {
      console.error('[SSO] Error al iniciar SSO Journey:', e);
      await StepHandlers[UiStepType.Error].handle(e);
    }
  }

  public async startJourneyWithId(journeyId: string): Promise<void> {
    console.log('[Journey] Iniciando Journey con ID:', journeyId);

    try {
      const provider = getActiveProvider();
      const idoResponse = await provider.startJourney(journeyId);
      let debugPin: string | undefined;

      if (this.isJourneyActive(idoResponse.journeyStepId)) {
        debugPin = await window.tsPlatform.ido.generateDebugPin();
      }

      await this.executeJourney(idoResponse, debugPin);
    } catch (e: any) {
      console.error('[Journey] Error al iniciar Journey:', e);
      await StepHandlers[UiStepType.Error].handle(e);
    }
  }

  private async executeJourney(idoResponse: IdoServiceResponse | undefined, debugPin: string | undefined): Promise<void> {
    try {
      do {
        await SdkState.setState(debugPin);
        this.setDebugPin(debugPin);

        console.log('[SSO] Handling step', idoResponse);
        idoResponse = await this.handleJourneyStep(idoResponse);
      } while (idoResponse);
    } catch (e: any) {
      console.error('[SSO] Error durante la ejecucion del journey:', e);
      await StepHandlers[UiStepType.Error].handle(e);
    }
  }

  private async handleJourneyStep(
    idoResponse: IdoServiceResponse | undefined,
  ): Promise<IdoServiceResponse | undefined> {
    if (!idoResponse) {
      throw new Error('No response');
    }

    const stepId = idoResponse.journeyStepId;
    if (!stepId) {
      throw new Error('No journey step ID in response');
    }

    if (stepId === IdoJourneyActionType.Success) {
      this.handleSuccess(idoResponse);
      return;
    }

    if (stepId === IdoJourneyActionType.Rejection) {
      await StepHandlers[UiStepType.Rejection].handle(idoResponse);
      return;
    }

    console.debug(`[SSO] handle journey step ${stepId}`);
    const handler = StepHandlers[stepId];
    if (!handler) {
      throw new Error(
        `No handler for journey step ${stepId}.`,
      );
    }

    const uiResponse = await handler.handle(idoResponse);

    if (!uiResponse) {
      return;
    }

    const provider = getActiveProvider();
    const optionId = this.resolveOptionId(uiResponse.options, idoResponse);
    return provider.submitClientResponse(optionId, uiResponse.data);
  }

  private handleSuccess(response: IdoServiceResponse): void {
    if (response.data?.json_data) {
      sessionStorage.setItem('ssoJourneyData', JSON.stringify(response.data.json_data));
    }

    const redirectUrl = response.redirectUrl;
    if (redirectUrl) {
      console.log('[SSO] Journey completado. Redirigiendo a:', redirectUrl);
      window.location.href = redirectUrl;
    } else {
      console.log('[SSO] Journey completado sin redirectUrl');
      setMainContent(sanitizeHtml(InformationComponent('Journey Completado', 'El journey finalizo correctamente.', '', '')));
    }
  }

  private resolveOptionId(
    requestedOption: ClientResponseOptionType | string,
    idoResponse: IdoServiceResponse,
  ): string {
    const options = idoResponse.clientResponseOptions;
    if (!options) return requestedOption;

    const clientInputOption = options['client_input'] || options['ClientInput'];
    if (clientInputOption && (requestedOption === ClientResponseOptionType.ClientInput || requestedOption === 'ClientInput' || requestedOption === 'client_input')) {
      return clientInputOption.id;
    }

    return requestedOption;
  }

  private isJourneyActive(journeyStepId: IdoJourneyActionType | string | undefined): boolean {
    return IdoJourneyActionType.Success !== journeyStepId && IdoJourneyActionType.Rejection !== journeyStepId;
  }

  private setDebugPin(debugPin?: string): void {
    if (debugPin) {
      const el = getElement<HTMLDivElement>('#debug-pin');
      if (el) {
        el.innerHTML = `<img src="/grey-info.svg" title="Debug PIN" />
          <div class="key">Debug PIN:</div>
          <div class="value">${debugPin}</div>
          <img src="/copy.svg" id="debug-pin-copy" />`;

        const copyBtn = getElement<HTMLImageElement>('#debug-pin-copy');
        copyBtn?.addEventListener('click', () => {
          navigator.clipboard.writeText(debugPin);
          copyBtn.src = '/check.svg';
          setTimeout(() => { copyBtn.src = '/copy.svg'; }, 3000);
        });
      }
    }
  }
}
