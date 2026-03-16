import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/api/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    })),
  },
}));

import App from "../../src/App";

function renderApp(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe("Routing", () => {
  it("renders Dashboard at /", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  it("renders NewProduct at /new", async () => {
    renderApp("/new");
    await waitFor(() => {
      expect(screen.getByText("Add New Product")).toBeInTheDocument();
    });
  });

  it("renders Product page at /product", async () => {
    renderApp("/product?id=some-uuid");
    await waitFor(() => {
      expect(screen.getByText("Product not found.")).toBeInTheDocument();
    });
  });

  it("all routes include the Layout nav bar", async () => {
    renderApp("/");
    await waitFor(() => {
      expect(screen.getByText("ReviewLens")).toBeInTheDocument();
      expect(
        screen.getByText("ReviewLens AI — Review Intelligence Portal")
      ).toBeInTheDocument();
    });
  });
});
