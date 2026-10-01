import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { FriendLinksPageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";
import { PageHeading, useSite } from "../components/primitives";
import { text } from "../i18n";

export function FriendLinksPage({ links }: FriendLinksPageProps) {
  const projects = (useSite().projects ?? []).filter((project) => project.url);
  return (
    <div className="sz-account-page sz-friend-links-page">
      <PageHeading
        display
        title={m.friend_links_title()}
        description={m.friend_links_desc()}
        className="sz-friend-links-heading"
      />

      {!!projects.length && (
        <section
          className="sz-own-sites"
          aria-label={text("我的站点", "My sites")}
        >
          <p className="sz-label">{text("我的站点", "My sites")}</p>
          <nav>
            {projects.map((project) => (
              <a
                key={project.id}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {project.title}
                <ArrowUpRight size={14} />
              </a>
            ))}
          </nav>
          <p className="sz-muted">
            {text(
              "一些正在生长的作品，也欢迎你去坐坐。",
              "A few things I am making. You are welcome to explore.",
            )}
          </p>
        </section>
      )}

      {links.length > 0 ? (
        <ol className="sz-friend-link-list">
          {links.map((link, index) => (
            <li className="sz-friend-link-row" key={link.id}>
              <span className="sz-friend-link-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {link.logoUrl ? (
                <img
                  className="sz-friend-link-logo"
                  src={link.logoUrl}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className="sz-friend-link-copy">
                <a
                  className="sz-friend-link-title"
                  href={link.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.siteName}
                  <ArrowUpRight aria-hidden="true" />
                </a>
                <p className="sz-friend-link-url">{link.siteUrl}</p>
                {link.description ? (
                  <p className="sz-friend-link-description">
                    {link.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="sz-friend-links-empty">
          <p>{m.friend_links_no_links()}</p>
          <p className="sz-muted">{m.friend_links_first_link()}</p>
        </div>
      )}

      <footer className="sz-friend-links-apply">
        <div>
          <h2>{m.friend_links_join_title()}</h2>
          <p className="sz-muted">{m.friend_links_join_desc()}</p>
        </div>
        <Link to="/submit-friend-link" className="sz-text-link">
          {m.friend_links_apply()}
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}

export function FriendLinksPageSkeleton() {
  return (
    <div
      className="sz-account-page sz-friend-links-page"
      aria-busy="true"
      aria-label={m.friend_links_title()}
    >
      <PageHeading
        display
        title={m.friend_links_title()}
        description={m.friend_links_desc()}
        className="sz-friend-links-heading"
      />
      <ol className="sz-friend-link-list sz-friend-link-list-skeleton">
        {Array.from({ length: 5 }, (_, index) => (
          <li className="sz-friend-link-row" key={index}>
            <span className="sz-friend-link-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="sz-skeleton-block sz-skeleton-logo" />
            <span className="sz-skeleton-copy">
              <span className="sz-skeleton-line sz-skeleton-title" />
              <span className="sz-skeleton-line sz-skeleton-url" />
              <span className="sz-skeleton-line sz-skeleton-description" />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
