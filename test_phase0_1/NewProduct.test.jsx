import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import NewProduct from "../src/pages/NewProduct";

function renderNewProduct() {
  return render(
    <MemoryRouter>
      <NewProduct />
    </MemoryRouter>
  );
}

describe("NewProduct", () => {
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

  it("shows URL warning about anti-bot measures", () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("URL"));
    expect(
      screen.getByText(/anti-bot measures/i)
    ).toBeInTheDocument();
  });

  it("shows CSV helper text about AI column mapping", () => {
    renderNewProduct();
    expect(
      screen.getByText(/ai will map columns automatically/i)
    ).toBeInTheDocument();
  });

  it("disables submit button when product name is empty", () => {
    renderNewProduct();
    const submitBtn = screen.getByText("Extract & Ingest Reviews");
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button when product name is filled", () => {
    renderNewProduct();
    const input = screen.getByPlaceholderText(/notion|slack|figma/i);
    fireEvent.change(input, { target: { value: "TestProduct" } });
    const submitBtn = screen.getByText("Extract & Ingest Reviews");
    expect(submitBtn).not.toBeDisabled();
  });
});
