import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { FlashcardProposalDto, GenerationCreateResponseDto } from '../../types';
import { AiService } from './ai.service';

// Mock API service response
const mockApiResponse = [
  {
    front: "What is the capital of France?",
    back: "Paris",
    source: "ai-full"
  },
  {
    front: "What is the largest planet in our solar system?",
    back: "Jupiter",
    source: "ai-full"
  },
  {
    front: "Who wrote 'Romeo and Juliet'?",
    back: "William Shakespeare",
    source: "ai-full"
  }
] as const;

// AI Service error types
type AiServiceError = {
  code: 'TIMEOUT' | 'API_ERROR' | 'INVALID_RESPONSE';
  message: string;
};

export class GenerationService {
  private readonly aiService: AiService;

  constructor(
    private readonly supabaseClient: SupabaseClient<Database>
  ) {
    this.aiService = new AiService();
  }

  private generateTextHash(text: string): string {
    return crypto
      .createHash('md5')
      .update(text)
      .digest('hex');
  }

  private async callAiService(text: string): Promise<FlashcardProposalDto[]> {
    try {
      return await this.aiService.generateFlashcards(text);
    } catch (error) {
      const aiError = error as AiServiceError;
      
      await this.logGenerationError({
        userId: 'system',
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
    metadata?: Record<string, unknown>;
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
          model: 'gpt-4-mock',
          metadata: {
            timestamp,
            environment: process.env.NODE_ENV || 'development',
            ...params.metadata
          }
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
      throw new Error('Generation with this text already exists');
    }

    const { data: generation, error: generationError } = await this.supabaseClient
      .from('generations')
      .insert({
        user_id: params.userId,
        model: 'gpt-4-mock',
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
      throw new Error(`Failed to save generation: ${generationError.message}`);
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
      throw error;
    }
  }
} 