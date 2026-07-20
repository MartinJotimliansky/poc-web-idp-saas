/**
 * @interface
 * @description Parameters for SDK initialization
 */
export interface IdoInitOptions {
  /**
   * Base path for sending API requests. This would be the base URL of the orchestration server.
   */
  serverPath: string;

  /**
   * An optional resource URI, if defined in the application settings in the admin portal
   */
    resource?: string;

  /**
   * The log level for the SDK. Default is LogLevel.Info
   * @default LogLevel.Info
   * @see {@link LogLevel}
   */
  logLevel?: LogLevel;

  /**
   * The timeout for polling requests to the server for the wait for another device action in seconds.
   * @default 3
   * @see {@link IdoJourneyActionType.WaitForAnotherDevice}
   */
  pollingTimeout?: number;

  /**
   * The expected locale format is the standard language tags as defined by the localization RFC 5646 (https://datatracker.ietf.org/doc/html/rfc5646).
   */
  locale?: string;
}

/**
 * @interface
 * @description Optional parameters for starting a journey
 */
export interface StartJourneyOptions {
  /**
   * Additional parameters to be passed to the Journey, Optional.
   */
  additionalParams?: any;
  /**
   * A unique identifier for the flow. Will be auto generated if not provided.
   */
  correlationId?: string;
}

/**
 * @enum
 * @description The enum for the log levels.
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warning = 2,
  Error = 3,
}

/**
 * @enum
 * @description The enum for the sdk error codes.
 */
export enum ErrorCode {
  /**
   * @description The init options object is invalid.
   */
  InvalidInitOptions = "invalid_initialization_options",
  /**
   * @description The sdk is not initialized.
   */
  NotInitialized = "not_initialized",
  /**
   * @description There is no active Journey.
   */
  NoActiveJourney = "no_active_journey",
  /**
   * @description Unable to receive response from the server.
   */
  NetworkError = "network_error",
  /**
   * @description The client response to the Journey is not valid.
   */
  ClientResponseNotValid = "client_response_not_valid",
  /**
   * @description The server returned an unexpected error.
   */
  ServerError = "server_error",
  /**
   * @description The provided state is not valid for SDK state recovery.
   */
  InvalidState = "invalid_state",

  /**
   * @description The provided credentials are invalid.
   */
  InvalidCredentials = "invalid_credentials",

    /**
     * @description The provided OTP passcode is expired.
     */
  ExpiredOTPPasscode = "expired_otp_passcode",

  /**
   * @description The provided validation passcode is expired.
   */
  ExpiredValidationPasscode = "expired_validation_passcode",


  /**
   * @description Max resend attempts reached
   */
  MaxResendReached = "expired_otp_passcode",
}

/**
 * @interface
 * @description Common interface for Promise rejections. Developers should handle according to the @errorCode
 */
export interface IdoSdkError {
  /**
   * @description The error code.
   */
  readonly errorCode: ErrorCode;
  /**
   * @description The error description.
   */
  readonly description: string;
  /**
   * @description The error additional data. Optional.
   */
  readonly data?: any;
}

/**
 * @enum
 * @description The enum for the client response option types.
 */
export enum ClientResponseOptionType {
  /**
   * @description Client response option type for client input. This is the standard response option for any step.
   */
  ClientInput = "client_input",
    /**
   * @description Client response option type for a cancelation branch in the Journey. Use this for canceling the current step.
   */
  Cancel = "cancel",
  /**
   * @description Client response option type for a failure branch in the Journey. Use this for reporting client side failure for the current step.
   */
  Fail = "failure",
  /**
   * @description Client response option type for custom branch in the Journey, used for custom branching.
   */
  Custom = "custom",

  /**
   * @description Client response option type for a resend of the OTP. Use this for restarting the current step (sms / email otp authentication).
   */
  Resend = "resend",
}

/**
 * @interface
 * @description The interface for client response option object. Use this object to submit client input to the Journey
 * step to process, cancel the current step or choose a custom branch.
 */
