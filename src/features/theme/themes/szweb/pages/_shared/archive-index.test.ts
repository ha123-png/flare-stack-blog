import { describe, expect, it } from "vitest";
import { buildArchiveGroups } from "./archive-index";

const DAY_MS = 24 * 60 * 60 * 1000;

function makeNewestFirstPosts(count: number) {
  const newest = Date.UTC(2026, 0, 1);
  return Array.from({ length: count }, (_, index) => ({
    slug: `post-${index}`,
    publishedAt: new Date(newest - index * DAY_MS).toISOString(),
  }));
}

function splitIntoCursorPages<T>(items: Array<T>, limit: number) {
  const pages: Array<Array<T>> = [];
  for (let start = 0; start < items.length; start += limit) {
    pages.push(items.slice(start, start + limit));
  }
  return pages;
}

describe("buildArchiveGroups", () => {
  it.each([
    200, 1000,
  ])("keeps every post and produces ordered year/month counts across %i cursor results", (count) => {
    const posts = makeNewestFirstPosts(count);
    const cursorPages = splitIntoCursorPages(posts, 50);
    const groups = buildArchiveGroups(cursorPages.flat());

    const groupedPosts = groups.flatMap((year) =>
      year.months.flatMap((month) => month.posts),
    );
    expect(groupedPosts).toHaveLength(count);
    expect(new Set(groupedPosts.map((post) => post.slug)).size).toBe(count);

    const years = groups.map((year) => year.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));

    for (const year of groups) {
      expect(year.count).toBe(
        year.months.reduce((sum, month) => sum + month.posts.length, 0),
      );
      const months = year.months.map((month) => month.month);
      expect(months).toEqual([...months].sort((a, b) => b - a));

      for (const month of year.months) {
        const timestamps = month.posts.map((post) =>
          new Date(post.publishedAt).getTime(),
        );
        expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
        expect(
          month.posts.every((post) => {
            const date = new Date(post.publishedAt);
            return (
              date.getUTCFullYear() === year.year &&
              date.getUTCMonth() + 1 === month.month
            );
          }),
        ).toBe(true);
      }
    }
  });

  it("excludes missing and invalid dates without corrupting valid counts", () => {
    const validPosts = makeNewestFirstPosts(3);
    const groups = buildArchiveGroups([
      ...validPosts,
      { slug: "missing", publishedAt: null },
      { slug: "invalid", publishedAt: "not-a-date" },
      { slug: "invalid-date-object", publishedAt: new Date(Number.NaN) },
    ]);

    expect(groups.reduce((sum, year) => sum + year.count, 0)).toBe(3);
    expect(
      groups.flatMap((year) => year.months.flatMap((month) => month.posts)),
    ).toEqual(validPosts);
  });

  it("returns an empty index when no post has a usable publication date", () => {
    expect(
      buildArchiveGroups([{ publishedAt: null }, { publishedAt: "invalid" }]),
    ).toEqual([]);
  });
});
