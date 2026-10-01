import { text } from "../i18n";

export function PostPageSkeleton() {
  return (
    <div
      className="sz-wrap sz-loading"
      aria-label={text("正在加载文章", "Loading article")}
      aria-busy="true"
    >
      <div className="sz-skeleton sz-skeleton--small" />
      <div className="sz-skeleton sz-skeleton--title" />
      <div className="sz-skeleton sz-skeleton--title" />
      <div className="sz-skeleton sz-skeleton--wide" />
    </div>
  );
}
