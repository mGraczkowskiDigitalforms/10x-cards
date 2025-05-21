import type { OpenRouterConfig } from "./openrouter.types";

/**
 * Default configuration for OpenRouter service
 *
 * @remarks
 * These are safe defaults that can be overridden when initializing the service.
 * API key and URL should be provided via environment variables.
 */
export const DEFAULT_OPENROUTER_CONFIG: Omit<OpenRouterConfig, "apiKey"> = {
  apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  defaultModel: "gpt-4o-mini",
  defaultParameters: {
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 1000,
  },
  retryConfig: {
    maxRetries: 3,
    initialDelay: 300,
    maxDelay: 3000,
    backoffFactor: 2,
  },
};

/**
 * Creates a complete OpenRouter configuration by combining default config with provided API key
 *
 * @param apiKey - OpenRouter API key (required)
 * @param overrides - Optional configuration overrides
 * @returns Complete OpenRouter configuration
 */
export function createOpenRouterConfig(apiKey: string, overrides?: Partial<OpenRouterConfig>): OpenRouterConfig {
  if (!apiKey) {
    throw new Error("OpenRouter API key is required");
  }

  return {
    ...DEFAULT_OPENROUTER_CONFIG,
    apiKey,
    ...overrides,
  };
}

/**
 * Environment variables required for OpenRouter service
 */
export const OPENROUTER_ENV = {
  API_KEY: "OPENROUTER_API_KEY",
  API_URL: "OPENROUTER_API_URL",
} as const;

/**
 * Creates OpenRouter configuration from environment variables
 *
 * @param overrides - Optional configuration overrides
 * @returns OpenRouter configuration
 * @throws Error if required environment variables are missing
 */
export function createOpenRouterConfigFromEnv(overrides?: Partial<OpenRouterConfig>): OpenRouterConfig {
  //   // Debug logging
  //   console.log('Environment variables:', {
  //     available: import.meta.env,
  //     apiKey: import.meta.env[OPENROUTER_ENV.API_KEY],
  //     apiUrl: import.meta.env[OPENROUTER_ENV.API_URL]
  //   });

  const apiKey = import.meta.env[OPENROUTER_ENV.API_KEY];
  const apiUrl = import.meta.env[OPENROUTER_ENV.API_URL];

  if (!apiKey) {
    throw new Error(`Missing required environment variable: ${OPENROUTER_ENV.API_KEY}`);
  }

  return createOpenRouterConfig(apiKey, {
    ...overrides,
    apiUrl: apiUrl ?? DEFAULT_OPENROUTER_CONFIG.apiUrl,
  });
}
