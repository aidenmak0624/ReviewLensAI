import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReviewTable from "../../src/components/product/ReviewTable";

const mockReviews = [
  {
    id: "r1",
    reviewer_name: "Alice",
    rating: 5,
    review_text: "Excellent product!",
    review_date: "2026-03-15",
  },
  {
    id: "r2",
    reviewer_name: "Bob",
    rating: 3,
    review_text: "Decent but needs improvement.",
    review_date: "2026-03-14",
  },
];

describe("ReviewTable — onRowClick", () => {
  it("fires onRowClick with correct review when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(<ReviewTable reviews={mockReviews} onRowClick={onRowClick} />);

    // Click the row containing Alice's review
    fireEvent.click(screen.getByText("Alice"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "r1", reviewer_name: "Alice" })
    );
  });

  it("fires onRowClick with correct review for second row", () => {
    const onRowClick = vi.fn();
    render(<ReviewTable reviews={mockReviews} onRowClick={onRowClick} />);

    fireEvent.click(screen.getByText("Bob"));
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: "r2", reviewer_name: "Bob" })
    );
  });

  it("applies cursor-pointer when onRowClick is provided", () => {
    const onRowClick = vi.fn();
    render(<ReviewTable reviews={mockReviews} onRowClick={onRowClick} />);

    const row = screen.getByText("Alice").closest("tr");
    expect(row.className).toContain("cursor-pointer");
  });

  it("does not apply cursor-pointer when onRowClick is not provided", () => {
    render(<ReviewTable reviews={mockReviews} />);

    const row = screen.getByText("Alice").closest("tr");
    expect(row.className).not.toContain("cursor-pointer");
  });
});
