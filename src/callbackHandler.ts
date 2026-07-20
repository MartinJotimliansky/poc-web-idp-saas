import { setMainContent, sanitizeHtml, getElement } from './common';
import { InformationComponent } from './components/informationComponent';
import { getQueryParam } from './router';

type CallbackState = 'loading' | 'success' | 'error';

interface TokenResult {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  exchangeDurationMs?: number;
  [key: string]: any;
}

export class CallbackHandler {
  private state: CallbackState = 'loading';
  private code: string = '';
  private errorMessage: string = '';
  private tokenEndpointResponse: string = '';
  private supervielleResponse: string = '';
  private supervielleLatencyMs: number | undefined;

  public async handle(): Promise<void> {
    this.render();

    const codeParam = getQueryParam('code');
    const errorParam = getQueryParam('error');
    const errorDesc = getQueryParam('error_description');

    if (errorParam) {
      this.errorMessage = errorDesc || errorParam;
      this.state = 'error';
      this.render();
      return;
    }

    if (!codeParam) {
      this.errorMessage = 'No se recibio un parametro "code" ni "error" en la URL.';
      this.state = 'error';
      this.render();
      return;
    }

    this.code = codeParam;
    this.render();

    await this.exchangeCode(codeParam);
  }

  private async exchangeCode(code: string): Promise<void> {
    try {
      const journeyDataRaw = sessionStorage.getItem('ssoJourneyData');
      let journeyToken: string | undefined;
      if (journeyDataRaw) {
        try {
          const journeyData = JSON.parse(journeyDataRaw);
          journeyToken = journeyData.token;
        } catch {}
      }

      const body: any = { code };
      if (journeyToken) {
        body.journey_token = journeyToken;
      }

      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.details || errorData.error || `Token exchange failed (${response.status})`);
      }

      const result: TokenResult = await response.json();
      this.tokenEndpointResponse = JSON.stringify(result, null, 2);

      if (result.access_token) {
        await this.callSupervielle(result.access_token);
      } else {
        this.state = 'success';
        this.render();
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'Error al intercambiar el codigo';
      this.state = 'error';
      this.render();
    }
  }

  private async callSupervielle(accessToken: string): Promise<void> {
    try {
      const start = performance.now();
      const response = await fetch('/api/introspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: accessToken }),
      });

      this.supervielleLatencyMs = Math.round(performance.now() - start);

      const rawText = await response.text();
      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        this.supervielleResponse = rawText || `HTTP ${response.status}`;
        this.state = 'success';
        this.render();
        return;
      }

      this.supervielleResponse = typeof data.body === 'string' ? data.body : JSON.stringify(data, null, 2);
      this.state = 'success';
      this.render();
    } catch (err: any) {
      this.errorMessage = err.message || 'Error al consultar Supervielle';
      this.state = 'error';
      this.render();
    }
  }

  private render(): void {
    const html = this.generateHtml();
    setMainContent(sanitizeHtml(html));
    this.attachEventListeners();
  }

  private generateHtml(): string {
    switch (this.state) {
      case 'loading':
        return this.renderLoading();
      case 'success':
        return this.renderSuccess();
      case 'error':
        return this.renderError();
      default:
        return this.renderLoading();
    }
  }

  private renderLoading(): string {
    return InformationComponent(
      'Autenticando...',
      `<div><strong>Authorization Code:</strong></div><pre style="word-break:break-all;">${this.code}</pre><p>Canjeando codigo por tokens...</p>`,
      '',
      '',
    );
  }

  private renderSuccess(): string {
    let content = '';

    const journeyDataRaw = sessionStorage.getItem('ssoJourneyData');
    if (journeyDataRaw) {
      try {
        const journeyData = JSON.parse(journeyDataRaw);
        const metrics: string[] = [];
        if (journeyData.total_time !== undefined) {
          metrics.push(`<div><strong>Tiempo total:</strong> ${journeyData.total_time} ms</div>`);
        }
        if (journeyData.request_latency !== undefined) {
          metrics.push(`<div><strong>Latencia API token:</strong> ${journeyData.request_latency} ms</div>`);
        }
        if (this.supervielleLatencyMs !== undefined) {
          metrics.push(`<div><strong>Latencia API Supervielle:</strong> ${this.supervielleLatencyMs} ms</div>`);
        }
        if (metrics.length > 0) {
          content += `<div class="alert info"><div class="metrics">${metrics.join('')}</div></div>`;
        }
      } catch {
      }
      sessionStorage.removeItem('ssoJourneyData');
    }

    if (this.tokenEndpointResponse) {
      content += '<div class="separator"></div><h3>Respuesta endpoint de token</h3>';
      content += `<pre style="max-height:400px;overflow:auto;word-break:break-all;">${this.tokenEndpointResponse}</pre>`;
    }

    if (this.supervielleResponse) {
      content += '<div class="separator"></div><h3>Respuesta API Supervielle</h3>';
      content += `<pre style="max-height:400px;overflow:auto;word-break:break-all;">${this.supervielleResponse}</pre>`;
    }

    return InformationComponent('Autenticacion exitosa', content, 'Restart', 'restart-btn');
  }

  private renderError(): string {
    return InformationComponent('Error', this.errorMessage, 'Reintentar', 'retry-btn', 'error');
  }

  private attachEventListeners(): void {
    const restartBtn = getElement<HTMLButtonElement>('#restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/';
      });
    }

    const retryBtn = getElement<HTMLButtonElement>('#retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => window.location.reload());
    }
  }
}
