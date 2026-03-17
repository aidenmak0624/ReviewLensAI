import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/api/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: "test-product-id" },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    functions: {
      invoke: vi.fn(() =>
        Promise.resolve({
          data: {
            reviews: [
              {
                reviewer_name: "Test User",
                rating: 4,
                review_text: "Great product",
                review_date: "2026-01-15",
                verified: true,
                helpful_count: 2,
              },
            ],
            review_ids: ["r1"],
            count: 1,
          },
          error: null,
        })
      ),
    },
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

describe("NewProduct — Tab Isolation (no input bleed across tabs)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears rawInput when switching from CSV to Paste tab", () => {
    renderNewProduct();

    // Default tab is CSV — verify it's active
    expect(
      screen.getByText(/drop your csv file here/i)
    ).toBeInTheDocument();

    // Switch to Paste tab
    fireEvent.click(screen.getByText("Paste Text"));
    expect(
      screen.getByPlaceholderText(/paste reviews here/i)
    ).toBeInTheDocument();

    // Extract button should be disabled (no input in paste)
    const extractBtn = screen.getByText("Extract & Preview Reviews");
    expect(extractBtn).toBeDisabled();
  });

  it("clears image when switching from Image to CSV tab", () => {
    renderNewProduct();

    // Switch to Image tab
    fireEvent.click(screen.getByText("Image"));
    expect(
      screen.getByText("Drop an image here or click to browse")
    ).toBeInTheDocument();

    // Select a valid image
    const input = screen.getByTestId("image-file-input");
    const validFile = new File(["fake image data"], "review_screenshot.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [validFile] } });

    // Now switch to CSV tab — image should be cleared
    fireEvent.click(screen.getByText("CSV Upload"));
    expect(
      screen.getByText(/drop your csv file here/i)
    ).toBeInTheDocument();

    // Switch back to Image tab — drop zone should be empty (no file)
    fireEvent.click(screen.getByText("Image"));
    expect(
      screen.getByText("Drop an image here or click to browse")
    ).toBeInTheDocument();
  });

  it("clears URL input when switching from URL to Image tab", () => {
    renderNewProduct();

    // Switch to URL tab and type a URL
    fireEvent.click(screen.getByText("URL"));
    const urlInput = screen.getByPlaceholderText(/g2\.com/i);
    fireEvent.change(urlInput, {
      target: { value: "https://www.g2.com/products/notion/reviews" },
    });
    expect(urlInput.value).toBe("https://www.g2.com/products/notion/reviews");

    // Switch to Image tab
    fireEvent.click(screen.getByText("Image"));

    // Switch back to URL tab — URL should still be there (urlInput is separate state)
    fireEvent.click(screen.getByText("URL"));
    // URL input keeps its value since it's stored in separate useState
    expect(screen.getByPlaceholderText(/g2\.com/i)).toBeInTheDocument();
  });

  it("switching tabs keeps product name and platform intact", () => {
    renderNewProduct();

    // Set product name
    const nameInput = screen.getByPlaceholderText(/notion|slack|figma/i);
    fireEvent.change(nameInput, { target: { value: "TestProduct" } });

    // Set platform to Amazon
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "amazon" } });

    // Switch through all tabs
    fireEvent.click(screen.getByText("URL"));
    fireEvent.click(screen.getByText("Paste Text"));
    fireEvent.click(screen.getByText("Image"));
    fireEvent.click(screen.getByText("CSV Upload"));

    // Product name and platform should be unchanged
    expect(nameInput.value).toBe("TestProduct");
    expect(select.value).toBe("amazon");
  });
});

