import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { tagsQueryOptions } from "@/features/tags/queries";
import { PageHeading } from "../components/primitives";
import { text } from "../i18n";

type TagSort = "popular" | "name";

function isInternalTag(name: string) {
  return name.trim().toLocaleLowerCase().startsWith("_chroma:");
}

export function TagsPage() {
  const { data: sourceTags } = useSuspenseQuery(tagsQueryOptions);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TagSort>("popular");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const locale = text("zh-CN", "en");

  const tags = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    const filtered = sourceTags.filter(
      (tag) =>
        !isInternalTag(tag.name) &&
        (!search || tag.name.toLocaleLowerCase().includes(search)),
    );

    return filtered.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, locale);
      return b.postCount - a.postCount || a.name.localeCompare(b.name, locale);
    });
  }, [sourceTags, query, sort, locale]);

  const selected = activeTag
    ? sourceTags.find(
        (tag) => tag.name === activeTag && !isInternalTag(tag.name),
      )
    : undefined;

  return (
    <div className="sz-wrap sz-tags-page">
      <PageHeading
        display
        eyebrow={text("主题索引 / TOPICS", "TOPICS")}
        title={text("标签", "Tags")}
        description={text(
          "从一个词出发，找到相关的文章。",
          "Start with a word and find related writing.",
        )}
      >
        <p className="sz-tags-total">
          {text(`${tags.length} 个主题`, `${tags.length} topics`)}
        </p>
      </PageHeading>

      <section
        className="sz-tag-directory-tools"
        aria-label={text("搜索与排序主题", "Search and sort topics")}
      >
        <label className="sz-tag-directory-search">
          <span className="sz-visually-hidden">
            {text("搜索标签", "Search tags")}
          </span>
          <input
            autoComplete="off"
            type="search"
            value={query}
            placeholder={text("搜索主题…", "Search topics…")}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {query && (
            <button
              aria-label={text("清除主题搜索", "Clear topic search")}
              type="button"
              onClick={() => setQuery("")}
            >
              {text("清除", "Clear")}
            </button>
          )}
        </label>
        <label className="sz-tag-sort">
          <span className="sz-label">{text("排序", "Sort")}</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.currentTarget.value as TagSort)}
          >
            <option value="popular">{text("文章数量", "Post count")}</option>
            <option value="name">{text("名称", "Name")}</option>
          </select>
        </label>
      </section>

      {selected && (
        <div className="sz-active-tag" aria-live="polite">
          <p>
            {text("当前主题", "Current topic")} <strong>{selected.name}</strong>
            <span>
              {text(
                `${selected.postCount} 篇文章`,
                `${selected.postCount} posts`,
              )}
            </span>
          </p>
          <Link
            className="sz-text-link"
            to="/posts"
            search={{ tagName: selected.name }}
          >
            {text("查看相关文章", "View related posts")}{" "}
            <span aria-hidden="true">→</span>
          </Link>
          <button
            className="sz-text-link"
            type="button"
            onClick={() => setActiveTag(null)}
          >
            {text("清除", "Clear")}
          </button>
        </div>
      )}

      {sourceTags.length === 0 ? (
        <div className="sz-empty-state">
          <p className="sz-label">{text("暂无主题", "No topics yet")}</p>
          <h2>
            {text(
              "发布文章并添加标签后，会出现在这里。",
              "Topics will appear here after you publish tagged articles.",
            )}
          </h2>
        </div>
      ) : tags.length === 0 ? (
        <div className="sz-empty-state">
          <p className="sz-label">
            {text("没有匹配结果", "No matching topics")}
          </p>
          <h2>
            {text(
              "换一个词搜索，或清除当前搜索。",
              "Try another term or clear your search.",
            )}
          </h2>
          <button
            className="sz-text-link"
            type="button"
            onClick={() => setQuery("")}
          >
            {text("清除搜索", "Clear search")}
          </button>
        </div>
      ) : (
        <ol
          className="sz-tag-index"
          aria-label={text("主题列表", "Topic list")}
        >
          {tags.map((tag) => (
            <li key={tag.id}>
              <button
                aria-pressed={activeTag === tag.name}
                className={`sz-tag-index-entry${activeTag === tag.name ? " is-active" : ""}`}
                type="button"
                onClick={() =>
                  setActiveTag((current) =>
                    current === tag.name ? null : tag.name,
                  )
                }
              >
                <span>{tag.name}</span>
                <small>{tag.postCount}</small>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
