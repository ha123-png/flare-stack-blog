import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";
import { m } from "@/paraglide/messages";
import { text } from "../../i18n";

function Tool({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`sz-toolbar-button${active ? " sz-is-active" : ""}`}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

export function CommentEditorToolbar({
  editor,
  onLinkClick,
  onImageClick,
}: {
  editor: Editor;
  onLinkClick: () => void;
  onImageClick: () => void;
}) {
  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      underline: current.isActive("underline"),
      strike: current.isActive("strike"),
      code: current.isActive("code"),
      link: current.isActive("link"),
    }),
  });
  return (
    <div
      className="sz-toolbar"
      role="toolbar"
      aria-label={text("评论格式工具", "Comment formatting tools")}
    >
      <Tool
        icon={Bold}
        label={m.comments_editor_toolbar_bold()}
        active={active.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <Tool
        icon={Italic}
        label={m.comments_editor_toolbar_italic()}
        active={active.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <Tool
        icon={Underline}
        label={m.comments_editor_toolbar_underline()}
        active={active.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <Tool
        icon={Strikethrough}
        label={m.comments_editor_toolbar_strike()}
        active={active.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Tool
        icon={Code}
        label={m.comments_editor_toolbar_code()}
        active={active.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />
      <span className="sz-toolbar-divider" aria-hidden="true" />
      <Tool
        icon={LinkIcon}
        label={m.comments_editor_toolbar_link()}
        active={active.link}
        onClick={onLinkClick}
      />
      <Tool
        icon={ImageIcon}
        label={m.comments_editor_toolbar_image()}
        onClick={onImageClick}
      />
      <span className="sz-toolbar-spacer" />
      <Tool
        icon={Undo}
        label={m.comments_editor_toolbar_undo()}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <Tool
        icon={Redo}
        label={m.comments_editor_toolbar_redo()}
        onClick={() => editor.chain().focus().redo().run()}
      />
    </div>
  );
}
