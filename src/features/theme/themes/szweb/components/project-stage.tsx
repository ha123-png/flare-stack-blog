import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";
import { text as uiText } from "../i18n";
import type { Project } from "../site";
import { useSite } from "./primitives";

export function ProjectImage({
  project,
  entered = false,
}: {
  project: Project;
  entered?: boolean;
}) {
  if (!project.image)
    return (
      <div className="sz-project-no-image" aria-hidden="true">
        {project.title}
      </div>
    );
  return (
    <div
      className={"sz-art" + (entered ? " sz-art--entered" : "")}
      data-chroma={project.accent}
    >
      <img
        src={project.image}
        alt={project.title + " · " + project.category}
        width={1440}
        height={900}
        loading="lazy"
        className="sz-project-screenshot"
      />
    </div>
  );
}
export function ProjectStage() {
  const projects: Project[] = useSite().projects ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = Math.max(
    0,
    projects.findIndex((project) => project.id === selectedId),
  );
  const [interacted, setInteracted] = useState(false);
  const select = (index: number) => {
    setInteracted(true);
    setSelectedId(projects[index].id);
  };
  const current = projects[selected] ?? projects[0];
  if (!current) return null;
  return (
    <section
      className="sz-project-band"
      data-chroma={current.accent}
      data-paper-accent={current.accent}
      data-interacted={interacted}
    >
      <div className="sz-wrap">
        <div className="sz-section-heading">
          <h2>{uiText("作品与实践", "Selected projects")}</h2>
          <Link className="sz-text-link" to="/projects">
            {uiText("全部项目", "All projects")}
            <Plus size={15} />
          </Link>
        </div>
        <div className="sz-project-stage">
          <div
            className="sz-project-tabs"
            role="tablist"
            aria-label={uiText("精选项目", "Featured projects")}
          >
            {projects.map((project, index) => (
              <button
                type="button"
                key={project.id}
                role="tab"
                id={"project-tab-" + project.id}
                aria-selected={selected === index}
                aria-controls="project-panel"
                tabIndex={selected === index ? 0 : -1}
                className={selected === index ? "active" : ""}
                data-paper-accent={project.accent}
                onClick={() => select(index)}
                onKeyDown={(event) => {
                  if (
                    ![
                      "ArrowRight",
                      "ArrowLeft",
                      "ArrowDown",
                      "ArrowUp",
                      "Home",
                      "End",
                    ].includes(event.key)
                  )
                    return;
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? projects.length - 1
                        : (index +
                            (["ArrowRight", "ArrowDown"].includes(event.key)
                              ? 1
                              : -1) +
                            projects.length) %
                          projects.length;
                  select(next);
                  document
                    .getElementById("project-tab-" + projects[next].id)
                    ?.focus();
                }}
              >
                <span>
                  <strong>{project.title}</strong>
                  <small>{project.category}</small>
                </span>
                <span
                  className="sz-project-fold"
                  aria-hidden={selected !== index}
                >
                  <span className="sz-project-abstract">
                    {project.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div
            className="sz-project-visual"
            id="project-panel"
            role="tabpanel"
            aria-labelledby={"project-tab-" + current.id}
          >
            <Link
              to="/projects/$projectId"
              params={{ projectId: current.id }}
              className="sz-discovery"
            >
              <div className="sz-stage-images">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className={
                      "sz-project-slide" +
                      (selected === index ? " is-active" : "")
                    }
                    aria-hidden={selected !== index}
                  >
                    <ProjectImage project={project} />
                  </div>
                ))}
              </div>
              <span className="sz-project-action">
                {uiText("查看项目", "Explore project")}
                <ArrowUpRight size={16} />
              </span>
            </Link>
            <p className="sz-project-caption" key={current.id}>
              <span>
                {String(selected + 1).padStart(2, "0")} /{" "}
                {String(projects.length).padStart(2, "0")}
              </span>
              <span>
                {current.status} · {current.year}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
