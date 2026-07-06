import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

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

import NewProduct from "../../src/pages/NewProduct";

function renderNewProduct() {
  return render(
    <MemoryRouter>
      <NewProduct />
    </MemoryRouter>
  );
}

describe("NewProduct — Phase 1 (ingestion flow)", () => {
  // Extraction goes through raw fetch to the extract-reviews Edge Function,
  // not supabase.functions.invoke — mock the actual transport.
  let fetchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("disables extract button when product name is empty", () => {
    renderNewProduct();
    const btn = screen.getByText(/extract & preview/i);
    expect(btn).toBeDisabled();
  });

  it("disables extract button when product name is filled but no review data", () => {
    renderNewProduct();
    fireEvent.change(screen.getByPlaceholderText(/notion/i), {
      target: { value: "TestProduct" },
    });
    const btn = screen.getByText(/extract & preview/i);
    expect(btn).toBeDisabled();
  });

  it("shows anti-bot warning on URL tab", () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("URL"));
    expect(screen.getByText(/anti-bot measures/i)).toBeInTheDocument();
  });

  it("shows AI column mapping text on CSV tab", () => {
    renderNewProduct();
    expect(screen.getByText(/ai will map columns automatically/i)).toBeInTheDocument();
  });

  it("shows character count on Paste tab", () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("Paste Text"));
    expect(screen.getByText(/0 characters/i)).toBeInTheDocument();
  });

  it("updates character count when text is pasted", () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("Paste Text"));
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(screen.getByText(/11 characters/i)).toBeInTheDocument();
  });

  it("shows extracting state when extract button is clicked", async () => {
    // Mock the edge function to never resolve (keeps loading state)
    fetchSpy.mockReturnValue(new Promise(() => {}));

    renderNewProduct();
    // Switch to paste and add content
    fireEvent.click(screen.getByText("Paste Text"));
    fireEvent.change(screen.getByPlaceholderText(/paste reviews here/i), {
      target: { value: "John - 5 stars - Great product!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/notion/i), {
      target: { value: "TestProduct" },
    });

    fireEvent.click(screen.getByText(/extract & preview/i));
    expect(screen.getByText(/extracting reviews/i)).toBeInTheDocument();
  });

  it("shows error banner when extraction fails", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: "OpenAI API error" }),
    });

    renderNewProduct();
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
      expect(screen.getByText("OpenAI API error")).toBeInTheDocument();
    });
  });

  it("shows preview table after successful extraction", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [
          {
            reviewer_name: "John",
            rating: 5,
            review_text: "Great product!",
            review_date: "2026-03-01",
          },
          {
            reviewer_name: "Jane",
            rating: 3,
            review_text: "Decent but could improve.",
            review_date: "2026-02-28",
          },
        ],
        count: 2,
        extraction_method: "openai_function_calling",
      }),
    });

    renderNewProduct();
    fireEvent.click(screen.getByText("Paste Text"));
    fireEvent.change(screen.getByPlaceholderText(/paste reviews here/i), {
      target: { value: "John - 5 stars - Great product!" },
    });
    fireEvent.change(screen.getByPlaceholderText(/notion/i), {
      target: { value: "TestProduct" },
    });

    fireEvent.click(screen.getByText(/extract & preview/i));
    await waitFor(() => {
      expect(screen.getByText("Review Preview")).toBeInTheDocument();
      expect(screen.getByText("Extracted Reviews (2)")).toBeInTheDocument();
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Jane")).toBeInTheDocument();
    });
  });

  it("shows back to input button on preview step", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [
          { reviewer_name: "Test", rating: 4, review_text: "Good", review_date: null },
        ],
        count: 1,
      }),
    });

    renderNewProduct();
    fireEvent.click(screen.getByText("Paste Text"));
    fireEvent.change(screen.getByPlaceholderText(/paste reviews here/i), {
      target: { value: "Test review" },
    });
    fireEvent.change(screen.getByPlaceholderText(/notion/i), {
      target: { value: "Product" },
    });

    fireEvent.click(screen.getByText(/extract & preview/i));
    await waitFor(() => {
      expect(screen.getByText("Back to input")).toBeInTheDocument();
    });
  });

  it("returns to input step when back button is clicked", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [
          { reviewer_name: "Test", rating: 4, review_text: "Good", review_date: null },
        ],
        count: 1,
      }),
    });

    renderNewProduct();
    fireEvent.click(screen.getByText("Paste Text"));
    fireEvent.change(screen.getByPlaceholderText(/paste reviews here/i), {
      target: { value: "Test review" },
    });
    fireEvent.change(screen.getByPlaceholderText(/notion/i), {
      target: { value: "Product" },
    });

    fireEvent.click(screen.getByText(/extract & preview/i));
    await waitFor(() => screen.getByText("Back to input"));
    fireEvent.click(screen.getByText("Back to input"));
    expect(screen.getByText(/extract & preview/i)).toBeInTheDocument();
  });

  it("shows confirm button with review count", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({
        reviews: [
          { reviewer_name: "A", rating: 5, review_text: "Great", review_date: null },
          { reviewer_name: "B", rating: 4, review_text: "Good", review_date: null },
          { reviewer_name: "C", rating: 3, review_text: "OK", review_date: null },
        ],
        count: 3,
      }),
    });

    renderNewProduct();
    fireEvent.click(screen.getByText("Paste Text"));
    fireEvent.change(screen.getByPlaceholderText(/paste reviews here/i), {
      target: { value: "Reviews here" },
    });
    fireEvent.change(screen.getByPlaceholderText(/notion/i), {
      target: { value: "Product" },
    });

    fireEvent.click(screen.getByText(/extract & preview/i));
    await waitFor(() => {
      expect(screen.getByText(/confirm & ingest 3 reviews/i)).toBeInTheDocument();
    });
  });
});
