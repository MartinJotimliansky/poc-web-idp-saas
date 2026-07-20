export type InformationType = 'none' | 'info' | 'success' | 'warning' | 'error';

/**
 * Generates an information modal that displays customizable content.
 * The modal aligns with the text and allows for flexible styling and content.
 */
export function InformationComponent(
  title?: string,
  text?: string,
  buttonText?: string,
  buttonId?: string,
  type: InformationType = 'none',
): string {
  const textType = type === 'none' ? '' : `class="alert ${type}"`;

  return /* HTML */ `<div class="information column">
    <h3>${title || 'Title'}</h3>
    <div ${textType} class="free-text">${text || 'Text'}</div>
    <button id="${buttonId}" class="full-width">${(buttonText && buttonText) || 'Continue'}</button>
  </div>`;
}
