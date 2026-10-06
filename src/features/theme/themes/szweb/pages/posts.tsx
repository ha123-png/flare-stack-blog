import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import type { PostsPageProps } from "@/features/theme/contract/pages";
import {
  articleChroma,
  articlePaperAccent,
} from "../components/article-chroma";
import { ArticlePreview } from "../components/article-preview";
import { PageHeading, useSite } from "../components/primitives";
import { text } from "../i18n";
import { useBatchedViewCounts } from "./_shared/use-batched-view-counts";

const INITIAL_TAG_LIMIT = 14;
const LIST_STATE_PREFIX = "szweb:posts-state:";

type SavedListState = {
  previewSlug?: string | null;
  scrollY?: number;
};

function formatPostDate(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return {
    dateTime: date.toISOString().slice(0, 10),
    label: text(
      `${month}.${day}`,
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date),
    ),
    year: date.getUTCFullYear(),
  };
}

function isInternalTag(name: string) {
  return name.trim().toLowerCase().startsWith("_chroma:");
}

function tagsForPost(post: PostItem) {
  return (post.tags ?? []).filter((tag) => !isInternalTag(tag.name));
}

function readSavedState(key: string): SavedListState | null {
  try {
    const value = sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as SavedListState) : null;
  } catch {
    return null;
  }
}

function saveListState(key: string, state: SavedListState) {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Scroll and preview restoration are an enhancement; keep navigation usable
    // when storage is disabled or full.
  }
}

