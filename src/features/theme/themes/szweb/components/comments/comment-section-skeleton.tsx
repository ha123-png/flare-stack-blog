import { text } from "../../i18n";

export function CommentSectionSkeleton() {
  return (
    <section
      className="sz-comments sz-comments-skeleton"
      aria-busy="true"
      aria-label={text("正在加载评论", "Loading comments")}
    >
      <div className="sz-skeleton-line sz-comments-skeleton-title" />
      <div className="sz-skeleton-line sz-comments-skeleton-editor" />
      {[0, 1, 2].map((item) => (
        <div className="sz-comment-skeleton" key={item}>
          <div className="sz-skeleton-line sz-comment-skeleton-name" />
          <div className="sz-skeleton-line sz-comment-skeleton-content" />
          <div className="sz-skeleton-line sz-comment-skeleton-short" />
        </div>
      ))}
    </section>
  );
}
