import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Layout from "../../src/components/Layout";

function renderWithRouter(ui, { route = "/" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe("Layout", () => {
  it("renders the ReviewLens AI logo text", () => {
    renderWithRouter(<Layout />);
    expect(screen.getByText("ReviewLens")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("renders Dashboard nav link", () => {
    renderWithRouter(<Layout />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
  });

  it("renders New Product nav link", () => {
    renderWithRouter(<Layout />);
    expect(screen.getByRole("link", { name: /new product/i })).toBeInTheDocument();
  });

  it("renders footer text", () => {
    renderWithRouter(<Layout />);
    expect(
      screen.getByText("ReviewLens AI — Review Intelligence Portal")
    ).toBeInTheDocument();
  });

  it("highlights Dashboard link when on / route", () => {
    renderWithRouter(<Layout />, { route: "/" });
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink.className).toContain("text-primary");
  });

  it("highlights New Product link when on /new route", () => {
    renderWithRouter(<Layout />, { route: "/new" });
    const newProductLink = screen.getByRole("link", { name: /new product/i });
    expect(newProductLink.className).toContain("text-primary");
  });

  it("Dashboard link points to /", () => {
    renderWithRouter(<Layout />);
    const link = screen.getByRole("link", { name: /dashboard/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("New Product link points to /new", () => {
    renderWithRouter(<Layout />);
    const link = screen.getByRole("link", { name: /new product/i });
    expect(link).toHaveAttribute("href", "/new");
  });
});
