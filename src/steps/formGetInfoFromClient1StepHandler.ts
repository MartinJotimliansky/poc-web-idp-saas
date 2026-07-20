import { StepHandler, StepResponse } from '../types/stepHandler';
import { StepResolver } from '../stepHandlers';
import { ClientResponseOptionType, IdoServiceResponse } from '../types/sdk_interfaces';
import * as commonHelpers from '../common';

export class FormGetInfoFromClient1StepHandler implements StepHandler {
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
      ? inputFields.map((field: any) => this.renderField(field, input)).join('')
      : this.renderDefaultFields(input);

    const buttonsHtml = buttons.length > 0
      ? buttons.map((btn: any) => `<button type="button" id="branch-btn-${btn.name}" class="full-width ${btn.format === 'secondary' ? 'secondary' : ''}">${btn.label || btn.name}</button>`).join('')
      : '';

    return commonHelpers.sanitizeHtml(/* HTML */ `
      ${titleField ? `<h1 class="center">${titleField.label}</h1>` : ''}
      ${input?.data?.form_title && !titleField ? `<h1 class="center">${input?.data?.form_title}</h1>` : ''}
      ${input?.data?.form_description ? `<div class="alert info">${input?.data?.form_description}</div>` : (!titleField ? `<h2 class="center">Introduce tus credenciales</h2>` : '')}

      <form id="form-get_info_from_client_1" class="column">
        ${fieldsHtml}
        <button type="submit" id="submit-get_info_from_client_1" class="full-width">${submitLabel}</button>
      </form>
      ${buttonsHtml ? `<div class="column" style="margin-top: 12px;">${buttonsHtml}</div>` : ''}
      <div id="step-error" class="alert error"></div>
    ` /* HTML-END */);
  }

  private renderField(field: any, input?: IdoServiceResponse) {
    const isRequired = this.getFieldProperty(input, 'get_info_from_client_1', field.name, 'required') ?? field.required;
    const isReadonly = this.getFieldProperty(input, 'get_info_from_client_1', field.name, 'readonly') ?? field.readonly;
    const inputType = field.format === 'password' ? 'password' : 'text';
    const label = field.label || field.name;

    return `
      <div class="input-container">
        <input
          type="${inputType}"
          id="get_info_from_client_1_${field.name}"
          name="${field.name}"
          ${isRequired ? 'required' : ''}
          ${isReadonly ? 'readonly' : ''}
          value="${field.defaultValue || ''}"
          placeholder=" "
        />
        <label for="get_info_from_client_1_${field.name}">${label}${isRequired ? '*' : ''}</label>
      </div>
    `;
  }

  private renderDefaultFields(input?: IdoServiceResponse) {
    return `
      <div class="input-container">
        <input
          type="text"
          id="get_info_from_client_1_userName"
          name="userName"
          ${this.getAuthScriptValueFromIdoResponse(input, 'get_info_from_client_1', 'userName', 'required') ? 'required' : ''}
          ${this.getAuthScriptValueFromIdoResponse(input, 'get_info_from_client_1', 'userName', 'readonly') ? 'readonly' : ''}
          placeholder=" "
        />
        <label for="get_info_from_client_1_userName">Usuario${this.getAuthScriptValueFromIdoResponse(input, 'get_info_from_client_1', 'userName', 'required') ? '*' : ''}</label>
      </div>
      <div class="input-container">
        <input
          type="password"
          id="get_info_from_client_1_userPassword"
          name="userPassword"
          ${this.getAuthScriptValueFromIdoResponse(input, 'get_info_from_client_1', 'userPassword', 'required') ? 'required' : ''}
          ${this.getAuthScriptValueFromIdoResponse(input, 'get_info_from_client_1', 'userPassword', 'readonly') ? 'readonly' : ''}
          placeholder=" "
        />
        <label for="get_info_from_client_1_userPassword">Contraseña${this.getAuthScriptValueFromIdoResponse(input, 'get_info_from_client_1', 'userPassword', 'required') ? '*' : ''}</label>
      </div>
    `;
  }

  protected setEventListeners(submitStep: StepResolver, input?: IdoServiceResponse) {
    this.setupFormLinkListeners('get_info_from_client_1', submitStep);

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

        commonHelpers.markJourneyStarted();

        submitStep({
          options: this.getClientResponseOptions(formId),
          data,
        });
      },
      'submit',
    );
  }

  private getClientResponseOptions(alternateBranchId: string) {
    return alternateBranchId === 'get_info_from_client_1'
      ? ClientResponseOptionType.ClientInput
      : (alternateBranchId as ClientResponseOptionType);
  }

  private getFieldProperty(input: IdoServiceResponse | undefined, formId: string, fieldName: string, property: string): any {
    if (!input) return undefined;

    if (input.journeyStepId === formId && input.data?.form_schema) {
      const field = input.data.form_schema.find((f: any) => f.name === fieldName);
      if (field) return field[property];
    }
    return undefined;
  }

  private getAuthScriptValueFromIdoResponse(
    input?: IdoServiceResponse,
    formId?: string,
    fieldName?: string,
    property?: string,
  ) {
    if (!input) {
      return undefined;
    }

    let field;
    if (input.journeyStepId === formId && input.data?.form_schema) {
      field = input.data.form_schema.find((f: any) => f.name === fieldName);
    } else if (input.clientResponseOptions) {
      const branch = input.clientResponseOptions[`${formId}`];
      if (branch?.schema) {
        field = branch.schema.find((f: any) => f.name === fieldName);
      }
    }

    return field?.[`${property}`];
  }
}
