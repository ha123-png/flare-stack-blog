import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { JSONContent } from "@tiptap/react";
import { useEffect, useState } from "react";
import type { RootCommentWithReplyCount } from "@/features/comments/comments.schema";
import { repliesByRootIdInfiniteQuery } from "@/features/comments/queries";
import { authClient } from "@/lib/auth/auth.client";
import { m } from "@/paraglide/messages";
import { CommentEditor } from "./comment-editor";
import { CommentItem } from "./comment-item";

type ReplyTarget = { rootId: number; commentId: number; userName: string };

interface CommentListProps {
  rootComments: Array<RootCommentWithReplyCount>;
  postId: number;
  replyTarget: ReplyTarget | null;
  onReply: (rootId: number, commentId: number, userName: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (content: JSONContent) => Promise<void>;
  onDelete: (commentId: number) => void;
  isSubmittingReply: boolean;
  initialExpandedRootId?: number;
  highlightCommentId?: number;
}

export function CommentList(props: CommentListProps) {
  const [expandedRoots, setExpandedRoots] = useState<Set<number>>(
    () =>
      new Set(props.initialExpandedRootId ? [props.initialExpandedRootId] : []),
  );

  useEffect(() => {
    if (props.initialExpandedRootId)
      setExpandedRoots((previous) =>
        new Set(previous).add(props.initialExpandedRootId!),
      );
  }, [props.initialExpandedRootId]);

  useEffect(() => {
    if (!props.highlightCommentId) return;
    let attempts = 0;
    let timer = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(
        `comment-${props.highlightCommentId}`,
      );
      if (target) {
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "center",
        });
        return;
      }
      if (attempts++ < 25) timer = window.setTimeout(scrollToTarget, 160);
    };
    scrollToTarget();
    return () => window.clearTimeout(timer);
  }, [props.highlightCommentId, props.rootComments.length]);

  if (props.rootComments.length === 0) {
    return (
      <div className="sz-comment-state sz-comment-empty">
        <span className="sz-comment-empty-mark">—</span>
        <p>{m.comments_list_empty()}</p>
      </div>
    );
  }

  return (
    <div className="sz-comment-list">
      {props.rootComments.map((root) => (
        <RootThread
          key={root.id}
          root={root}
          {...props}
          isExpanded={expandedRoots.has(root.id)}
          onToggle={() =>
            setExpandedRoots((previous) => {
              const next = new Set(previous);
              if (next.has(root.id)) next.delete(root.id);
              else next.add(root.id);
              return next;
            })
          }
        />
      ))}
    </div>
  );
}

function RootThread({
  root,
  postId,
  isExpanded,
  onToggle,
  replyTarget,
  onReply,
  onCancelReply,
  onSubmitReply,
  onDelete,
  isSubmittingReply,
  highlightCommentId,
}: CommentListProps & {
  root: RootCommentWithReplyCount;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: session } = authClient.useSession();
  const repliesQuery = useInfiniteQuery({
    ...repliesByRootIdInfiniteQuery(postId, root.id, session?.user.id),
    enabled: isExpanded && root.replyCount > 0,
  });
  const replies = repliesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const isReplyingToRoot =
    replyTarget?.rootId === root.id && replyTarget.commentId === root.id;

  const replyForm = (target: ReplyTarget) =>
    session ? (
      <div className="sz-inline-reply">
        <div className="sz-inline-reply-label">
          <span>{m.comments_item_reply()}</span>
          <strong>@{target.userName}</strong>
        </div>
        <CommentEditor
          onSubmit={onSubmitReply}
          isSubmitting={isSubmittingReply}
          autoFocus
          onCancel={onCancelReply}
          submitLabel={m.comments_editor_submit_reply()}
        />
      </div>
    ) : (
      <div className="sz-reply-login">
        <span>
          {m.comments_list_login_to_reply({ userName: target.userName })}
        </span>
        <Link className="sz-text-link" to="/login">
          {m.comments_login()}
        </Link>
        <button className="sz-text-link" type="button" onClick={onCancelReply}>
          {m.comments_editor_cancel()}
        </button>
      </div>
    );

  return (
    <article className="sz-comment-thread">
      <CommentItem
        comment={root}
        onReply={() =>
          onReply(
            root.id,
            root.id,
            root.user?.name || m.comments_item_unknown_user(),
          )
        }
        onDelete={onDelete}
        highlightCommentId={highlightCommentId}
      />
      {isReplyingToRoot && replyTarget && replyForm(replyTarget)}
      {root.replyCount > 0 && (
        <div className="sz-replies-block">
          <button
            className="sz-replies-toggle"
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggle}
          >
            <i aria-hidden="true" />
            {isExpanded
              ? m.comments_list_collapse_replies()
              : m.comments_list_expand_replies({ count: root.replyCount })}
          </button>
          {isExpanded && (
            <div className="sz-replies-list">
              {repliesQuery.isPending && (
                <p className="sz-reply-state">{m.comments_loading()}</p>
              )}
              {repliesQuery.isError && (
                <div className="sz-reply-state" role="alert">
                  <span>{m.comments_toast_unknown_error()}</span>
                  <button
                    className="sz-text-link"
                    type="button"
                    onClick={() => void repliesQuery.refetch()}
                  >
                    {m.error_retry()}
                  </button>
                </div>
              )}
              {replies.map((reply) => {
                const target =
                  replyTarget?.rootId === root.id &&
                  replyTarget.commentId === reply.id
                    ? replyTarget
                    : null;
                return (
                  <div className="sz-reply-entry" key={reply.id}>
                    <CommentItem
                      comment={reply}
                      isReply
                      replyToName={reply.replyTo?.name || root.user?.name}
                      highlightCommentId={highlightCommentId}
                      onDelete={onDelete}
                      onReply={() =>
                        onReply(
                          root.id,
                          reply.id,
                          reply.user?.name || m.comments_item_unknown_user(),
                        )
                      }
                    />
                    {target && replyForm(target)}
                  </div>
                );
              })}
              {repliesQuery.hasNextPage && (
                <button
                  className="sz-text-link sz-replies-more"
                  type="button"
                  disabled={repliesQuery.isFetchingNextPage}
                  onClick={() => void repliesQuery.fetchNextPage()}
                >
                  {repliesQuery.isFetchingNextPage
                    ? m.comments_loading()
                    : m.comments_list_load_more_replies()}
                </button>
              )}
              {repliesQuery.isFetchNextPageError && (
                <button
                  className="sz-text-link"
                  type="button"
                  onClick={() => void repliesQuery.fetchNextPage()}
                >
                  {m.error_retry()}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
