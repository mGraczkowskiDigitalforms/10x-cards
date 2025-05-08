import type { APIRoute } from 'astro';
import { z } from 'zod';
import type { CreateFlashcardsCommand, FlashcardCreateDto } from '../../types';
import { supabaseClient, DEFAULT_USER_ID } from '../../db/supabase.client';
import { FlashcardService, FlashcardServiceError } from '../../lib/services/flashcard.service';

// Validation schema for individual flashcard
const flashcardCreateSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.enum(['ai-full', 'ai-edited', 'manual']),
  generation_id: z.number().nullable()
}).refine((data) => {
  // Validate that generation_id is present when source is AI-related
  if (['ai-full', 'ai-edited'].includes(data.source)) {
    return data.generation_id !== null;
  }
  return true;
}, {
  message: "generation_id is required when source is 'ai-full' or 'ai-edited'"
});

// Validation schema for the entire request body
const createFlashcardsSchema = z.object({
  flashcards: z.array(flashcardCreateSchema)
    .min(1)
    .max(100) // Reasonable limit to prevent abuse
});

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const flashcardService = new FlashcardService(supabaseClient);
    const createdFlashcards = await flashcardService.createFlashcards(
      validationResult.data.flashcards,
      DEFAULT_USER_ID
    );

    return new Response(JSON.stringify({
      flashcards: createdFlashcards,
      message: 'Flashcards creation completed'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing flashcards creation:', error);

    if (error instanceof FlashcardServiceError) {
      const statusCode = 
        error.code === 'DUPLICATE_FLASHCARDS' || error.code === 'EXISTING_FLASHCARDS'
          ? 409 // Conflict
          : error.code === 'DATABASE_ERROR'
            ? 503 // Service Unavailable
            : error.code === 'INVALID_GENERATION_IDS'
              ? 422 // Unprocessable Entity
              : 400; // Bad Request

      return new Response(JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.details
      }), {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 