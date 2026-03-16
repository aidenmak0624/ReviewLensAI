import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PasteReviews from "../../src/components/ingestion/PasteReviews";

describe("PasteReviews — Phase 1", () => {
  it("renders textarea with placeholder", () => {
    render(<PasteReviews onParsed={vi.fn()} />);
    expect(screen.getByPlaceholderText(/paste reviews here/i)).toBeInTheDocument();
  });

  it("renders label", () => {
    render(<PasteReviews onParsed={vi.fn()} />);
    expect(screen.getByText("Paste Review Text")).toBeInTheDocument();
  });

  it("shows character count starting at 0", () => {
    render(<PasteReviews onParsed={vi.fn()} />);
    expect(screen.getByText("0 characters")).toBeInTheDocument();
  });

  it("updates character count on input", () => {
    render(<PasteReviews onParsed={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);
    fireEvent.change(textarea, { target: { value: "Hello world" } });
    expect(screen.getByText("11 characters")).toBeInTheDocument();
  });

  it("calls onParsed with text content", () => {
    const onParsed = vi.fn();
    render(<PasteReviews onParsed={onParsed} />);
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);
    fireEvent.change(textarea, { target: { value: "Review text" } });
    expect(onParsed).toHaveBeenCalledWith("Review text");
  });

  it("calls onParsed with null when text is cleared", () => {
    const onParsed = vi.fn();
    render(<PasteReviews onParsed={onParsed} />);
    const textarea = screen.getByPlaceholderText(/paste reviews here/i);
    fireEvent.change(textarea, { target: { value: "text" } });
    fireEvent.change(textarea, { target: { value: "" } });
    expect(onParsed).toHaveBeenLastCalledWith(null);
  });
});
