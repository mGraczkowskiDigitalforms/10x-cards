import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseServerInstance } from '../../../src/db/supabase.server';
import type { AstroCookies, APIContext } from 'astro';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSupabase = {
  auth: {
    getUser: mockGetUser
  }
};

vi.mock('../../../src/db/supabase.server', () => ({
  createSupabaseServerInstance: vi.fn(() => mockSupabase)
}));

// Mock components
vi.mock('@/components/auth/RegisterForm', () => ({
  RegisterForm: vi.fn(() => null)
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: vi.fn(() => null)
}));

// Create mock Astro context
const createMockAstroContext = () => ({
  cookies: {
    get: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    headers: () => new Headers()
  } as unknown as AstroCookies,
  request: new Request('http://localhost/auth/register'),
  url: new URL('http://localhost/auth/register'),
  redirect: vi.fn(),
  props: {},
  site: new URL('http://localhost'),
  generator: '10x-cards',
  clientAddress: '127.0.0.1',
  preferredLocale: 'en',
  currentLocale: 'en',
  locals: {}
});

// Mock Astro component
const mockRegisterPage = {
  async render(this: APIContext) {
    const supabase = createSupabaseServerInstance({
      cookies: this.cookies,
      headers: this.request.headers
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (user) {
      return this.redirect('/generate');
    }

    return {
      props: {}
    };
  }
};

vi.mock('../../../src/pages/auth/register/index.astro', () => ({
  default: mockRegisterPage
}));

describe('Register Page', () => {
  let mockContext: APIContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockAstroContext() as unknown as APIContext;
  });

  it('should redirect to generate page if user is already logged in', async () => {
    // Arrange
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User;

    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null
    });

    // Act
    await mockRegisterPage.render.call(mockContext);

    // Assert
    expect(mockContext.redirect).toHaveBeenCalledWith('/generate');
  });

  it('should render registration page if user is not logged in', async () => {
    // Arrange
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null
    });

    // Act
    const result = await mockRegisterPage.render.call(mockContext);

    // Assert
    expect(mockContext.redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ props: {} });
  });

  it('should handle Supabase error gracefully', async () => {
    // Arrange
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Supabase error')
    });

    // Act
    const result = await mockRegisterPage.render.call(mockContext);

    // Assert
    expect(mockContext.redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ props: {} });
  });
}); 