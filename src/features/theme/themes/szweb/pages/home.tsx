import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { tagsQueryOptions } from "@/features/tags/queries";
import type { HomePageProps } from "@/features/theme/contract/pages/home";
import {
  articleChroma,
  articlePaperAccent,
} from "../components/article-chroma";
import { BookCover } from "../components/book-cover";
import {
  dateLabel,
  EmptyState,
  TagLinks,
  useSite,
} from "../components/primitives";
import { ProjectStage } from "../components/project-stage";
import { text as uiText } from "../i18n";
import { isPublicTag } from "../site";
import { useBatchedViewCounts } from "./_shared/use-batched-view-counts";

function WritingRow({ post, views }: { post: PostItem; views?: number }) {
  const { projects } = useSite();
  const date = post.publishedAt ? new Date(post.publishedAt) : null;
  return (
    <article
      className="sz-home-row sz-paper-row"
      data-chroma={articleChroma(post.slug, post.tags)}
      data-paper-accent={articlePaperAccent(post, projects)}
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
  // The public feed is ordered by publication date; pinning never selects the lead.
  const latest = posts[0];
  const recent = posts.slice(1, 6);
  const recommendations = pinnedPosts.filter((post) => post.id !== latest?.id);
  const mostRead = popularPosts.filter(
    (post) =>
      post.id !== latest?.id &&
      !recommendations.some((pin) => pin.id === post.id),
  );
  const { projects } = useSite();
  const { data: tags = [] } = useQuery(tagsQueryOptions);
  const { counts: views } = useBatchedViewCounts(
    [...posts, ...pinnedPosts].map((post) => post.slug),
  );
  return (
    <>
      <div className="sz-wrap">
        <BookCover />
      </div>
      <section
        className="sz-wrap sz-home-writing"
        aria-labelledby="sz-writing-heading"
      >
        <div className="sz-section-heading">
          <h2 id="sz-writing-heading">
            {uiText("最近写下", "Recent writing")}
          </h2>
          <Link to="/posts" className="sz-text-link">
            {uiText("全部文章", "All articles")}
            <Plus size={15} />
          </Link>
        </div>
        <div className="sz-home-writing-grid">
          <div>
            {latest ? (
              <Link
                className="sz-home-latest sz-paper-row"
                to="/post/$slug"
                params={{ slug: latest.slug }}
                aria-labelledby="sz-latest-label sz-latest-title"
                data-chroma={articleChroma(latest.slug, latest.tags)}
                data-paper-accent={articlePaperAccent(latest, projects)}
                data-article={latest.slug}
              >
                <span className="sz-home-latest-label" id="sz-latest-label">
                  {uiText("最新文章", "Latest article")}
                </span>
                <h3 id="sz-latest-title">{latest.title}</h3>
                {latest.summary && (
                  <p className="sz-home-latest-summary">{latest.summary}</p>
                )}
                <div className="sz-home-latest-footer">
                  <div className="sz-home-latest-meta">
                    <time
                      dateTime={
                        latest.publishedAt
                          ? new Date(latest.publishedAt).toISOString()
                          : undefined
                      }
                    >
                      {dateLabel(latest.publishedAt)}
                    </time>
                    <span>
                      {latest.readTimeInMinutes}{" "}
                      {uiText("分钟阅读", " min read")}
                    </span>
                  </div>
                  <span className="sz-text-link sz-text-link--line">
                    {uiText("阅读全文", "Read the article")}
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
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
            {recent.map((post) => (
              <WritingRow
                key={post.id}
                post={post}
                views={views?.[post.slug]}
              />
            ))}
          </div>
          <aside className="sz-reading-aside">
            <ReadingGroup
              id="sz-pinned-heading"
              title={uiText("置顶推荐", "Pinned articles")}
              posts={recommendations}
            />
            <ReadingGroup
              id="sz-most-read-heading"
              title={uiText(
                "近 30 天阅读较多",
                "Most read in the last 30 days",
              )}
              posts={mostRead}
            />
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
                      className="sz-topic-paper"
                      key={tag.name}
                      to="/posts"
                      search={{ tagName: tag.name }}
                    >
                      <span>{tag.name}</span> <sup>{tag.postCount}</sup>
                    </Link>
                  ))}
                <Link className="sz-all-topics" to="/tags">
                  {uiText("全部主题", "All topics")}
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
      <ProjectStage />
    </>
  );
}
function ReadingGroup({
  id,
  title,
  posts,
}: {
  id: string;
  title: string;
  posts: PostItem[];
}) {
  if (!posts.length) return null;
  return (
    <section className="sz-reading-group" aria-labelledby={id}>
      <h2 className="sz-label" id={id}>
        {title}
      </h2>
      {posts.map((post) => (
        <Link
          key={post.id}
          to="/post/$slug"
          params={{ slug: post.slug }}
          className="sz-aside-entry"
        >
          <h3>{post.title}</h3>
          <span>
            {post.readTimeInMinutes} {uiText("分钟阅读", " min read")}
          </span>
        </Link>
      ))}
    </section>
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
