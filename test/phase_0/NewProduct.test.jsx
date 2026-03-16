import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/api/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

import NewProduct from "../../src/pages/NewProduct";

function renderNewProduct() {
  return render(
    <MemoryRouter>
      <NewProduct />
    </MemoryRouter>
  );
}

describe("NewProduct — Phase 0 (basic UI rendering)", () => {
  it("renders the page title", () => {
    renderNewProduct();
    expect(screen.getByText("Add New Product")).toBeInTheDocument();
  });

  it("renders product name input", () => {
    renderNewProduct();
    expect(
      screen.getByPlaceholderText(/notion|slack|figma/i)
    ).toBeInTheDocument();
  });

  it("renders platform dropdown with all 5 platforms", () => {
    renderNewProduct();
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("G2")).toBeInTheDocument();
    expect(screen.getByText("Amazon")).toBeInTheDocument();
    expect(screen.getByText("Google Maps")).toBeInTheDocument();
    expect(screen.getByText("Yelp")).toBeInTheDocument();
    expect(screen.getByText("Capterra")).toBeInTheDocument();
  });

  it("renders all three ingestion tabs", () => {
    renderNewProduct();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("CSV Upload")).toBeInTheDocument();
    expect(screen.getByText("Paste Text")).toBeInTheDocument();
  });

  it("defaults to CSV Upload tab", () => {
    renderNewProduct();
    expect(
      screen.getByText(/drop your csv file here/i)
    ).toBeInTheDocument();
  });

  it("switches to URL tab when clicked", () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("URL"));
    expect(
      screen.getByPlaceholderText(/g2\.com/i)
    ).toBeInTheDocument();
  });

  it("switches to Paste Text tab when clicked", () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("Paste Text"));
    expect(
      screen.getByPlaceholderText(/paste reviews here/i)
    ).toBeInTheDocument();
  });
});
