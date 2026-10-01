import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { tagsQueryOptions } from "@/features/tags/queries";
import { PageHeading, useSite } from "../components/primitives";
import { text } from "../i18n";
import { isPublicTag } from "../site";
import { useArchiveIndex } from "./_shared/use-archive-index";

export function DirectoryPage() {
  const { projects = [] } = useSite();
  const { data: allTags } = useSuspenseQuery(tagsQueryOptions);
  const tags = allTags.filter((tag) => isPublicTag(tag.name));
  const { groups, count, hasNextPage, isFetchNextPageError, fetchNextPage } =
    useArchiveIndex();
  const countLabel = (amount: number) =>
    text(
      `${amount} 篇${hasNextPage ? " · 已载入" : ""}`,
      `${amount} articles${hasNextPage ? " · loaded" : ""}`,
    );
  return (
    <div className="sz-wrap sz-directory-page">
      <PageHeading
        display
        className="sz-directory-heading"
        eyebrow={text("站点目录 / CONTENTS", "CONTENTS")}
        title={text("索引", "Index")}
        description={text(
          "写作、作品、时间与连接。从这里，找到下一页。",
          "Writing, work, time and connections. Find your next page here.",
        )}
      >
        <span className="sz-directory-edition">
          {text("四个分册 · 持续增补", "Four chapters · Still unfolding")}
        </span>
      </PageHeading>
      <div className="sz-directory-grid">
        <section aria-labelledby="sz-directory-writing">
          <header className="sz-directory-section-heading">
            <span>01</span>
            <div>
              <h2 id="sz-directory-writing">{text("文章", "Writing")}</h2>
              <p>
                {text(
                  "记录一个想法，也保留思考的过程。",
                  "Ideas, observations, and the thinking in between.",
                )}
              </p>
            </div>
          </header>
          <Link to="/posts" className="sz-directory-entry">
            <span>{text("全部文章", "All articles")}</span>
            <i aria-hidden="true" />
            <small>{countLabel(count)}</small>
          </Link>
          <Link to="/tags" className="sz-directory-entry">
            <span>{text("主题与标签", "Topics and tags")}</span>
            <i aria-hidden="true" />
            <small>
              {text(`${tags.length} 个主题`, `${tags.length} topics`)}
            </small>
          </Link>
          <div className="sz-directory-topics">
            {tags.slice(0, 8).map((tag) => (
              <Link
                className="sz-topic-paper"
                key={tag.name}
                to="/posts"
                search={{ tagName: tag.name }}
              >
                <span>{tag.name}</span>
                <sup>{tag.postCount}</sup>
              </Link>
            ))}
          </div>
          <Link to="/search" className="sz-directory-entry">
            <span>{text("全文搜索", "Search the writing")}</span>
            <i aria-hidden="true" />
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
        <section aria-labelledby="sz-directory-projects">
          <header className="sz-directory-section-heading">
            <span>02</span>
            <div>
              <h2 id="sz-directory-projects">{text("项目", "Projects")}</h2>
              <p>
                {text(
                  "把想法变成可以看见、可以使用的东西。",
                  "Ideas made visible, and things made useful.",
                )}
              </p>
            </div>
          </header>
          {projects.map((project) => (
            <Link
              key={project.id}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="sz-directory-entry sz-directory-project"
              data-chroma={project.accent}
            >
              <span>
                {project.title}
                <small>{project.category}</small>
              </span>
              <i aria-hidden="true" />
              <small>{project.status}</small>
            </Link>
          ))}
          <Link to="/projects" className="sz-directory-entry">
            <span>{text("全部项目", "All projects")}</span>
            <i aria-hidden="true" />
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
        <section aria-labelledby="sz-directory-time">
          <header className="sz-directory-section-heading">
            <span>03</span>
            <div>
              <h2 id="sz-directory-time">{text("时间", "Time")}</h2>
              <p>
                {text(
                  "从现在出发，沿着记录回望。",
                  "Start in the present. Read your way back.",
                )}
              </p>
            </div>
          </header>
          {groups.map((group) => (
            <Link
              key={group.year}
              to="/archive"
              hash={`year-${group.year}`}
              className="sz-directory-entry"
            >
              <span>{group.year}</span>
              <i aria-hidden="true" />
              <small>{countLabel(group.count)}</small>
            </Link>
          ))}
          <Link to="/archive" className="sz-directory-entry">
            <span>{text("完整时间档案", "Complete archive")}</span>
            <i aria-hidden="true" />
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          {hasNextPage && (
            <p className="sz-directory-load-state" role="status">
              {isFetchNextPageError
                ? text(
                    "较早的记录暂未载入。",
                    "Earlier entries could not be loaded.",
                  )
                : text("正在翻阅更早的记录…", "Opening earlier entries…")}
              {isFetchNextPageError && (
                <button
                  className="sz-text-link"
                  type="button"
                  onClick={() => void fetchNextPage()}
                >
                  {text("继续载入", "Try again")}
                </button>
              )}
            </p>
          )}
        </section>
        <section aria-labelledby="sz-directory-connections">
          <header className="sz-directory-section-heading">
            <span>04</span>
            <div>
              <h2 id="sz-directory-connections">
                {text("连接", "Connections")}
              </h2>
              <p>
                {text(
                  "在这里停留，也去别处看看。",
                  "Stay a while. Then explore a little further.",
                )}
              </p>
            </div>
          </header>
          <a href="/rss.xml" className="sz-directory-entry">
            <span>{text("RSS 订阅", "RSS feed")}</span>
            <i aria-hidden="true" />
            <small>RSS 2.0</small>
          </a>
          <a href="/atom.xml" className="sz-directory-entry">
            <span>{text("Atom 订阅", "Atom feed")}</span>
            <i aria-hidden="true" />
            <small>Atom 1.0</small>
          </a>
          <Link to="/friend-links" className="sz-directory-entry">
            <span>{text("友链", "Friends")}</span>
            <i aria-hidden="true" />
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link to="/submit-friend-link" className="sz-directory-entry">
            <span>{text("申请友链", "Submit your site")}</span>
            <i aria-hidden="true" />
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link to="/about" className="sz-directory-entry">
            <span>{text("关于作者", "About the author")}</span>
            <i aria-hidden="true" />
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