function PostRow({
  post,
  pinned,
  views,
  viewsPending,
  compact,
  expanded,
  onTogglePreview,
  onBeforeOpen,
  onTagClick,
}: {
  post: PostItem;
  pinned: boolean;
  views?: number;
  viewsPending: boolean;
  compact: boolean;
  expanded: boolean;
  onTogglePreview: () => void;
  onBeforeOpen: () => void;
  onTagClick: (tagName: string) => void;
}) {
  const tags = tagsForPost(post);
  const { projects } = useSite();
  const date = formatPostDate(post.publishedAt);

  return (
    <article
      className={`sz-article-row sz-paper-row${compact ? " is-compact" : ""}${expanded ? " is-expanded" : ""}`}
      data-chroma={articleChroma(post.slug, post.tags)}
      data-paper-accent={articlePaperAccent(post, projects)}
      data-article={post.slug}
      id={`sz-post-${post.slug}`}
    >
      <time className="sz-article-date" dateTime={date?.dateTime}>
        {date?.label ?? "—"}
        {date && <small>{date.year}</small>}
      </time>

      <div className="sz-article-copy">
        <div className="sz-article-title-line">
          <h2 className="sz-article-title">
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              onClick={onBeforeOpen}
            >
              {post.title}
            </Link>
          </h2>
          {pinned && (
            <span
              className="sz-article-flags"
              aria-label={text("文章标记", "Article labels")}
            >
              <span>{text("置顶", "Pinned")}</span>
            </span>
          )}
        </div>

        {!compact && post.summary && (
          <p className="sz-article-summary">{post.summary}</p>
        )}

        <div className="sz-article-meta">
          <div
            className="sz-article-tags"
            aria-label={text("文章标签", "Article tags")}
          >
            {tags.map((tag) => (
              <button
                className="sz-text-link"
                key={tag.id}
                type="button"
                onClick={() => onTagClick(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <span>
            {text(
              `${post.readTimeInMinutes} 分钟阅读`,
              `${post.readTimeInMinutes} min read`,
            )}
          </span>
          {viewsPending ? (
            <span aria-live="polite">
              {text("浏览量载入中", "Loading views…")}
            </span>
          ) : views !== undefined ? (
            <span>
              {text(
                `浏览 ${views.toLocaleString("zh-CN")}`,
                `${views.toLocaleString("en-US")} views`,
              )}
            </span>
          ) : null}
          <button
            aria-controls={`sz-preview-${post.slug}`}
            aria-expanded={expanded}
            className="sz-preview-trigger"
            type="button"
            onClick={onTogglePreview}
          >
            {expanded
              ? text("收起节选", "Close excerpt")
              : text("先读一段", "Read a preview")}
          </button>
        </div>

        {expanded && (
          <div className="sz-inline-preview" id={`sz-preview-${post.slug}`}>
            <ArticlePreview slug={post.slug} onBeforeOpen={onBeforeOpen} />
          </div>
        )}
      </div>
    </article>
  );
}

export function PostsPage({
  posts,
  tags,
  selectedTag,
  onTagClick,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: PostsPageProps) {
  const [compact, setCompact] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const storageKey = `${LIST_STATE_PREFIX}${selectedTag || "all"}`;

  const visibleTags = useMemo(() => {
    const publicTags = tags.filter((tag) => !isInternalTag(tag.name));
    const matching = tagSearch.trim()
      ? publicTags.filter((tag) =>
          tag.name
            .toLocaleLowerCase()
            .includes(tagSearch.trim().toLocaleLowerCase()),
        )
      : publicTags;
    return tagsExpanded || tagSearch.trim()
      ? matching
      : matching.slice(0, INITIAL_TAG_LIMIT);
  }, [tags, tagSearch, tagsExpanded]);

  const postSlugs = useMemo(() => posts.map((post) => post.slug), [posts]);
  const { counts: viewCounts, isPending: viewsPending } =
    useBatchedViewCounts(postSlugs);

  useEffect(() => {
    const saved = readSavedState(storageKey);
    if (!saved) return;

    setPreviewSlug(saved.previewSlug ?? null);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Storage may be disabled; restored state remains usable for this visit.
    }
    if (typeof saved.scrollY === "number" && saved.scrollY > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: saved.scrollY }));
    }
  }, [storageKey]);

  const saveCurrentState = (nextPreviewSlug = previewSlug) => {
    saveListState(storageKey, {
      previewSlug: nextPreviewSlug,
      scrollY: window.scrollY,
    });
  };

  const handlePreviewToggle = (slug: string) => {
    const next = previewSlug === slug ? null : slug;
    setPreviewSlug(next);
    saveCurrentState(next);
  };

  const loadedLabel = hasNextPage
    ? text(
        `已载入 ${posts.length} 篇，继续向下浏览可加载更多`,
        `${posts.length} posts loaded. Load more to continue.`,
      )
    : selectedTag
      ? text(
          `共 ${posts.length} 篇「${selectedTag}」主题文章`,
          `${posts.length} published posts tagged “${selectedTag}”`,
        )
      : text(`${posts.length} 篇已发布文章`, `${posts.length} published posts`);

  return (
    <div className="sz-wrap sz-posts-page">
      <PageHeading
        display
        eyebrow={text("写作索引 / WRITING", "WRITING")}
        title={text("文章", "Articles")}
        description={text(
          "按发布时间浏览，或从一个主题开始。",
          "Browse by date or start with a topic.",
        )}
      >
        <p className="sz-article-range" aria-live="polite">
          {loadedLabel}
        </p>
      </PageHeading>

      <section
        className="sz-post-filters"
        aria-label={text("文章筛选", "Filter articles")}
      >
        <div className="sz-filter-heading">
          <p className="sz-label">{text("主题", "Topics")}</p>
          <label className="sz-tag-search">
            <span className="sz-visually-hidden">
              {text("搜索标签", "Search tags")}
            </span>
            <input
              autoComplete="off"
              type="search"
              value={tagSearch}
              placeholder={text("搜索标签", "Search tags")}
              onChange={(event) => setTagSearch(event.currentTarget.value)}
            />
            {tagSearch && (
              <button
                className="sz-tag-search-clear"
                type="button"
                aria-label={text("清除标签搜索", "Clear tag search")}
                onClick={() => setTagSearch("")}
              >
                {text("清除", "Clear")}
              </button>
            )}
          </label>
        </div>

        <div className="sz-topic-strip">
          <button
            aria-pressed={!selectedTag}
            className={`sz-topic-link${!selectedTag ? " is-active" : ""}`}
            type="button"
            onClick={() => onTagClick("")}
          >
            {text("全部", "All")}
          </button>
          {visibleTags.map((tag) => (
            <button
              aria-pressed={selectedTag === tag.name}
              className={`sz-topic-link${selectedTag === tag.name ? " is-active" : ""}`}
              key={tag.id}
              type="button"
              onClick={() => onTagClick(tag.name)}
            >
              <span>{tag.name}</span>
              <small>{tag.postCount}</small>
            </button>
          ))}
          {!tagSearch && tags.length > INITIAL_TAG_LIMIT && (
            <button
              aria-expanded={tagsExpanded}
              className="sz-topic-expand"
              type="button"
              onClick={() => setTagsExpanded((expanded) => !expanded)}
            >
              {tagsExpanded
                ? text("收起", "Show fewer")
                : text(
                    `更多标签 +${tags.length - INITIAL_TAG_LIMIT}`,
                    `More tags +${tags.length - INITIAL_TAG_LIMIT}`,
                  )}
            </button>
          )}
        </div>

        {selectedTag && (
          <div className="sz-active-filter">
            <span>
              {text("当前主题：", "Current topic: ")}
              {selectedTag}
            </span>
            <button
              className="sz-text-link"
              type="button"
              onClick={() => onTagClick("")}
            >
              {text("清除筛选", "Clear filter")}
            </button>
          </div>
        )}
      </section>

      <div className="sz-list-toolbar">
        <p className="sz-muted">
          {posts.length
            ? text(`显示 ${posts.length} 篇`, `Showing ${posts.length} posts`)
            : ""}
        </p>
        <div
          className="sz-view-toggle"
          role="group"
          aria-label={text("文章列表密度", "Article list density")}
        >
          <button
            aria-pressed={!compact}
            className={!compact ? "is-selected" : ""}
            type="button"
            onClick={() => setCompact(false)}
          >
            {text("舒展", "Comfortable")}
          </button>
          <button
            aria-pressed={compact}
            className={compact ? "is-selected" : ""}
            type="button"
            onClick={() => setCompact(true)}
          >
            {text("紧凑", "Compact")}
          </button>
        </div>
      </div>

      <div className={`sz-index-columns${previewSlug ? " has-preview" : ""}`}>
        <section
          aria-label={text("文章列表", "Article list")}
          className={`sz-article-list${compact ? " is-compact" : ""}`}
        >
          {posts.length === 0 ? (
            <div className="sz-empty-state">
              <p className="sz-label">{text("没有文章", "No articles")}</p>
              <h2>
                {selectedTag
                  ? text(
                      `暂时没有「${selectedTag}」相关文章。`,
                      `There are no published articles tagged “${selectedTag}” yet.`,
                    )
                  : text(
                      "这里还没有已发布文章。",
                      "No published articles yet.",
                    )}
              </h2>
              {selectedTag && (
                <button
                  className="sz-text-link"
                  type="button"
                  onClick={() => onTagClick("")}
                >
                  {text("清除标签筛选", "Clear tag filter")}
                </button>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                pinned={Boolean(post.pinnedAt)}
                views={viewCounts[post.slug]}
                viewsPending={viewsPending}
                compact={compact}
                expanded={previewSlug === post.slug}
                onTogglePreview={() => handlePreviewToggle(post.slug)}
                onBeforeOpen={() => saveCurrentState()}
                onTagClick={onTagClick}
              />
            ))
          )}
        </section>
        {previewSlug && (
          <aside
            className="sz-preview-rail"
            aria-label={text("文章节选", "Article excerpt")}
          >
            <ArticlePreview
              slug={previewSlug}
              onBeforeOpen={() => saveCurrentState()}
            />
          </aside>
        )}
      </div>

      {hasNextPage && (
        <div className="sz-load-more">
          <button
            className="sz-button"
            type="button"
            disabled={isFetchingNextPage}
            onClick={fetchNextPage}
          >
            {isFetchingNextPage
              ? text("正在载入文章…", "Loading articles…")
              : text("加载更多文章", "Load more articles")}
          </button>
          {isFetchingNextPage && (
            <span className="sz-muted" role="status">
              {text("正在载入下一批", "Loading the next batch")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function PostsPageSkeleton() {
  return (
    <div
      className="sz-wrap sz-posts-page"
      aria-busy="true"
      aria-label={text("正在载入文章", "Loading articles")}
    >
      <header className="sz-page-heading">
        <div>
          <p className="sz-label">{text("文章", "Articles")}</p>
          <div className="sz-skeleton sz-skeleton-title" />
          <div className="sz-skeleton sz-skeleton-copy" />
        </div>
      </header>
      <div className="sz-skeleton-topic-strip" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <section className="sz-article-list">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="sz-skeleton-row" key={index}>
            <div className="sz-skeleton sz-skeleton-date" />
            <div className="sz-skeleton-row-copy">
              <div className="sz-skeleton sz-skeleton-line-title" />
              <div className="sz-skeleton sz-skeleton-line-copy" />
              <div className="sz-skeleton sz-skeleton-line-meta" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
