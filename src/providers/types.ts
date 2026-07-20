import { IdoServiceResponse, ClientResponseOptionType } from '../types/sdk_interfaces';

export interface IdentityProvider {
  readonly name: string;
  
  initialize(config: Record<string, any>): Promise<void>;
  
  startJourney(journeyId: string, options?: { additionalParams?: any; correlationId?: string }): Promise<IdoServiceResponse>;
  
  startSsoJourney?(interactionId: string): Promise<IdoServiceResponse>;
  
  submitClientResponse(
    optionId: ClientResponseOptionType | string,
    data?: any
  ): Promise<IdoServiceResponse>;
}
