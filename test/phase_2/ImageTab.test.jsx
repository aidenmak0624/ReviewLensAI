import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("NewProduct — Image Tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Image tab", () => {
    renderNewProduct();
    expect(screen.getByText("Image")).toBeInTheDocument();
  });

  it("shows drop zone when Image tab is active", () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("Image"));

    expect(
      screen.getByText("Drop an image here or click to browse")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Accepts PNG, JPG, JPEG, WebP/)
    ).toBeInTheDocument();
  });

  it("rejects non-image files", async () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("Image"));

    const input = screen.getByTestId("image-file-input");
    const pdfFile = new File(["fake pdf"], "test.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid file type/)
      ).toBeInTheDocument();
    });
  });

  it("rejects files over 20MB", async () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("Image"));

    const input = screen.getByTestId("image-file-input");
    // Create a mock file that reports > 20MB size
    const bigFile = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(bigFile, "size", { value: 21 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(screen.getByText(/File too large/)).toBeInTheDocument();
    });
  });

  it("shows file name after valid image is selected", async () => {
    renderNewProduct();
    fireEvent.click(screen.getByText("Image"));

    const input = screen.getByTestId("image-file-input");
    const validFile = new File(["fake image data"], "reviews.png", {
      type: "image/png",
    });

    fireEvent.change(input, { target: { files: [validFile] } });

    // File name and remove button should appear
    await waitFor(() => {
      expect(screen.getByText("reviews.png")).toBeInTheDocument();
      expect(screen.getByLabelText("Remove image")).toBeInTheDocument();
    });
  });

  it("has all 4 tabs (URL, CSV Upload, Paste Text, Image)", () => {
    renderNewProduct();
    expect(screen.getByText("URL")).toBeInTheDocument();
    expect(screen.getByText("CSV Upload")).toBeInTheDocument();
    expect(screen.getByText("Paste Text")).toBeInTheDocument();
    expect(screen.getByText("Image")).toBeInTheDocument();
  });
});
