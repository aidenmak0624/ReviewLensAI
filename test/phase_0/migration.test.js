import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const migrationSQL = readFileSync(
  resolve(__dirname, "../../supabase/migrations/001_create_tables.sql"),
  "utf-8"
);

describe("Database Migration SQL", () => {
  it("creates products table", () => {
    expect(migrationSQL).toContain("create table products");
  });

  it("creates reviews table", () => {
    expect(migrationSQL).toContain("create table reviews");
  });

  it("products table has uuid primary key", () => {
    expect(migrationSQL).toMatch(
      /id\s+uuid\s+primary\s+key\s+default\s+gen_random_uuid/
    );
  });

  it("products table has required columns", () => {
    const requiredColumns = [
      "name",
      "platform",
      "source_url",
      "total_reviews",
      "average_rating",
      "rating_distribution",
      "status",
      "ingestion_method",
      "pinecone_namespace",
      "created_at",
    ];
    for (const col of requiredColumns) {
      expect(migrationSQL).toContain(col);
    }
  });

  it("reviews table has foreign key to products", () => {
    expect(migrationSQL).toContain("references products(id) on delete cascade");
  });

  it("reviews table has rating constraint (1-5)", () => {
    expect(migrationSQL).toContain("check (rating between 1 and 5)");
  });

  it("reviews table has required columns", () => {
    const requiredColumns = [
      "reviewer_name",
      "rating",
      "review_text",
      "review_date",
      "verified",
      "helpful_count",
      "pinecone_vector_id",
    ];
    for (const col of requiredColumns) {
      expect(migrationSQL).toContain(col);
    }
  });

  it("creates index on reviews.product_id", () => {
    expect(migrationSQL).toContain("create index idx_reviews_product_id");
  });

  it("products defaults status to ingesting", () => {
    expect(migrationSQL).toContain("default 'ingesting'");
  });

  it("rating_distribution defaults to empty JSON", () => {
    expect(migrationSQL).toContain(
      `default '{"1":0,"2":0,"3":0,"4":0,"5":0}'`
    );
  });
});
