import { StepHandler, StepResponse } from '../types/stepHandler';
import { StepResolver } from '../stepHandlers';
import { addLoadingButtonClickListener, generateAlternateBranch, sanitizeHtml, setMainContent } from '../common';
import { InformationComponent } from '../components/informationComponent';
import { ClientResponseOptionType, IdoServiceResponse } from '../types/sdk_interfaces';

export class DisplayInformationStepHandler implements StepHandler {
  private readonly BUTTON_ID = 'information_button';

  public async handle(input?: IdoServiceResponse): Promise<StepResponse | void> {
    return new Promise<StepResponse | void>((submitStep: StepResolver) => {
      const html = this.generateHtml(input);
      setMainContent(html);

      generateAlternateBranch(submitStep, input);

      this.setEventListeners(submitStep);
    });
  }

  protected generateHtml(input?: IdoServiceResponse) {
    const stepData = input?.data;
    const html = InformationComponent(stepData?.title, stepData?.text, stepData?.button_text, this.BUTTON_ID);

    return sanitizeHtml(html);
  }

  protected setEventListeners(submitStep: StepResolver) {
    addLoadingButtonClickListener(`#${this.BUTTON_ID}`, () => {
      submitStep({
        options: ClientResponseOptionType.ClientInput,
        data: {},
      });
    });
  }
}
