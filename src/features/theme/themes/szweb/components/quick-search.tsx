import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  searchDocsQueryOptions,
  searchMetaQuery,
} from "@/features/search/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { text } from "../i18n";
import { parseSafeSnippet } from "../pages/_shared/search-snippets";
import { articleChroma, articlePaperAccent } from "./article-chroma";
import { useSite } from "./primitives";

const QuickSearchContext = createContext<(() => void) | null>(null);

export function QuickSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const origin = useRef<HTMLElement | null>(null);
  const restoreFocus = useRef(true);
  const launch = () => {
    if (pathname === "/search") {
      document.getElementById("sz-search-input")?.focus();
      return;
    }
    if (window.matchMedia("(max-width: 650px)").matches) {
      void navigate({ to: "/search" });
      return;
    }
    if (document.querySelector("dialog[open]")) return;
    origin.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    restoreFocus.current = true;
    setOpen(true);
  };
  const dismiss = (restore = true) => {
    restoreFocus.current = restore;
    setOpen(false);
  };
  useEffect(() => {
    restoreFocus.current = false;
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.key.toLowerCase() !== "k" ||
        event.isComposing
      )
        return;
      event.preventDefault();
      if (event.repeat) return;
      if (open) document.getElementById("sz-quick-input")?.focus();
      else launch();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, pathname]);
  return (
    <QuickSearchContext.Provider value={launch}>
      {children}
      {open && (
        <QuickSearchDialog
          onDismiss={dismiss}
          origin={origin.current}
          shouldRestore={() => restoreFocus.current}
        />
      )}
    </QuickSearchContext.Provider>
  );
}

export function SearchTrigger() {
  const launch = useContext(QuickSearchContext);
  const [shortcut, setShortcut] = useState("Ctrl K");
  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K");
  }, []);
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !launch ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    launch();
  };
  return (
    <Link
      to="/search"
      className="sz-search-trigger"
      onClick={click}
      aria-label={text("搜索文章", "Search articles")}
      title={text("搜索文章", "Search articles") + " · " + shortcut}
    >
      <Search size={18} aria-hidden="true" />
      <span>{text("搜索", "Search")}</span>
      <kbd aria-hidden="true">{shortcut}</kbd>
    </Link>
  );
}

