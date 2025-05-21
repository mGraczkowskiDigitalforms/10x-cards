import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../../src/pages/api/auth/login";
import type { APIContext } from "astro";

// Mock Supabase client
const mockSignInWithPassword = vi.fn();
const mockSupabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
  },
};

vi.mock("../../../src/db/supabase.server", () => ({
  createSupabaseServerInstance: vi.fn(() => mockSupabase),
}));

// Create mock Astro context
const createMockContext = (body?: object): APIContext =>
  ({
    request: new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }),
    cookies: {
      get: vi.fn(),
      has: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      headers: () => new Headers(),
    },
    url: new URL("http://localhost/api/auth/login"),
    clientAddress: "127.0.0.1",
    site: new URL("http://localhost"),
    generator: "10x-cards",
    props: {},
    redirect: vi.fn(),
    locals: {},
  }) as unknown as APIContext;

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully authenticate user with valid credentials", async () => {
    // Arrange
    const mockUser = { id: "123", email: "test@example.com" };
    const mockCredentials = { email: "test@example.com", password: "validPassword" };

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const context = createMockContext(mockCredentials);

    // Act
    const response = await POST(context);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      user: {
        id: mockUser.id,
        email: mockUser.email,
      },
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith(mockCredentials);
  });

  it("should return 400 for invalid credentials", async () => {
    // Arrange
    const mockCredentials = { email: "test@example.com", password: "wrongPassword" };

    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "Invalid credentials" },
    });

    const context = createMockContext(mockCredentials);

    // Act
    const response = await POST(context);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseData).toEqual({ error: "Invalid credentials" });
    expect(mockSignInWithPassword).toHaveBeenCalledWith(mockCredentials);
  });

  it("should return 400 for missing email", async () => {
    // Arrange
    const mockCredentials = { password: "password123" };
    const context = createMockContext(mockCredentials);

    // Act
    const response = await POST(context);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseData).toEqual({ error: "Email is required" });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("should return 400 for missing password", async () => {
    // Arrange
    const mockCredentials = { email: "test@example.com" };
    const context = createMockContext(mockCredentials);

    // Act
    const response = await POST(context);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseData).toEqual({ error: "Password is required" });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("should return 500 for internal server error", async () => {
    // Arrange
    const mockCredentials = { email: "test@example.com", password: "password" };

    mockSignInWithPassword.mockRejectedValueOnce(new Error("Internal error"));
    const context = createMockContext(mockCredentials);

    // Act
    const response = await POST(context);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(responseData).toEqual({ error: "Internal server error" });
    expect(mockSignInWithPassword).toHaveBeenCalledWith(mockCredentials);
  });

  it("should handle missing request body", async () => {
    // Arrange
    const context = createMockContext();

    // Act
    const response = await POST(context);
    const responseData = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseData).toEqual({ error: "Request body is required" });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});
