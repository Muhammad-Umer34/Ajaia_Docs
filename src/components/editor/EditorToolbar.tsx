"use client";

import { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
  editable?: boolean;
}

export default function EditorToolbar({
  editor,
  editable = true,
}: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className={`editor-toolbar ${!editable ? "disabled" : ""}`}>
      {/* Text Styles */}
      <div className="btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`tb-btn ${editor.isActive("bold") ? "active" : ""}`}
          title="Bold (Ctrl+B)"
          disabled={!editable}
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`tb-btn ${editor.isActive("italic") ? "active" : ""}`}
          title="Italic (Ctrl+I)"
          disabled={!editable}
        >
          <em>I</em>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`tb-btn ${editor.isActive("underline") ? "active" : ""}`}
          title="Underline (Ctrl+U)"
          disabled={!editable}
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`tb-btn ${editor.isActive("strike") ? "active" : ""}`}
          title="Strikethrough"
          disabled={!editable}
        >
          <s>S</s>
        </button>
      </div>

      <div className="tb-divider" />

      {/* Headings */}
      <div className="btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`tb-btn ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
          title="Heading 1"
          disabled={!editable}
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`tb-btn ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
          title="Heading 2"
          disabled={!editable}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`tb-btn ${editor.isActive("heading", { level: 3 }) ? "active" : ""}`}
          title="Heading 3"
          disabled={!editable}
        >
          H3
        </button>
      </div>

      <div className="tb-divider" />

      {/* Lists & Quotes */}
      <div className="btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`tb-btn ${editor.isActive("bulletList") ? "active" : ""}`}
          title="Bullet List"
          disabled={!editable}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="2" fill="currentColor" />
            <circle cx="4" cy="12" r="2" fill="currentColor" />
            <circle cx="4" cy="18" r="2" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`tb-btn ${editor.isActive("orderedList") ? "active" : ""}`}
          title="Numbered List"
          disabled={!editable}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="2" y="7" fontSize="8" fill="currentColor" fontWeight="bold">1</text>
            <text x="2" y="13" fontSize="8" fill="currentColor" fontWeight="bold">2</text>
            <text x="2" y="19" fontSize="8" fill="currentColor" fontWeight="bold">3</text>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`tb-btn ${editor.isActive("blockquote") ? "active" : ""}`}
          title="Blockquote"
          disabled={!editable}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          </svg>
        </button>
      </div>

      <div className="tb-divider" />

      {/* History */}
      <div className="btn-group">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || !editable}
          className="tb-btn"
          title="Undo (Ctrl+Z)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || !editable}
          className="tb-btn"
          title="Redo (Ctrl+Y)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .editor-toolbar {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.45rem 0.75rem;
          background: rgba(18, 18, 26, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          flex-wrap: wrap;
          user-select: none;
        }

        .editor-toolbar.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .btn-group {
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }

        .tb-divider {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 0.25rem;
        }

        .tb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 0.4rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tb-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          color: #f1f5f9;
        }

        .tb-btn.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
        }

        .tb-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
