import { describe, expect, it } from "vitest";
import { zheyePublicTitle } from "../identity";
import { articleAccents, articleChroma } from "./article-chroma";

describe("Fold editorial identity", () => {
  it("replaces the legacy address without renaming a custom site", () => {
    expect(zheyePublicTitle("szweb.ren")).toBe("折页");
    expect(zheyePublicTitle(" SZWEB ")).toBe("折页");
    expect(zheyePublicTitle("A personal journal")).toBe("A personal journal");
  });
  it("gives unconfigured articles stable, varied reverse colors", () => {
    const slugs = [
      "edge-blog-in-a-weekend",
      "chinese-search-index",
      "slow-afternoon-walk",
      "small-css-archive",
      "reading-notes-checklist",
    ];
    const colors = slugs.map((slug) => articleChroma(slug));
    expect(new Set(colors).size).toBeGreaterThanOrEqual(3);
    expect(slugs.map((slug) => articleChroma(slug))).toEqual(colors);
  });
  it("does not depend on public tags or tag order", () => {
    expect(articleChroma("a-page", ["Writing", "生活"])).toBe(
      articleChroma("a-page"),
    );
    expect(
      articleChroma("a-page", [{ name: "生活" }, { name: "Writing" }]),
    ).toBe(articleChroma("a-page"));
  });
  it("keeps a slug consistent between article and search DTOs", () => {
    expect(articleChroma("one-page", [{ name: "_chroma:cobalt" }])).toBe(
      "cobalt",
    );
    expect(articleChroma("one-page", ["_chroma:cobalt"])).toBe("cobalt");
    expect(articleChroma("one-page", [" _CHROMA: EMERALD "])).toBe("emerald");
  });
  it("allows a validated editorial override", () => {
    for (const accent of articleAccents)
      expect(articleChroma("one-page", ["_chroma:" + accent])).toBe(accent);
  });
  it("never injects arbitrary values as a CSS color", () => {
    expect(
      articleChroma("safe-page", ["_chroma:url(https://example.invalid)"]),
    ).toBe(articleChroma("safe-page"));
    expect(
      articleChroma("safe-page", ["_chroma:unknown", "_chroma:copper"]),
    ).toBe("copper");
    expect(articleChroma("safe-page", ["Writing:_chroma:violet"])).toBe(
      articleChroma("safe-page"),
    );
  });
  it("keeps empty content neutral", () => {
    expect(articleChroma("")).toBeUndefined();
    expect(articleChroma("  ")).toBeUndefined();
  });
  it("normalizes whitespace and canonically equivalent Unicode", () => {
    expect(articleChroma("  折页-café  ")).toBe(
      articleChroma("折页-cafe\u0301"),
    );
  });
  it("covers the bounded palette across a long archive", () => {
    const colors = new Set(
      Array.from({ length: 250 }, (_, i) => articleChroma(`article-${i}`)),
    );
    expect(colors).toEqual(new Set(articleAccents));
  });
});
