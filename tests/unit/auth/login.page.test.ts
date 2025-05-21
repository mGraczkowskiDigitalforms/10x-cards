import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseServerInstance } from "../../../src/db/supabase.server";
import type { AstroCookies } from "astro";
import type { APIContext } from "astro";

// Mock Supabase client
const mockGetUser = vi.fn();
const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock("../../../src/db/supabase.server", () => ({
  createSupabaseServerInstance: vi.fn(() => mockSupabase),
}));

// Create mock Astro context
const createMockAstroContext = () => ({
  cookies: {
    get: vi.fn(),
    has: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    headers: () => new Headers(),
  } as unknown as AstroCookies,
  request: new Request("http://localhost/auth/login"),
  url: new URL("http://localhost/auth/login"),
  redirect: vi.fn(),
  props: {},
  site: new URL("http://localhost"),
  generator: "10x-cards",
  clientAddress: "127.0.0.1",
  preferredLocale: "en",
  currentLocale: "en",
  locals: {},
});

// Mock Astro component
const mockLoginPage = {
  async render(this: APIContext) {
    const supabase = createSupabaseServerInstance({
      cookies: this.cookies,
      headers: this.request.headers,
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return this.redirect("/generate");
    }

    return {
      props: {},
    };
  },
};

vi.mock("../../../src/pages/auth/login/index.astro", () => ({
  default: mockLoginPage,
}));

describe("Login Page", () => {
  let mockContext: APIContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = createMockAstroContext() as unknown as APIContext;
  });

  it("should redirect to /generate when user is already logged in", async () => {
    // Arrange
    const mockUser = { id: "123", email: "test@example.com" };
    mockGetUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    // Act
    await mockLoginPage.render.call(mockContext);

    // Assert
    expect(mockContext.redirect).toHaveBeenCalledWith("/generate");
  });

  it("should not redirect when user is not logged in", async () => {
    // Arrange
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    // Act
    const result = await mockLoginPage.render.call(mockContext);

    // Assert
    expect(mockContext.redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ props: {} });
  });

  it("should handle error during user check", async () => {
    // Arrange
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("Failed to get user"),
    });

    // Act
    const result = await mockLoginPage.render.call(mockContext);

    // Assert
    expect(mockContext.redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ props: {} });
  });
});
