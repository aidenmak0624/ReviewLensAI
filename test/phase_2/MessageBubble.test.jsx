import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MessageBubble from "../../src/components/chat/MessageBubble";

const mockCitations = {
  1: {
    reviewNumber: 1,
    id: "r1",
    reviewer_name: "Alice",
    rating: 5,
    review_text: "Great product!",
    review_date: "2026-03-15",
    verified: true,
    helpful_count: 3,
    source_modality: "csv",
  },
  2: {
    reviewNumber: 2,
    id: "r2",
    reviewer_name: "Bob",
    rating: 3,
    review_text: "Average experience.",
    review_date: "2026-03-14",
    verified: false,
    helpful_count: 0,
    source_modality: "paste",
  },
};

describe("MessageBubble — Citations", () => {
  it("renders [Review N] as clickable buttons", () => {
    const message = {
      role: "assistant",
      content: "Users love the UI [Review 1] but find bugs [Review 2].",
    };

    render(
      <MessageBubble
        message={message}
        citations={mockCitations}
        onCitationClick={() => {}}
      />
    );

    const badge1 = screen.getByText("[Review 1]");
    const badge2 = screen.getByText("[Review 2]");
    expect(badge1.tagName).toBe("BUTTON");
    expect(badge2.tagName).toBe("BUTTON");
  });

  it("fires onCitationClick with correct review when badge is clicked", () => {
    const onCitationClick = vi.fn();
    const message = {
      role: "assistant",
      content: "Good feedback [Review 1] and mixed [Review 2].",
    };

    render(
      <MessageBubble
        message={message}
        citations={mockCitations}
        onCitationClick={onCitationClick}
      />
    );

    fireEvent.click(screen.getByText("[Review 1]"));
    expect(onCitationClick).toHaveBeenCalledTimes(1);
    expect(onCitationClick).toHaveBeenCalledWith(mockCitations[1]);

    fireEvent.click(screen.getByText("[Review 2]"));
    expect(onCitationClick).toHaveBeenCalledTimes(2);
    expect(onCitationClick).toHaveBeenCalledWith(mockCitations[2]);
  });

  it("renders badges without hover styling when citation data is missing", () => {
    const message = {
      role: "assistant",
      content: "Reference [Review 3] not in citations.",
    };

    render(
      <MessageBubble message={message} citations={mockCitations} />
    );

    const badge = screen.getByText("[Review 3]");
    expect(badge.tagName).toBe("BUTTON");
    expect(badge.className).toContain("cursor-default");
  });

  it("does not fire onCitationClick when citation data is missing for that review number", () => {
    const onCitationClick = vi.fn();
    const message = {
      role: "assistant",
      content: "Unknown reference [Review 99].",
    };

    render(
      <MessageBubble
        message={message}
        citations={mockCitations}
        onCitationClick={onCitationClick}
      />
    );

    fireEvent.click(screen.getByText("[Review 99]"));
    expect(onCitationClick).not.toHaveBeenCalled();
  });

  it("renders user messages as plain text without citation processing", () => {
    const message = {
      role: "user",
      content: "What about [Review 1]?",
    };

    render(<MessageBubble message={message} />);

    // User messages render content as plain text, not processed
    expect(screen.getByText("What about [Review 1]?")).toBeInTheDocument();
  });
});
