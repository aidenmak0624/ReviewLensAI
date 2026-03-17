import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InsightReport from "../../src/components/product/InsightReport";

const mockData = {
  themes: [
    { theme: "Ease of Use", summary: "Most users find the product intuitive and easy to learn." },
    { theme: "Performance Issues", summary: "Several users reported slow loading times at scale." },
  ],
  faqs: [
    { question: "How steep is the learning curve?", answer: "Most users report getting productive within a week." },
    { question: "Does it scale well?", answer: "Mixed feedback — small teams love it, larger teams report slowdowns." },
  ],
  actions: [
    { action: "Optimize database queries for large workspaces", priority: "high", rationale: "Multiple reviewers cite performance degradation at scale." },
    { action: "Add onboarding tutorials", priority: "med", rationale: "New users need guided walkthroughs." },
    { action: "Consider dark mode", priority: "low", rationale: "Occasional feature request but not a core complaint." },
  ],
};

describe("InsightReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders all 3 section cards", () => {
    render(<InsightReport data={mockData} />);
    expect(screen.getByText("Evidence & Themes")).toBeInTheDocument();
    expect(screen.getByText("FAQ & Friction Points")).toBeInTheDocument();
    expect(screen.getByText("Action Items")).toBeInTheDocument();
  });

  it("renders theme titles and summaries", () => {
    render(<InsightReport data={mockData} />);
    expect(screen.getByText("Ease of Use")).toBeInTheDocument();
    expect(screen.getByText(/intuitive and easy to learn/)).toBeInTheDocument();
    expect(screen.getByText("Performance Issues")).toBeInTheDocument();
  });

  it("renders FAQ questions and answers", () => {
    render(<InsightReport data={mockData} />);
    expect(screen.getByText(/How steep is the learning curve/)).toBeInTheDocument();
    expect(screen.getByText(/productive within a week/)).toBeInTheDocument();
  });

  it("renders action items with correct priority badges", () => {
    render(<InsightReport data={mockData} />);

    const highBadge = screen.getByText("HIGH");
    expect(highBadge.className).toContain("bg-red-100");

    const medBadge = screen.getByText("MED");
    expect(medBadge.className).toContain("bg-amber-100");

    const lowBadge = screen.getByText("LOW");
    expect(lowBadge.className).toContain("bg-gray-100");
  });

  it("copies action items to clipboard when Copy button is clicked", async () => {
    render(<InsightReport data={mockData} />);

    fireEvent.click(screen.getByText("Copy Action Items"));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "[HIGH] Optimize database queries for large workspaces\n[MED] Add onboarding tutorials\n[LOW] Consider dark mode"
    );
  });

  it("collapses and expands sections", () => {
    render(<InsightReport data={mockData} />);

    // Themes section should be open by default
    expect(screen.getByText("Ease of Use")).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByText("Evidence & Themes"));

    // Content should be hidden
    expect(screen.queryByText("Ease of Use")).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText("Evidence & Themes"));
    expect(screen.getByText("Ease of Use")).toBeInTheDocument();
  });

  it("returns null when data is null", () => {
    const { container } = render(<InsightReport data={null} />);
    expect(container.innerHTML).toBe("");
  });
});
