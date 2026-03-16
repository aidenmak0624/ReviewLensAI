import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing Dashboard
vi.mock("../src/api/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import Dashboard from "../src/pages/Dashboard";
import { supabase } from "../src/api/supabaseClient";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeletons initially", () => {
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => new Promise(() => {}), // never resolves — keeps loading
      }),
    });
    renderDashboard();
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("shows empty state when no products exist", async () => {
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("No products yet")).toBeInTheDocument();
    });
  });

  it("shows 'Add Your First Product' CTA in empty state", async () => {
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    });
    renderDashboard();
    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /add your first product/i })
      ).toBeInTheDocument();
    });
  });

  it("renders product cards when products exist", async () => {
    const mockProducts = [
      {
        id: "abc-123",
        name: "Notion",
        platform: "g2",
        total_reviews: 50,
        average_rating: "4.25",
        status: "ready",
        created_at: "2026-03-16T00:00:00Z",
        rating_distribution: { 1: 2, 2: 3, 3: 5, 4: 20, 5: 20 },
      },
    ];
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockProducts, error: null }),
      }),
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("Notion")).toBeInTheDocument();
    });
  });

  it("displays correct stats overview tiles", async () => {
    const mockProducts = [
      {
        id: "1",
        name: "Product A",
        platform: "g2",
        total_reviews: 30,
        average_rating: "4.00",
        status: "ready",
        created_at: "2026-03-16T00:00:00Z",
      },
      {
        id: "2",
        name: "Product B",
        platform: "amazon",
        total_reviews: 20,
        average_rating: "3.50",
        status: "ready",
        created_at: "2026-03-15T00:00:00Z",
      },
    ];
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockProducts, error: null }),
      }),
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // total products
      expect(screen.getByText("50")).toBeInTheDocument(); // total reviews (30+20)
      expect(screen.getByText("3.75")).toBeInTheDocument(); // avg rating (4+3.5)/2
    });
  });

  it("renders platform badge on product card", async () => {
    const mockProducts = [
      {
        id: "1",
        name: "Slack",
        platform: "g2",
        total_reviews: 10,
        average_rating: "4.50",
        status: "ready",
        created_at: "2026-03-16T00:00:00Z",
      },
    ];
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockProducts, error: null }),
      }),
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("G2")).toBeInTheDocument();
    });
  });

  it("renders status badge on product card", async () => {
    const mockProducts = [
      {
        id: "1",
        name: "Figma",
        platform: "capterra",
        total_reviews: 5,
        average_rating: "3.00",
        status: "ingesting",
        created_at: "2026-03-16T00:00:00Z",
      },
    ];
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockProducts, error: null }),
      }),
    });
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText("ingesting")).toBeInTheDocument();
    });
  });

  it("product card links to /product?id=<uuid>", async () => {
    const mockProducts = [
      {
        id: "test-uuid-123",
        name: "Zoom",
        platform: "amazon",
        total_reviews: 15,
        average_rating: "4.00",
        status: "ready",
        created_at: "2026-03-16T00:00:00Z",
      },
    ];
    supabase.from.mockReturnValue({
      select: () => ({
        order: () => Promise.resolve({ data: mockProducts, error: null }),
      }),
    });
    renderDashboard();
    await waitFor(() => {
      const link = screen.getByText("Zoom").closest("a");
      expect(link).toHaveAttribute("href", "/product?id=test-uuid-123");
    });
  });
});