function Snippet({ value }: { value: string }) {
  return (
    <>
      {parseSafeSnippet(value).map((part, i) =>
        part.marked ? (
          <mark key={i}>{part.text}</mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function QuickSearchDialog({
  onDismiss,
  origin,
  shouldRestore,
}: {
  onDismiss: (restore?: boolean) => void;
  origin: HTMLElement | null;
  shouldRestore: () => boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { projects } = useSite();
  const input = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();
  const normalized = query.trim();
  const debounced = useDebounce(normalized, 250);
  const meta = useQuery({
    ...searchMetaQuery,
    enabled: !!debounced,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const result = useQuery({
    ...searchDocsQueryOptions(debounced, meta.data?.version || "init"),
    enabled: !!debounced && !!meta.data?.version && !composing,
    staleTime: Infinity,
    retry: 1,
  });
  const busy =
    !!normalized &&
    (composing ||
      debounced !== normalized ||
      meta.isPending ||
      result.isFetching);
  const failed = meta.isError || result.isError;
  const results =
    normalized && !busy && !failed ? (result.data ?? []).slice(0, 5) : [];
  const active =
    activeIndex >= 0 && activeIndex < results.length ? activeIndex : -1;

  useEffect(() => {
    const node = dialog.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.showModal();
    input.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(closeTimer.current);
      node?.close();
      document.body.style.overflow = previous;
      if (shouldRestore() && origin?.isConnected)
        origin.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);
  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`sz-quick-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 650px)");
    const change = () => {
      if (!media.matches) return;
      onDismiss(false);
      void navigate({ to: "/search", search: { q: normalized || undefined } });
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [normalized, navigate]);

  const close = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDismiss();
      return;
    }
    setClosing(true);
    closeTimer.current = setTimeout(() => onDismiss(), 140);
  };
  const select = (slug: string) => {
    onDismiss(false);
    void navigate({ to: "/post/$slug", params: { slug } });
  };
  const all = () => {
    onDismiss(false);
    void navigate({ to: "/search", search: { q: normalized || undefined } });
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || composing || event.keyCode === 229)
      return;
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex(active < 0 ? 0 : (active + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex(active <= 0 ? results.length - 1 : active - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0) select(results[active].post.slug);
      else all();
    }
  };
  return (
    <dialog
      ref={dialog}
      className={"sz-site sz-quick-search" + (closing ? " is-closing" : "")}
      data-chroma={
        active >= 0
          ? articleChroma(results[active].post.slug, results[active].post.tags)
          : undefined
      }
      aria-labelledby="sz-quick-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const stops = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "a[href], button:not(:disabled), input:not(:disabled), [tabindex]",
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 && element.getClientRects().length > 0,
        );
        if (!stops.length) return;
        const index = stops.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey
          ? index <= 0
            ? stops.length - 1
            : index - 1
          : (index + 1) % stops.length;
        event.preventDefault();
        stops[next].focus({ preventScroll: true });
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const r = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          close();
      }}
    >
      <div className="sz-quick-top">
        <h2 id="sz-quick-title">
          {text("在折页里找一找", "Find something in 折页")}
        </h2>
        <button
          type="button"
          className="sz-icon-button"
          onClick={close}
          aria-label={text("关闭快捷搜索", "Close quick search")}
        >
          <X size={18} />
        </button>
      </div>
      <div className="sz-quick-field">
        <Search size={23} aria-hidden="true" />
        <input
          ref={input}
          id="sz-quick-input"
          name="q"
          type="search"
          role="combobox"
          aria-label={text(
            "搜索标题、摘要、正文和标签",
            "Search titles, summaries, content, and tags",
          )}
          aria-autocomplete="list"
          aria-controls="sz-quick-results"
          aria-expanded={results.length > 0}
          aria-activedescendant={
            active >= 0 ? `sz-quick-option-${active}` : undefined
          }
          autoComplete="off"
          placeholder={text(
            "一个关键词，一页旧想法。",
            "A keyword. An earlier idea.",
          )}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={keyDown}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
        />
        {query && (
          <button
            type="button"
            className="sz-icon-button"
            aria-label={text("清除搜索内容", "Clear search")}
            onClick={() => {
              setQuery("");
              input.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="sz-quick-status" role="status" aria-live="polite">
        {!normalized
          ? text(
              "查找文章标题、摘要、正文与标签。",
              "Search across titles, summaries, content and tags.",
            )
          : busy
            ? text("正在检索…", "Searching…")
            : failed
              ? text("搜索暂时无法连接。", "Search is temporarily unavailable.")
              : results.length
                ? text(
                    `预览 ${results.length} 条结果`,
                    `Previewing ${results.length} results`,
                  )
                : text(
                    "没有匹配文章，换个关键词试试。",
                    "No matching articles. Try another keyword.",
                  )}
        {busy && <span className="sz-search-progress" aria-hidden="true" />}
        {failed && !busy && (
          <button
            className="sz-text-link"
            type="button"
            onClick={() => {
              void meta.refetch();
              if (meta.data?.version) void result.refetch();
            }}
          >
            {text("重试搜索", "Retry search")}
          </button>
        )}
      </div>
      <div
        id="sz-quick-results"
        className="sz-quick-results"
        role="listbox"
        aria-label={text("搜索建议", "Search suggestions")}
      >
        {results.map((item, i) => (
          <button
            key={item.post.id}
            id={`sz-quick-option-${i}`}
            role="option"
            aria-selected={active === i}
            tabIndex={-1}
            type="button"
            className={
              "sz-quick-result sz-paper-row" +
              (active === i ? " is-active" : "")
            }
            data-chroma={articleChroma(item.post.slug, item.post.tags)}
            data-paper-accent={articlePaperAccent(item.post, projects)}
            data-article={item.post.slug}
            onPointerMove={() => setActiveIndex(i)}
            onClick={() => select(item.post.slug)}
          >
            <span className="sz-quick-result-copy">
              <strong>
                <Snippet value={item.matches.title ?? item.post.title} />
              </strong>
              <small>
                <Snippet
                  value={
                    item.matches.summary ??
                    item.matches.contentSnippet ??
                    item.post.summary ??
                    ""
                  }
                />
              </small>
            </span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
      <footer className="sz-quick-bottom">
        <span aria-hidden="true">
          ↑↓ {text("选择", "Select")}
          <span>Esc {text("关闭", "Close")}</span>
        </span>
        <Link
          to="/search"
          search={{ q: normalized || undefined }}
          onClick={() => onDismiss(false)}
        >
          {text("查看全部搜索结果", "View all search results")}
          <ArrowRight size={15} />
        </Link>
      </footer>
    </dialog>
  );
}
