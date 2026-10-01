import type { JSONContent } from "@tiptap/react";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { useMemo } from "react";
import { getCommentExtensions } from "@/features/comments/components/editor/config";
import { text } from "../../i18n";
import { ZoomableImage } from "../content/zoomable-image";

export function CommentContent({ content }: { content: JSONContent | null }) {
  const rendered = useMemo(
    () =>
      content
        ? renderToReactElement({
            extensions: getCommentExtensions(),
            content,
            options: {
              nodeMapping: {
                image: ({ node }) => {
                  const attrs = node.attrs as {
                    src?: string;
                    alt?: string | null;
                    caption?: string | null;
                    width?: number | string;
                    height?: number | string;
                  };
                  if (!attrs.src) return null;
                  const dimension = (value: string | number | undefined) => {
                    if (typeof value === "number") return value;
                    if (!value || value.includes("%")) return undefined;
                    const number = Number.parseInt(value, 10);
                    return Number.isFinite(number) ? number : undefined;
                  };
                  const alt =
                    attrs.alt ||
                    attrs.caption ||
                    text("评论图片", "Comment image");
                  return (
                    <span className="sz-comment-image">
                      <ZoomableImage
                        src={attrs.src}
                        alt={alt}
                        width={dimension(attrs.width)}
                        height={dimension(attrs.height)}
                      />
                      {attrs.caption && (
                        <span className="sz-comment-image-caption">
                          {attrs.caption}
                        </span>
                      )}
                    </span>
                  );
                },
              },
            },
          })
        : null,
    [content],
  );
  return <div className="sz-comment-rich-content">{rendered}</div>;
}
