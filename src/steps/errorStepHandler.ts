import { StepHandler, StepResponse } from '../types/stepHandler';
import { IdoServiceResponse } from '../types/sdk_interfaces';
import { InformationComponent } from '../components/informationComponent';
import { addLoadingButtonClickListener, restartApp, sanitizeHtml, setMainContent } from '../common';

/**
 * Handles error scenarios during the journey.
 * Displays error messages and provides an option to restart the application.
 */
export class ErrorStepHandler implements StepHandler {
  private readonly BUTTON_ID = 'restart_button';

  public async handle(input?: IdoServiceResponse): Promise<StepResponse | void> {
    return new Promise<StepResponse | void>(() => {
      const html = this.generateHtml(input);
      setMainContent(html);

      this.setEventListeners();
    });
  }

  // The input variable may be an exception that was thrown.
  // For this reason we cast it to type 'any' and look for an error message to display.
  protected generateHtml(input?: any) {
    const message = input?.message || input?.data || 'Unknown error';
    console.error('Journey execution error', input);

    const html = InformationComponent('An error occurred', message, 'Restart', this.BUTTON_ID, 'error');
    return sanitizeHtml(html);
  }

  protected setEventListeners() {
    addLoadingButtonClickListener(`#${this.BUTTON_ID}`, () => {
      restartApp();
    });
  }
}
