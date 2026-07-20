import { SdkState } from './sdkState.ts';
import { ClientResponseOptionType, IdoServiceResponse } from './types/sdk_interfaces.ts';
import { StepHandlers, StepResolver, UiStepType } from './stepHandlers';
import DOMPurify from 'dompurify';

export function getElement<T extends HTMLElement>(selector: string): T | undefined {
  const elem = document.querySelector<T>(selector)!;

  if (!elem) {
    console.warn(`Element ${selector} not found`);
  }

  return elem;
}

export function setMainContent(content: string) {
  getElement<HTMLDivElement>('#app')!.innerHTML = content;
}

export function addOverlay(id: string, content: string) {
  const overlays = getElement<HTMLDivElement>('#overlays')!;
  const overlay = document.createElement('div');

  overlay.id = id;
  overlay.classList.add('overlay');
  overlay.innerHTML = content;

  overlays.append(overlay);
}

function addEventListener(selector: string, event: string, callback: (e: Event) => void) {
  getElement<HTMLElement>(selector)?.addEventListener(event, callback);
}

export function addClickListener(selector: string, callback: (e: Event) => void) {
  addEventListener(selector, 'click', callback);
}

export function getInputValue(selector: string) {
  return getElement<HTMLInputElement | HTMLTextAreaElement>(selector)?.value.trim();
}

export function clearStoredAccessToken() {
  sessionStorage.removeItem('idoAccessToken');
}

let journeyStartTime: number | undefined;

export function markJourneyStarted(startTime = performance.now()) {
  journeyStartTime = startTime;
}

export function getJourneyDurationMs(now = performance.now()) {
  if (journeyStartTime === undefined) {
    return undefined;
  }

  return Math.round(now - journeyStartTime);
}

export function restartApp() {
  SdkState.clearSessionStorage();
  clearStoredAccessToken();
  window.location.href = '/';
}

export function generateId(length = 5) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}

export function generateAlternateBranch(submitStep: StepResolver, input?: IdoServiceResponse) {
  const alternateBranchingOptions =
    input?.clientResponseOptions &&
    Object.values(input.clientResponseOptions).filter((option) =>
      [ClientResponseOptionType.Cancel, ClientResponseOptionType.Custom].includes(option.type),
    );
  if (!alternateBranchingOptions?.length) return;

  const alternateBranchDiv = document.createElement('div');
  alternateBranchDiv.classList.add('column');

  alternateBranchingOptions.forEach((option) => {
    const button = document.createElement('button');
    button.classList.add('full-width', 'secondary');
    button.innerHTML = option.label || option.id;

    button.addEventListener('click', () => {
      button.classList.add('loading');
      button.disabled = true;

      submitStep({ options: option.id, data: {} });
    });

    alternateBranchDiv.append(button);
  });

  document.querySelector('#app')?.append(alternateBranchDiv);
}

export function sanitizeHtml(html: string) {
  return DOMPurify.sanitize(html, { SANITIZE_DOM: false });
}

export function resolveOptionIdFromButton(btnName: string, btnLabel: string | undefined, input?: IdoServiceResponse): string {
  const options = input?.clientResponseOptions;
  if (!options) return btnName;

  if (options[btnName]) return options[btnName].id;

  for (const opt of Object.values(options)) {
    if (opt.label && btnLabel && opt.label === btnLabel) return opt.id;
    if (opt.label && opt.label === btnName) return opt.id;
  }

  const typeMatch = Object.values(options).find((opt) => opt.type === btnName);
  if (typeMatch) return typeMatch.id;

  return btnName;
}

export function addLoadingButtonClickListener(selector: string, callback: () => void | Promise<void>, event = 'click') {
  addEventListener(selector, event, async (e: Event) => {
    e.preventDefault();
    let button: HTMLButtonElement | null = null;

    if (event === 'submit') {
      const form = e.target as HTMLFormElement;
      button = form.querySelector<HTMLButtonElement>('button[type="submit"], input[type="submit"]');
    } else {
      button = e.target as HTMLButtonElement;
    }

    if (button) {
      button.classList.add('loading');
      button.disabled = true;
    }

    try {
      await callback();
    } catch (e: any) {
      await StepHandlers[UiStepType.Error].handle(e);
    }
  });
}
