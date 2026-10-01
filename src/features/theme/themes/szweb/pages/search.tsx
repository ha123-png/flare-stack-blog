import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  SearchPageProps,
  SearchResultItem,
} from "@/features/theme/contract/pages";
import { articleChroma } from "../components/article-chroma";
import { text } from "../i18n";

import { parseSafeSnippet } from "./_shared/search-snippets";

/** Render only the server's exact <mark> wrapper; all other markup stays text. */
function SafeSnippet({ value }: { value: string }) {
  return (
    <>
      {parseSafeSnippet(value).map((segment, index) => {
        if (segment.marked) {
          return <mark key={index}>{segment.text}</mark>;
        }
        return <span key={index}>{segment.text}</span>;
      })}
    </>
  );
}

function resultSnippet(result: SearchResultItem) {
  return (
    result.matches.summary ??
    result.matches.contentSnippet ??
    result.post.summary ??
    ""
  );
}

export function SearchPage({
  query,
  results,
  isSearching,
  errorMessage,
  onQueryChange,
  onSelectPost,
  onBack,
  onRetry,
}: SearchPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = query.trim();

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const visibleResults =
    isSearching || errorMessage !== undefined || !normalizedQuery
      ? []
      : results;

  useEffect(() => {
    if (activeIndex >= visibleResults.length) {
      setActiveIndex(visibleResults.length - 1);
    }
  }, [activeIndex, visibleResults.length]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "ArrowDown" && visibleResults.length > 0) {
      event.preventDefault();
      setActiveIndex((current) =>
        current < 0 ? 0 : Math.min(visibleResults.length - 1, current + 1),
      );
      return;
    }

    if (event.key === "ArrowUp" && visibleResults.length > 0) {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? visibleResults.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const selected = visibleResults[activeIndex];
      if (selected) onSelectPost(selected.post.slug);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (activeIndex >= 0) {
        setActiveIndex(-1);
      } else if (query) {
        onQueryChange("");
      } else {
        onBack();
      }
    }
  };

  useEffect(() => {
    if (activeIndex < 0) return;
    document
      .getElementById(`sz-search-option-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div className="sz-wrap sz-search-page">
      <header className="sz-search-heading">
        <button className="sz-text-link" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> {text("返回", "Back")}
        </button>
        <h1 className="sz-label">{text("全文搜索", "Full-text search")}</h1>
      </header>

      <section
        className="sz-search-box"
        aria-label={text("搜索文章", "Search articles")}
      >
        <label className="sz-visually-hidden" htmlFor="sz-search-input">
          {text(
            "搜索标题、摘要、正文和标签",
            "Search titles, summaries, content, and tags",
          )}
        </label>
        <input
          id="sz-search-input"
          ref={inputRef}
          aria-autocomplete="list"
          aria-controls="sz-search-results"
          aria-expanded={normalizedQuery.length > 0}
          aria-activedescendant={
            activeIndex >= 0 ? `sz-search-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          name="q"
          placeholder={text(
            "搜索标题、摘要、正文与标签…",
            "Search titles, summaries, content, and tags…",
          )}
          role="combobox"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            aria-label={text("清除搜索内容", "Clear search")}
            className="sz-search-clear sz-icon-button"
            type="button"
            onClick={() => {
              onQueryChange("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
        <div className="sz-search-hints" aria-hidden="true">
          <span>{text("标题", "Title")}</span>
          <span>{text("摘要", "Summary")}</span>
          <span>{text("正文", "Content")}</span>
          <span>{text("标签", "Tags")}</span>
          <kbd>↑↓</kbd>
          <kbd>Enter</kbd>
          <kbd>Esc</kbd>
        </div>
      </section>

      <section
        aria-label={text("搜索结果", "Search results")}
        aria-live="polite"
        className="sz-search-results"
        id="sz-search-results"
        role="listbox"
      >
        {!normalizedQuery ? (
          <div className="sz-search-discovery">
            <p className="sz-label">{text("开始搜索", "Start searching")}</p>
            <p className="sz-muted">
              {text(
                "输入关键词，查找文章标题、摘要、正文和关联标签。",
                "Enter a keyword to find matching titles, summaries, content, and tags.",
              )}
            </p>
          </div>
        ) : errorMessage !== undefined && !isSearching ? (
          <div className="sz-empty-state" role="alert">
            <p className="sz-label">
              {text("搜索暂不可用", "Search is temporarily unavailable")}
            </p>
            <h2>
              {errorMessage ||
                text("请稍后再试。", "Please try again shortly.")}
            </h2>
            {onRetry && (
              <button className="sz-button" type="button" onClick={onRetry}>
                {text("重试搜索", "Retry search")}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="sz-search-status">
              <p className="sz-muted">
                {isSearching
                  ? text("正在检索…", "Searching…")
                  : text(
                      `${visibleResults.length} 条结果`,
                      `${visibleResults.length} results`,
                    )}
              </p>
              {isSearching && (
                <span className="sz-search-progress" aria-hidden="true" />
              )}
            </div>

            {isSearching && visibleResults.length === 0 ? (
              <div className="sz-search-loading" role="status">
                <span />
                <span />
                <span />
              </div>
            ) : !isSearching && visibleResults.length === 0 ? (
              <div className="sz-empty-state">
                <p className="sz-label">
                  {text("没有匹配文章", "No matching articles")}
                </p>
                <h2>
                  {text("换个关键词再试试。", "Try another search term.")}
                </h2>
                <p className="sz-muted">
                  {text("搜索词：", "Search term: ")}
                  {normalizedQuery}
                </p>
              </div>
            ) : (
              <div className="sz-search-list">
                {visibleResults.map((result, index) => {
                  const snippet = resultSnippet(result);
                  return (
                    <button
                      aria-selected={activeIndex === index}
                      className={`sz-search-result sz-paper-row${activeIndex === index ? " is-active" : ""}`}
                      data-chroma={articleChroma(
                        result.post.slug,
                        result.post.tags,
                      )}
                      data-article={result.post.slug}
                      id={`sz-search-option-${index}`}
                      key={result.post.id}
                      role="option"
                      type="button"
                      onClick={() => onSelectPost(result.post.slug)}
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                    >
                      <span className="sz-search-result-title">
                        {result.matches.title ? (
                          <SafeSnippet value={result.matches.title} />
                        ) : (
                          result.post.title
                        )}
                      </span>
                      {snippet && (
                        <span className="sz-search-result-snippet">
                          <SafeSnippet value={snippet} />
                        </span>
                      )}
                      {result.post.tags.length > 0 && (
                        <span className="sz-search-result-tags">
                          {result.post.tags
                            .filter(
                              (tag) =>
                                !tag
                                  .trim()
                                  .toLowerCase()
                                  .startsWith("_chroma:"),
                            )
                            .map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
