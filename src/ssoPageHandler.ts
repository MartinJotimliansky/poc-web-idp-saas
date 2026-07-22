import { StepHandlers, UiStepType } from './stepHandlers';
import { getElement, setMainContent, sanitizeHtml } from './common';
import { getActiveProvider } from './app';
import { IdoJourneyActionType, IdoServiceResponse, ClientResponseOptionType } from './types/sdk_interfaces';
import { SdkState } from './sdkState';
import { getQueryParam } from './router';
import { InformationComponent } from './components/informationComponent';
import { dynatraceService } from './services/ObservabilityService';

const MOBILE_DEEP_LINK = 'com.supervielle-poc.app://callback';

export class SsoPageHandler {
  public async handle(): Promise<void> {
    const interactionId =
      getQueryParam('src_interaction') ||
      getQueryParam('interaction_id') ||
      getQueryParam('interactionId');

    if (!interactionId) {
      setMainContent(sanitizeHtml(InformationComponent(
        'Error',
        'No se recibió interactionId. La URL debe contener ?interactionId=X',
        'Volver',
        'restart-btn',
        'error',
      )));
      this.attachRestartListener();
      return;
    }

    const isMobile = this.detectMobile();

    try {
      const provider = getActiveProvider();

      if (!provider.startSsoJourney) {
        throw new Error('El proveedor no soporta SSO Journey');
      }

      let correlationId: string | undefined;
      if (dynatraceService.isReady()) {
        correlationId = await dynatraceService.getCorrelationIdForTransmit('SSO Page Login Flow');
      }

      const idoResponse = await provider.startSsoJourney(interactionId, correlationId ? { correlationId } : undefined);
      let debugPin: string | undefined;

      if (this.isJourneyActive(idoResponse.journeyStepId)) {
        debugPin = await window.tsPlatform.ido.generateDebugPin();
      }

      await this.executeJourney(idoResponse, debugPin, isMobile);
    } catch (e: any) {
      setMainContent(sanitizeHtml(InformationComponent(
        'Error de autenticación',
        e.message || 'Error inesperado durante el proceso de SSO.',
        'Reintentar',
        'retry-btn',
        'error',
      )));
      this.attachRetryListener();
    }
  }

  private detectMobile(): boolean {
    const targetParam = getQueryParam('target');
    if (targetParam === 'mobile') return true;

    return false;
  }

  private async executeJourney(
    idoResponse: IdoServiceResponse | undefined,
    debugPin: string | undefined,
    isMobile: boolean,
  ): Promise<void> {
    do {
      await SdkState.setState(debugPin);
      this.setDebugPin(debugPin);

      idoResponse = await this.handleJourneyStep(idoResponse, isMobile);
    } while (idoResponse);
  }

  private async handleJourneyStep(
    idoResponse: IdoServiceResponse | undefined,
    isMobile: boolean,
  ): Promise<IdoServiceResponse | undefined> {
    if (!idoResponse) {
      throw new Error('No response');
    }

    const stepId = idoResponse.journeyStepId;
    if (!stepId) {
      throw new Error('No journey step ID in response');
    }

    if (stepId === IdoJourneyActionType.Success) {
      this.handleSuccess(idoResponse, isMobile);
      return;
    }

    if (stepId === IdoJourneyActionType.Rejection) {
      await StepHandlers[UiStepType.Rejection].handle(idoResponse);
      return;
    }

    const handler = StepHandlers[stepId];
    if (!handler) {
      throw new Error(`No handler for journey step ${stepId}.`);
    }

    const uiResponse = await handler.handle(idoResponse);
    if (!uiResponse) return;

    const provider = getActiveProvider();
    const optionId = this.resolveOptionId(uiResponse.options, idoResponse);
    return provider.submitClientResponse(optionId, uiResponse.data);
  }

  private handleSuccess(response: IdoServiceResponse, isMobile: boolean): void {
    const jsonData = response.data?.json_data;
    const redirectUrl = response.redirectUrl;

    if (jsonData) {
      sessionStorage.setItem('ssoJourneyData', JSON.stringify(jsonData));
    }

    if (isMobile && redirectUrl) {
      const codeFromUrl = this.extractCodeFromUrl(redirectUrl);
      if (codeFromUrl) {
        const deepLink = `${MOBILE_DEEP_LINK}?code=${encodeURIComponent(codeFromUrl)}`;
        window.location.href = deepLink;
        return;
      }
    }

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      setMainContent(sanitizeHtml(InformationComponent(
        'Error',
        'No se recibió URL de redirección del journey.',
        'Volver',
        'restart-btn',
        'error',
      )));
      this.attachRestartListener();
    }
  }

  private extractCodeFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('code');
    } catch {
      return null;
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

  private attachRestartListener(): void {
    const btn = getElement<HTMLButtonElement>('#restart-btn');
    btn?.addEventListener('click', () => { window.location.href = '/'; });
  }

  private attachRetryListener(): void {
    const btn = getElement<HTMLButtonElement>('#retry-btn');
    btn?.addEventListener('click', () => window.location.reload());
  }
}