export interface ClientResponseOption {
  /**
   * @description The type of the client response option.
   */
  readonly type: ClientResponseOptionType;
  /**
   * @description The id of the client response option.
   * Journey step unique id is provided for the {@link ClientResponseOptionType.Custom} response option type.
   * {@link ClientResponseOptionType.ClientInput} and {@link ClientResponseOptionType.Cancel} have standard Ids _ClientInput_ and _Cancel_, respectively.
   */
  readonly id: string;
  /**
   * @description The label of the client response option.
   */
  readonly label: string;
  /**
   * @description Optional schema object that can be used for UI rendering.
   */
  schema?: Record<string, any>;
}

/**
 * @deprecated
 * @enum
 * @description Deprecated enum. Use {@link IdoJourneyActionType} instead to detect completion, rejection, or a step that requires client input.
 */
export enum IdoServiceResponseType {
  /**
   * @description The Journey ended successfully.
   */
  JourneySuccess = "journey_success",
  /**
   * @description The Journey reached a step that requires client input.
   */
  ClientInputRequired = "client_input_required",
  /**
   * @description The current Journey step updated the client data or provided an error message.
   */
  ClientInputUpdateRequired = "client_input_update_required",
  /**
   * @description The Journey ended with explicit rejection.
   */
  JourneyRejection = "journey_rejection",
}

/**
 * @enum
 * @description The enum for the Journey step ID, used when the journey step is a predefined typed action.
 * The actions that do not use this are "Get Information from Client" and "Login Form" which allow the journey author to define a custom ID.
 * See also {@link IdoServiceResponse.journeyStepId}.
 */
export enum IdoJourneyActionType {
  /**
   * @description `journeyStepId` for a journey rejection.
   */
  Rejection = "action:rejection",

  /**
   * @description `journeyStepId` for a journey completion.
   */
  Success = "action:success",

  /**
   * @description `journeyStepId` for an Information action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   * These are the text values that are configured for the Information action step in the journey editor.
   * This can be used to display the information to the user.
   * ```json
   * {
   *  "data": {
   *    "title": "<TITLE>",
   *    "text": "<TEXT>",
   *    "button_text": "<BUTTON TEXT>"
   *  }
   * }
   * ```
   * The client response does not need to include any data: `tsPlatform.ido.submitClientResponse(ClientResponseOptionType.ClientInput);`
   */
  Information = "action:information",

  /**
   * @description `journeyStepId` for a server side debugger breakpoint.
   * This response is sent to the client side when the journey debugger has reached a breakpoint, and will continue to return while
   * the journey debugger is paused.
   *
   * The {@link IdoServiceResponse} object does not include any data.
   *
   * The client response does not need to include any data: `tsPlatform.ido.submitClientResponse(ClientResponseOptionType.ClientInput);`
   */
  DebugBreak = "action:debug_break",

  /**
   * @description `journeyStepId` for a Wait for Cross Session Message action.
   *
   * The {@link IdoServiceResponse} object includes information that can be presented as a QR to scan by another device.
   * The response will remain the same while the cross session message was not consumed by the journey executed by the other device.
   *
   * The client response does not need to include any data: `tsPlatform.ido.submitClientResponse(ClientResponseOptionType.ClientInput);`
   */
  WaitForAnotherDevice = "action:wait_for_another_device",

  /**
   * @hidden
   * @deprecated Use {@link IdoJourneyActionType.RegisterDeviceAction} instead.
   */
  CryptoBindingRegistration = "action:crypto_binding_registration",

  /**
   * @hidden
   * @deprecated Use {@link IdoJourneyActionType.ValidateDeviceAction} instead.
   */
  CryptoBindingValidation = "action:crypto_binding_validation",

  /**
   * @hidden
   * @description `journeyStepId` for Register Device action.
   * This action is handled automatically by the SDK.
   */
  RegisterDeviceAction = "transmit_platform_device_registration",

  /**
   * @hidden
   * @description `journeyStepId` for Validate Device action.
   * This action is handled automatically by the SDK.
   */
  ValidateDeviceAction = "transmit_platform_device_validation",

