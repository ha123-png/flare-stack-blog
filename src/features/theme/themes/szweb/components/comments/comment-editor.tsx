import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { LoaderCircle, Send } from "lucide-react";
import { useCallback, useState } from "react";
import { getCommentExtensions } from "@/features/comments/components/editor/config";
import { normalizeLinkHref } from "@/lib/links/normalize-link-href";
import { m } from "@/paraglide/messages";
import { CommentEditorToolbar } from "./comment-editor-toolbar";
import type { InsertType } from "./comment-insert-modal";
import { CommentInsertModal } from "./comment-insert-modal";

interface CommentEditorProps {
  onSubmit: (content: JSONContent) => Promise<void>;
  isSubmitting?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
}

export function CommentEditor({
  onSubmit,
  isSubmitting = false,
  autoFocus = false,
  onCancel,
  submitLabel,
}: CommentEditorProps) {
  const [insertType, setInsertType] = useState<InsertType>(null);
  const [initialUrl, setInitialUrl] = useState("");
  const editor = useEditor({
    extensions: getCommentExtensions(),
    content: "",
    autofocus: autoFocus ? "end" : false,
    editorProps: { attributes: { class: "sz-editor-prosemirror" } },
  });
  const { isEmpty } = useEditorState({
    editor,
    selector: (context) => ({ isEmpty: context.editor.isEmpty }),
  });

  const openLink = useCallback(() => {
    setInitialUrl(
      (editor.getAttributes("link").href as string | undefined) ?? "",
    );
    setInsertType("LINK");
  }, [editor]);
  const openImage = useCallback(() => {
    setInitialUrl("");
    setInsertType("IMAGE");
  }, []);

  const submit = async () => {
    if (isEmpty || isSubmitting) return;
    try {
      await onSubmit(editor.getJSON());
      editor.commands.clearContent();
    } catch {
      // The parent reports errors; keeping the JSON in the editor preserves the draft.
    }
  };

  return (
    <div className="sz-comment-editor">
      <div className="sz-comment-editor-toolbar">
        <CommentEditorToolbar
          editor={editor}
          onLinkClick={openLink}
          onImageClick={openImage}
        />
      </div>
      <EditorContent editor={editor} className="sz-comment-editor-area" />
      <footer className="sz-comment-editor-footer">
        <span>{m.comments_editor_support_markdown()}</span>
        <div>
          {onCancel && (
            <button className="sz-text-link" type="button" onClick={onCancel}>
              {m.comments_editor_cancel()}
            </button>
          )}
          <button
            className="sz-button sz-comment-submit"
            type="button"
            disabled={isEmpty || isSubmitting}
            onClick={() => void submit()}
          >
            {isSubmitting ? (
              <LoaderCircle
                className="sz-spinning"
                size={14}
                aria-hidden="true"
              />
            ) : (
              <Send size={14} aria-hidden="true" />
            )}
            {submitLabel || m.comments_editor_submit()}
          </button>
        </div>
      </footer>
      <CommentInsertModal
        type={insertType}
        initialUrl={initialUrl}
        onClose={() => {
          setInsertType(null);
          editor.chain().focus().run();
        }}
        onSubmit={(url) => {
          if (insertType === "LINK") {
            const href = normalizeLinkHref(url);
            if (!href)
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            else
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href })
                .run();
          } else if (insertType === "IMAGE") {
            editor.chain().focus().setImage({ src: url }).run();
          }
          setInsertType(null);
          editor.chain().focus().run();
        }}
      />
    </div>
  );
}
