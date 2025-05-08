import { z } from 'zod';
import type { APIRoute } from 'astro';
import type { GenerateFlashcardsCommand } from '../../types';
import { supabaseClient, DEFAULT_USER_ID } from '../../db/supabase.client';
import { GenerationService } from '../../lib/services/generation.service';

// Input validation schema
const generateFlashcardsSchema = z.object({
  text: z.string()
    .min(1000, 'Text must be at least 1000 characters long')
    .max(10000, 'Text cannot exceed 10000 characters')
});

export const POST: APIRoute = async ({ request }) => {
  try {
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
    
    const generationService = new GenerationService(supabaseClient);
    const response = await generationService.generateFlashcards(text, DEFAULT_USER_ID);

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing flashcard generation request:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 