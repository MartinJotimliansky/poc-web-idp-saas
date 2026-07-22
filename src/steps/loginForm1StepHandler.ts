import { StepHandler, StepResponse } from '../types/stepHandler';
import { StepResolver } from '../stepHandlers';
import { ClientResponseOptionType, IdoServiceResponse } from '../types/sdk_interfaces';
import * as commonHelpers from '../common';

export class LoginForm1StepHandler implements StepHandler {
  private currentInput?: IdoServiceResponse;

  public async handle(input?: IdoServiceResponse): Promise<StepResponse | void> {
    this.currentInput = input;
    return new Promise<StepResponse | void>((submitStep: StepResolver) => {
      const html = this.generateHtml(input);
      commonHelpers.setMainContent(html);

      this.setEventListeners(submitStep, input);
    });
  }

  private getFormId(input?: IdoServiceResponse): string {
    return (input?.journeyStepId as string) || 'login_form';
  }

  private getFormBranchOption(input?: IdoServiceResponse): { key: string; option: any } | undefined {
    const options = input?.clientResponseOptions;
    if (!options) return undefined;

    for (const [key, opt] of Object.entries(options)) {
      const schema = (opt as any).schema;
      if (Array.isArray(schema)) {
        const hasFormMetadata = schema.some((s: any) => s.type === 'metadata' && s.branchType === 'form');
        if (hasFormMetadata) return { key, option: opt };
      }
    }
    return undefined;
  }

  private getFormSchema(input?: IdoServiceResponse): any[] {
    const formBranch = this.getFormBranchOption(input);
    if (formBranch?.option?.schema) return formBranch.option.schema;
    return input?.data?.form_schema || [];
  }

  protected generateHtml(input?: IdoServiceResponse) {
    const formId = this.getFormId(input);
    const schema = this.getFormSchema(input);
    const inputFields = schema.filter((f: any) => f.type === 'input');
    const buttons = schema.filter((f: any) => f.type === 'button');
    const statics = schema.filter((f: any) => f.type === 'static');
    const titleField = statics.find((f: any) => f.format === 'title');
    const metadata = schema.find((f: any) => f.type === 'metadata' && f.branchType === 'form');
    const submitLabel = metadata?.primary || 'Iniciar sesion';

    const fieldsHtml = inputFields.length > 0
      ? inputFields.map((field: any) => this.renderField(field, input, formId)).join('')
      : this.renderDefaultFields(input, formId);

    const buttonsHtml = buttons.length > 0
      ? buttons.map((btn: any) => `<button type="button" id="branch-btn-${btn.name}" class="full-width ${btn.format === 'secondary' ? 'secondary' : ''}">${btn.label || btn.name}</button>`).join('')
      : '';

    return commonHelpers.sanitizeHtml(/* HTML */ `
      ${titleField ? `<h1 class="center">${titleField.label}</h1>` : ''}
      ${input?.data?.form_title && !titleField ? `<h1 class="center">${input?.data?.form_title}</h1>` : ''}
      ${input?.data?.form_description ? `<div class="alert info">${input?.data?.form_description}</div>` : (!titleField ? `<h2 class="center">Iniciar sesion</h2>` : '')}

      <form id="form-${formId}" class="column">
        ${fieldsHtml}
        <button type="submit" id="submit-${formId}" class="full-width">${submitLabel}</button>
      </form>
      ${buttonsHtml ? `<div class="column" style="margin-top: 12px;">${buttonsHtml}</div>` : ''}
      <div id="step-error" class="alert error"></div>
    ` /* HTML-END */);
  }

  private renderField(field: any, input: IdoServiceResponse | undefined, formId: string) {
    const isRequired = this.getFieldProperty(input, formId, field.name, 'required') ?? field.required;
    const isReadonly = this.getFieldProperty(input, formId, field.name, 'readonly') ?? field.readonly;
    const inputType = field.format === 'password' ? 'password' : 'text';
    const label = field.label || field.name;

    return `
      <div class="input-container">
        <input
          type="${inputType}"
          id="${formId}_${field.name}"
          name="${field.name}"
          ${isRequired ? 'required' : ''}
          ${isReadonly ? 'readonly' : ''}
          value="${field.defaultValue || ''}"
          placeholder=" "
        />
        <label for="${formId}_${field.name}">${label}${isRequired ? '*' : ''}</label>
      </div>
    `;
  }

  private renderDefaultFields(input: IdoServiceResponse | undefined, formId: string) {
    return `
      <div class="input-container">
        <input
          type="text"
          id="${formId}_userName"
          name="userName"
          ${this.getFieldProperty(input, formId, 'userName', 'required') ? 'required' : ''}
          ${this.getFieldProperty(input, formId, 'userName', 'readonly') ? 'readonly' : ''}
          placeholder=" "
        />
        <label for="${formId}_userName">Usuario${this.getFieldProperty(input, formId, 'userName', 'required') ? '*' : ''}</label>
      </div>
      <div class="input-container">
        <input
          type="password"
          id="${formId}_userPassword"
          name="userPassword"
          ${this.getFieldProperty(input, formId, 'userPassword', 'required') ? 'required' : ''}
          ${this.getFieldProperty(input, formId, 'userPassword', 'readonly') ? 'readonly' : ''}
          placeholder=" "
        />
        <label for="${formId}_userPassword">Contrasena${this.getFieldProperty(input, formId, 'userPassword', 'required') ? '*' : ''}</label>
      </div>
    `;
  }

  protected setEventListeners(submitStep: StepResolver, input?: IdoServiceResponse) {
    const formId = this.getFormId(input);
    this.setupFormLinkListeners(formId, submitStep);

    const schema = this.getFormSchema(input);
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
    if (alternateBranchId !== 'login_form' && alternateBranchId !== 'login_form_1') {
      return alternateBranchId as ClientResponseOptionType;
    }

    const formBranch = this.getFormBranchOption(this.currentInput);
    if (formBranch) return formBranch.key;

    const options = this.currentInput?.clientResponseOptions;
    if (options) {
      const clientInput = options[ClientResponseOptionType.ClientInput];
      if (clientInput) return ClientResponseOptionType.ClientInput;
    }

    return ClientResponseOptionType.ClientInput;
  }

  private getFieldProperty(input: IdoServiceResponse | undefined, formId: string, fieldName: string, property: string): any {
    if (!input) return undefined;

    const schema = input.data?.form_schema;
    if (input.journeyStepId === formId && schema) {
      const field = schema.find((f: any) => f.name === fieldName);
      if (field) return field[property];
    }

    const options = input.clientResponseOptions;
    if (options) {
      for (const opt of Object.values(options)) {
        const optSchema = (opt as any).schema;
        if (Array.isArray(optSchema)) {
          const field = optSchema.find((f: any) => f.name === fieldName);
          if (field) return field[property];
        }
      }
    }

    return undefined;
  }
}
