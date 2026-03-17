import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/api/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import Product from "../../src/pages/Product";
import { supabase } from "../../src/api/supabaseClient";

function renderProduct(id = "test-uuid") {
  return render(
    <MemoryRouter initialEntries={[`/product?id=${id}`]}>
      <Product />
    </MemoryRouter>
  );
}

const mockProduct = {
  id: "test-uuid",
  name: "Notion",
  platform: "g2",
  total_reviews: 42,
  average_rating: "4.35",
  status: "ready",
  ingestion_method: "csv_upload",
  rating_distribution: { 1: 1, 2: 3, 3: 5, 4: 15, 5: 18 },
  created_at: "2026-03-16T00:00:00Z",
};

const mockReviews = [
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
];

function setupMock(productData, reviewsData = mockReviews) {
  supabase.from.mockImplementation((table) => {
    if (table === "products") {
      return {
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: productData, error: null }),
          }),
        }),
      };
    }
    if (table === "reviews") {
      return {
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({ data: reviewsData, error: null }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    };
  });
}

describe("Product", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton initially", () => {
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => new Promise(() => {}),
          order: () => new Promise(() => {}),
        }),
      }),
    });
    renderProduct();
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows product not found when product does not exist", async () => {
    setupMock(null, []);
    renderProduct();
    await waitFor(() => {
      expect(screen.getByText("Product not found.")).toBeInTheDocument();
    });
  });

  it("renders product name as heading", async () => {
    setupMock(mockProduct);
    renderProduct();
    await waitFor(() => {
      expect(screen.getByText("Notion")).toBeInTheDocument();
    });
  });

  it("shows platform and review count in subtitle", async () => {
    setupMock(mockProduct);
    renderProduct();
    await waitFor(() => {
      expect(screen.getByText(/G2/)).toBeInTheDocument();
      expect(screen.getByText(/42 reviews/)).toBeInTheDocument();
      expect(screen.getByText(/4\.3 stars/)).toBeInTheDocument();
    });
  });

  it("renders all three tabs (Summary, Reviews, Chat)", async () => {
    setupMock(mockProduct);
    renderProduct();
    await waitFor(() => {
      expect(screen.getByText("Summary")).toBeInTheDocument();
      expect(screen.getByText("Reviews")).toBeInTheDocument();
      expect(screen.getByText("Chat")).toBeInTheDocument();
    });
  });

  it("defaults to Summary tab with IngestionSummary", async () => {
    setupMock(mockProduct);
    renderProduct();
    await waitFor(() => {
      expect(screen.getByText("Ingestion Summary")).toBeInTheDocument();
    });
  });

  it("switches to Reviews tab", async () => {
    setupMock(mockProduct);
    renderProduct();
    await waitFor(() => screen.getByText("Reviews"));
    fireEvent.click(screen.getByText("Reviews"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search reviews/i)).toBeInTheDocument();
    });
  });

  it("switches to Chat tab", async () => {
    setupMock(mockProduct);
    renderProduct();
    await waitFor(() => screen.getByText("Chat"));
    fireEvent.click(screen.getByText("Chat"));
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/ask about reviews/i)
      ).toBeInTheDocument();
    });
  });

  it("has a back to dashboard link", async () => {
    setupMock(mockProduct);
    renderProduct();
    await waitFor(() => {
      const backLink = screen.getByText(/back to dashboard/i);
      expect(backLink.closest("a")).toHaveAttribute("href", "/");
    });
  });
});