  /**
   * @description `journeyStepId` for WebAuthn Registration action.
   *
   * Data received in the {@link IdoServiceResponse} object: the input parameters that you need to send to `tsPlatform.webauthn.register()`
   * ```json
   * {
   *  "data": {
   *    "username": "<USERNAME>",
   *    "display_name": "<DISPLAY_NAME>",
   *    "register_as_discoverable": <true|false>,
   *    "allow_cross_platform_authenticators": <true|false>
   *  }
   * }
   * ```
   *
   * Before responding, activate `tsPlatform.webauthn.register()` to obtain the `webauthn_encoded_result` value.
   * This will present the user with the WebAuthn registration UI. Use the result to send the client response:
   * ```json
   * tsPlatform.ido.submitClientResponse(
   *     ClientResponseOptionType.ClientInput,
   *     {
   *         "webauthn_encoded_result": "<WEBAUTHN_ENCODED_RESULT_FROM_SDK>"
   *     })
   * ```
   */
  WebAuthnRegistration = "action:webauthn_registration",

  /**
   * @description `journeyStepId` for instructing the use of DRS trigger action, as part of the Risk Recommendation journey step.
   *
   * Data received in the {@link IdoServiceResponse} object: the input parameters that you need to send to `tsPlatform.drs.triggerActionEvent()`
   * ```json
   * {
   *  "data": {
   *     "correlation_id": "a47ed80a-41f9-464a-a42f-fce775b6e446",
   *     "user_id": "user",
   *     "action_type": "login"
   *  },
   * }
   * ```
   * Before responding, activate `tsPlatform.drs.triggerActionEvent()` to obtain the `action_token` value. This is a silent action, and does not require user interaction.
   * Use the result to send the client response:
   * ```json
   * tsPlatform.ido.submitClientResponse(
   *     ClientResponseOptionType.ClientInput,
   *     {
   *         "action_token": "<DRS action token>"
   *     })
   * ```
   */
  DrsTriggerAction = "action:drs_trigger_action",

  /**
   * @description `journeyStepId` for Identity Verification action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   * ```json
   * {
   *  "data": {
   *    "payload": {
   *      "endpoint": "<endpoint to redirect>",
   *      "base_endpoint": "<base endpoint>",
   *      "start_token": "<start token>",
   *      "state": "<state>",
   *      "session": "<session>"
   *      },
   *    }
   * }
   * ```
   * Use this data to redirect the user to the identity verification endpoint.
   * Since this redirects to a different page, make sure you store the SDK state by calling `tsPlatform.ido.serializeState()`, and saving the response data in the session storage.
   * After the user completes the identity verification, you can restore the SDK state and continue the journey, by calling `tsPlatform.ido.restoreFromSerializedState()` with the stored state.
   *
   * Once done, send the following client response:
   * ```json
   * tsPlatform.ido.submitClientResponse(
   *     ClientResponseOptionType.ClientInput,
   *     {
   *         "payload": {
   *             "sessionId": "<sessionId>",
   *             "state": "<state>"
   *         }
   *     })
   * ```
   */
  IdentityVerification = "action:id_verification",


  /**
   * @description `journeyStepId` for Email OTP authentication action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   *
   * ```json
   * {
   *  "data": {
   *    "code_length": <integer_code_length>
   *   }
   * }
   * ```
   *
   * On failure, the `IdoServiceResponse` {@link IdoServiceResponse.errorData} field will contain either the error code {@link ErrorCode.InvalidCredentials} or the error code {@link ErrorCode.ExpiredOTPPasscode}.
   *
   * This can be used to indicate that the passcode is invalid, prompting the user to enter a new passcode.
   * Also, a resend option (see below) can be provided to the user.
   *
   * Client responses:
   *
   * - For simple submit of OTP passcode:
   * ```json
   *      tsPlatform.ido.submitClientResponse(
   *          ClientResponseOptionType.ClientInput,
   *          {
   *              "passcode": "<passcode>"
   *          })
   * ```
   *
   * - In Order to request resend of OTP (restart the action):
   *     `tsPlatform.ido.submitClientResponse(ClientResponseOptionType.Resend)`
   *
   */
  EmailOTPAuthentication = "transmit_platform_email_otp_authentication",

  /**
   * @description `journeyStepId` for SMS OTP authentication action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   *
   * ```json
   * {
   *  "data": {
   *    "code_length": <integer_code_length>
   *   }
   * }
   * ```
   *
   * On failure, the `IdoServiceResponse` {@link IdoServiceResponse.errorData} field will contain either the error code {@link ErrorCode.InvalidCredentials}, or the error code {@link ErrorCode.ExpiredOTPPasscode}
   *
   * This can be used to indicate that the passcode is invalid, prompting the user to enter a new passcode.
   * Also, a resend option (see below) can be provided to the user.
   *
   * Client responses:
   *
   * - For simple submit of OTP passcode:
   * ```json
   *      tsPlatform.ido.submitClientResponse(
   *          ClientResponseOptionType.ClientInput,
   *          {
   *              "passcode": "<passcode>"
   *          })
   * ```
   *
   * - In Order to request resend of OTP (restart the action):
   *     `tsPlatform.ido.submitClientResponse(ClientResponseOptionType.Resend)`
   *
   */
  SmsOTPAuthentication = "transmit_platform_sms_otp_authentication",

