import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { articleChroma } from "../components/article-chroma";
import { text } from "../i18n";
import { archiveDateParts } from "./_shared/archive-index.ts";
import { useArchiveIndex } from "./_shared/use-archive-index";

function monthId(year: number, month: number) {
  return `sz-archive-${year}-${String(month).padStart(2, "0")}`;
}

function formatArchiveDate(post: PostItem) {
  const parts = archiveDateParts(post);
  if (!parts || !post.publishedAt) return null;
  const date =
    post.publishedAt instanceof Date
      ? post.publishedAt
      : new Date(post.publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return {
    dateTime: date.toISOString().slice(0, 10),
    day: text(
      `${String(parts.month).padStart(2, "0")}.${String(parts.day).padStart(2, "0")}`,
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(date),
    ),
  };
}

function monthLabel(month: number, style: "short" | "long" = "long") {
  const date = new Date(Date.UTC(2026, month - 1, 1));
  const chinese =
    style === "short"
      ? String(month).padStart(2, "0")
      : `${String(month).padStart(2, "0")}月`;
  return text(
    chinese,
    new Intl.DateTimeFormat("en-US", { month: style, timeZone: "UTC" }).format(
      date,
    ),
  );
}

export function ArchivePage() {
  const {
    groups: typedGroups,
    loadedPosts,
    count: indexedCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useArchiveIndex();
  const { hash } = useLocation();
  const [openYears, setOpenYears] = useState<Set<number>>(
    () => new Set(typedGroups[0] ? [typedGroups[0].year] : []),
  );
  const jumpedHash = useRef<string | null>(null);
  useEffect(() => {
    if (jumpedHash.current === hash) return;
    const match = /^year-(\d{4})$/.exec(hash);
    if (!match) {
      jumpedHash.current = hash;
      return;
    }
    const year = Number(match[1]);
    if (!typedGroups.some((group) => group.year === year)) return;
    jumpedHash.current = hash;
    setOpenYears((current) => new Set(current).add(year));
    const frame = requestAnimationFrame(() =>
      document.getElementById(hash)?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [hash, typedGroups]);

  const toggleYear = (year: number) => {
    setOpenYears((current) => {
      const next = new Set(current);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const jumpToMonth = (year: number, month: number) => {
    setOpenYears((current) => new Set(current).add(year));
    const targetId = monthId(year, month);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
      });
    });
  };

  const rangeText = hasNextPage
    ? text(
        `正在建立完整索引 · 已载入 ${loadedPosts.length} 篇，年月数量暂为部分结果`,
        `Building the full index · ${loadedPosts.length} posts loaded; month counts are partial.`,
      )
    : text(
        `全部文章 · ${indexedCount} 篇 · ${typedGroups.length} 个年份`,
        `Complete archive · ${indexedCount} posts · ${typedGroups.length} years`,
      );

  return (
    <div className="sz-wrap sz-archive-page">
      <header className="sz-page-heading">
        <div>
          <p className="sz-label">
            {text("成长档案 / ARCHIVE", "A growing archive")}
          </p>
          <h1>{text("时间", "Time")}</h1>
          <p className="sz-muted">
            {text(
              "从现在回望。那些写下的、做过的，都留在时间里。",
              "Looking back from here. A record of what I wrote, tried, and made.",
            )}
          </p>
        </div>
        <p className="sz-archive-range" aria-live="polite" role="status">
          {rangeText}
        </p>
      </header>

      {typedGroups.length > 0 && (
        <nav
          className="sz-archive-jump"
          aria-label={text("按年份翻阅", "Browse by year")}
        >
          {typedGroups.map((group) => (
            <a
              key={group.year}
              href={`#year-${group.year}`}
              onClick={() =>
                setOpenYears((current) => new Set(current).add(group.year))
              }
            >
              {group.year}
            </a>
          ))}
        </nav>
      )}

      <section
        className="sz-archive-groups"
        aria-label={text("历年文章", "Article archive")}
      >
        {typedGroups.length === 0 && !hasNextPage ? (
          <div className="sz-empty-state">
            <p className="sz-label">{text("尚无文章", "No articles yet")}</p>
            <h2>
              {text(
                "发布的文章会按时间出现在这里。",
                "Published articles will appear here in chronological order.",
              )}
            </h2>
          </div>
        ) : (
          typedGroups.map((group) => {
            const isOpen = openYears.has(group.year);
            return (
              <section
                className="sz-archive-year"
                id={`year-${group.year}`}
                key={group.year}
              >
                <h2 className="sz-archive-year-heading">
                  <button
                    aria-expanded={isOpen}
                    aria-controls={`sz-year-leaf-${group.year}`}
                    className="sz-archive-year-toggle"
                    type="button"
                    onClick={() => toggleYear(group.year)}
                  >
                    <span className="sz-archive-year-number">{group.year}</span>
                    <span className="sz-archive-year-count">
                      {text(
                        `${group.count} 篇${hasNextPage ? "（当前已载入）" : ""}`,
                        `${group.count} posts${hasNextPage ? " (loaded so far)" : ""}`,
                      )}
                    </span>
                    <span className="sz-archive-year-icon" aria-hidden="true">
                      <span>
                        {isOpen ? text("收起", "Close") : text("展开", "Open")}
                      </span>
                      <i />
                    </span>
                  </button>
                </h2>
                <nav
                  className="sz-archive-year-index"
                  aria-label={text(
                    `${group.year} 年的月份`,
                    `Months in ${group.year}`,
                  )}
                >
                  {group.months.map((month) => (
                    <button
                      type="button"
                      key={month.month}
                      onClick={() => jumpToMonth(group.year, month.month)}
                      aria-label={text(
                        `跳转到 ${group.year} 年 ${month.month} 月，${month.posts.length} 篇文章`,
                        `Jump to ${monthLabel(month.month)} ${group.year}, ${month.posts.length} articles`,
                      )}
                    >
                      <span>{monthLabel(month.month)}</span>
                      <small>
                        {text(
                          `${month.posts.length} 篇${hasNextPage ? " · 已载入" : ""}`,
                          `${month.posts.length} articles${hasNextPage ? " · loaded" : ""}`,
                        )}
                      </small>
                    </button>
                  ))}
                </nav>
                <div
                  className="sz-archive-months"
                  id={`sz-year-leaf-${group.year}`}
                  hidden={!isOpen}
                >
                  {group.months.map((month) => (
                    <section
                      className="sz-archive-month"
                      id={monthId(group.year, month.month)}
                      key={`${group.year}-${month.month}`}
                    >
                      <header className="sz-archive-month-heading">
                        <h3>{monthLabel(month.month)}</h3>
                        <span className="sz-muted">
                          {text(
                            `${month.posts.length} 篇${hasNextPage ? " · 部分" : ""}`,
                            `${month.posts.length} posts${hasNextPage ? " · partial" : ""}`,
                          )}
                        </span>
                      </header>
                      <ul>
                        {month.posts.map((post) => {
                          const date = formatArchiveDate(post);
                          return (
                            <li
                              key={post.id}
                              className="sz-paper-row"
                              data-chroma={articleChroma(post.slug, post.tags)}
                            >
                              <time dateTime={date?.dateTime}>
                                {date?.day ?? "—"}
                              </time>
                              <Link
                                to="/post/$slug"
                                params={{ slug: post.slug }}
                              >
                                {post.title}
                              </Link>
                              <span className="sz-archive-read-time">
                                {text(
                                  `${post.readTimeInMinutes} 分钟`,
                                  `${post.readTimeInMinutes} min`,
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </section>

      {hasNextPage && isFetchNextPageError && (
        <div className="sz-archive-load-state" role="alert">
          <p>
            {text(
              "时间索引暂时中断，已显示的数量仅代表已载入部分。",
              "Archive loading paused. The counts shown include only loaded posts.",
            )}
          </p>
          <button
            className="sz-button"
            type="button"
            onClick={() => void fetchNextPage()}
          >
            {text("继续载入", "Continue loading")}
          </button>
        </div>
      )}

      {hasNextPage && isFetchingNextPage && (
        <p className="sz-archive-loading" role="status">
          {text(
            "正在顺序载入下一批文章…",
            "Loading the next batch of articles…",
          )}
        </p>
      )}
    </div>
  );
}
