import { IdentityProvider } from './types';
import { TransmitSecurityProvider } from './transmit-security';

const providers: Record<string, () => IdentityProvider> = {
  'transmit-security': () => new TransmitSecurityProvider(),
};

export function getProvider(name: string): IdentityProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Proveedor "${name}" no está registrado. Proveedores disponibles: ${Object.keys(providers).join(', ')}`);
  }
  return factory();
}
