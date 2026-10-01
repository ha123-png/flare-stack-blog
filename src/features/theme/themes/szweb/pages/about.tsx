import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Rss } from "lucide-react";
import { BookCover } from "../components/book-cover";
import { useSite } from "../components/primitives";
import { text } from "../i18n";

export function AboutPage() {
  const site = useSite();
  return (
    <div className="sz-wrap sz-colophon">
      <BookCover about />
      <div className="sz-colophon-grid">
        <div className="sz-colophon-story">
          <p className="sz-colophon-lead">
            {text(
              `我是 ${site.author}。在这里写下思考，也让想法成形。`,
              "A place for writing, projects, and the thoughts still taking shape.",
            )}
          </p>
          <p>
            {text(
              "比起只展示完成的东西，我也想保留它们从哪里来、试过什么，以及为什么换了方向。",
              "Beyond the finished work, I want to keep where it came from, what I tried, and why I changed direction.",
            )}
          </p>
          <p>
            {text(
              "有些想法适合写成文章，有些需要做成一个可以使用的东西。我把它们放在一起，让作品与文字互相照应，慢慢积累。",
              "Some ideas become essays; others need to become something you can use. Here, they belong together.",
            )}
          </p>
          {!!site.projects?.length && (
            <section className="sz-colophon-now">
              <h2>{text("作品也在这里", "Work, in progress")}</h2>
              <nav
                className="sz-colophon-projects"
                aria-label={text("打开作品", "Visit the work")}
              >
                {site.projects
                  .filter((project) => project.url)
                  .map((project) => (
                    <a
                      className="sz-colophon-work"
                      key={project.id}
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      data-chroma={project.accent}
                    >
                      <span>
                        <strong>{project.title}</strong>
                        <small>{project.category}</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </a>
                  ))}
              </nav>
            </section>
          )}
        </div>
        <aside
          className="sz-colophon-index"
          aria-label={text("从这里开始", "Start here")}
        >
          <p className="sz-label">{text("从这里开始", "Start here")}</p>
          <Link to="/posts">
            <span>
              <strong>{text("写作", "Writing")}</strong>
              <small>
                {text("记录、观察与思考", "Notes, observations, ideas")}
              </small>
            </span>
            <ArrowUpRight size={20} />
          </Link>
          <Link to="/projects">
            <span>
              <strong>{text("项目", "Projects")}</strong>
              <small>
                {text(
                  "从想法，到可以体验的东西",
                  "From an idea to an experience",
                )}
              </small>
            </span>
            <ArrowUpRight size={20} />
          </Link>
          <Link to="/archive">
            <span>
              <strong>{text("时间", "Archive")}</strong>
              <small>
                {text("沿着年月，翻到更早的一页", "Turn to an earlier page")}
              </small>
            </span>
            <ArrowUpRight size={20} />
          </Link>
        </aside>
      </div>
      <section className="sz-colophon-contact">
        <h2>{text("保持联系", "Stay in touch")}</h2>
        <div>
          <p>
            {text(
              "通过 RSS 订阅新的文章，或在文章下方接着聊。",
              "Follow new writing via RSS, or continue the conversation in the comments.",
            )}
          </p>
          <nav
            className="sz-contact-links"
            aria-label={text("联系方式", "Contact links")}
          >
            <a className="sz-text-link" href="/rss.xml">
              {text("RSS 订阅", "Subscribe via RSS")}
              <Rss size={15} />
            </a>
            {site.social
              .filter((link) => link.url && link.platform !== "rss")
              .map((link) => (
                <a
                  key={link.platform + link.url}
                  href={link.url}
                  className="sz-text-link"
                  target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                >
                  {link.label || link.platform}
                  <ArrowUpRight size={15} />
                </a>
              ))}
            <Link className="sz-text-link" to="/friend-links">
              {text("友链", "Friends")}
              <ArrowUpRight size={15} />
            </Link>
          </nav>
        </div>
      </section>
    </div>
  );
}
