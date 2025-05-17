import type { 
  ModelParameters, 
  ChatMessage, 
  OpenRouterConfig,
  OpenRouterPayload,
  OpenRouterResponse,
  RetryConfig
} from './openrouter.types';
import type { Logger } from './logger.types';
import { 
  configSchema, 
  responseSchema, 
  OpenRouterError,
  messageSchema,
  modelParametersSchema,
  modelNameSchema,
  responseFormatSchema
} from './openrouter.types';
import { ConsoleLogger } from './console.logger';

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private currentModel: string;
  private modelParameters: ModelParameters;
  private systemMessage?: string;
  private userMessage?: string;
  private responseFormat?: Record<string, any>;
  private readonly retryConfig: Required<RetryConfig>;
  private readonly logger: Logger;

  constructor(config: OpenRouterConfig) {
    // Initialize logger
    this.logger = new ConsoleLogger('OpenRouterService');

    try {
      // Validate config
      const validatedConfig = configSchema.parse(config);

      // Initialize service
      this.apiKey = validatedConfig.apiKey;
      this.apiUrl = validatedConfig.apiUrl;
      this.currentModel = validatedConfig.defaultModel;
      this.modelParameters = validatedConfig.defaultParameters ?? {
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 150
      };

      // Initialize retry config with defaults
      this.retryConfig = {
        maxRetries: validatedConfig.retryConfig?.maxRetries ?? 3,
        initialDelay: validatedConfig.retryConfig?.initialDelay ?? 300,
        maxDelay: validatedConfig.retryConfig?.maxDelay ?? 3000,
        backoffFactor: validatedConfig.retryConfig?.backoffFactor ?? 2
      };

      // Validate API key format and environment
      if (!process.env.NODE_ENV) {
        throw new Error('Environment not properly configured');
      }

      if (!this.apiKey.startsWith('sk-')) {
        throw new Error('Invalid API key format');
      }

      this.logger.info('OpenRouter service initialized successfully', {
        model: this.currentModel,
        apiUrl: this.apiUrl
      });
    } catch (error) {
      this.logger.error('Failed to initialize OpenRouter service', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Public methods
  public async sendChatMessage(userMessage: string): Promise<OpenRouterResponse> {
    try {
      this.logger.debug('Sending chat message', { model: this.currentModel });

      // Validate input
      const validatedMessage = messageSchema.parse(userMessage);

      // Set user message
      this.setUserMessage(validatedMessage);

      // Prepare payload
      const payload = this._preparePayload();

      // Send request with retry
      const response = await this._sendRequestWithRetry(payload);

      // Validate and return response
      const result = await this._validateResponse(response);

      this.logger.info('Chat message sent successfully', {
        model: this.currentModel,
        messageTokens: result.usage.prompt_tokens,
        responseTokens: result.usage.completion_tokens
      });

      return result;
    } catch (error) {
      this._handleError(error);
      throw error; // Re-throw after handling
    }
  }

  public setSystemMessage(message: string): void {
    try {
      // Validate input
      const validatedMessage = messageSchema.parse(message);
      this.systemMessage = validatedMessage;
      this.logger.debug('System message set', { messageLength: message.length });
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  public setUserMessage(message: string): void {
    try {
      // Validate input
      const validatedMessage = messageSchema.parse(message);
      this.userMessage = validatedMessage;
      this.logger.debug('User message set', { messageLength: message.length });
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  public setModel(name: string, parameters?: ModelParameters): void {
    try {
      // Validate input
      const validatedName = modelNameSchema.parse(name);
      const validatedParameters = parameters ? modelParametersSchema.parse(parameters) : undefined;

      this.currentModel = validatedName;
      if (validatedParameters) {
        this.modelParameters = { ...this.modelParameters, ...validatedParameters };
      }

      this.logger.info('Model configuration updated', {
        model: this.currentModel,
        parameters: this.modelParameters
      });
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  public setResponseFormat(schema: Record<string, any>): void {
    try {
      // Validate input
      const validatedSchema = responseFormatSchema.parse(schema);
      this.responseFormat = validatedSchema;
      this.logger.debug('Response format set', { schema });
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  // Private methods
  private _preparePayload(): OpenRouterPayload {
    const messages: ChatMessage[] = [];

    // Add system message if present
    if (this.systemMessage) {
      messages.push({
        role: 'system',
        content: this.systemMessage
      });
    }

    // Add user message if present
    if (this.userMessage) {
      messages.push({
        role: 'user',
        content: this.userMessage
      });
    }

    if (messages.length === 0) {
      const error = new OpenRouterError(
        'No messages to send. Set at least one message using setSystemMessage or setUserMessage.',
        'NO_MESSAGES'
      );
      this.logger.error('Failed to prepare payload', error);
      throw error;
    }

    // Prepare payload
    const payload: OpenRouterPayload = {
      model: this.currentModel,
      messages,
      ...this.modelParameters
    };

    // Add response format if present
    if (this.responseFormat) {
      console.log('Setting response format:', this.responseFormat);
      payload.response_format = {
        type: "json_schema",
        json_schema: this.responseFormat
      };
    }

    this.logger.debug('Payload prepared', {
      model: payload.model,
      messagesCount: messages.length,
      hasResponseFormat: !!this.responseFormat
    });

    return payload;
  }

  private async _sendRequestWithRetry(payload: OpenRouterPayload): Promise<Response> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        this.logger.debug('Sending request', { attempt: attempt + 1 });
        return await this._sendRequest(payload);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if it's not a retryable error
        if (!this._isRetryableError(lastError)) {
          this.logger.warn('Non-retryable error encountered', { error: lastError.message });
          throw lastError;
        }

        // Check if we should retry
        if (attempt === this.retryConfig.maxRetries) {
          const retryError = new OpenRouterError(
            `Failed after ${attempt} retries: ${lastError.message}`,
            'MAX_RETRIES_EXCEEDED',
            undefined,
            lastError
          );
          this.logger.error('Max retries exceeded', retryError);
          throw retryError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffFactor, attempt),
          this.retryConfig.maxDelay
        );

        this.logger.debug('Retrying request', {
          attempt: attempt + 1,
          delay,
          error: lastError.message
        });

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    // This should never happen due to the while loop condition
    throw lastError ?? new Error('Unknown error during retry');
  }

  private async _sendRequest(payload: OpenRouterPayload): Promise<Response> {
    try {
      console.log('OpenRouter request details:', {
        url: this.apiUrl,
        model: payload.model,
        messageCount: payload.messages.length,
        hasResponseFormat: !!payload.response_format,
        messages: payload.messages,
        responseFormat: payload.response_format,
        fullPayload: JSON.stringify(payload, null, 2)
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://10x-cards.vercel.app',
          'X-Title': '10X Cards'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('OpenRouter raw response text:', responseText);

      if (!response.ok) {
        console.error('OpenRouter API error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText,
          requestPayload: payload
        });

        const errorData = responseText.startsWith('{') ? JSON.parse(responseText) : { error: responseText };
        const error = new OpenRouterError(
          `API request failed: ${response.status} ${response.statusText}`,
          'API_ERROR',
          response.status,
          errorData
        );
        throw error;
      }

      // Create a new Response with the text we already read
      return new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      const networkError = new OpenRouterError(
        `Failed to send request: ${error instanceof Error ? error.message : String(error)}`,
        'NETWORK_ERROR'
      );
      this.logger.error('Network request failed', networkError);
      throw networkError;
    }
  }

  private async _validateResponse(response: Response): Promise<OpenRouterResponse> {
    try {
      const data = await response.json();
      console.log('Raw API response:', JSON.stringify(data, null, 2));
      
      try {
        return responseSchema.parse(data);
      } catch (validationError) {
        console.error('Response validation error:', validationError);
        throw new OpenRouterError(
          `Invalid response format: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`,
          'INVALID_RESPONSE',
          undefined,
          validationError
        );
      }
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      const validationError = new OpenRouterError(
        `Invalid response format: ${error instanceof Error ? error.message : String(error)}`,
        'INVALID_RESPONSE'
      );
      this.logger.error('Response validation failed', validationError);
      throw validationError;
    }
  }

  private _isRetryableError(error: Error): boolean {
    if (error instanceof OpenRouterError) {
      // Retry on network errors and 5xx server errors
      return error.code === 'NETWORK_ERROR' || 
             (error.code === 'API_ERROR' && error.status ? error.status >= 500 : false);
    }
    // Retry on network errors
    return error.message.includes('network') || error.message.includes('timeout');
  }

  private _handleError(error: unknown): void {
    // Log error details without sensitive information
    const errorDetails = error instanceof OpenRouterError ? {
      code: error.code,
      status: error.status,
      message: error.message
    } : {
      message: String(error)
    };

    // Log error with appropriate context
    if (error instanceof OpenRouterError) {
      this.logger.error(error.message, error, {
        code: error.code,
        status: error.status
      });
    } else {
      this.logger.error('An unexpected error occurred', error instanceof Error ? error : new Error(String(error)));
    }
  }
} 