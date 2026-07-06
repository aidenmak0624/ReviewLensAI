import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mutable session so individual tests can simulate signed-out state.
// vi.hoisted is required because the vi.mock factory is hoisted above imports.
const authState = vi.hoisted(() => ({
  session: {
    access_token: "test-token",
    user: { id: "test-user-1", email: "tester@example.com" },
  },
}));

vi.mock("../../src/api/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    })),
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: authState.session } })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
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
  beforeEach(() => {
    authState.session = {
      access_token: "test-token",
      user: { id: "test-user-1", email: "tester@example.com" },
    };
  });

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

  it("redirects to the login page when signed out", async () => {
    authState.session = null;
    renderApp("/");
    await waitFor(() => {
      expect(screen.getByText("Sign in")).toBeInTheDocument();
    });
    expect(screen.queryByText("Add New Product")).not.toBeInTheDocument();
  });

  it("renders the login page at /login", async () => {
    authState.session = null;
    renderApp("/login");
    await waitFor(() => {
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });
  });
});
