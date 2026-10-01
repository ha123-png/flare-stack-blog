import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { JSONContent } from "@tiptap/react";
import { LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Turnstile, useTurnstile } from "@/components/common/turnstile";
import { useComments } from "@/features/comments/hooks/use-comments";
import { rootCommentsByPostIdInfiniteQuery } from "@/features/comments/queries";
import { authClient } from "@/lib/auth/auth.client";
import { m } from "@/paraglide/messages";
import { text } from "../../i18n";
import { CommentEditor } from "./comment-editor";
import { CommentList } from "./comment-list";
import { CommentSectionSkeleton } from "./comment-section-skeleton";
import { DeleteConfirmation } from "./delete-confirmation";

interface CommentSectionProps {
  postId: number;
  onCountChange?: (count: number) => void;
  initialExpandedRootId?: number;
  highlightCommentId?: number;
}

export function CommentSection({
  postId,
  onCountChange,
  initialExpandedRootId,
  highlightCommentId,
}: CommentSectionProps) {
  const { data: session } = authClient.useSession();
  const query = useInfiniteQuery(
    rootCommentsByPostIdInfiniteQuery(postId, session?.user.id),
  );
  const rootComments = query.data?.pages.flatMap((page) => page.items) ?? [];
  const { createComment, deleteComment, isCreating, isDeleting } =
    useComments(postId);
  const [replyTarget, setReplyTarget] = useState<{
    rootId: number;
    commentId: number;
    userName: string;
  } | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const {
    isPending: turnstilePending,
    reset: resetTurnstile,
    turnstileProps,
  } = useTurnstile("comment");

  const totalRoots = query.data?.pages[0]?.total ?? 0;
  useEffect(() => onCountChange?.(totalRoots), [onCountChange, totalRoots]);
  useEffect(() => {
    if (
      !initialExpandedRootId ||
      rootComments.some((comment) => comment.id === initialExpandedRootId) ||
      !query.hasNextPage ||
      query.isFetchingNextPage ||
      query.isFetchNextPageError
    )
      return;
    void query.fetchNextPage();
  }, [
    initialExpandedRootId,
    query.fetchNextPage,
    query.hasNextPage,
    query.isFetchNextPageError,
    query.isFetchingNextPage,
    rootComments,
  ]);

  const requireTurnstile = () => {
    if (!turnstilePending) return;
    toast.error(m.comments_turnstile_required());
    turnstileRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    // Let the editor keep its content while the challenge is unfinished.
    throw new Error("TURNSTILE_PENDING");
  };

  const submit = async (
    content: JSONContent,
    reply?: { rootId: number; commentId: number },
  ) => {
    requireTurnstile();
    try {
      const result = await createComment({
        data: {
          postId,
          content,
          ...(reply
            ? { rootId: reply.rootId, replyToCommentId: reply.commentId }
            : {}),
        },
      });
      if (result.error) throw new Error("COMMENT_CREATE_FAILED");
    } finally {
      resetTurnstile();
    }
  };

  const handleReplySubmit = async (content: JSONContent) => {
    if (!replyTarget) return;
    await submit(content, replyTarget);
    setReplyTarget(null);
  };

  const handleDelete = async () => {
    if (commentToDelete === null) return;
    try {
      const result = await deleteComment({ data: { id: commentToDelete } });
      if (!result.error) setCommentToDelete(null);
    } catch {
      toast.error(m.comments_toast_delete_error());
    }
  };

  if (query.isPending) return <CommentSectionSkeleton />;

  if (query.isError && !query.data) {
    return (
      <section className="sz-comments" aria-labelledby="sz-comments-heading">
        <header className="sz-comments-header">
          <h2 id="sz-comments-heading">{m.comments_count({ count: 0 })}</h2>
        </header>
        <div className="sz-comment-state sz-comment-error" role="alert">
          <p>{m.comments_toast_unknown_error()}</p>
          <button
            className="sz-button sz-button-secondary"
            type="button"
            onClick={() => void query.refetch()}
          >
            {m.error_retry()}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="sz-comments" aria-labelledby="sz-comments-heading">
      <header className="sz-comments-header">
        <div>
          <h2 id="sz-comments-heading">
            {m.comments_count({ count: totalRoots })}
          </h2>
          <p>{text("把想法接着聊下去。", "Continue the conversation.")}</p>
        </div>
        <span className="sz-label">{text("讨论", "Discussion")}</span>
      </header>

      {session ? (
        <div className="sz-comment-composer">
          <p className="sz-comment-identity">
            {text(
              `以 ${session.user.name || m.comments_item_anonymous()} 的身份留言`,
              `Commenting as ${session.user.name || m.comments_item_anonymous()}`,
            )}
          </p>
          <CommentEditor
            onSubmit={(content) => submit(content)}
            isSubmitting={isCreating && !replyTarget}
          />
        </div>
      ) : (
        <div className="sz-comment-login">
          <p>{m.comments_join_discussion()}</p>
          <Link to="/login" className="sz-button">
            <LogIn size={15} aria-hidden="true" />
            {m.comments_login()}
          </Link>
        </div>
      )}

      <div className="sz-turnstile" ref={turnstileRef}>
        <Turnstile {...turnstileProps} />
      </div>

      {query.isError && query.data && (
        <div className="sz-inline-error" role="alert">
          <span>{m.comments_toast_unknown_error()}</span>
          <button
            className="sz-text-link"
            type="button"
            onClick={() => void query.refetch()}
          >
            {m.error_retry()}
          </button>
        </div>
      )}

      <CommentList
        rootComments={rootComments}
        postId={postId}
        replyTarget={replyTarget}
        onReply={(rootId, commentId, userName) =>
          setReplyTarget({ rootId, commentId, userName })
        }
        onCancelReply={() => setReplyTarget(null)}
        onSubmitReply={handleReplySubmit}
        onDelete={setCommentToDelete}
        isSubmittingReply={isCreating}
        initialExpandedRootId={initialExpandedRootId}
        highlightCommentId={highlightCommentId}
      />

      {query.hasNextPage && (
        <div className="sz-comments-more-wrap">
          <button
            className="sz-text-link"
            type="button"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage
              ? m.comments_loading()
              : m.comments_load_more()}
          </button>
          {query.isFetchNextPageError && (
            <button
              className="sz-text-link"
              type="button"
              onClick={() => void query.fetchNextPage()}
            >
              {m.error_retry()}
            </button>
          )}
        </div>
      )}

      <DeleteConfirmation
        isOpen={commentToDelete !== null}
        isLoading={isDeleting}
        onCancel={() => setCommentToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </section>
  );
}
