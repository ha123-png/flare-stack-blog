import { Link, useRouteContext } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getLocale } from "@/paraglide/runtime";
import { text as uiText } from "../i18n";
import { isPublicTag, szwebSite } from "../site";

export function useSite() {
  return useRouteContext({ from: "__root__" }).siteConfig;
}
export function dateLabel(value: Date | string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat(getLocale() === "en" ? "en-GB" : "zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      }).format(new Date(value))
    : "";
}
export function PageHeading({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <header className="sz-page-heading">
      <div>
        <h1>
          {title}
          {count !== undefined && <sup>{count}</sup>}
        </h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </header>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="sz-empty">
      <span className="sz-empty-line" aria-hidden="true" />
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {children}
    </section>
  );
}
export function Brand({ unfold = false }: { unfold?: boolean }) {
  return (
    <Link
      to="/"
      className="sz-brand"
      data-unfold={unfold || undefined}
      aria-label={szwebSite.wordmark + uiText(" · 首页", " · Home")}
    >
      <span className="sz-brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="sz-brand-name">{szwebSite.wordmark}</span>
      <span className="sz-brand-domain">{szwebSite.domain}</span>
    </Link>
  );
}
export function TagLinks({ tags }: { tags?: Array<{ name: string }> }) {
  return (
    <span className="sz-tag-links">
      {tags
        ?.filter((tag) => isPublicTag(tag.name))
        .map((tag) => (
          <Link key={tag.name} to="/posts" search={{ tagName: tag.name }}>
            {tag.name}
          </Link>
        ))}
    </span>
  );
}
