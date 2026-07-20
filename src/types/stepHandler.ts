import { ClientResponseOptionType, IdoServiceResponse } from './sdk_interfaces.ts';

/**
 * Represents the response for a single step in the journey.
 */
export interface StepResponse {
  /**
   * The type of client response or a custom string identifier.
   */
  options: ClientResponseOptionType | string;

  /**
   * Optional additional data associated with the response.
   */
  data?: any;
}

/**
 * Defines the interface that must be implemented by the step handler classes.
 * Each step handler is responsible for processing the input from the previous step,
 * performing any necessary operations, and preparing the response for the next step.
 *
 * NOTE: The design for step handlers is only an implementation suggestion, and is provided here
 * to demonstrate how to uniformly handle incoming requests from the orchestration service.
 */
export interface StepHandler {
  /**
   * Handles a step in the journey process.
   * @param input The response from the server for the previous step.
   * @returns A Promise that resolves to a StepResponse object to be passed to the SDK,
   *          or void if the journey should end.
   */
  handle(input?: IdoServiceResponse): Promise<StepResponse | void>;
}