   /**
    * @description `journeyStepId` for TOTP Registration action.
    *
    * Data received in the {@link IdoServiceResponse} object:
    * ```json
    * {
    *  "data": {
    *    "payload": {
    *      "secret": "<secret>",
    *      "uri": "<uri>"
    *     },
    *   }
    * }
    * ```
    * Use this data to display the TOTP registration QR code / link  to the user.
    * The user should use this to register the TOTP secret in their authenticator app.
    * Once the user has completed the registration, send the following empty client response:
    * ```json
    * tsPlatform.ido.submitClientResponse(
    *    ClientResponseOptionType.ClientInput
    * )
    * ```
    * Please note that registration of the TOTP secret is a silent action, and does not require user interaction.
    * An empty response is sent to the server in order to continue the journey.
    *
    */

  /**
   * @description `journeyStepId` for Email Validation action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   *
   * ```json
   * {
   *  "data": {
   *    "code_length": <integer_code_length>
   *   }
   * }
   * ```
   *
   * On failure, the `IdoServiceResponse` {@link IdoServiceResponse.errorData} field will contain either the error code {@link ErrorCode.InvalidCredentials}
   *
   * Resend option also (see below) can be provided to the user.
   *
   * Client responses:
   *
   * - For simple submit of validation passcode:
   * ```json
   *      tsPlatform.ido.submitClientResponse(
   *          ClientResponseOptionType.ClientInput,
   *          {
   *              "passcode": "<passcode>"
   *          })
   * ```
   *
   * - In Order to request resend of OTP (restart the action):
   *     `tsPlatform.ido.submitClientResponse(ClientResponseOptionType.Resend)`
   *
   */
  EmailValidation = "transmit_platform_email_validation",


  /**
   * @description `journeyStepId` for Sms Validation action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   *
   * ```json
   * {
   *  "data": {
   *    "code_length": <integer_code_length>
   *   }
   * }
   * ```
   *
   * On failure, the `IdoServiceResponse` {@link IdoServiceResponse.errorData} field will contain either the error code {@link ErrorCode.InvalidCredentials}
   *
   * Resend option also (see below) can be provided to the user.
   *
   * Client responses:
   *
   * - For simple submit of validation passcode:
   * ```json
   *      tsPlatform.ido.submitClientResponse(
   *          ClientResponseOptionType.ClientInput,
   *          {
   *              "passcode": "<passcode>"
   *          })
   * ```
   *
   * - In Order to request resend of OTP (restart the action):
   *     `tsPlatform.ido.submitClientResponse(ClientResponseOptionType.Resend)`
   *
   */
  SmsValidation = "transmit_platform_sms_validation",

  TotpRegistration = "transmit_platform_totp_registration",


    /**
   * @description `journeyStepId` for Transaction Signing with TOTP action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   * ```json
   * {
   *  "data": {
   *    "transaction_challenge": "<6_DIGIT_CHALLENGE_CODE>",
   *    "approval_data": {
   *      // Note: This is just an example. The actual approval_data can vary.
   *      "transactionId": "<TRANSACTION_ID>",
   *      "amount": "<AMOUNT>",
   *      "currency": "<CURRENCY>"
   *    }
   *  }
   * }
   * ```
   * Use this data to display the transaction details and the challenge code to the user.
   * The user should use this challenge code to generate a TOTP code using their authenticator app.
   *
   * Client responses:
   *
   * - For submitting the TOTP code:
   * ```json
   * tsPlatform.ido.submitClientResponse(
   *    ClientResponseOptionType.ClientInput,
   *    {
   *      "totp_code": "<6_DIGIT_TOTP_CODE>"
   *    }
   * )
   * ```
   *
   * On failure, the `IdoServiceResponse` {@link IdoServiceResponse.errorData} field will contain the error code {@link ErrorCode.InvalidCredentials}.
   * This can be used to indicate that the TOTP code is invalid, prompting the user to enter a new code.
   *
   * Note: The user has a limited number of attempts to enter the correct TOTP code before the journey is rejected.
   */
    TransactionSigningTOTP = "transmit_platform_transaction_signing_totp",

