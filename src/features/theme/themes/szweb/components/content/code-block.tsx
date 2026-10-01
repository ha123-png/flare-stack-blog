import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { m } from "@/paraglide/messages";

const FOLD_THRESHOLD = 420;
const LANGUAGES: Record<string, string> = {
  ts: "TypeScript",
  typescript: "TypeScript",
  js: "JavaScript",
  javascript: "JavaScript",
  jsx: "JSX",
  tsx: "TSX",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
  rust: "Rust",
  java: "Java",
  cpp: "C++",
  c: "C",
  php: "PHP",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  sql: "SQL",
  sh: "Shell",
  bash: "Bash",
  md: "Markdown",
};

function escapeHTML(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );
}

export function CodeBlock({
  code,
  language,
  highlightedHtml,
}: {
  code: string;
  language: string | null;
  highlightedHtml?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [folded, setFolded] = useState(false);
  const [canFold, setCanFold] = useState(false);
  const lang = language
    ? (LANGUAGES[language.toLowerCase()] ?? language)
    : m.common_plain_text();

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const measure = () => {
      const shouldFold = content.scrollHeight > FOLD_THRESHOLD + 48;
      setCanFold(shouldFold);
      setFolded(shouldFold);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [code, highlightedHtml]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <figure className="sz-code-block">
      <div className="sz-code-shell">
        <header className="sz-code-head">
          <span>{lang}</span>
          <button
            type="button"
            onClick={copy}
            className="sz-code-copy"
            aria-label={m.common_copy_code()}
            title={m.common_copy_code()}
          >
            {copied ? (
              <>
                <Check size={14} aria-hidden="true" />
                <span>{m.common_copied()}</span>
              </>
            ) : (
              <Copy size={14} aria-hidden="true" />
            )}
          </button>
        </header>
        <div
          className={`sz-code-window${folded ? " sz-is-folded" : ""}`}
          style={folded ? { maxHeight: FOLD_THRESHOLD } : undefined}
        >
          <div ref={contentRef} className="sz-code-content">
            <div
              dangerouslySetInnerHTML={{
                __html:
                  highlightedHtml ||
                  `<pre><code>${escapeHTML(code)}</code></pre>`,
              }}
            />
          </div>
        </div>
        {canFold && (
          <button
            type="button"
            className="sz-code-expand"
            onClick={() => setFolded((current) => !current)}
            aria-expanded={!folded}
          >
            {folded ? (
              <>
                <ChevronDown size={15} aria-hidden="true" />
                {m.common_show_more()}
              </>
            ) : (
              <>
                <ChevronUp size={15} aria-hidden="true" />
                {m.common_collapse()}
              </>
            )}
          </button>
        )}
      </div>
    </figure>
  );
}
