import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const authState = vi.hoisted(() => ({
  session: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    session: authState.session,
    user: authState.session?.user ?? null,
    loading: false,
    signIn: authState.signIn,
    signUp: authState.signUp,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
  getAccessToken: vi.fn().mockResolvedValue(null),
}));

import Login from "../../src/pages/Login";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>
  );
}

function submitForm() {
  fireEvent.submit(screen.getByLabelText("Email").closest("form"));
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.session = null;
  });

  it("renders email and password fields with a Sign In button", () => {
    renderLogin();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("toggles to signup mode and back", () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("shows the error banner when sign-in fails", async () => {
    authState.signIn.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    renderLogin();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "tester@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });
    submitForm();
    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to the app after successful sign-in", async () => {
    authState.signIn.mockResolvedValue({ error: null });
    renderLogin();
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "tester@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    submitForm();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("navigates immediately when signup returns a live session", async () => {
    authState.signUp.mockResolvedValue({
      data: { user: { id: "u1" }, session: { access_token: "t" } },
      error: null,
    });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    submitForm();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("shows the check-your-email notice when confirmation is required", async () => {
    authState.signUp.mockResolvedValue({
      data: { user: { id: "u1" }, session: null },
      error: null,
    });
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    submitForm();
    await waitFor(() => {
      expect(
        screen.getByText(/check your email to confirm your account/i)
      ).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("rejects signup passwords shorter than 6 characters without calling signUp", async () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "abc" },
    });
    submitForm();
    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters.")
      ).toBeInTheDocument();
    });
    expect(authState.signUp).not.toHaveBeenCalled();
  });
});
