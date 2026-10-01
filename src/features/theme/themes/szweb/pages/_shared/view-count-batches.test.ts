import { describe, expect, it } from "vitest";
import { viewCountBatches } from "./view-count-batches";

describe("view count request budgets", () => {
  it("keeps all 1000 posts within API and UTF-8 cache key limits", () => {
    const slugs = Array.from(
      { length: 1000 },
      (_, i) => `长文章-slug-${i}-${"x".repeat(65)}`,
    );
    const batches = viewCountBatches(slugs);
    expect(batches.flat()).toEqual(slugs);
    for (const batch of batches) {
      expect(batch.length).toBeLessThanOrEqual(50);
      expect(
        new TextEncoder().encode(["pageview", "counts", ...batch].join(":"))
          .length,
      ).toBeLessThanOrEqual(512);
    }
  });
  it("limits short requests to 50 and deduplicates without losing order", () => {
    const slugs = Array.from({ length: 101 }, (_, i) => `${i}`);
    const batches = viewCountBatches(["", ...slugs, "1"]);
    expect(batches.map((batch) => batch.length)).toEqual([50, 50, 1]);
    expect(batches.flat()).toEqual(slugs);
  });
  it("preserves an oversized legacy slug as an isolated request", () => {
    const slug = "x".repeat(600);
    expect(viewCountBatches(["before", slug, "after"])).toEqual([
      ["before"],
      [slug],
      ["after"],
    ]);
    expect(viewCountBatches([])).toEqual([]);
  });
});
