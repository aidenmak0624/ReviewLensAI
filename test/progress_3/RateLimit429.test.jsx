import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");

vi.mock("../../src/api/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-1", email: "tester@example.com" },
    session: { access_token: "test-token" },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
  getAccessToken: vi.fn().mockResolvedValue("test-token"),
}));

import ChatInterface from "../../src/components/chat/ChatInterface";
import NewProduct from "../../src/pages/NewProduct";
import Product from "../../src/pages/Product";
import { supabase } from "../../src/api/supabaseClient";

function mock429(message) {
  return {
    ok: false,
    status: 429,
    json: async () => ({ error: "RATE_LIMITED", message, limit: 0, remaining: 0 }),
  };
}

describe("429 rate-limit handling", () => {
  let fetchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("ChatInterface shows the server rate-limit message instead of the generic error", async () => {
    const message =
      "Daily limit reached (50 chat questions/day). Your quota resets tomorrow (UTC).";
    fetchSpy.mockResolvedValue(mock429(message));

    render(
      <ChatInterface
        product={{ id: "test-uuid", name: "Notion", status: "ready" }}
        onCitationClick={() => {}}
      />
    );

    const input = screen.getByPlaceholderText("Ask about reviews...");
    fireEvent.change(input, { target: { value: "Summarize the reviews" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText(message)).toBeInTheDocument();
    });
    expect(
      screen.queryByText("Sorry, something went wrong. Please try again.")
    ).not.toBeInTheDocument();
  });

  it("NewProduct extraction shows the server rate-limit message in the error banner", async () => {
    const message =
      "Daily limit reached (5 product ingestions/day). Your quota resets tomorrow (UTC).";
    fetchSpy.mockResolvedValue(mock429(message));

    render(
      <MemoryRouter>
        <NewProduct />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Paste Text"));
    fireEvent.change(screen.getByPlaceholderText(/paste reviews here/i), {
      target: { value: "John - 5 stars - Great product!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/notion/i), {
      target: { value: "TestProduct" },
    });
    fireEvent.click(screen.getByText(/extract & preview/i));

    await waitFor(() => {
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  it("Insight tab shows the server rate-limit message with a Retry button", async () => {
    const message =
      "Daily limit reached (10 insight reports/day). Your quota resets tomorrow (UTC).";
    fetchSpy.mockResolvedValue(mock429(message));

    supabase.from.mockImplementation((table) => {
      if (table === "products") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: "test-uuid",
                    name: "Notion",
                    platform: "g2",
                    total_reviews: 1,
                    average_rating: "4.5",
                    status: "ready",
                    rating_distribution: { 5: 1 },
                    created_at: "2026-03-16T00:00:00Z",
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  {
                    id: "r1",
                    product_id: "test-uuid",
                    reviewer_name: "Alice",
                    rating: 5,
                    review_text: "Great product!",
                    review_date: "2026-03-15",
                    verified: true,
                    helpful_count: 3,
                  },
                ],
                error: null,
              }),
          }),
        }),
      };
    });

    render(
      <MemoryRouter initialEntries={["/product?id=test-uuid"]}>
        <Product />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Notion")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Insight"));
    fireEvent.click(screen.getByText("Generate AI Insight Report"));

    await waitFor(() => {
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });
});