    /**
     * @description `journeyStepId` for Invoke IDP action.
     *
     * Data received in the {@link IdoServiceResponse} object:
     * ```json
     * {
     *  "data": {
     *    "authorization_url": "<URL_OF_THE_AUTHORIZATION_ENDPOINT>",
     *    "authorization_request_method": "<GET_OR_POST>",
     *    "invocation_method": "<PAGE_OR_POPUP>",
     *    "idp_name": "<IDP_NAME>"
     *  }
     * }
     * ```
     * Use this data to redirect the user to the IDP authorization endpoint.
     *
     *
     * Once done, send the following client response:
     * ```json
     * tsPlatform.ido.submitClientResponse(
     *    ClientResponseOptionType.ClientInput,
     *    {
     *       "idp_response" : {
     *          "code": "<code>",
     *          "state": "<state>",
     *       }
     *     }
     * )
     *```
     *
     *
     */
  InvokeIDP = "invoke_idp",

  /**
   * @description `journeyStepId` for Transaction Signing with Passkeys action.
   *
   * Data received in the {@link IdoServiceResponse} object:
   * ```json
   * {
   *  "data": {
   *    "user_identifier": "<USERNAME>",
   *    "approval_data": {
   *      // Note: This is just an example. The actual approval_data can vary.
   *      "transactionId": "<TRANSACTION_ID>",
   *      "amount": "<AMOUNT>",
   *      "currency": "<CURRENCY>"
   *    }
   *  }
   * }
   * ```
   * Before responding, call `tsPlatform.webauthn.approve.modal()` to obtain the `webauthn_encoded_result` value.
   * ```javascript
   * const result = await tsPlatform.webauthn.approve.modal(
   *   response.data.approval_data // Transaction details to be approved
   * );
   * ```
   * 
   * Then submit the result:
   * ```javascript
   * tsPlatform.ido.submitClientResponse(
   *    ClientResponseOptionType.ClientInput,
   *    {
   *      "webauthn_encoded_result": result
   *    }
   * )
   * ```
   *
   * On failure, the `IdoServiceResponse` {@link IdoServiceResponse.errorData} field will contain 
   * relevant error codes that can be used to handle various failure scenarios.
   * 
   * Note: The approval_data object can contain up to 10 key-value pairs using only alphanumeric 
   * characters, underscores, hyphens, and periods. The WebAuthn encoded result remains valid for 60 seconds.
   */
  WebAuthnTransactionSigning = "transmit_platform_transaction_signing_webauthn",

  /**
   * @description `journeyStepId` for Web to Mobile Authentication action.
   * This action type is used for both simple authentication and transaction signing scenarios.
   *
   * Initial Data received in the {@link IdoServiceResponse} object when multiple devices are available:
   * ```json
   * {
   *  "data": {
   *    "devices": [
   *      {
   *        "name": "Device 1",
   *        "code": "1"
   *      },
   *      {
   *        "name": "Device 2", 
   *        "code": "2"
   *      }
   *    ]
   *  }
   * }
   * ```
   * 
   * For device selection, send the following client response:
   * ```javascript
   * tsPlatform.ido.submitClientResponse(
   *    ClientResponseOptionType.ClientInput,
   *    {
   *      "selected_device_code": "<DEVICE_CODE>"
   *    }
   * )
   * ```
   *
   * After device selection or when only one device is available, the action will wait for mobile approval.
   * The response includes polling configuration and optional transaction details:
   * ```json
   * {
   *  "data": {
   *    "device_display_name": "Device 1",
   *    "resend_attempts_left": 5,
   *    "polling_interval": 3,
   *    "approval_data": {
   *      // Note: This is just an example. The actual approval_data can vary.
   *      "transactionId": "<TRANSACTION_ID>",
   *      "amount": "<AMOUNT>",
   *      "currency": "<CURRENCY>"
   *    }
   *  }
   * }
   * ```
   * 
   * The following options are available:
   * 
   * - To check current authentication status (polling):
   * ```javascript
   * // The application should implement its own polling mechanism
   * // and call this method periodically to check the status
   * tsPlatform.ido.submitClientResponse(ClientResponseOptionType.ClientInput)
   * ```
   *
   * - To cancel the authentication:
   * ```javascript
   * tsPlatform.ido.submitClientResponse(ClientResponseOptionType.Cancel)
   * ```
   *
   * - To resend the push notification:
   * ```javascript
   * tsPlatform.ido.submitClientResponse(ClientResponseOptionType.Resend)
   * ```
   *
   * Note: The application is responsible for implementing the polling mechanism 
   * to check the authentication status. The SDK only provides the method to 
   * submit the status check request. Use the polling_interval from the response
   * to determine the frequency of status checks.
   *
   * On failure, the `IdoServiceResponse` {@link IdoServiceResponse.errorData} field will contain 
   * relevant error codes that can be used to handle various failure scenarios.
   */
  MobileApproveAuthentication = "transmit_platform_mobile_approve_authentication"
}

