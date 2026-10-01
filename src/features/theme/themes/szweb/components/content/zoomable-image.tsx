import { ClientOnly } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { m } from "@/paraglide/messages";
import { text } from "../../i18n";

function originalImageUrl(src: string) {
  try {
    const url = new URL(src, window.location.origin);
    url.searchParams.set("original", "true");
    return url.toString();
  } catch {
    return src.includes("?") ? `${src}&original=true` : `${src}?original=true`;
  }
}

export function ZoomableImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousOverflow = useRef("");
  const originalSrc =
    typeof window !== "undefined" ? originalImageUrl(src) : src;

  useEffect(() => {
    if (!open) return;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [
          ...dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href]:not([tabindex="-1"]), button:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
          ),
        ];
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const focusIsInside = dialogRef.current.contains(
          document.activeElement,
        );
        if (!focusIsInside) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow.current;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="sz-image-trigger"
        onClick={() => setOpen(true)}
        aria-label={m.common_view_full_image()}
      >
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
        <span className="sz-image-expand" aria-hidden="true">
          ↗
        </span>
      </button>
      <ClientOnly>
        {open &&
          createPortal(
            <div
              ref={dialogRef}
              className="sz-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={alt || m.common_image_preview()}
            >
              <button
                className="sz-lightbox-backdrop"
                type="button"
                tabIndex={-1}
                aria-label={m.common_close()}
                onClick={() => setOpen(false)}
              />
              <header className="sz-lightbox-head">
                <div>
                  <strong>{m.common_image_preview()}</strong>
                  {alt && <span>{alt}</span>}
                </div>
                <div className="sz-lightbox-actions">
                  <a
                    href={originalSrc}
                    download
                    target="_blank"
                    rel="noreferrer"
                  >
                    {text("原图", "Original")}
                  </a>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={m.common_close()}
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>
              </header>
              <div className="sz-lightbox-image">
                <img src={originalSrc} alt={alt} loading="eager" />
              </div>
            </div>,
            document.body,
          )}
      </ClientOnly>
    </>
  );
}
