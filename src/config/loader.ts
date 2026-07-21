export interface AppConfig {
  app: {
    name: string;
    display_name: string;
    port: number;
  };
  provider: {
    name: string;
    config: Record<string, any>;
  };
  journeys: {
    delete_user: string;
  };
  supervielle: {
    api_url: string;
  };
  dynatrace: {
    endpoint_url: string;
    application_id: string;
    device_id: number;
  };
  backend: {
    port: number;
  };
}

export async function loadConfig(): Promise<AppConfig> {
  const response = await fetch('/api/config');
  return response.json() as Promise<AppConfig>;
}