/**
 * @interface
 * @description The interface for the Journey step response object. Including Journey end with either error, rejection and success.
 */
export interface IdoServiceResponse {
  /**
   * @deprecated
   * @description Deprecated attribute. Use {@link IdoJourneyActionType} instead.
   */
  readonly type: IdoServiceResponseType;
  /**
   * @description Optional data object returned from the server for any of the journey steps.
   */
  readonly data?: any;
  /**
   * @description Additional error data returned from the server for any of the journey steps.
   */
  readonly errorData?: IdoSdkError;
  /**
   * @description Contains the Journey step ID, allowing the client side to choose the correct handler and UI.
   * This will be either a form ID for the "Get Information from Client" and "Login Form" journey steps,
   * or one of {@link IdoJourneyActionType} for other actions.
   */
  readonly journeyStepId?: IdoJourneyActionType | string;
  /**
   * @description The Journey client response options if the response type is {@link IdoServiceResponseType.ClientInputRequired}
   * or {@link IdoServiceResponseType.ClientInputUpdateRequired}.
   */
  readonly clientResponseOptions?: Record<
    ClientResponseOptionType | string,
    ClientResponseOption
  >;

  /**
   * @description A proof of journey completion is provided upon successful completion of the journey,
   * indicated by the {@link IdoJourneyActionType.Success} step ID.
   */
  token?: string;

  /**
   * @description If a browser-redirection is required (for example at the end of an SSO journey) - the server will provide the redirect URL here.
   * The client should redirect the browser to this URL, i.e. by issuing a `window.location.href = response.redirectUrl;`
   */
  redirectUrl?: string;
}

/**
 * @interface
 * @description The interface for the sdk object.
 */
export interface IdoSdk {
  /**
   * @description Creates a new Identity Orchestration SDK instance with your client context.
   * Do not call this function directly - see below how to initialize via the unified web SDK
   * @param clientId - Client ID for this application.
   * @param  options - Additional environment configuration for the SDK operation.
   * @returns The promise that will be resolved when the SDK is initialized.
   * @throws {@link ErrorCode.InvalidInitOptions} in case of invalid init options.
   * @example
   * // Initialize an instance of the Identity Orchestration SDK using the unified SDK
   * await window.tsPlatform.initialize({
   *   clientId: 'my-client-id',
   *   ido: { serverPath: 'https://api.transmitsecurity.io/ido'}
   * });
   */
  init(clientId: string, options?: IdoInitOptions): Promise<void>;

  /**
   * @description Starts a Journey with a given id.
   * @param journeyId - Journey Identifier in the Mosaic Admin Console.
   * @param options - Additional parameters to be passed to the journey.
   * @returns The promise that will be resolved when the {@link IdoServiceResponse} is received.
   * @throws {@link ErrorCode.NotInitialized} - Throws error if the SDK is not initialized.
   * @throws {@link ErrorCode.NetworkError} - Throws error if could not connect to server, or server did not respond before timeout.
   * @throws {@link ErrorCode.ServerError} - Throws error if the server returned an unexpected error.
   * @example
   * // Start a Journey with the id 'my-journey-id'
   * try {
   *   const idoResponse = await window.tsPlatform.ido.startJourney('my-journey-id', { additionalParams: 'additionalParams' });
   *   // Handle Journey response
   * } catch(error) {
   *   switch(sdkError.errorCode) ...
   * }
   */
  startJourney(
    journeyId: string,
    options?: StartJourneyOptions
  ): Promise<IdoServiceResponse>;


