import { describe, it, expect, vi, beforeEach } from "vitest";
import type { APIRoute } from "astro";
import { POST } from "../../../src/pages/api/auth/logout";
import { createSupabaseServerInstance } from "../../../src/db/supabase.server";
import type { AstroCookies } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
vi.mock("../../../src/db/supabase.server", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe("POST /api/auth/logout", () => {
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

  it("should log out user successfully", async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValueOnce({
          error: null,
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase);

    mockRequest = new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as Parameters<APIRoute>[0]);

    // Assert
    expect(response.status).toBe(200);
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it("should handle logout error", async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockResolvedValueOnce({
          error: { message: "Failed to sign out" },
        }),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase);

    mockRequest = new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // Act
    const response = await POST({ request: mockRequest, cookies: mockCookies } as Parameters<APIRoute>[0]);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: "Failed to sign out",
    });
  });

  it("should handle unexpected errors", async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        signOut: vi.fn().mockRejectedValueOnce(new Error("Unexpected error")),
      },
    } as unknown as SupabaseClient;

    vi.mocked(createSupabaseServerInstance).mockReturnValueOnce(mockSupabase);

    mockRequest = new Request("http://localhost/api/auth/logout", {
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
});
