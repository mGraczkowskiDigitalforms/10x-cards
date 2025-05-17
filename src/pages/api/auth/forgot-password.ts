import type { APIRoute } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.server';

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 10000; // 10 seconds in milliseconds
const rateLimitMap = new Map<string, number>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const lastAttempt = rateLimitMap.get(email);

  if (lastAttempt && now - lastAttempt < RATE_LIMIT_WINDOW) {
    return true;
  }

  rateLimitMap.set(email, now);
  return false;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }), 
        { status: 400 }
      );
    }

    // Check rate limiting
    if (isRateLimited(email)) {
      return new Response(
        JSON.stringify({ 
          error: 'Please wait a few seconds before trying again' 
        }), 
        { status: 429 }
      );
    }

    const supabase = createSupabaseServerInstance({ 
      cookies, 
      headers: request.headers 
    });

    // Try to send reset password email - this will also check if user exists
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    // Handle specific error cases
    if (error) {
      // Check for user not found error
      if (error.message.includes('Email rate limit exceeded.')) {
        return new Response(
          JSON.stringify({ 
            error: 'Please wait a few minutes before trying again' 
          }), 
          { status: 429 }
        );
      }

      // For security reasons, we don't want to expose whether a user exists or not
      // We'll return the same message for non-existent users
      return new Response(
        JSON.stringify({ 
          error: 'If an account exists with this email, we have sent password reset instructions' 
        }), 
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'If an account exists with this email, we have sent password reset instructions' 
      }), 
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'An unexpected error occurred' 
      }), 
      { status: 500 }
    );
  }
}; 