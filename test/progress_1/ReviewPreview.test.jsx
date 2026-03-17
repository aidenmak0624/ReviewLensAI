import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReviewPreview from "../../src/components/ingestion/ReviewPreview";

const mockReviews = [
  {
    reviewer_name: "Alice",
    rating: 5,
    review_text: "Amazing product!",
    review_date: "2026-03-01",
  },
  {
    reviewer_name: "Bob",
    rating: 2,
    review_text: "Not great, needs improvement.",
    review_date: "2026-02-15",
  },
  {
    reviewer_name: null,
    rating: 4,
    review_text: "Pretty good overall.",
    review_date: null,
  },
];

describe("ReviewPreview — Phase 1", () => {
  it("returns null when no reviews provided", () => {
    const { container } = render(
      <ReviewPreview reviews={[]} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null when reviews is null", () => {
    const { container } = render(
      <ReviewPreview reviews={null} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("displays review count in header", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(screen.getByText("Extracted Reviews (3)")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(screen.getByText("#")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.getByText("Rating")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("renders reviewer names", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Anonymous")).toBeInTheDocument();
  });

  it("renders review text", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(screen.getByText("Amazing product!")).toBeInTheDocument();
    expect(screen.getByText("Not great, needs improvement.")).toBeInTheDocument();
  });

  it("renders dates and dash for missing dates", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(screen.getByText("2026-03-01")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("has delete buttons for each review", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    const deleteButtons = screen.getAllByLabelText(/remove review/i);
    expect(deleteButtons).toHaveLength(3);
  });

  it("calls onRemoveReview with correct index when delete is clicked", () => {
    const onRemove = vi.fn();
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={onRemove} onConfirm={vi.fn()} loading={false} />
    );
    const deleteButtons = screen.getAllByLabelText(/remove review/i);
    fireEvent.click(deleteButtons[1]); // Remove Bob (index 1)
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it("shows confirm button with review count", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(screen.getByText(/confirm & ingest 3 reviews/i)).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={onConfirm} loading={false} />
    );
    fireEvent.click(screen.getByText(/confirm & ingest/i));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("disables confirm button and shows loading text when loading", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={true} />
    );
    const btn = screen.getByText(/saving & embedding/i);
    expect(btn).toBeDisabled();
  });

  it("renders row numbers starting at 1", () => {
    render(
      <ReviewPreview reviews={mockReviews} onRemoveReview={vi.fn()} onConfirm={vi.fn()} loading={false} />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
