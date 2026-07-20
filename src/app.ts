import { IdentityProvider } from './providers/types';
import { getProvider } from './providers/registry';
import { loadConfig, AppConfig } from './config/loader';

let currentProvider: IdentityProvider | null = null;
let currentConfig: AppConfig | null = null;

export async function initApp(): Promise<{ provider: IdentityProvider; config: AppConfig }> {
  if (currentProvider && currentConfig) {
    return { provider: currentProvider, config: currentConfig };
  }

  currentConfig = await loadConfig();
  currentProvider = getProvider(currentConfig.provider.name);
  await currentProvider.initialize(currentConfig.provider.config);

  console.log(`[${currentConfig.app.name}] Proveedor activo: ${currentProvider.name}`);

  return { provider: currentProvider, config: currentConfig };
}

export function getConfig(): AppConfig {
  if (!currentConfig) throw new Error('App no inicializada. Llama initApp() primero.');
  return currentConfig;
}

export function getActiveProvider(): IdentityProvider {
  if (!currentProvider) throw new Error('App no inicializada. Llama initApp() primero.');
  return currentProvider;
}
