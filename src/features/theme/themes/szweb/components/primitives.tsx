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
export function TitleWords({ title }: { title: string }) {
  return [
    ...new Intl.Segmenter(getLocale(), { granularity: "word" }).segment(title),
  ].map((part) =>
    part.isWordLike ? (
      <span className="sz-title-word" key={part.index}>
        {part.segment}
      </span>
    ) : (
      part.segment
    ),
  );
}
export function PageHeading({
  title,
  description,
  children,
  display = false,
  eyebrow,
  metadata,
  className = "",
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  display?: boolean;
  eyebrow?: string;
  metadata?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`sz-page-heading${display ? " sz-page-heading--chapter" : ""} ${className}`}
    >
      <div className="sz-heading-copy">
        {eyebrow && <p className="sz-label">{eyebrow}</p>}
        <h1 className={display ? "sz-display-title" : undefined}>{title}</h1>
        {description && <p className="sz-muted">{description}</p>}
      </div>
      {(metadata || children) && (
        <div className="sz-heading-meta">{metadata || children}</div>
      )}
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
  const site = useSite();
  return (
    <Link
      to="/"
      className="sz-brand"
      data-unfold={unfold || undefined}
      aria-label={site.title + uiText(" · 首页", " · Home")}
    >
      <span className="sz-brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="sz-brand-name">{site.title}</span>
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
          <Link
            className="sz-topic-paper"
            key={tag.name}
            to="/posts"
            search={{ tagName: tag.name }}
          >
            {tag.name}
          </Link>
        ))}
    </span>
  );
}
