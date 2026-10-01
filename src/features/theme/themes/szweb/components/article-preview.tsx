import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { postBySlugQuery } from "@/features/posts/queries";
import { text } from "../i18n";
import { articleChroma } from "./article-chroma";

type TextNode = { type?: string; text?: string; content?: TextNode[] };
function textOf(node: TextNode): string {
  return node.text ?? node.content?.map(textOf).join("") ?? "";
}
export function ArticlePreview({
  slug,
  onBeforeOpen,
}: {
  slug: string;
  onBeforeOpen: () => void;
}) {
  const result = useQuery(postBySlugQuery(slug));
  const paragraphs =
    (result.data?.contentJson as TextNode | undefined)?.content
      ?.filter((node) => node.type === "paragraph")
      .map(textOf)
      .filter(Boolean)
      .slice(0, 3) ?? [];
  return (
    <div
      className="sz-preview-body"
      aria-live="polite"
      data-chroma={articleChroma(slug, result.data?.tags)}
      data-article={slug}
    >
      <p className="sz-label">{text("正文节选", "Article excerpt")}</p>
      {result.isPending ? (
        <p className="sz-muted" role="status">
          {text("正在读取这一段…", "Loading this excerpt…")}
        </p>
      ) : result.isError ? (
        <div>
          <p>
            {text(
              "暂时未能加载正文。",
              "The article excerpt could not be loaded.",
            )}
          </p>
          <button
            className="sz-text-link"
            type="button"
            onClick={() => result.refetch()}
          >
            {text("重新加载", "Reload excerpt")}
          </button>
        </div>
      ) : (
        <>
          {result.data && <h3>{result.data.title}</h3>}
          {paragraphs.length ? (
            paragraphs.map((paragraph, i) => (
              <p key={i}>
                {paragraph.length > 400
                  ? paragraph.slice(0, 400) + "…"
                  : paragraph}
              </p>
            ))
          ) : (
            <p>
              {text(
                "这篇内容以图像或代码为主，打开正文继续阅读。",
                "This article focuses on images or code. Open it to continue reading.",
              )}
            </p>
          )}
        </>
      )}
      <Link
        className="sz-text-link sz-text-link--line"
        to="/post/$slug"
        params={{ slug }}
        onClick={onBeforeOpen}
      >
        {text("阅读全文", "Read the full article")}{" "}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
