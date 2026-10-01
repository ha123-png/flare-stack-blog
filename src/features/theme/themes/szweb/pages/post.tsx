import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ClientOnly,
  getRouteApi,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowLeft, ArrowUp, Check, Copy, Minus, Plus } from "lucide-react";
import type { CSSProperties, RefObject } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useViewCounts } from "@/features/pageview/queries";
import { relatedPostsQuery } from "@/features/posts/queries";
import type { TableOfContentsItem } from "@/features/posts/utils/toc";
import type { PostPageProps } from "@/features/theme/contract/pages";
import { useActiveTOC } from "@/hooks/use-active-toc";
import { authClient } from "@/lib/auth/auth.client";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { articleChroma } from "../components/article-chroma";
import { CommentSection } from "../components/comments/comment-section";
import { ContentRenderer } from "../components/content/content-renderer";
import { text } from "../i18n";
import { isPublicTag } from "../site";
import "../styles/reading.css";

const routeApi = getRouteApi("/_public/post/$slug");

function formatPublishedDate(value: Date | string | null | undefined) {
  return value ? formatDate(value) : "—";
}

function PostTableOfContents({
  headers,
  commentCount,
}: {
  headers: Array<TableOfContentsItem>;
  commentCount: number;
}) {
  const activeId = useActiveTOC(headers);
  const navigate = useNavigate();

  if (headers.length === 0) return null;

  const goTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
      navigate({ hash: id, replace: true, hashScrollIntoView: false });
    }
  };

  const list = (
    <>
      {headers.map((header) => (
        <a
          key={header.id}
          href={`#${header.id}`}
          aria-current={activeId === header.id ? "location" : undefined}
          className={`sz-toc-link${activeId === header.id ? " sz-is-active" : ""}`}
          style={
            { "--sz-toc-depth": Math.max(0, header.level - 2) } as CSSProperties
          }
          onClick={(event) => {
            event.preventDefault();
            goTo(header.id);
          }}
        >
          {header.text}
        </a>
      ))}
      <a
        className="sz-toc-link sz-toc-comments"
        href="#comments"
        onClick={(event) => {
          event.preventDefault();
          goTo("comments");
        }}
      >
        {m.comments_count({ count: commentCount })}
      </a>
    </>
  );

  return (
    <>
      <nav
        className="sz-post-toc sz-post-toc-desktop"
        aria-label={text("文章目录", "Table of contents")}
      >
        <p className="sz-label">{text("这篇文章", "On this page")}</p>
        <div className="sz-toc-list">{list}</div>
      </nav>
      <details className="sz-post-toc-mobile">
        <summary>
          {text("文章目录", "Contents")} <span>{headers.length}</span>
        </summary>
        <nav
          aria-label={text("文章目录", "Table of contents")}
          className="sz-toc-list"
        >
          {list}
        </nav>
      </details>
    </>
  );
}

