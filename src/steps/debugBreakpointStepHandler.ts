import { StepHandler, StepResponse } from '../types/stepHandler';
import { StepResolver } from '../stepHandlers';
import { ClientResponseOptionType, IdoServiceResponse } from '../types/sdk_interfaces';
import { InformationComponent } from '../components/informationComponent';
import { addLoadingButtonClickListener, sanitizeHtml, setMainContent } from '../common';

/**
 * Handles a debug breakpoint in the journey.
 * Pauses the journey execution and allows for inspection of the current state on the Transmit Journey Debugger.
 * This handler automatically attempts to continue the journey every second, in addition to providing a manual continue button.
 */
export class DebugBreakpointStepHandler implements StepHandler {
  private readonly BUTTON_ID = 'continue_button';

  public async handle(input?: IdoServiceResponse): Promise<StepResponse | void> {
    return new Promise<StepResponse | void>((submitStep: StepResolver) => {
      const html = this.generateHtml();
      setMainContent(html);

      this.setEventListeners(submitStep, input);
    });
  }

  protected generateHtml() {
    const html = InformationComponent(
      'Debug break',
      'The journey is now paused.<br>You can use the browser console to inspect the state of the journey.',
      'Continue',
      this.BUTTON_ID,
      'info',
    );

    return sanitizeHtml(html);
  }

  protected setEventListeners(submitStep: StepResolver, input?: IdoServiceResponse) {
    const stepData = input?.data;
    const submit = () =>
      submitStep({
        options: ClientResponseOptionType.ClientInput,
        data: stepData,
      });

    // Automatically attempt to continue the journey every second
    setTimeout(() => submit(), 1000);
    addLoadingButtonClickListener(`#${this.BUTTON_ID}`, () => submit());
  }
}
