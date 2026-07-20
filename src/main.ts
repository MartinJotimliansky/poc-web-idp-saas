import { addClickListener, getElement, restartApp, clearStoredAccessToken } from './common';
import { SdkState } from './sdkState';
import { initApp, getConfig } from './app';
import { registerRoute, navigate, getCurrentPath } from './router';
import { SsoJourneyExecutor } from './ssoJourneyExecutor';
import { CallbackHandler } from './callbackHandler';

registerRoute('/login', async () => {
  console.log('[Router] Ruta: /login (SSO Journey Hub)');
  const executor = new SsoJourneyExecutor();
  await executor.startSsoJourney();
});

registerRoute('/login/callback', async () => {
  console.log('[Router] Ruta: /login/callback (Token Exchange)');
  const handler = new CallbackHandler();
  await handler.handle();
});

registerRoute('/', async () => {
  console.log('[Router] Ruta: / (Redirect a Auth)');
  const config = getConfig();
  const cfg = config.provider.config;
  const authUrl = `${cfg.auth_url}?client_id=${encodeURIComponent(cfg.client_id)}&redirect_uri=${encodeURIComponent(cfg.redirect_uri)}&response_type=code&scope=${encodeURIComponent(cfg.scope)}&createNewUser=true`;
  console.log('[Auth] Redirecting to:', authUrl);
  window.location.href = authUrl;
});

document.addEventListener('DOMContentLoaded', async function () {
  const { config } = await initApp();

  revealApplication();
  updateJourneyNameDisplay(config.app.display_name);

  const path = getCurrentPath();

  if (path === '/login/callback') {
    await navigate();
    return;
  }

  await navigate();
});

function updateJourneyNameDisplay(displayName: string) {
  const journeyNameEl = getElement<HTMLDivElement>('#journey-name .value');
  if (journeyNameEl) {
    journeyNameEl.textContent = displayName;
  }
}

addClickListener('#restart-button', () => {
  restartApp();
});

addClickListener('#delete-user-button', async () => {
  SdkState.clearSessionStorage();
  clearStoredAccessToken();
  sessionStorage.clear();
  const config = getConfig();
  const executor = new SsoJourneyExecutor();
  await executor.startJourneyWithId(config.journeys.delete_user);
});

function revealApplication() {
  const element = getElement<HTMLHtmlElement>('html');
  if (element) {
    element.style.display = 'block';
  }
}
