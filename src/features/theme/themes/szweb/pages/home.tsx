import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Rss } from "lucide-react";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { tagsQueryOptions } from "@/features/tags/queries";
import type { HomePageProps } from "@/features/theme/contract/pages/home";
import { articleChroma } from "../components/article-chroma";
import {
  dateLabel,
  EmptyState,
  TagLinks,
  useSite,
} from "../components/primitives";
import { ProjectStage } from "../components/project-stage";
import { text as uiText } from "../i18n";
import { editorialMedia, isPublicTag, szwebSite } from "../site";
import { useBatchedViewCounts } from "./_shared/use-batched-view-counts";

function WritingRow({ post, views }: { post: PostItem; views?: number }) {
  const date = post.publishedAt ? new Date(post.publishedAt) : null;
  return (
    <article
      className="sz-home-row sz-paper-row"
      data-chroma={articleChroma(post.slug, post.tags)}
      data-article={post.slug}
    >
      <time dateTime={date?.toISOString()}>
        {date
          ? String(date.getUTCMonth() + 1).padStart(2, "0") +
            "." +
            String(date.getUTCDate()).padStart(2, "0")
          : "—"}
        <small>{date?.getUTCFullYear()}</small>
      </time>
      <div>
        <h3>
          <Link to="/post/$slug" params={{ slug: post.slug }}>
            {post.title}
          </Link>
        </h3>
        <div className="sz-home-row-meta">
          <TagLinks tags={post.tags} />
          <span>
            {post.readTimeInMinutes} {uiText("分钟", " min")}
            {views !== undefined && (
              <>
                {" "}
                · {views} {uiText("次阅读", " views")}
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
export function HomePage({
  posts,
  pinnedPosts = [],
  popularPosts = [],
}: HomePageProps) {
  const site = useSite();
  const featured = pinnedPosts[0] ?? posts[0];
  const recent = posts.filter((post) => post.id !== featured?.id).slice(0, 5);
  const secondaryPinned = pinnedPosts.slice(1);
  const aside = [
    ...secondaryPinned,
    ...popularPosts.filter(
      (post) =>
        post.id !== featured?.id &&
        !secondaryPinned.some((pin) => pin.id === post.id),
    ),
  ];
  const { data: tags = [] } = useQuery(tagsQueryOptions);
  const { counts: views } = useBatchedViewCounts(
    [...posts, ...pinnedPosts].map((post) => post.slug),
  );
  const media = featured ? editorialMedia[featured.slug] : undefined;
  return (
    <>
      <div className="sz-wrap">
        <div className="sz-home-intro">
          <p>
            {site.author && (
              <Link to="/about" className="sz-home-author">
                {site.author}
              </Link>
            )}
            {szwebSite.introduction} <span>{site.description}</span>
          </p>
          <a href="/rss.xml" className="sz-text-link">
            RSS <Rss size={14} />
          </a>
        </div>
        {featured ? (
          <section
            className={"sz-featured" + (!media ? " sz-featured--type" : "")}
          >
            <div className="sz-featured-copy">
              <div className="sz-meta">
                <span className="sz-kicker">
                  {featured.pinnedAt
                    ? uiText("精选文章", "Featured")
                    : uiText("最新文章", "Latest article")}
                </span>
                <time
                  dateTime={
                    featured.publishedAt
                      ? new Date(featured.publishedAt).toISOString()
                      : undefined
                  }
                >
                  {dateLabel(featured.publishedAt)}
                </time>
              </div>
              <h1>
                <Link to="/post/$slug" params={{ slug: featured.slug }}>
                  {featured.title}
                </Link>
              </h1>
              {featured.summary && (
                <p className="sz-featured-summary">{featured.summary}</p>
              )}
              <div className="sz-featured-actions">
                <Link
                  className="sz-text-link sz-text-link--line"
                  to="/post/$slug"
                  params={{ slug: featured.slug }}
                >
                  {uiText("阅读全文", "Read the article")}
                  <ArrowRight size={16} />
                </Link>
                <span className="sz-muted">
                  {featured.readTimeInMinutes} {uiText("分钟阅读", " min read")}
                </span>
              </div>
            </div>
            {media ? (
              <Link
                to="/post/$slug"
                params={{ slug: featured.slug }}
                className="sz-featured-media"
              >
                <img
                  src={media.image}
                  alt={media.alt}
                  width={1200}
                  height={800}
                  fetchPriority="high"
                />
              </Link>
            ) : (
              <div className="sz-featured-side">
                <span className="sz-label">
                  {uiText(
                    "写作、过程与观察",
                    "Writing, process and observation",
                  )}
                </span>
                <TagLinks tags={featured.tags} />
                <p>
                  {uiText(
                    "从一个具体的问题开始，",
                    "Start with a concrete question.",
                  )}
                  <br />
                  {uiText(
                    "把值得留下的思考写下来。",
                    "Keep the thoughts worth returning to.",
                  )}
                </p>
                <Link className="sz-text-link" to="/archive">
                  {uiText("沿着时间阅读", "Read through time")}
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>
        ) : (
          <EmptyState
            title={uiText(
              "第一篇，正在路上。",
              "The first story is on its way.",
            )}
            description={uiText(
              "新的记录会从这里开始。",
              "New stories will begin here.",
            )}
          />
        )}
      </div>
      <ProjectStage />
      <section className="sz-wrap sz-home-writing">
        <div className="sz-home-writing-grid">
          <div>
            <div className="sz-section-heading">
              <h2>{uiText("最近写下", "Recent writing")}</h2>
              <Link to="/posts" className="sz-text-link">
                {uiText("全部文章", "All articles")}
                <Plus size={15} />
              </Link>
            </div>
            {recent.length ? (
              recent.map((post) => (
                <WritingRow
                  key={post.id}
                  post={post}
                  views={views?.[post.slug]}
                />
              ))
            ) : (
              <p className="sz-muted">
                {uiText(
                  "新的文章会陆续出现在这里。",
                  "New articles will appear here.",
                )}
              </p>
            )}
          </div>
          <aside className="sz-reading-aside">
            <h2 className="sz-label">
              {uiText("值得重读", "Worth another read")}
            </h2>
            {aside.map((post) => (
              <Link
                key={post.id}
                to="/post/$slug"
                params={{ slug: post.slug }}
                className="sz-aside-entry"
              >
                <h3>{post.title}</h3>
                <span>
                  {post.pinnedAt
                    ? uiText("置顶", "Pinned")
                    : uiText("近 30 天热门", "Popular this month")}{" "}
                  · {post.readTimeInMinutes} {uiText("分钟", " min")}
                </span>
              </Link>
            ))}
            <div className="sz-home-explore">
              <h2 className="sz-label">
                {uiText("从一个主题开始", "Start with a topic")}
              </h2>
              <div>
                {tags
                  .filter((tag) => isPublicTag(tag.name))
                  .slice(0, 8)
                  .map((tag) => (
                    <Link
                      key={tag.name}
                      to="/posts"
                      search={{ tagName: tag.name }}
                    >
                      {tag.name} <sup>{tag.postCount}</sup>
                    </Link>
                  ))}
                <Link to="/tags">
                  {uiText("全部主题", "All topics")}
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
export function HomePageSkeleton() {
  return (
    <div
      className="sz-wrap sz-loading"
      aria-label={uiText("正在加载首页", "Loading home")}
      aria-busy="true"
    >
      <div className="sz-skeleton sz-skeleton--small" />
      <div className="sz-skeleton sz-skeleton--title" />
      <div className="sz-skeleton sz-skeleton--title" />
      <div className="sz-skeleton sz-skeleton--wide" />
    </div>
  );
}
