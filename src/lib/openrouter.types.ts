import { z } from "zod";

// Types
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterConfig {
  apiKey: string;
  apiUrl: string;
  defaultModel: string;
  defaultParameters?: ModelParameters;
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

// API Types
export interface OpenRouterPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_schema";
    json_schema: Record<string, unknown>;
  };
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
  created: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Error Types
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

// Input Validation Schemas
export const messageSchema = z.string().min(1, "Message cannot be empty").max(32768, "Message is too long");

export const modelParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  max_tokens: z.number().min(1).optional(),
});

export const modelNameSchema = z
  .string()
  .min(1, "Model name cannot be empty")
  .refine((val) => !val.includes(" "), "Model name cannot contain spaces");

export const responseFormatSchema = z.object({
  name: z.string(),
  schema: z.object({
    type: z.string(),
    properties: z.record(z.unknown()),
    required: z.array(z.string()),
  }),
});

// Configuration Validation Schemas
export const configSchema = z.object({
  apiKey: z.string().min(1),
  apiUrl: z.string().url(),
  defaultModel: z.string().min(1),
  defaultParameters: modelParametersSchema.optional(),
  retryConfig: z
    .object({
      maxRetries: z.number().min(0).max(5).optional(),
      initialDelay: z.number().min(100).max(1000).optional(),
      maxDelay: z.number().min(1000).max(10000).optional(),
      backoffFactor: z.number().min(1).max(3).optional(),
    })
    .optional(),
});

// Response Validation Schemas
export const chatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const responseSchema = z.object({
  id: z.string(),
  choices: z.array(
    z.object({
      message: chatMessageSchema,
      finish_reason: z.string(),
    })
  ),
  created: z.number(),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});
