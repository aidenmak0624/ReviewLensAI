import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const extractReviewsCode = readFileSync(
  resolve(__dirname, "../../supabase/functions/extract-reviews/index.ts"),
  "utf-8"
);

const embedReviewsCode = readFileSync(
  resolve(__dirname, "../../supabase/functions/embed-reviews/index.ts"),
  "utf-8"
);

describe("extract-reviews Edge Function — code structure", () => {
  it("imports CORS headers", () => {
    expect(extractReviewsCode).toContain('import { corsHeaders }');
  });

  it("imports OpenAI client", () => {
    expect(extractReviewsCode).toContain('import openai');
  });

  it("imports Supabase client", () => {
    expect(extractReviewsCode).toContain('import { supabase }');
  });

  it("defines save_reviews function tool", () => {
    expect(extractReviewsCode).toContain('"save_reviews"');
  });

  it("uses GPT-4o model", () => {
    expect(extractReviewsCode).toContain('"gpt-4o"');
  });

  it("validates mode input (url, csv, paste)", () => {
    expect(extractReviewsCode).toContain('["url", "csv", "paste"]');
  });

  it("handles CORS preflight", () => {
    expect(extractReviewsCode).toContain('req.method === "OPTIONS"');
  });

  it("returns INVALID_MODE error for bad mode", () => {
    expect(extractReviewsCode).toContain("INVALID_MODE");
  });

  it("returns EMPTY_INPUT error for empty input", () => {
    expect(extractReviewsCode).toContain("EMPTY_INPUT");
  });

  it("returns EXTRACTION_FAILED for zero results", () => {
    expect(extractReviewsCode).toContain("EXTRACTION_FAILED");
  });

  it("computes rating distribution", () => {
    expect(extractReviewsCode).toContain("ratingDist");
  });

  it("inserts reviews into Postgres", () => {
    expect(extractReviewsCode).toContain('.from("reviews")');
    expect(extractReviewsCode).toContain(".insert(");
  });

  it("updates product with stats", () => {
    expect(extractReviewsCode).toContain('.from("products")');
    expect(extractReviewsCode).toContain(".update(");
  });

  it("sets pinecone_namespace on product", () => {
    expect(extractReviewsCode).toContain("pinecone_namespace");
    expect(extractReviewsCode).toContain("`product-${product_id}`");
  });

  it("has CSV mode system prompt", () => {
    expect(extractReviewsCode).toContain("CSV data");
  });

  it("has paste mode system prompt", () => {
    expect(extractReviewsCode).toContain("raw text containing product reviews");
  });

  it("enforces rating 1-5 clamping", () => {
    expect(extractReviewsCode).toContain("Math.max(1, Math.min(5");
  });
});

describe("embed-reviews Edge Function — code structure", () => {
  it("imports CORS headers", () => {
    expect(embedReviewsCode).toContain('import { corsHeaders }');
  });

  it("imports OpenAI client", () => {
    expect(embedReviewsCode).toContain('import openai');
  });

  it("imports Pinecone index", () => {
    expect(embedReviewsCode).toContain('import { pineconeIndex }');
  });

  it("uses text-embedding-3-small model", () => {
    expect(embedReviewsCode).toContain('"text-embedding-3-small"');
  });

  it("batches embeddings at 100 per call", () => {
    expect(embedReviewsCode).toContain("BATCH_SIZE = 100");
  });

  it("upserts to Pinecone namespace", () => {
    expect(embedReviewsCode).toContain(".namespace(namespace).upsert(");
  });

  it("stores metadata with vectors", () => {
    expect(embedReviewsCode).toContain("metadata:");
    expect(embedReviewsCode).toContain("product_id");
    expect(embedReviewsCode).toContain("rating:");
    expect(embedReviewsCode).toContain("text:");
  });

  it("updates pinecone_vector_id on review rows", () => {
    expect(embedReviewsCode).toContain("pinecone_vector_id");
    expect(embedReviewsCode).toContain("`review-${r.id}`");
  });

  it("sets product status to ready on success", () => {
    expect(embedReviewsCode).toContain('status: "ready"');
  });

  it("sets product status to error on failure", () => {
    expect(embedReviewsCode).toContain('status: "error"');
  });

  it("validates required inputs", () => {
    expect(embedReviewsCode).toContain("INVALID_INPUT");
  });

  it("handles CORS preflight", () => {
    expect(embedReviewsCode).toContain('req.method === "OPTIONS"');
  });

  it("uses review-{uuid} as vector ID", () => {
    expect(embedReviewsCode).toContain("`review-${review.id}`");
  });
});
