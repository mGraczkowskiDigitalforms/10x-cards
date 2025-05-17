import type { MiddlewareHandler } from 'astro';
import type { AstroCookies } from 'astro';
import { createSupabaseServerInstance } from '../db/supabase.server';
import type { AstroLocals } from '../types';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/reset-password',
];

// API paths that require authentication
const API_PATHS = ['/api/'];

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Initialize Supabase client for all requests
  const supabase = createSupabaseServerInstance({ 
    cookies: context.cookies as AstroCookies,
    headers: context.request.headers 
  });

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser();

  // Add supabase client and user to locals
  context.locals.supabase = supabase;
  context.locals.user = user;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(context.url.pathname)) {
    return next();
  }

  // Check auth only for API paths
  if (context.url.pathname.startsWith('/api/')) {
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return next();
}; 