import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { FriendLinksPageProps } from "@/features/theme/contract/pages";
import { m } from "@/paraglide/messages";

export function FriendLinksPage({ links }: FriendLinksPageProps) {
  return (
    <div className="sz-account-page sz-friend-links-page">
      <header className="sz-account-heading sz-friend-links-heading">
        <h1 className="sz-account-title">{m.friend_links_title()}</h1>
        <p className="sz-account-description">{m.friend_links_desc()}</p>
      </header>

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
      <header className="sz-account-heading sz-friend-links-heading">
        <h1 className="sz-account-title">{m.friend_links_title()}</h1>
        <div className="sz-skeleton-line sz-skeleton-description" />
      </header>
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
