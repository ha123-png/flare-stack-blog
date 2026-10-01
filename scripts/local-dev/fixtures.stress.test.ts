import { describe, expect, it } from "vitest";
import {
  buildArticleContent,
  FIXTURE_ARTICLES,
  FIXTURE_STRESS_ARTICLES,
  getFixtureArticles,
} from "./fixtures.ts";

type ContentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: Array<ContentNode>;
};

function flattenContent(node: ContentNode): Array<ContentNode> {
  return [node, ...(node.content ?? []).flatMap(flattenContent)];
}

describe("local archive stress fixtures", () => {
  it("keeps the default dataset at 30 and adds exactly 220 stable published posts", () => {
    expect(FIXTURE_ARTICLES).toHaveLength(30);
    expect(getFixtureArticles(false)).toBe(FIXTURE_ARTICLES);
    expect(FIXTURE_STRESS_ARTICLES).toHaveLength(220);

    const stressArticles = getFixtureArticles(true);
    expect(stressArticles).toHaveLength(250);
    expect(
      stressArticles.filter((article) => article.status === "published"),
    ).toHaveLength(245);
    expect(
      stressArticles.filter((article) => article.status === "draft"),
    ).toHaveLength(3);
    expect(
      stressArticles.filter((article) => article.status === "scheduled"),
    ).toHaveLength(2);
    expect(new Set(stressArticles.map((article) => article.slug)).size).toBe(
      250,
    );

    const latestDefaultPostAge = Math.max(
      ...FIXTURE_ARTICLES.filter(
        (article) => article.status === "published",
      ).map((article) => article.publishedDaysAgo ?? 0),
    );
    expect(
      Math.min(
        ...FIXTURE_STRESS_ARTICLES.map(
          (article) => article.publishedDaysAgo ?? Number.POSITIVE_INFINITY,
        ),
      ),
    ).toBeGreaterThan(latestDefaultPostAge);
  });

  it("includes a blank-summary post with a long code sample and an eight-column table", () => {
    const article = FIXTURE_STRESS_ARTICLES.find(
      (item) => item.contentMode === "archive-stress",
    );
    expect(article).toBeDefined();
    expect(article?.summary).toBe("");
    expect(article?.title.length).toBeGreaterThan(100);

    const root = buildArticleContent(article!) as unknown as ContentNode;
    const nodes = flattenContent(root);
    const headingLevels = nodes
      .filter((node) => node.type === "heading")
      .map((node) => node.attrs?.level);
    expect(headingLevels).toEqual(expect.arrayContaining([1, 2, 3]));

    const code = nodes.find((node) => node.type === "codeBlock")?.content?.[0]
      ?.text;
    expect(code?.split("\n")).toHaveLength(64);

    const table = nodes.find((node) => node.type === "table");
    expect(table?.content).toHaveLength(9);
    expect(table?.content?.every((row) => row.content?.length === 8)).toBe(
      true,
    );
    expect(
      table?.content?.[0]?.content?.every(
        (cell) => cell.type === "tableHeader",
      ),
    ).toBe(true);
  });
});