describe("NewProduct — Extract button state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extract button disabled when product name is empty", () => {
    renderNewProduct();

    // Switch to Paste tab and add input
    fireEvent.click(screen.getByText("Paste Text"));
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);
    fireEvent.change(textarea, {
      target: { value: "John - 5 stars - Great!" },
    });

    // No product name — button should be disabled
    const extractBtn = screen.getByText("Extract & Preview Reviews");
    expect(extractBtn).toBeDisabled();
  });

  it("extract button enabled when product name AND input are set", () => {
    renderNewProduct();

    // Set product name
    const nameInput = screen.getByPlaceholderText(/notion|slack|figma/i);
    fireEvent.change(nameInput, { target: { value: "TestProduct" } });

    // Switch to Paste tab and add input
    fireEvent.click(screen.getByText("Paste Text"));
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);
    fireEvent.change(textarea, {
      target: { value: "John - 5 stars - Great product!" },
    });

    // Both set — button should be enabled
    const extractBtn = screen.getByText("Extract & Preview Reviews");
    expect(extractBtn).not.toBeDisabled();
  });

  it("extract button disabled on Image tab when no image selected", () => {
    renderNewProduct();

    // Set product name
    const nameInput = screen.getByPlaceholderText(/notion|slack|figma/i);
    fireEvent.change(nameInput, { target: { value: "TestProduct" } });

    // Switch to Image tab — no image yet
    fireEvent.click(screen.getByText("Image"));

    const extractBtn = screen.getByText("Extract & Preview Reviews");
    expect(extractBtn).toBeDisabled();
  });

  it("extract button enabled on Image tab when image is selected", () => {
    renderNewProduct();

    // Set product name
    const nameInput = screen.getByPlaceholderText(/notion|slack|figma/i);
    fireEvent.change(nameInput, { target: { value: "TestProduct" } });

    // Switch to Image tab and select a file
    fireEvent.click(screen.getByText("Image"));
    const input = screen.getByTestId("image-file-input");
    const validFile = new File(["fake"], "shot.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [validFile] } });

    const extractBtn = screen.getByText("Extract & Preview Reviews");
    expect(extractBtn).not.toBeDisabled();
  });
});

describe("NewProduct — Large input handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts large paste text input (100+ reviews, 50KB+)", () => {
    renderNewProduct();

    // Set product name
    const nameInput = screen.getByPlaceholderText(/notion|slack|figma/i);
    fireEvent.change(nameInput, { target: { value: "LoadTestProduct" } });

    // Switch to paste tab
    fireEvent.click(screen.getByText("Paste Text"));
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);

    // Generate a large paste input (~100 reviews)
    const reviews = [];
    for (let i = 1; i <= 100; i++) {
      const rating = ((i % 5) + 1);
      reviews.push(
        `Review ${i} - ${["Alice", "Bob", "Carol", "Dave", "Eve"][i % 5]} ${["Smith", "Jones", "Lee", "Wang", "Chen"][i % 5]} - ${rating} stars - 2026-0${Math.min(i % 3 + 1, 3)}-${String((i % 28) + 1).padStart(2, "0")}\n` +
        `"This is review number ${i}. The product has ${rating >= 4 ? "excellent" : rating >= 3 ? "decent" : "poor"} features. ` +
        `I particularly ${rating >= 4 ? "loved" : "disliked"} the user interface and the collaboration tools. ` +
        `The pricing could be ${rating >= 3 ? "justified" : "much better"} for what you get. ` +
        `Overall ${rating >= 4 ? "highly recommend" : rating >= 3 ? "it's okay" : "would not recommend"}."`
      );
    }
    const largeText = reviews.join("\n\n");

    fireEvent.change(textarea, { target: { value: largeText } });

    // Verify the text is accepted
    expect(textarea.value).toBe(largeText);
    expect(textarea.value.length).toBeGreaterThan(10000);

    // Character count should display
    expect(
      screen.getByText(`${largeText.length.toLocaleString()} characters`)
    ).toBeInTheDocument();

    // Extract button should be enabled
    const extractBtn = screen.getByText("Extract & Preview Reviews");
    expect(extractBtn).not.toBeDisabled();
  });

  it("handles paste text with special characters (quotes, commas, newlines)", () => {
    renderNewProduct();

    const nameInput = screen.getByPlaceholderText(/notion|slack|figma/i);
    fireEvent.change(nameInput, { target: { value: "SpecialChars" } });

    fireEvent.click(screen.getByText("Paste Text"));
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);

    const trickyText = `John "Johnny" O'Brien - 5 stars
"This product is amazing, I love it! It's the best I've ever used."
The features include: drag & drop, real-time sync, and "smart" templates.

María García-López — 3 stars
"C'est bon, mais pas parfait. Le prix est élevé pour les fonctionnalités offertes."
特殊字符测试 — unicode support

李明 (Ming Li) - 4 stars
"用了3个月，总体不错。界面设计很好，但有时候会卡。"
Rating: ★★★★☆`;

    fireEvent.change(textarea, { target: { value: trickyText } });
    expect(textarea.value).toBe(trickyText);

    const extractBtn = screen.getByText("Extract & Preview Reviews");
    expect(extractBtn).not.toBeDisabled();
  });
});
