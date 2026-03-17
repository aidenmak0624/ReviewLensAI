import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ChatInterface from "../../src/components/chat/ChatInterface";

// Mock import.meta.env
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");

const mockProduct = {
  id: "test-uuid",
  name: "Notion",
  status: "ready",
};

const mockCitationsPayload = [
  {
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
];

describe("ChatInterface — Citations", () => {
  let fetchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("parses citations_ready SSE event and makes badges clickable", async () => {
    const onCitationClick = vi.fn();

    // Build an SSE response with token stream + citations_ready event
    const ssePayload = [
      'data: {"token":"Users love it "}',
      'data: {"token":"[Review 1]"}',
      'data: {"token":"."}',
      "",
      "event: citations_ready",
      `data: ${JSON.stringify(mockCitationsPayload)}`,
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(ssePayload),
            })
            .mockResolvedValue({ done: true }),
        }),
      },
    });

    render(
      <ChatInterface product={mockProduct} onCitationClick={onCitationClick} />
    );

    const input = screen.getByPlaceholderText("Ask about reviews...");
    fireEvent.change(input, { target: { value: "What do users think?" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Wait for the stream to complete and citations to be parsed
    await waitFor(() => {
      expect(screen.getByText("[Review 1]")).toBeInTheDocument();
    });

    // Click the citation badge
    fireEvent.click(screen.getByText("[Review 1]"));

    expect(onCitationClick).toHaveBeenCalledTimes(1);
    expect(onCitationClick).toHaveBeenCalledWith(mockCitationsPayload[0]);
  });

  it("clears citations when skill changes", async () => {
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true }),
        }),
      },
    });

    render(<ChatInterface product={mockProduct} onCitationClick={() => {}} />);

    // Switch skill — should reset state
    fireEvent.click(screen.getByText("Sentiment"));

    // Verify empty state message (messages cleared)
    expect(screen.getByText(/Ask me anything/)).toBeInTheDocument();
  });
});
