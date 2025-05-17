import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { GenerateFlashcardsCommand } from '../../types';
import { GenerationService } from '../../lib/services/generation.service';

// Input validation schema
const generateFlashcardsSchema = z.object({
  text: z.string()
    .min(1000, 'Text must be at least 1000 characters long')
    .max(10000, 'Text cannot exceed 10000 characters')
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Verify user is authenticated
    if (!locals.user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized - User not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    const body = await request.json() as GenerateFlashcardsCommand;
    const validationResult = generateFlashcardsSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { text } = validationResult.data;
    
    const generationService = new GenerationService(locals.supabase, locals.user);
    const response = await generationService.generateFlashcards(text, locals.user.id);

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing flashcard generation request:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate flashcards. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 