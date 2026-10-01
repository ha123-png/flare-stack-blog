import { useEffect, useRef } from "react";
import { m } from "@/paraglide/messages";

export function DeleteConfirmation({
  isOpen,
  isLoading,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);
  const isLoadingRef = useRef(isLoading);
  onCancelRef.current = onCancel;
  isLoadingRef.current = isLoading;
  useEffect(() => {
    if (!isOpen) return;
    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoadingRef.current) {
        onCancelRef.current();
        return;
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = [
          ...dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not(:disabled):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        if (!focusable.length) {
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
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      const previousActiveElement = previousActiveElementRef.current;
      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus();
      } else {
        const deletedComment =
          previousActiveElement?.closest<HTMLElement>(".sz-comment-item");
        if (deletedComment) {
          deletedComment.tabIndex = -1;
          deletedComment.focus();
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div
      className="sz-confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="sz-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sz-delete-title"
        aria-describedby="sz-delete-desc"
        tabIndex={-1}
      >
        <span className="sz-label">{m.comments_item_delete()}</span>
        <h2 id="sz-delete-title">{m.comments_delete_title()}</h2>
        <p id="sz-delete-desc">{m.comments_delete_desc()}</p>
        <footer>
          <button
            ref={cancelRef}
            className="sz-button sz-button-secondary"
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            {m.common_cancel()}
          </button>
          <button
            className="sz-button sz-button-danger"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? m.common_processing() : m.comments_delete_confirm()}
          </button>
        </footer>
      </section>
    </div>
  );
}
