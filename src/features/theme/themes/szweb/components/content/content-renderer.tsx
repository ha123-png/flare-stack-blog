import type { JSONContent } from "@tiptap/react";
import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import { useMemo } from "react";
import { MathFormula } from "@/components/content/math-formula";
import { extensions } from "@/features/posts/editor/config";
import { text } from "../../i18n";
import { CodeBlock } from "./code-block";
import { ContentImage } from "./content-image";

export function ContentRenderer({ content }: { content: JSONContent | null }) {
  const rendered = useMemo(
    () =>
      content
        ? renderToReactElement({
            extensions,
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
                  const numeric = (value: number | string | undefined) => {
                    if (typeof value === "number") return value;
                    if (!value || value.includes("%")) return undefined;
                    const parsed = Number.parseInt(value, 10);
                    return Number.isFinite(parsed) ? parsed : undefined;
                  };
                  if (!attrs.src) return null;
                  return (
                    <ContentImage
                      src={attrs.src}
                      alt={attrs.alt || ""}
                      caption={attrs.caption || ""}
                      width={numeric(attrs.width)}
                      height={numeric(attrs.height)}
                    />
                  );
                },
                codeBlock: ({ node }) => {
                  const attrs = node.attrs as {
                    language?: string | null;
                    highlightedHtml?: string;
                  };
                  return (
                    <CodeBlock
                      code={node.textContent || ""}
                      language={attrs.language || null}
                      highlightedHtml={attrs.highlightedHtml}
                    />
                  );
                },
                table: ({ children }) => (
                  <div
                    className="sz-table-scroll"
                    role="region"
                    aria-label={text(
                      "可横向滚动的数据表",
                      "Scrollable data table",
                    )}
                    tabIndex={0}
                  >
                    <table>
                      <tbody>{children}</tbody>
                    </table>
                  </div>
                ),
                tableCell: ({ node, children }) => {
                  const attrs = node.attrs as {
                    colspan?: number;
                    rowspan?: number;
                    colwidth?: Array<number>;
                    style?: string;
                  };
                  return (
                    <td
                      colSpan={attrs.colspan}
                      rowSpan={attrs.rowspan}
                      style={attrs.style ? { width: attrs.style } : undefined}
                    >
                      {children}
                    </td>
                  );
                },
                tableHeader: ({ node, children }) => {
                  const attrs = node.attrs as {
                    colspan?: number;
                    rowspan?: number;
                    colwidth?: Array<number>;
                    style?: string;
                  };
                  return (
                    <th
                      colSpan={attrs.colspan}
                      rowSpan={attrs.rowspan}
                      style={attrs.style ? { width: attrs.style } : undefined}
                    >
                      {children}
                    </th>
                  );
                },
                inlineMath: ({ node }) => (
                  <MathFormula
                    latex={(node.attrs as { latex?: string }).latex ?? ""}
                    mode="inline"
                  />
                ),
                blockMath: ({ node }) => (
                  <MathFormula
                    latex={(node.attrs as { latex?: string }).latex ?? ""}
                    mode="block"
                  />
                ),
              },
            },
          })
        : null,
    [content],
  );

  if (!content) return null;
  return <div className="sz-prosemirror">{rendered}</div>;
}
