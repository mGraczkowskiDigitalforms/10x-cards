import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../../src/pages/api/auth/logout';
import { createSupabaseServerInstance } from '../../../src/db/supabase.server';

// Mock Supabase client
vi.mock('../../../src/db/supabase.server', () => ({
  createSupabaseServerInstance: vi.fn()
}));

describe('POST /api/auth/logout', () => {
  let mockRequest: Request;
  let mockCookies: any;
  let mockHeaders: Headers;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders = new Headers();
    mockCookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn()
    };
  });

  it('should log out user successfully', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValueOnce({
          error: null
        })
      }
    };

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase as any);

    mockRequest = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as any);

    // Assert
    expect(response.status).toBe(200);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('should handle logout error', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValueOnce({
          error: { message: 'Failed to sign out' }
        })
      }
    };

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase as any);

    mockRequest = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as any);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Failed to sign out'
    });
  });

  it('should handle unexpected errors', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockRejectedValueOnce(new Error('Unexpected error'))
      }
    };

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase as any);

    mockRequest = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as any);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Internal server error'
    });
  });
}); 