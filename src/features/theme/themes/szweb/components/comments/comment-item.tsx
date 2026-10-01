import { ClientOnly } from "@tanstack/react-router";
import { MessageCircle, Trash2 } from "lucide-react";
import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CommentWithUser } from "@/features/comments/comments.schema";
import { authClient } from "@/lib/auth/auth.client";
import { formatDate } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { CommentContent } from "./comment-render";

interface CommentItemProps {
  comment: CommentWithUser;
  onReply?: () => void;
  onDelete?: (id: number) => void;
  isReply?: boolean;
  replyToName?: string | null;
  highlightCommentId?: number;
}

export const CommentItem = memo(function CommentItem({
  comment,
  onReply,
  onDelete,
  isReply,
  replyToName,
  highlightCommentId,
}: CommentItemProps) {
  const { data: session } = authClient.useSession();
  const isAuthor = session?.user.id === comment.userId;
  const isAdmin = session?.user.role === "admin";
  const isAuthorAdmin = comment.user?.role === "admin";
  const isDeleted = comment.status === "deleted";
  const isPending =
    comment.status === "pending" || comment.status === "verifying";

  return (
    <div
      id={`comment-${comment.id}`}
      className={`sz-comment-item${isReply ? " sz-is-reply" : ""}${highlightCommentId === comment.id ? " sz-is-highlighted" : ""}`}
    >
      <div className="sz-comment-avatar" aria-hidden="true">
        {isDeleted ? (
          <span>×</span>
        ) : comment.user?.image ? (
          <img src={comment.user.image} alt="" loading="lazy" />
        ) : (
          <span>{comment.user?.name?.slice(0, 1) || "?"}</span>
        )}
      </div>
      <div className="sz-comment-main">
        <header className="sz-comment-head">
          <div className="sz-comment-author">
            <strong>
              {isDeleted
                ? m.comments_item_deleted_author()
                : comment.user?.name || m.comments_item_anonymous()}
            </strong>
            {isAuthorAdmin && !isDeleted && (
              <span className="sz-author-badge">
                {m.comments_item_blogger()}
              </span>
            )}
            {isPending && (
              <span
                className={`sz-comment-status${comment.status === "verifying" ? " sz-is-verifying" : ""}`}
              >
                {comment.status === "pending"
                  ? m.comments_status_pending()
                  : m.comments_status_verifying()}
              </span>
            )}
            {isReply && replyToName && (
              <span className="sz-comment-reply-to">
                {m.comments_item_reply_to({
                  name: isDeleted ? m.comments_item_unknown() : replyToName,
                })}
              </span>
            )}
          </div>
          <time dateTime={new Date(comment.createdAt).toISOString()}>
            <ClientOnly fallback="—">
              {formatDate(comment.createdAt, { includeTime: true })}
            </ClientOnly>
          </time>
        </header>
        <CommentBody content={comment.content} isDeleted={isDeleted} />
        {!isDeleted && (
          <div className="sz-comment-actions">
            <button className="sz-text-link" type="button" onClick={onReply}>
              <MessageCircle size={14} aria-hidden="true" />
              {m.comments_item_reply()}
            </button>
            {(isAuthor || isAdmin) && (
              <button
                className="sz-text-link sz-comment-delete"
                type="button"
                onClick={() => onDelete?.(comment.id)}
              >
                <Trash2 size={13} aria-hidden="true" />
                {m.comments_item_delete()}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function CommentBody({
  content,
  isDeleted,
}: {
  content: CommentWithUser["content"];
  isDeleted: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const rendered = useMemo(
    () => (isDeleted ? null : <CommentContent content={content} />),
    [content, isDeleted],
  );

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setCanExpand(element.scrollHeight > 184);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [rendered]);

  if (isDeleted)
    return (
      <p className="sz-comment-deleted">{m.comments_item_deleted_content()}</p>
    );
  return (
    <>
      <div
        ref={ref}
        className={`sz-comment-content${canExpand && !expanded ? " sz-is-clamped" : ""}`}
      >
        {rendered}
      </div>
      {canExpand && (
        <button
          className="sz-text-link sz-comment-expand"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? m.common_collapse() : m.common_show_more()}
        </button>
      )}
    </>
  );
}
