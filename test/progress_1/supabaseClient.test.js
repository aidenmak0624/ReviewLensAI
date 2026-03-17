import { describe, it, expect, vi } from "vitest";

// Mock the supabase-js module before importing our client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  })),
}));

describe("supabaseClient", () => {
  it("exports a supabase client instance", async () => {
    const { supabase } = await import("../../src/api/supabaseClient");
    expect(supabase).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(supabase.functions).toBeDefined();
  });
});
