import {
  OpenKitBuilder,
  type OpenKit,
  type InitCallback,
} from '@dynatrace/openkit-js';

export interface DynatraceConfig {
  endpointURL: string;
  applicationID: string;
  deviceID: number;
  applicationVersion?: string;
  operatingSystem?: string;
  manufacturer?: string;
  modelId?: string;
  defaultClientIP?: string;
  initTimeoutMs?: number;
}

const DEFAULT_INIT_TIMEOUT_MS = 10_000;
const DEFAULT_CLIENT_IP = '127.0.0.1';

export class DynatraceService {
  private static instance: DynatraceService | null = null;

  private openKit: OpenKit | null = null;
  private initialized = false;
  private config: DynatraceConfig | null = null;

  private constructor() {}

  static getInstance(): DynatraceService {
    if (!DynatraceService.instance) {
      DynatraceService.instance = new DynatraceService();
    }
    return DynatraceService.instance;
  }

  async initialize(config: DynatraceConfig): Promise<void> {
    if (this.initialized && this.openKit) {
      console.warn('[Dynatrace] Ya inicializado. Ignorando re-inicialización.');
      return;
    }

    this.config = config;

    const os = config.operatingSystem ?? this.detectOS();

    const builder = new OpenKitBuilder(
      config.endpointURL,
      config.applicationID,
      config.deviceID
    )
      .withApplicationVersion(config.applicationVersion ?? '1.0.0')
      .withOperatingSystem(os)
      .withManufacturer(config.manufacturer ?? 'Supervielle')
      .withModelId(config.modelId ?? 'Web-POC');

    if (typeof window !== 'undefined') {
      builder
        .withScreenResolution(window.screen.width, window.screen.height)
        .withUserLanguage(navigator.language ?? 'es');
    }

    this.openKit = builder.build();

    await this.awaitInitialization(
      config.initTimeoutMs ?? DEFAULT_INIT_TIMEOUT_MS
    );

    this.initialized = true;
    console.info('[Dynatrace] OpenKit inicializado correctamente.');
  }

  createSession(clientIP?: string): void {
    this.ensureReady();

    const ip = clientIP ?? this.config?.defaultClientIP ?? DEFAULT_CLIENT_IP;
    this.openKit!.createSession(ip);
    console.info('[Dynatrace] Sesión creada para IP:', ip);
  }

  async getCorrelationIdForTransmit(
    actionName = 'Login Flow',
    traceURL?: string
  ): Promise<string> {
    this.ensureReady();

    const session = this.openKit!.createSession(
      this.config?.defaultClientIP ?? DEFAULT_CLIENT_IP
    );
    const action = session.enterAction(actionName);

    const url = traceURL ?? this.buildLoginTraceURL();
    const webRequestTracer = action.traceWebRequest(url);
    webRequestTracer.start();

    const dynatraceTag = webRequestTracer.getTag();
    const correlationId = dynatraceTag || this.generateFallbackCorrelationId();
    console.info('[Dynatrace] Correlation ID generado:', correlationId);

    return correlationId;
  }

  isReady(): boolean {
    return this.initialized && this.openKit !== null;
  }

  private awaitInitialization(timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const callback: InitCallback = (success: boolean) => {
        if (success) {
          resolve();
        } else {
          reject(
            new Error(
              `[Dynatrace] Falló la inicialización dentro del timeout de ${timeoutMs}ms.`
            )
          );
        }
      };

      this.openKit!.waitForInit(callback, timeoutMs);
    });
  }

  private detectOS(): string {
    if (typeof navigator === 'undefined') return 'Unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Browser';
  }

  private buildLoginTraceURL(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://localhost';
    return `${origin}/api/auth/login?ts=${Date.now()}`;
  }

  private generateFallbackCorrelationId(): string {
    const chars = 'abcdef0123456789';
    const segments = [8, 4, 4, 4, 12];
    return segments
      .map((len) =>
        Array.from({ length: len }, () =>
          chars[Math.floor(Math.random() * chars.length)]
        ).join('')
      )
      .join('-');
  }

  private ensureReady(): void {
    if (!this.initialized || !this.openKit) {
      throw new Error(
        '[Dynatrace] OpenKit no inicializado. Llama a initialize() primero.'
      );
    }
  }
}

export const dynatraceService = DynatraceService.getInstance();
