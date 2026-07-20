import { StepHandler, StepResponse } from '../types/stepHandler';
import { IdoServiceResponse } from '../types/sdk_interfaces';
import { InformationComponent } from '../components/informationComponent';
import { ModalComponent } from '../components/modalComponent';
import { addClickListener, addLoadingButtonClickListener, restartApp, sanitizeHtml, setMainContent } from '../common';

/**
 * Handles the Reject Access step of the journey.
 * Displays rejection information and optionally shows additional data if available.
 */
export class RejectAccessStepHandler implements StepHandler {
  private readonly BUTTON_ID = 'restart_button';
  private readonly ADDITIONAL_DATA_BUTTON_ID = 'additional_data_button';
  private additionalData?: string;

  public async handle(input?: IdoServiceResponse): Promise<StepResponse | void> {
    return new Promise<StepResponse | void>(() => {
      const html = this.generateHtml(input);
      setMainContent(html);

      this.setEventListeners();
    });
  }

  protected generateHtml(input?: IdoServiceResponse) {
    const inputData = input?.data;

    const title = inputData?.title || 'Journey rejected';
    const text = `<div>${inputData?.text || 'Journey rejected without a message'}</div>`;
    const buttonText = inputData?.button_text || 'Restart';

    let html = InformationComponent(title, text, buttonText, this.BUTTON_ID, 'error');

    const additionalData = inputData?.failure_data?.reason?.data;
    if (additionalData) {
      this.additionalData = additionalData;
      html += `<button id="${this.ADDITIONAL_DATA_BUTTON_ID}" class="secondary full-width">Additional data</button>`;
    }

    return sanitizeHtml(html);
  }

  protected setEventListeners() {
    addLoadingButtonClickListener(`#${this.BUTTON_ID}`, () => {
      restartApp();
    });

    if (this.additionalData) {
      addClickListener(`#${this.ADDITIONAL_DATA_BUTTON_ID}`, () => {
        ModalComponent('Additional data', `<pre>${JSON.stringify(this.additionalData, undefined, 2)}</pre>`);
      });
    }
  }
}
