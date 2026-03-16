import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CSVUploader from "../../src/components/ingestion/CSVUploader";

describe("CSVUploader — Phase 1", () => {
  it("renders drop zone with instructions", () => {
    render(<CSVUploader onParsed={vi.fn()} />);
    expect(screen.getByText(/drop your csv file here/i)).toBeInTheDocument();
    expect(screen.getByText(/ai will map columns automatically/i)).toBeInTheDocument();
  });

  it("has a hidden file input accepting .csv", () => {
    render(<CSVUploader onParsed={vi.fn()} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("accept", ".csv");
  });

  it("renders drop zone as clickable", () => {
    render(<CSVUploader onParsed={vi.fn()} />);
    const dropZone = screen.getByText(/drop your csv file here/i).closest("div");
    expect(dropZone.className).toContain("cursor-pointer");
  });
});
