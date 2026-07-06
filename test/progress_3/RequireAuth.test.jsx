import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authState = vi.hoisted(() => ({ session: null, loading: false }));

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    session: authState.session,
    user: authState.session?.user ?? null,
    loading: authState.loading,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
  getAccessToken: vi.fn().mockResolvedValue(null),
}));

import RequireAuth from "../../src/components/RequireAuth";

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <div>PROTECTED CONTENT</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  beforeEach(() => {
    authState.session = null;
    authState.loading = false;
  });

  it("shows a spinner while the session is hydrating (no redirect flash)", () => {
    authState.loading = true;
    const { container } = renderProtected();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("PROTECTED CONTENT")).not.toBeInTheDocument();
    expect(screen.queryByText("LOGIN PAGE")).not.toBeInTheDocument();
  });

  it("redirects to /login when there is no session", () => {
    renderProtected();
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
    expect(screen.queryByText("PROTECTED CONTENT")).not.toBeInTheDocument();
  });

  it("renders children when a session exists", () => {
    authState.session = {
      access_token: "test-token",
      user: { id: "test-user-1", email: "tester@example.com" },
    };
    renderProtected();
    expect(screen.getByText("PROTECTED CONTENT")).toBeInTheDocument();
  });
});
