import { StepHandler, StepResponse } from '../types/stepHandler';
import { StepResolver } from '../stepHandlers';
import { ClientResponseOptionType, IdoServiceResponse } from '../types/sdk_interfaces';
import * as commonHelpers from '../common';

export class FormGetInfoFromClient2StepHandler implements StepHandler {
  public async handle(input?: IdoServiceResponse): Promise<StepResponse | void> {
    return new Promise<StepResponse | void>((submitStep: StepResolver) => {
      const html = this.generateHtml(input);
      commonHelpers.setMainContent(html);

      this.setEventListeners(submitStep, input);
    });
  }

  protected generateHtml(input?: IdoServiceResponse) {
    const schema = input?.data?.form_schema || [];
    const inputFields = schema.filter((f: any) => f.type === 'input');
    const buttons = schema.filter((f: any) => f.type === 'button');
    const statics = schema.filter((f: any) => f.type === 'static');
    const titleField = statics.find((f: any) => f.format === 'title');
    const metadata = schema.find((f: any) => f.type === 'metadata' && f.branchType === 'form');
    const submitLabel = metadata?.primary || 'Submit';

    const fieldsHtml = inputFields.length > 0
      ? inputFields.map((field: any) => this.renderField(field)).join('')
      : '';

    const buttonsHtml = buttons.length > 0
      ? buttons.map((btn: any) => `<button type="button" id="branch-btn-${btn.name}" class="full-width ${btn.format === 'secondary' ? 'secondary' : ''}">${btn.label || btn.name}</button>`).join('')
      : '';

    return commonHelpers.sanitizeHtml(/* HTML */ `
      ${titleField ? `<h1 class="center">${titleField.label}</h1>` : ''}
      ${input?.data?.form_title && !titleField ? `<h1 class="center">${input?.data?.form_title}</h1>` : ''}
      ${input?.data?.form_description ? `<div class="alert info">${input?.data?.form_description}</div>` : ''}

      <form id="form-get_info_from_client_2" class="column">
        ${fieldsHtml}
        <button type="submit" id="submit-get_info_from_client_2" class="full-width">${submitLabel}</button>
      </form>
      ${buttonsHtml ? `<div class="column" style="margin-top: 12px;">${buttonsHtml}</div>` : ''}
      <div id="step-error" class="alert error"></div>
    ` /* HTML-END */);
  }

  private renderField(field: any) {
    const inputType = field.format === 'password' ? 'password' : 'text';
    const label = field.label || field.name;

    return `
      <div class="input-container">
        <input
          type="${inputType}"
          id="get_info_from_client_2_${field.name}"
          name="${field.name}"
          ${field.required ? 'required' : ''}
          ${field.readonly ? 'readonly' : ''}
          value="${field.defaultValue || ''}"
          placeholder=" "
        />
        <label for="get_info_from_client_2_${field.name}">${label}${field.required ? '*' : ''}</label>
      </div>
    `;
  }

  protected setEventListeners(submitStep: StepResolver, input?: IdoServiceResponse) {
    this.setupFormLinkListeners('get_info_from_client_2', submitStep);

    const schema = input?.data?.form_schema || [];
    const buttons = schema.filter((f: any) => f.type === 'button');

    buttons.forEach((btn: any) => {
      commonHelpers.addClickListener(`#branch-btn-${btn.name}`, () => {
        const button = commonHelpers.getElement<HTMLButtonElement>(`#branch-btn-${btn.name}`);
        if (button) {
          button.classList.add('loading');
          button.disabled = true;
        }
        const optionId = commonHelpers.resolveOptionIdFromButton(btn.name, btn.label, input);
        submitStep({ options: optionId, data: {} });
      });
    });

    if (input?.data?.error_data && input.data.error_data !== 'null') {
      commonHelpers.getElement<HTMLDivElement>(`#step-error`)!.innerHTML = input.data.error_data;
    }
  }

  private setupFormLinkListeners(formId: string, submitStep: StepResolver) {
    commonHelpers.addLoadingButtonClickListener(
      `#form-${formId}`,
      async () => {
        const form = commonHelpers.getElement<HTMLFormElement>(`#form-${formId}`);
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        submitStep({
          options: this.getClientResponseOptions(formId),
          data,
        });
      },
      'submit',
    );
  }

  private getClientResponseOptions(alternateBranchId: string) {
    return alternateBranchId === 'get_info_from_client_2'
      ? ClientResponseOptionType.ClientInput
      : (alternateBranchId as ClientResponseOptionType);
  }
}
