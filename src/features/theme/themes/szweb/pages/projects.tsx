import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { projectPostsQuery } from "@/features/config/queries/project-posts";
import {
  articleChroma,
  articlePaperAccent,
} from "../components/article-chroma";
import {
  dateLabel,
  EmptyState,
  PageHeading,
  useSite,
} from "../components/primitives";
import { ProjectImage } from "../components/project-stage";
import { text as uiText } from "../i18n";
import type { Project } from "../site";

export function ProjectsPage() {
  const projects: Project[] = useSite().projects ?? [];
  return (
    <div className="sz-wrap sz-projects-page">
      <PageHeading
        display
        eyebrow={uiText("作品插页 / SELECTED WORK", "SELECTED WORK")}
        title={uiText("项目", "Projects")}
        metadata={uiText(
          `${projects.length} 个项目`,
          `${projects.length} projects`,
        )}
        description={uiText(
          "一些可以使用的东西，一些仍在继续的实验。",
          "Useful things and experiments in progress.",
        )}
      />
      <div className="sz-project-list">
        {projects.map((project) => (
          <article className="sz-project-entry" key={project.id}>
            <div>
              <h2>
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                >
                  {project.title}
                </Link>
              </h2>
              <p className="sz-label">{project.category}</p>
              <p>{project.description}</p>
              <p className="sz-meta">
                {project.status} · {project.year}
              </p>
              <Link
                className="sz-text-link sz-text-link--line"
                to="/projects/$projectId"
                params={{ projectId: project.id }}
              >
                {uiText("查看项目", "Explore project")}
                <ArrowUpRight size={15} />
              </Link>
            </div>
            <Link
              className="sz-discovery"
              data-chroma={project.accent}
              data-paper-accent={project.accent}
              to="/projects/$projectId"
              params={{ projectId: project.id }}
            >
              <ProjectImage project={project} />
            </Link>
          </article>
        ))}
      </div>
      {!projects.length && (
        <EmptyState
          title={uiText("新的项目正在酝酿。", "New projects are taking shape.")}
        />
      )}
    </div>
  );
}
function ProjectWriting({ project }: { project: Project }) {
  const { projects } = useSite();
  const result = useInfiniteQuery(projectPostsQuery(project));
  const posts = result.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section
      className="sz-project-writing"
      aria-label={uiText("项目手记", "Project notes")}
    >
      <h2>{uiText("项目手记", "Project notes")}</h2>
      <div className="sz-project-notes">
        {posts.length > 0 && (
          <p className="sz-muted sz-project-notes-intro">
            {uiText(
              "作品背后的思考、制作与迭代。",
              "The thinking, making and iterations behind this work.",
            )}
          </p>
        )}
        {posts.map((post) => (
          <Link
            key={post.id}
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="sz-directory-entry sz-paper-row"
            data-chroma={articleChroma(post.slug, post.tags)}
            data-paper-accent={articlePaperAccent(post, projects)}
          >
            <span>
              {post.title}
              {project.leadSlug === post.slug && (
                <small className="sz-project-lead-label">
                  {uiText("开篇", "Introduction")}
                </small>
              )}
            </span>
            <i aria-hidden="true" />
            <small>
              {dateLabel(post.publishedAt)} · {post.readTimeInMinutes}{" "}
              {uiText("分钟", "min")}
            </small>
          </Link>
        ))}
        {!posts.length && !result.isPending && !result.isError && (
          <p className="sz-muted">
            {uiText(
              "新的项目手记，会留在这里。",
              "New project notes will find their place here.",
            )}
          </p>
        )}
        {result.hasNextPage && (
          <button
            className="sz-text-link"
            type="button"
            disabled={result.isFetchingNextPage}
            onClick={() => void result.fetchNextPage()}
          >
            {result.isFetchingNextPage
              ? uiText("正在载入…", "Loading…")
              : uiText("继续翻阅", "Read earlier notes")}
          </button>
        )}
        {result.isPending && (
          <p className="sz-muted" role="status">
            {uiText("正在载入手记…", "Loading notes…")}
          </p>
        )}
        {(result.isError || result.isFetchNextPageError) && (
          <p className="sz-muted">
            {uiText(
              "部分手记暂时无法载入。",
              "Some notes could not be loaded.",
            )}
            <button
              type="button"
              className="sz-text-link"
              onClick={() => {
                if (result.isFetchNextPageError) void result.fetchNextPage();
                else void result.refetch();
              }}
            >
              {uiText("重试", "Try again")}
            </button>
          </p>
        )}
      </div>
    </section>
  );
}

export function ProjectPage({ projectId }: { projectId: string }) {
  const project = (useSite().projects ?? []).find(
    (item) => item.id === projectId,
  );
  if (!project)
    return (
      <EmptyState
        title={uiText("没有找到这个项目", "This project could not be found.")}
      >
        <Link to="/projects" className="sz-text-link">
          {uiText("返回全部项目", "Back to projects")}
        </Link>
      </EmptyState>
    );
  return (
    <div className="sz-wrap sz-project-detail">
      <Link className="sz-text-link" to="/projects">
        <ArrowLeft size={15} />
        {uiText("全部项目", "All projects")}
      </Link>
      <PageHeading title={project.title} description={project.category}>
        <span className="sz-meta">
          {project.status} · {project.year}
        </span>
      </PageHeading>
      <ProjectImage project={project} entered />
      <div className="sz-project-body">
        <div className="sz-project-description">
          <h2>{uiText("关于这个项目", "About this project")}</h2>
          <div>
            <p>{project.description}</p>
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="sz-text-link"
              >
                {uiText("打开作品", "Visit the work")}
                <ArrowUpRight size={15} />
              </a>
            )}
          </div>
        </div>
        {project.video && (
          <figure className="sz-project-film">
            <video
              controls
              playsInline
              preload="metadata"
              poster={project.video.poster}
              aria-label={project.video.title}
            >
              <source src={project.video.src} />
              <a href={project.video.src}>
                {uiText("打开项目视频", "Open project video")}
              </a>
            </video>
            <figcaption>{project.video.title}</figcaption>
          </figure>
        )}
        <ProjectWriting project={project} />
      </div>
    </div>
  );
}
