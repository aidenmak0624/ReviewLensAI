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

describe("ChatInterface — Skill Integration", () => {
  let fetchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fetch to return a simple stream
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('data: {"token":"Hello"}\n\ndata: [DONE]\n\n'),
            })
            .mockResolvedValue({ done: true }),
        }),
      },
    });
  });

  it("renders SkillSelector with 7 pills", () => {
    render(<ChatInterface product={mockProduct} />);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("UI Bugs")).toBeInTheDocument();
    expect(screen.getByText("Sentiment")).toBeInTheDocument();
    expect(screen.getByText("SWOT")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Executive")).toBeInTheDocument();
  });

  it("includes skill: 'general' by default in fetch body", async () => {
    render(<ChatInterface product={mockProduct} />);

    const input = screen.getByPlaceholderText("Ask about reviews...");
    fireEvent.change(input, { target: { value: "What are the issues?" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.skill).toBe("general");
    expect(body.question).toBe("What are the issues?");
    expect(body.product_id).toBe("test-uuid");
  });

  it("includes selected skill in fetch body after switching", async () => {
    render(<ChatInterface product={mockProduct} />);

    // Switch to UI Bugs skill
    fireEvent.click(screen.getByText("UI Bugs"));

    const input = screen.getByPlaceholderText("Ask about reviews...");
    fireEvent.change(input, { target: { value: "List the bugs" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.skill).toBe("ui_bug_detection");
  });

  it("resets messages to empty when skill changes", () => {
    render(<ChatInterface product={mockProduct} />);

    // First, verify the empty state message is shown
    expect(screen.getByText(/Ask me anything/)).toBeInTheDocument();

    // Switch skill — should still show empty state (messages reset)
    fireEvent.click(screen.getByText("Sentiment"));
    expect(screen.getByText(/Ask me anything/)).toBeInTheDocument();
  });
});
