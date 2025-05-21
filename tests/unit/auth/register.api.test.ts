import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIRoute } from "astro";
import { POST } from "../../../src/pages/api/auth/register";
import { createSupabaseServerInstance } from "../../../src/db/supabase.server";
import type { AstroCookies } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
vi.mock("../../../src/db/supabase.server", () => ({
  createSupabaseServerInstance: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  })),
}));

describe("POST /api/auth/register", () => {
  let mockRequest: Request;
  let mockCookies: AstroCookies;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    } as unknown as AstroCookies;
  });

  it("should register a new user successfully", async () => {
    // Arrange
    const mockUser = { id: "123", email: "test@example.com" };
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase);

    mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as Parameters<APIRoute>[0]);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      user: {
        id: mockUser.id,
        email: mockUser.email,
      },
    });
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should handle registration error", async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "Email already exists" },
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase);

    mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as Parameters<APIRoute>[0]);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Email already exists",
    });
  });

  it("should handle auto-login error after successful registration", async () => {
    // Arrange
    const mockUser = { id: "123", email: "test@example.com" };
    const mockSupabase = {
      auth: {
        signUp: vi.fn().mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValueOnce({
          data: null,
          error: { message: "Unable to login" },
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase);

    mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as Parameters<APIRoute>[0]);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Unable to login",
    });
  });

  it("should handle missing request body", async () => {
    // Arrange
    mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as Parameters<APIRoute>[0]);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Internal server error",
    });
  });

  it("should handle invalid JSON in request body", async () => {
    // Arrange
    mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as Parameters<APIRoute>[0]);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: "Internal server error",
    });
  });
});
