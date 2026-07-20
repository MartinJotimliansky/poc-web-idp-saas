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
  backend: {
    port: number;
  };
}

export async function loadConfig(): Promise<AppConfig> {
  const response = await fetch('/api/config');
  return response.json() as Promise<AppConfig>;
}
