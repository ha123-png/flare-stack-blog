import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { postBySlugQuery } from "@/features/posts/queries";
import { articleChroma } from "../components/article-chroma";
import { EmptyState, PageHeading } from "../components/primitives";
import { ProjectImage } from "../components/project-stage";
import { text as uiText } from "../i18n";
import { type Project, szwebSite } from "../site";

export function ProjectsPage() {
  const projects: Project[] = szwebSite.projects;
  return (
    <div className="sz-wrap">
      <PageHeading
        title={uiText("项目", "Projects")}
        count={projects.length}
        description={uiText(
          "一些可以使用的东西，一些仍在继续的实验。",
          "Useful things and experiments in progress.",
        )}
      />
      <p className="sz-project-index-note">
        {uiText("作品插页 / SELECTED WORK", "Selected work")}
      </p>
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
function ProjectWriting({ slugs }: { slugs: string[] }) {
  const results = useQueries({ queries: slugs.map(postBySlugQuery) });
  return (
    <section
      className="sz-project-writing"
      aria-label={uiText("项目手记", "Project notes")}
    >
      <h2>{uiText("项目手记", "Project notes")}</h2>
      {results.map((result, index) =>
        result.data ? (
          <Link
            key={slugs[index]}
            to="/post/$slug"
            params={{ slug: result.data.slug }}
            className="sz-directory-entry"
            data-chroma={articleChroma(result.data.slug, result.data.tags)}
          >
            <span>{result.data.title}</span>
            <i aria-hidden="true" />
            <small>
              {result.data.readTimeInMinutes} {uiText("分钟", "min")}
            </small>
          </Link>
        ) : null,
      )}
      {results.some((result) => result.isPending) && (
        <p className="sz-muted" role="status">
          {uiText("正在载入手记…", "Loading notes…")}
        </p>
      )}
      {results.some((result) => result.isError) && (
        <p className="sz-muted">
          {uiText("部分手记暂时无法载入。", "Some notes could not be loaded.")}
          <button
            type="button"
            className="sz-text-link"
            onClick={() => {
              for (const result of results)
                if (result.isError) void result.refetch();
            }}
          >
            {uiText("重试", "Try again")}
          </button>
        </p>
      )}
    </section>
  );
}

export function ProjectPage({ projectId }: { projectId: string }) {
  const project = (szwebSite.projects as Project[]).find(
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
      <div className="sz-project-description">
        <h2>{uiText("关于这个项目", "About this project")}</h2>
        <p>{project.description}</p>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="sz-text-link"
          >
            {uiText("访问项目", "Visit project")}
            <ArrowUpRight size={15} />
          </a>
        )}
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
      {!!project.relatedSlugs?.length && (
        <ProjectWriting slugs={project.relatedSlugs} />
      )}
    </div>
  );
}
