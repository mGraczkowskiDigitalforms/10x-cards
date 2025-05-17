import type { MiddlewareHandler, APIContext } from 'astro';
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

export const authMiddleware: MiddlewareHandler = async (context, next) => {
  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(context.url.pathname)) {
    return next();
  }

  // Initialize Supabase client
  const supabase = createSupabaseServerInstance({ 
    cookies: context.cookies as AstroCookies,
    headers: context.request.headers 
  });

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser();

  // Set supabase client and user in locals
  context.locals.supabase = supabase;
  context.locals.user = user;

  return next();
}; 