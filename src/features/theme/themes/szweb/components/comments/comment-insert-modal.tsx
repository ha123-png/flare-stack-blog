import { ClientOnly } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m } from "@/paraglide/messages";

export type InsertType = "LINK" | "IMAGE" | null;

export function CommentInsertModal({
  type,
  initialUrl = "",
  onClose,
  onSubmit,
}: {
  type: InsertType;
  initialUrl?: string;
  onClose: () => void;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const previousOverflowRef = useRef("");
  onCloseRef.current = onClose;
  const mounted = type !== null;
  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl, type]);
  useEffect(() => {
    if (!mounted) return;
    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href]:not([tabindex="-1"]), button:not(:disabled):not([tabindex="-1"]), input:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflowRef.current;
      if (previousActiveElementRef.current?.isConnected)
        previousActiveElementRef.current.focus();
    };
  }, [mounted]);

  if (!mounted) return null;
  const title =
    type === "LINK"
      ? m.comments_editor_modal_link_title()
      : m.comments_editor_modal_image_title();
  const label =
    type === "LINK"
      ? m.comments_editor_modal_link_label()
      : m.comments_editor_modal_image_label();
  const confirm = () => {
    const value = url.trim();
    if (value) onSubmit(value);
  };

  return (
    <ClientOnly>
      {createPortal(
        <div
          className="sz-site sz-insert-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <section
            ref={dialogRef}
            className="sz-insert-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sz-insert-title"
            tabIndex={-1}
          >
            <header>
              <h2 id="sz-insert-title">{title}</h2>
              <button
                className="sz-icon-button"
                type="button"
                onClick={onClose}
                aria-label={m.common_close()}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <label htmlFor="sz-comment-insert-url">{label}</label>
            <input
              id="sz-comment-insert-url"
              ref={inputRef}
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") confirm();
              }}
              placeholder="https://…"
            />
            <p>
              {type === "LINK"
                ? m.comments_editor_modal_link_desc()
                : m.comments_editor_modal_image_desc()}
            </p>
            <footer>
              <button className="sz-text-link" type="button" onClick={onClose}>
                {m.comments_editor_modal_cancel()}
              </button>
              <button
                className="sz-button"
                type="button"
                onClick={confirm}
                disabled={!url.trim()}
              >
                {m.comments_editor_modal_confirm()}
              </button>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </ClientOnly>
  );
}
