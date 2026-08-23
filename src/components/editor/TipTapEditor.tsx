"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface TipTapEditorProps {
  initialContent: any;
  onUpdate: (jsonContent: any) => void;
  editable?: boolean;
  onEditorReady?: (editor: any) => void;
}

export interface TipTapEditorHandle {
  setRemoteContent: (content: any) => void;
}

const TipTapEditor = forwardRef<TipTapEditorHandle, TipTapEditorProps>(
  function TipTapEditor({ initialContent, onUpdate, editable = true, onEditorReady }, ref) {
    // Keep onUpdate always fresh in a ref to avoid stale closure traps
    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
      onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    // Flag to suppress onUpdate when setting remote content
    const isRemoteUpdateRef = useRef(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        Placeholder.configure({
          placeholder: "Start typing your document content here...",
        }),
      ],
      content: initialContent || {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
      editable: editable,
      onUpdate: ({ editor }) => {
        // Skip firing onUpdate if this was triggered by a remote content set
        if (isRemoteUpdateRef.current) return;
        onUpdateRef.current?.(editor.getJSON());
      },
    });

    // Expose a method to set content from remote sources without triggering onUpdate
    useImperativeHandle(
      ref,
      () => ({
        setRemoteContent: (content: any) => {
          if (!editor) return;
          isRemoteUpdateRef.current = true;
          editor.commands.setContent(content, false);
          // Keep flag true until next tick
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 50);
        },
      }),
      [editor]
    );

    useEffect(() => {
      if (editor) {
        editor.setEditable(editable);
        if (onEditorReady) {
          onEditorReady(editor);
        }
      }
    }, [editor, editable, onEditorReady]);

    return (
      <div className="tiptap-wrapper">
        <EditorContent editor={editor} className="tiptap-content-container" />

        <style jsx global>{`
          .tiptap-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          .tiptap-content-container {
            width: 100%;
            max-width: 840px;
            min-height: 70vh;
            background: rgba(18, 18, 26, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 3rem 3.5rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
          }

          @media (max-width: 768px) {
            .tiptap-content-container {
              padding: 1.75rem 1.5rem;
            }
          }

          .ProseMirror {
            outline: none;
            min-height: 60vh;
            color: #f1f5f9;
            font-family: var(--font-doc, "Georgia", Cambria, serif);
            font-size: 1.125rem;
            line-height: 1.8;
            letter-spacing: -0.003em;
          }

          .ProseMirror p {
            margin-bottom: 1.25rem;
          }

          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #475569;
            pointer-events: none;
            height: 0;
            font-style: italic;
          }

          .ProseMirror h1 {
            font-family: var(--font-ui, system-ui, sans-serif);
            font-size: 2.2rem;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.25;
            margin-top: 2rem;
            margin-bottom: 1rem;
            letter-spacing: -0.02em;
          }

          .ProseMirror h2 {
            font-family: var(--font-ui, system-ui, sans-serif);
            font-size: 1.65rem;
            font-weight: 600;
            color: #f8fafc;
            line-height: 1.3;
            margin-top: 1.75rem;
            margin-bottom: 0.75rem;
            letter-spacing: -0.01em;
          }

          .ProseMirror h3 {
            font-family: var(--font-ui, system-ui, sans-serif);
            font-size: 1.3rem;
            font-weight: 600;
            color: #e2e8f0;
            line-height: 1.4;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }

          .ProseMirror ul,
          .ProseMirror ol {
            padding-left: 1.75rem;
            margin-bottom: 1.25rem;
          }

          .ProseMirror li {
            margin-bottom: 0.4rem;
          }

          .ProseMirror blockquote {
            border-left: 3px solid #6366f1;
            padding-left: 1.25rem;
            margin: 1.5rem 0;
            color: #cbd5e1;
            font-style: italic;
          }

          .ProseMirror code {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #a5b4fc;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.9em;
            font-family: "JetBrains Mono", monospace;
          }

          .ProseMirror pre {
            background: #0d0d14;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 1rem 1.25rem;
            margin: 1.5rem 0;
            overflow-x: auto;
          }

          .ProseMirror pre code {
            background: transparent;
            border: none;
            padding: 0;
            color: #f8fafc;
          }

          .ProseMirror hr {
            border: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin: 2rem 0;
          }

          ::selection {
            background: rgba(99, 102, 241, 0.35);
          }
        `}</style>
      </div>
    );
  }
);

export default TipTapEditor;