  /**
   * @description Starts an SSO Journey with a given Interaction ID.
   * @param interactionId - Interaction identifier given as part of the response to the initial /authorize request
   * @returns The promise that will be resolved when the {@link IdoServiceResponse} is received.
   * @throws {@link ErrorCode.NotInitialized} - Throws error if the SDK is not initialized.
   * @throws {@link ErrorCode.NetworkError} - Throws error if could not connect to server, or server did not respond before timeout.
   * @throws {@link ErrorCode.ServerError} - Throws error if the server returned an unexpected error.
   * @example
   * // Start a Journey with the Interaction ID '2456E855-05A0-4992-85C1-A2519CBB4AA7'
   * try {
   *   const idoResponse = await window.tsPlatform.ido.startSsoJourney('2456E855-05A0-4992-85C1-A2519CBB4AA7');
   *   // Handle Journey response
   * } catch(error) {
   *   switch(sdkError.errorCode) ...
   * }
   */
  startSsoJourney(
    interactionId: string
  ): Promise<IdoServiceResponse>;

  /**
   *
   * @description This method will submit client input to the Journey step to process.
   * @param clientResponseOptionId - The response option ID is one of the IDs provided in the {@link IdoServiceResponse.clientResponseOptions}.
   * This would either be {@link ClientResponseOptionType.ClientInput} for collected user input,
   * or one of the others if another journey path was selected by the user.
   * @param data - The client response data object.
   * Mandatory in {@link ClientResponseOptionType.ClientInput} response option type, populate with data for the Journey step to process.
   * Optional in {@link ClientResponseOptionType.Cancel} and {@link ClientResponseOptionType.Custom} as an additional parameters for the branch.
   * @returns The promise that will be resolved when the {@link IdoServiceResponse} is received.
   * @throws {@link ErrorCode.NotInitialized} - Throws error if the SDK is not initialized.
   * @throws {@link ErrorCode.NoActiveJourney} - Throws error if the SDK state does not have an active Journey.
   * @throws {@link ErrorCode.NetworkError} - Throws error if could not connect to server, or server did not respond before timeout.
   * @throws {@link ErrorCode.ClientResponseNotValid} - Throws error if the client response to the Journey is not valid.
   * @throws {@link ErrorCode.ServerError} - Throws error if the server returned an unexpected error.
   * @example
   * // The previous response may include multiple response options. The standard 'ClientInput' response option
   * // signals we are sending collected user input to the journey step.
   * const selectedInputOptionId = ClientResponseOptionType.ClientInput;
   *
   * // Submit the client input. The data inside the JSON correspond to the expected fields from the Journey step.
   * try {
   *   const idoResponse = await window.tsPlatform.ido.submitClientResponse(selectedInputOption, {
   *     'userEmail': 'user@input.email',
   *     'userPhone': '111-222-3333',
   *   });
   * } catch(sdkError) {
   *   switch(sdkError.errorCode) ...
   * }
   */
  submitClientResponse(
    clientResponseOptionId: ClientResponseOptionType | string,
    data?: any
  ): Promise<IdoServiceResponse>;

  /**
   * @description Get the current serialized state of the SDK. Can be stored by the application code and used to
   * restore the SDK state following page redirects or refresh
   * @returns The current state of the SDK.
   */
  serializeState(): string;

  /**
   * @description Restores the SDK state from a serialized state, can be used to recover from page redirects or refresh.
   * The application code also receives the latest communication from the orchestration server.
   * @param state - The state to restore from.
   * @returns The last {@link IdoServiceResponse} that was received before the state was saved.
   * @throws {@link ErrorCode.InvalidState} - Throws error if the provided state string is invalid.
   */
  restoreFromSerializedState(state: string): IdoServiceResponse;

  /**
   * @description This method will generate a debug PIN
   *  const debugPin = await sdk.generateDebugPin();
   *  console.log(`Debug PIN: ${debugPin}`); // Output: Debug PIN: 1234
   */
  generateDebugPin(): Promise<string>;
}