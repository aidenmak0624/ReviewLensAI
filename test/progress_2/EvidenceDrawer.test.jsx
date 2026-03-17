import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EvidenceDrawer from "../../src/components/chat/EvidenceDrawer";

const mockReview = {
  id: "r1",
  reviewer_name: "Alice Johnson",
  rating: 4,
  review_text: "Great product with some minor issues. The interface is clean but could use better search.",
  review_date: "2026-03-15",
  verified: true,
  helpful_count: 7,
  source_modality: "csv",
  source_file_name: "reviews.csv",
};

describe("EvidenceDrawer", () => {
  it("renders all fields with mock data", () => {
    render(
      <EvidenceDrawer isOpen={true} review={mockReview} onClose={() => {}} />
    );

    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
    expect(screen.getByText(/March 1[45], 2026/)).toBeInTheDocument();
    expect(screen.getByLabelText("4 out of 5 stars")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText(/Great product with some minor issues/)).toBeInTheDocument();
    expect(screen.getByText(/7 people found this helpful/)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    render(
      <EvidenceDrawer isOpen={false} review={mockReview} onClose={() => {}} />
    );
    expect(screen.queryByText("Alice Johnson")).not.toBeInTheDocument();
  });

  it("does not render when review is null", () => {
    render(
      <EvidenceDrawer isOpen={true} review={null} onClose={() => {}} />
    );
    expect(screen.queryByText("Review Detail")).not.toBeInTheDocument();
  });

  it("fires onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    render(
      <EvidenceDrawer isOpen={true} review={mockReview} onClose={onClose} />
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fires onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <EvidenceDrawer isOpen={true} review={mockReview} onClose={onClose} />
    );

    fireEvent.click(screen.getByTestId("drawer-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fires onClose when X button is clicked", () => {
    const onClose = vi.fn();
    render(
      <EvidenceDrawer isOpen={true} review={mockReview} onClose={onClose} />
    );

    fireEvent.click(screen.getByLabelText("Close drawer"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides verified badge when verified is false", () => {
    const unverified = { ...mockReview, verified: false };
    render(
      <EvidenceDrawer isOpen={true} review={unverified} onClose={() => {}} />
    );
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("hides helpful count when helpful_count is 0", () => {
    const noHelpful = { ...mockReview, helpful_count: 0 };
    render(
      <EvidenceDrawer isOpen={true} review={noHelpful} onClose={() => {}} />
    );
    expect(screen.queryByText(/found this helpful/)).not.toBeInTheDocument();
  });

  it("shows singular 'person' for helpful_count of 1", () => {
    const oneHelpful = { ...mockReview, helpful_count: 1 };
    render(
      <EvidenceDrawer isOpen={true} review={oneHelpful} onClose={() => {}} />
    );
    expect(screen.getByText(/1 person found this helpful/)).toBeInTheDocument();
  });

  it("renders correct source badge for each modality", () => {
    const modalities = [
      { key: "csv", label: "CSV" },
      { key: "paste", label: "Paste" },
      { key: "url", label: "URL" },
      { key: "image", label: "Image" },
    ];
    for (const { key, label } of modalities) {
      const { unmount } = render(
        <EvidenceDrawer
          isOpen={true}
          review={{ ...mockReview, source_modality: key }}
          onClose={() => {}}
        />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