function ReadingProgress({
  articleRef,
  title,
}: {
  articleRef: RefObject<HTMLDivElement | null>;
  title: string;
}) {
  const [progress, setProgress] = useState(0);
  const [readingPast, setReadingPast] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const article = articleRef.current;
        if (!article) return;
        const rect = article.getBoundingClientRect();
        const total = Math.max(
          1,
          article.offsetHeight - window.innerHeight * 0.5,
        );
        const value = Math.min(
          100,
          Math.max(0, ((window.innerHeight * 0.35 - rect.top) / total) * 100),
        );
        setProgress(Math.round(value));
        setReadingPast(rect.top < -180 && rect.bottom > 0);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [articleRef]);

  return (
    <>
      <aside
        className="sz-reading-rail"
        aria-label={text("阅读进度", "Reading progress")}
      >
        <span>
          {progress === 0 ? text("开始阅读", "Start reading") : `${progress}%`}
        </span>
        <div
          className="sz-reading-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <i style={{ height: `${progress}%` }} />
        </div>
        <small>
          {progress >= 100
            ? text("读完了", "Finished")
            : text("阅读中", "Reading")}
        </small>
      </aside>
      <div
        className={`sz-reading-mobile${readingPast ? " sz-is-visible" : ""}`}
        role="progressbar"
        aria-label={text("阅读进度", "Reading progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span>{readingPast ? title : ""}</span>
        <span>{progress}%</span>
        <i style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}

function RelatedPosts({ slug }: { slug: string }) {
  const { data: posts } = useSuspenseQuery(relatedPostsQuery(slug, 3));
  if (posts.length === 0) return null;
  return (
    <section className="sz-post-related" aria-labelledby="sz-related-heading">
      <div className="sz-related-heading">
        <h2 id="sz-related-heading">
          {text("继续读下去", "Continue reading")}
        </h2>
        <span className="sz-label">
          {text(
            `${posts.length} 篇相关记录`,
            `${posts.length} related articles`,
          )}
        </span>
      </div>
      <div className="sz-related-list">
        {posts.map((post) => (
          <Link
            key={post.id}
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="sz-related-link"
          >
            <span className="sz-related-meta">
              <ClientOnly fallback="—">
                {formatPublishedDate(post.publishedAt)}
              </ClientOnly>
              <i />
              {m.read_time({ count: post.readTimeInMinutes })}
            </span>
            <span className="sz-related-title">{post.title}</span>
            <span className="sz-related-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(m.post_share_success(), {
        description: m.post_share_success_desc(),
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(m.post_share_error(), {
        description: m.post_share_error_desc(),
      });
    }
  };
  return (
    <button
      className="sz-icon-button"
      type="button"
      onClick={onCopy}
      aria-label={m.post_share()}
      title={m.post_share()}
    >
      {copied ? (
        <Check size={17} aria-hidden="true" />
      ) : (
        <Copy size={17} aria-hidden="true" />
      )}
    </button>
  );
}

export function PostPage({ post }: PostPageProps) {
  const { data: session } = authClient.useSession();
  const { rootId, highlightCommentId } = routeApi.useSearch();
  const articleRef = useRef<HTMLDivElement>(null);
  const [contentScale, setContentScale] = useState(1);
  const { data: viewCounts } = useViewCounts([post.slug]);
  const views = viewCounts?.[post.slug];
  const isUpdated = Boolean(
    post.publishedAt &&
      post.updatedAt &&
      new Date(post.publishedAt).getTime() !==
        new Date(post.updatedAt).getTime(),
  );
  const metadata = useMemo(
    () => (post.tags ?? []).filter((tag) => isPublicTag(tag.name)),
    [post.tags],
  );
  const [commentCount, setCommentCount] = useState(0);

  const adjustText = (delta: number) =>
    setContentScale((current) =>
      Math.min(1.2, Math.max(0.9, Math.round((current + delta) * 100) / 100)),
    );

  return (
    <article
      className="sz-post"
      data-chroma={articleChroma(post.slug, post.tags)}
      data-article={post.slug}
    >
      <ReadingProgress articleRef={articleRef} title={post.title} />
      <div className="sz-post-wrap sz-wrap">
        <nav
          className="sz-post-backline"
          aria-label={text("文章导航", "Article navigation")}
        >
          <Link to="/posts" className="sz-text-link">
            <ArrowLeft size={15} aria-hidden="true" />
            {m.post_back_to_list()}
          </Link>
          <ClientOnly>
            {session?.user.role === "admin" && (
              <Link
                to="/admin/posts/edit/$id"
                params={{ id: String(post.id) }}
                className="sz-text-link sz-admin-edit"
              >
                <span aria-hidden="true">↗</span>
                {m.post_edit()}
              </Link>
            )}
          </ClientOnly>
        </nav>

        <header className="sz-post-header">
          <div
            className="sz-post-tags"
            aria-label={text("文章标签", "Article tags")}
          >
            {metadata.map((tag) => (
              <Link key={tag.id} to="/posts" search={{ tagName: tag.name }}>
                {tag.name}
              </Link>
            ))}
          </div>
          <h1
            className="sz-post-title"
          >
            {post.title}
          </h1>
          {post.summary && <p className="sz-post-summary">{post.summary}</p>}
          <div className="sz-post-meta-row">
            <div className="sz-post-meta">
              <span>
                <ClientOnly fallback="—">
                  {formatPublishedDate(post.publishedAt)}
                </ClientOnly>
              </span>
              {isUpdated && (
                <>
                  <i />
                  <span>
                    {text("更新于", "Updated")}{" "}
                    <ClientOnly fallback="—">
                      {formatPublishedDate(post.updatedAt)}
                    </ClientOnly>
                  </span>
                </>
              )}
              <i />
              <span>{m.read_time({ count: post.readTimeInMinutes })}</span>
              {views !== undefined && (
                <>
                  <i />
                  <span>{m.post_views_count({ count: views })}</span>
                </>
              )}
            </div>
            <div
              className="sz-post-actions"
              aria-label={text("阅读工具", "Reading tools")}
            >
              <button
                className="sz-icon-button"
                type="button"
                onClick={() => adjustText(-0.05)}
                disabled={contentScale <= 0.9}
                aria-label={text("缩小字号", "Decrease text size")}
                title={text("缩小字号", "Decrease text size")}
              >
                <Minus size={15} aria-hidden="true" />
              </button>
              <span className="sz-text-size" aria-live="polite">
                A<span>a</span>
              </span>
              <button
                className="sz-icon-button"
                type="button"
                onClick={() => adjustText(0.05)}
                disabled={contentScale >= 1.2}
                aria-label={text("放大字号", "Increase text size")}
                title={text("放大字号", "Increase text size")}
              >
                <Plus size={15} aria-hidden="true" />
              </button>
              <CopyLinkButton />
            </div>
          </div>
        </header>

        <div className="sz-post-layout">
          <PostTableOfContents headers={post.toc} commentCount={commentCount} />
          <div className="sz-post-main">
            <div
              className="sz-post-content"
              ref={articleRef}
              style={{ "--sz-content-scale": contentScale } as CSSProperties}
            >
              <ContentRenderer content={post.contentJson} />
            </div>
            <footer className="sz-post-footer">
              <div className="sz-post-footer-tags">
                {metadata.map((tag) => (
                  <Link key={tag.id} to="/posts" search={{ tagName: tag.name }}>
                    {tag.name}
                  </Link>
                ))}
              </div>
              <span>
                {text("记录于", "Published on")}{" "}
                <ClientOnly fallback="—">
                  {formatPublishedDate(post.publishedAt)}
                </ClientOnly>
              </span>
            </footer>
            <Suspense fallback={<RelatedPostsSkeleton />}>
              <RelatedPosts slug={post.slug} />
            </Suspense>
            <div className="sz-comments-anchor" id="comments">
              <CommentSection
                postId={post.id}
                onCountChange={setCommentCount}
                initialExpandedRootId={rootId}
                highlightCommentId={highlightCommentId}
              />
            </div>
          </div>
        </div>
      </div>
      <button
        className="sz-back-to-top"
        type="button"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
          })
        }
        aria-label={m.post_back_to_top()}
      >
        <ArrowUp size={17} aria-hidden="true" />
        <span>{m.post_back_to_top()}</span>
      </button>
    </article>
  );
}

export function PostPageSkeleton() {
  return (
    <article
      className="sz-post sz-post-skeleton"
      aria-busy="true"
      aria-label={text("正在加载文章", "Loading article")}
    >
      <div className="sz-post-wrap sz-wrap">
        <div className="sz-skeleton-line sz-skeleton-back" />
        <div className="sz-skeleton-head">
          <div className="sz-skeleton-line sz-skeleton-tags" />
          <div className="sz-skeleton-line sz-skeleton-title" />
          <div className="sz-skeleton-line sz-skeleton-summary" />
          <div className="sz-skeleton-line sz-skeleton-meta" />
        </div>
        <div className="sz-skeleton-body">
          {[100, 88, 96, 70, 95, 82, 99, 63, 92].map((width, index) => (
            <div
              key={index}
              className="sz-skeleton-line"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function RelatedPostsSkeleton() {
  return (
    <section className="sz-post-related sz-related-skeleton" aria-hidden="true">
      <div className="sz-skeleton-line sz-related-skeleton-heading" />
      <div className="sz-related-skeleton-list">
        <div className="sz-skeleton-line" />
        <div className="sz-skeleton-line" />
      </div>
    </section>
  );
}
