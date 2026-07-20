import { addClickListener, addOverlay, generateId, getElement } from '../common.ts';

/**
 * Creates and displays a modal component with custom title and content.
 * The modal includes a close button and is wrapped in an overlay.
 */
export function ModalComponent(title: string, content: string) {
  const id = `modal-${generateId()}`;
  const closeButtonId = `modal-${id}-close`;

  addOverlay(
    id,
    /* HTML */ `<div class="modal column">
      <h3>${title}</h3>
      <div class="modal-content">${content}</div>
      <button id="${closeButtonId}" class="full-width">Close</button>
    </div>`,
  );

  setTimeout(() => {
    const overlay = getElement(`#${id}`);
    if (overlay) {
      overlay.classList.add('loaded');
    }
  }, 0);

  addClickListener(`#${closeButtonId}`, () => {
    const modal = getElement<HTMLElement>(`#${id}`);
    if (modal) {
      modal.remove();
    }
  });
}
