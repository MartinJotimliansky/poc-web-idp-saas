import { StepHandler, StepResponse } from './types/stepHandler';
import { IdoJourneyActionType } from './types/sdk_interfaces';
import { ErrorStepHandler } from './steps/errorStepHandler';
import { RejectAccessStepHandler } from './steps/rejectAccessStepHandler';
import { DebugBreakpointStepHandler } from './steps/debugBreakpointStepHandler';
import { DisplayInformationStepHandler } from './steps/displayInformationStepHandler';
import { FormGetInfoFromClient2StepHandler } from './steps/formGetInfoFromClient2StepHandler';
import { FormGetInfoFromClient1StepHandler } from './steps/formGetInfoFromClient1StepHandler';
import { LoginForm1StepHandler } from './steps/loginForm1StepHandler';

export const UiStepType = {
  ...IdoJourneyActionType,
  ['Error']: 'step:error',
  ['GetInfoFromClient2']: 'get_info_from_client_2',
  ['GetInfoFromClient1']: 'get_info_from_client_1',
  ['LoginForm1']: 'login_form',
  ['LoginForm1Alt']: 'login_form_1',
};

export type StepResolver = (value: PromiseLike<StepResponse | void> | StepResponse | void) => void;

export const StepHandlers: { [key: string]: StepHandler } = {
  [UiStepType['Error']]: new ErrorStepHandler(),
  [UiStepType['Rejection']]: new RejectAccessStepHandler(),
  [UiStepType['DebugBreak']]: new DebugBreakpointStepHandler(),
  [UiStepType['Information']]: new DisplayInformationStepHandler(),
  [UiStepType['GetInfoFromClient2']]: new FormGetInfoFromClient2StepHandler(),
  [UiStepType['GetInfoFromClient1']]: new FormGetInfoFromClient1StepHandler(),
  [UiStepType['LoginForm1']]: new LoginForm1StepHandler(),
  [UiStepType['LoginForm1Alt']]: new LoginForm1StepHandler(),
};
