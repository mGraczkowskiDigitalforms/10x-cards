import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { FlashcardProposalDto, GenerationCreateResponseDto } from '../../types';
import { OpenRouterService } from '../openrouter.service';
import { createOpenRouterConfigFromEnv } from '../openrouter.config';
import { DEFAULT_USER_ID } from '../../db/supabase.client';

// AI Service error types
type AiServiceError = {
  code: 'TIMEOUT' | 'API_ERROR' | 'INVALID_RESPONSE';
  message: string;
};

export class GenerationService {
  private readonly openRouter: OpenRouterService;

  constructor(
    private readonly supabaseClient: SupabaseClient<Database>
  ) {
    this.openRouter = new OpenRouterService(createOpenRouterConfigFromEnv({
      defaultModel: 'gpt-4o-mini',
      defaultParameters: {
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 1000
      }
    }));

    // Set up system message for flashcard generation
    this.openRouter.setSystemMessage(`You are a helpful AI assistant that creates high-quality flashcards from provided text.
Your task is to generate concise and effective flashcards following these rules:

1. Create clear, focused questions for the front and concise, accurate answers for the back
2. Each flashcard should test a single concept
3. Questions should promote active recall
4. Avoid yes/no questions
5. Keep both sides concise but complete
6. Use clear, simple language
7. Maintain factual accuracy
8. Include 5-10 most important concepts from the text
9. Flashcards should be written in the language of the provided text

IMPORTANT: You must respond ONLY with a valid JSON object containing a "flashcards" array. Each flashcard in the array must have exactly two properties: "front" and "back". Do not include any explanations or additional text.

Example response format:
{
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris"
    }
  ]
}`);

    // Set response format to ensure proper JSON structure
    this.openRouter.setResponseFormat({
      name: "flashcards",
      schema: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" }
              },
              required: ["front", "back"]
            }
          }
        },
        required: ["flashcards"]
      }
    });
  }

  private generateTextHash(text: string): string {
    return crypto
      .createHash('md5')
      .update(text)
      .digest('hex');
  }

  private async callAiService(text: string): Promise<FlashcardProposalDto[]> {
    try {
      // Set the user's text as input
      this.openRouter.setUserMessage(text);
      
      // Get response from OpenRouter
      const response = await this.openRouter.sendChatMessage(text);
      
      try {
        // Log raw response for debugging
        console.log('OpenRouter raw response:', {
          status: response.choices?.[0]?.finish_reason,
          content: response.choices?.[0]?.message?.content?.substring(0, 200) + '...',
          model: response.model,
          usage: response.usage
        });

        // Parse the response
        const responseData = JSON.parse(response.choices[0].message.content);
        
        // Validate response structure
        if (!responseData || typeof responseData !== 'object' || !Array.isArray(responseData.flashcards)) {
          throw new Error('Invalid response structure: expected object with flashcards array');
        }

        // Validate and transform each flashcard
        return responseData.flashcards.map((card: unknown, index: number) => {
          if (!card || typeof card !== 'object') {
            throw new Error(`Flashcard at index ${index} is not an object`);
          }

          const typedCard = card as { front?: string; back?: string };
          
          if (!typedCard.front || !typedCard.back) {
            throw new Error(`Flashcard at index ${index} is missing required properties`);
          }

          return {
            front: typedCard.front,
            back: typedCard.back,
            source: 'ai-full' as const
          };
        });
      } catch (parseError: unknown) {
        if (parseError instanceof Error) {
          throw new Error(`Invalid response format: ${parseError.message}`);
        }
        throw new Error('Invalid response format: Unknown parsing error');
      }
    } catch (error) {
      // Log detailed error information
      console.error('OpenRouter API error:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        responseError: error instanceof Error && 'response' in error ? 
          await (error as any).response?.text() : undefined
      });

      const aiError = error as AiServiceError;
      
      await this.logGenerationError({
        userId: DEFAULT_USER_ID,
        errorCode: aiError.code || 'API_ERROR',
        errorMessage: aiError.message || 'Unknown AI service error',
        sourceTextHash: this.generateTextHash(text),
        sourceTextLength: text.length
      });

      throw new Error(`AI Service error: ${aiError.message || 'Unknown error'}`);
    }
  }

  private async checkExistingGeneration(userId: string, sourceTextHash: string) {
    const { data: existingGeneration } = await this.supabaseClient
      .from('generations')
      .select()
      .match({ user_id: userId, source_text_hash: sourceTextHash })
      .single();

    return existingGeneration;
  }

  private async logGenerationError(params: {
    userId: string;
    errorCode: string;
    errorMessage: string;
    sourceTextHash: string;
    sourceTextLength: number;
  }) {
    try {
      const timestamp = new Date().toISOString();
      const { error } = await this.supabaseClient
        .from('generation_error_logs')
        .insert({
          user_id: params.userId,
          error_code: params.errorCode,
          error_message: params.errorMessage,
          source_text_hash: params.sourceTextHash,
          source_text_length: params.sourceTextLength,
          model: 'gpt-4'
        });

      if (error) {
        console.error('Failed to log generation error:', {
          error,
          params,
          timestamp
        });
      }
    } catch (error) {
      // Log to console as last resort if we can't save to database
      console.error('Critical error while logging generation error:', {
        error,
        originalError: params,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async saveGeneration(params: {
    userId: string;
    sourceTextHash: string;
    textLength: number;
    flashcardsCount: number;
    generationDuration: number;
  }) {
    // Check for existing generation with the same hash
    const existingGeneration = await this.checkExistingGeneration(params.userId, params.sourceTextHash);
    
    if (existingGeneration) {
      await this.logGenerationError({
        userId: params.userId,
        errorCode: 'DUPLICATE_HASH',
        errorMessage: 'Generation with this text hash already exists',
        sourceTextHash: params.sourceTextHash,
        sourceTextLength: params.textLength
      });
      throw new Error('Flashcards for this text have already been generated. Please use different text or check your existing flashcards.');
    }

    const { data: generation, error: generationError } = await this.supabaseClient
      .from('generations')
      .insert({
        user_id: params.userId,
        model: 'gpt-4',
        generated_count: params.flashcardsCount,
        source_text_hash: params.sourceTextHash,
        source_text_length: params.textLength,
        generation_duration: params.generationDuration,
      })
      .select()
      .single();

    if (generationError) {
      await this.logGenerationError({
        userId: params.userId,
        errorCode: 'DB_ERROR',
        errorMessage: generationError.message,
        sourceTextHash: params.sourceTextHash,
        sourceTextLength: params.textLength
      });
      throw new Error(generationError instanceof Error ? generationError.message : 'Failed to generate flashcards. Please try again.');
    }

    return generation;
  }

  async generateFlashcards(text: string, userId: string): Promise<GenerationCreateResponseDto> {
    const startTime = Date.now();
    
    try {
      const sourceTextHash = this.generateTextHash(text);
      const flashcardsProposal = await this.callAiService(text);
      
      const generationDuration = Date.now() - startTime;
      
      const generation = await this.saveGeneration({
        userId,
        sourceTextHash,
        textLength: text.length,
        flashcardsCount: flashcardsProposal.length,
        generationDuration,
      });

      return {
        generation: {
          id: generation.id,
          generated_count: generation.generated_count,
          created_at: generation.created_at
        },
        flashcards_proposal: flashcardsProposal
      };
    } catch (error) {
      await this.logGenerationError({
        userId,
        errorCode: 'GENERATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        sourceTextHash: this.generateTextHash(text),
        sourceTextLength: text.length
      });
      
      throw new Error(error instanceof Error ? error.message : 'Failed to generate flashcards. Please try again.');
    }
  }
} 