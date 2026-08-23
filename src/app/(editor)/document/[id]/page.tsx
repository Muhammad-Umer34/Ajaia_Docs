"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Editor } from "@tiptap/react";
import TipTapEditor, { TipTapEditorHandle } from "@/components/editor/TipTapEditor";
import EditorToolbar from "@/components/editor/EditorToolbar";
import Avatar from "@/components/ui/Avatar";
import ShareModal from "@/components/dashboard/ShareModal";
import ExportMenu from "@/components/editor/ExportMenu";
import { formatDate } from "@/lib/utils";
import { getWSClient } from "@/lib/ws-client";

interface DocumentData {
  id: string;
  title: string;
  content: any;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  permission: "owner" | "edit" | "view";
  owner: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
  shares?: Array<{
    id: string;
    permission: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarColor: string;
    };
  }>;
}

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [document, setDocument] = useState<DocumentData | null>(null);
  const [title, setTitle] = useState("Untitled Document");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Refs
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<TipTapEditorHandle>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const lastSyncedUpdatedAtRef = useRef<string>("");
  const saveStatusRef = useRef<string>("idle");
  const documentRef = useRef<DocumentData | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));
  const lastContentStringRef = useRef<string>("");

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  useEffect(() => {
    saveStatusRef.current = saveStatus;
  }, [saveStatus]);

  useEffect(() => {
    editorInstanceRef.current = editorInstance;
  }, [editorInstance]);

  // ── Fetch document on load ───────────────────────────────────────────
  useEffect(() => {
    async function loadDocument() {
      try {
        const res = await fetch(`/api/documents/${id}`);
        if (!res.ok) {
          if (res.status === 403) setError("You do not have permission to view this document.");
          else if (res.status === 404) setError("Document not found.");
          else setError("Failed to load document.");
          setLoading(false);
          return;
        }

        const data: DocumentData = await res.json();
        setDocument(data);
        setTitle(data.title);
        lastContentStringRef.current = JSON.stringify(data.content);
      } catch (err) {
        setError("Error connecting to server.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDocument();
    }
  }, [id]);

  // Focus title input when editing title
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // ── WebSocket Connection & Real-Time Sync ────────────────────────────
  useEffect(() => {
    if (!id) return;

    const ws = getWSClient();
    ws.connect();
    ws.joinDocument(id);

    // Handle incoming content updates from other users
    const handleDocUpdate = (data: any) => {
      if (data.senderId === clientIdRef.current) return;
      if (data.content) {
        const newStr = JSON.stringify(data.content);
        if (newStr !== lastContentStringRef.current) {
          lastContentStringRef.current = newStr;
          if (editorRef.current) {
            editorRef.current.setRemoteContent(data.content);
          }
        }
      }
      if (data.updatedAt) {
        setDocument((prev) =>
          prev ? { ...prev, updatedAt: data.updatedAt } : null
        );
      }
    };

    // Handle incoming title updates from other users
    const handleTitleUpdate = (data: any) => {
      if (data.senderId === clientIdRef.current) return;
      if (data.title) {
        setTitle(data.title);
        setDocument((prev) =>
          prev ? { ...prev, title: data.title } : null
        );
      }
    };

    // Handle saved notifications from other users
    const handleSavedNotification = (data: any) => {
      if (data.updatedAt) {
        setDocument((prev) =>
          prev ? { ...prev, updatedAt: data.updatedAt } : null
        );
      }
    };

    // Handle live permission changes (e.g. owner downgraded edit to view, or revoked)
    const handlePermissionsUpdate = async () => {
      try {
        const res = await fetch(`/api/documents/${id}`);
        if (res.ok) {
          const data: DocumentData = await res.json();
          setDocument(data);
          setTitle(data.title);
        } else if (res.status === 403) {
          setError("Your access to this document has been revoked.");
        }
      } catch (err) {}
    };

    ws.on("doc:update", handleDocUpdate);
    ws.on("doc:title", handleTitleUpdate);
    ws.on("doc:saved", handleSavedNotification);
    ws.on("doc:permissions", handlePermissionsUpdate);

    // Fallback polling for serverless environments (like Vercel) where WebSockets are unavailable
    let isMounted = true;
    let fallbackPollTimer: NodeJS.Timeout | null = null;

    async function serverlessFallbackPoll() {
      if (!isMounted) return;

      // Only poll if WebSocket is NOT connected and local editor is idle
      if (!ws.isConnected && saveStatusRef.current === "idle") {
        try {
          const res = await fetch(`/api/documents/${id}`);
          if (res.ok && isMounted) {
            const data: DocumentData = await res.json();
            if (data.updatedAt && data.updatedAt !== lastSyncedUpdatedAtRef.current) {
              lastSyncedUpdatedAtRef.current = data.updatedAt;
              if (editorRef.current && (!editorInstanceRef.current || !editorInstanceRef.current.isFocused)) {
                editorRef.current.setRemoteContent(data.content);
                setTitle(data.title);
                setDocument((prev) => (prev ? { ...prev, ...data } : data));
              }
            }
          }
        } catch (e) {}
      }

      if (isMounted) {
        fallbackPollTimer = setTimeout(serverlessFallbackPoll, 2000);
      }
    }

    fallbackPollTimer = setTimeout(serverlessFallbackPoll, 2000);

    return () => {
      isMounted = false;
      if (fallbackPollTimer) clearTimeout(fallbackPollTimer);
      ws.off("doc:update", handleDocUpdate);
      ws.off("doc:title", handleTitleUpdate);
      ws.off("doc:saved", handleSavedNotification);
      ws.off("doc:permissions", handlePermissionsUpdate);
      ws.leaveDocument();
    };
  }, [id]);

  // ── Save to Database (debounced PATCH) ───────────────────────────────
  const performSave = useCallback(
    async (content: any) => {
      const doc = documentRef.current;
      if (!doc || doc.permission === "view") {
        setSaveStatus("idle");
        return;
      }

      setSaveStatus("saving");

      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (res.ok) {
          const savedDoc = await res.json();
          const updatedAt = savedDoc.updatedAt || new Date().toISOString();
          lastSyncedUpdatedAtRef.current = updatedAt;
          setDocument((prev) =>
            prev ? { ...prev, updatedAt } : null
          );
          setSaveStatus("saved");

          // Notify other clients that the doc was saved
          try {
            const ws = getWSClient();
            ws.sendSavedNotification(updatedAt);
          } catch (e) {}

          setTimeout(() => {
            setSaveStatus((s) => (s === "saved" ? "idle" : s));
          }, 2000);
        } else {
          if (res.status === 403) {
            // Permission changed on server — refetch to lock UI
            const refetchRes = await fetch(`/api/documents/${id}`);
            if (refetchRes.ok) {
              const freshData = await refetchRes.json();
              setDocument(freshData);
            } else if (refetchRes.status === 403) {
              setError("Your access to this document has been revoked.");
            }
          }
          setSaveStatus("error");
        }
      } catch (err) {
        setSaveStatus("error");
      }
    },
    [id]
  );

  // ── Instant Save (Ctrl+S / click) ────────────────────────────────────
  const performImmediateSave = useCallback(() => {
    const doc = documentRef.current;
    if (!editorInstanceRef.current || !doc || doc.permission === "view") return;

    // Cancel any pending debounced save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const content = editorInstanceRef.current.getJSON();
    performSave(content);
  }, [performSave]);

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        performImmediateSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [performImmediateSave]);

  // ── Content Update Handler (from local typing) ───────────────────────
  const handleContentUpdate = useCallback(
    (newContent: any) => {
      const doc = documentRef.current;
      if (!doc || doc.permission === "view") return;

      const contentStr = JSON.stringify(newContent);
      // Strictly skip if content is identical to what was already loaded or received from remote
      if (contentStr === lastContentStringRef.current) {
        return;
      }
      lastContentStringRef.current = contentStr;

      // Broadcast live typing to other connected clients via WebSocket
      try {
        const ws = getWSClient();
        ws.sendDocUpdate(newContent, clientIdRef.current);
      } catch (e) {}

      // Debounced save to database
      setSaveStatus("saving");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        performSave(newContent);
      }, 1000);
    },
    [performSave]
  );

  // ── Title Save Handler ───────────────────────────────────────────────
  const handleSaveTitle = async (newTitle: string) => {
    const trimmed = newTitle.trim() || "Untitled Document";
    setTitle(trimmed);
    setIsEditingTitle(false);

    if (document && trimmed !== document.title && document.permission !== "view") {
      // Broadcast title update via WebSocket
      const ws = getWSClient();
      ws.sendTitleUpdate(trimmed);

      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });

        if (res.ok) {
          const saved = await res.json();
          setDocument((prev) => (prev ? { ...prev, title: trimmed, updatedAt: saved.updatedAt } : null));
          setSaveStatus("saved");
          setTimeout(() => {
            setSaveStatus((s) => (s === "saved" ? "idle" : s));
          }, 2000);
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        setSaveStatus("error");
      }
    }
  };

  // ── Delete Document Handler ──────────────────────────────────────────
  const handleDeleteDocument = async () => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.push("/dashboard");
        }
      } catch (err) {}
    }
  };

  // ── Word Count ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!editorInstance) return;

    const updateWords = () => {
      const text = editorInstance.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
    };

    editorInstance.on("update", updateWords);
    updateWords();

    return () => {
      editorInstance.off("update", updateWords);
    };
  }, [editorInstance]);

  // ── Render: Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="editor-loading-screen">
        <div className="spinner-large" />
        <p>Loading document...</p>
        <style jsx>{`
          .editor-loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            color: #94a3b8;
          }
          .spinner-large {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(99, 102, 241, 0.2);
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ── Render: Error ────────────────────────────────────────────────────
  if (error || !document) {
    return (
      <div className="editor-error-screen">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Document Unavailable</h2>
          <p>{error || "Unable to find the requested document."}</p>
          <Link href="/dashboard" className="btn-back">
            ← Return to Dashboard
          </Link>
        </div>
        <style jsx>{`
          .editor-error-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }
          .error-card {
            background: rgba(18, 18, 26, 0.8);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 16px;
            padding: 2.5rem;
            text-align: center;
            max-width: 420px;
          }
          .error-icon {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
          }
          .error-card h2 {
            font-size: 1.35rem;
            font-weight: 700;
            color: #fca5a5;
            margin-bottom: 0.5rem;
          }
          .error-card p {
            color: #94a3b8;
            font-size: 0.9rem;
            margin-bottom: 1.5rem;
          }
          .btn-back {
            display: inline-block;
            background: #6366f1;
            color: #ffffff;
            padding: 0.65rem 1.25rem;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.2s;
          }
          .btn-back:hover {
            background: #4f46e5;
          }
        `}</style>
      </div>
    );
  }

  const isEditable = document.permission !== "view";

  return (
    <div className="editor-page-container">
      {/* Top Navigation Bar */}
      <header className="editor-header">
        <div className="header-left">
          <Link href="/dashboard" className="btn-return" title="Back to Dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>

          <div className="title-section">
            {isEditingTitle && isEditable ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveTitle(title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle(title);
                  if (e.key === "Escape") {
                    setTitle(document.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="title-input-active"
              />
            ) : (
              <h1
                className={`doc-heading ${isEditable ? "clickable" : ""}`}
                onClick={() => isEditable && setIsEditingTitle(true)}
                title={isEditable ? "Click to rename" : title}
              >
                {title}
              </h1>
            )}

            <div className="status-meta">
              {/* Save status badge */}
              {saveStatus === "saving" && (
                <span className="save-tag saving">
                  <span className="dot pulse" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="save-tag saved">
                  ✓ Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span
                  className="save-tag error clickable"
                  onClick={() => isEditable && performImmediateSave()}
                  title="Click to retry saving (Ctrl+S)"
                >
                  ⚠ Retry save
                </span>
              )}
              {saveStatus === "idle" && (
                <span
                  className="save-tag idle"
                  suppressHydrationWarning
                >
                  Last updated {formatDate(document.updatedAt)}
                </span>
              )}

              {/* Permission pill */}
              <span className={`permission-badge ${document.permission}`}>
                {document.permission === "owner"
                  ? "Owner"
                  : document.permission === "edit"
                  ? "Can Edit"
                  : "View Only"}
              </span>
            </div>
          </div>
        </div>

        <div className="header-right">
          {document.permission !== "owner" && (
            <div className="doc-owner-info">
              <Avatar name={document.owner.name} color={document.owner.avatarColor} size="sm" />
              <span className="owner-label">Owned by {document.owner.name}</span>
            </div>
          )}

          {/* Export Menu */}
          <ExportMenu
            title={title}
            getContent={() =>
              editorInstanceRef.current
                ? editorInstanceRef.current.getJSON()
                : document.content
            }
          />

          {document.permission === "owner" && (
            <>
              <button
                type="button"
                className="btn-share-trigger"
                onClick={() => setIsShareOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share</span>
              </button>

              <button
                type="button"
                className="btn-delete-trigger"
                onClick={handleDeleteDocument}
                title="Delete document"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Toolbar Bar */}
      <div className="sticky-toolbar-wrapper">
        <EditorToolbar editor={editorInstance} editable={isEditable} />
      </div>

      {/* Main Document Content */}
      <main className="editor-workspace">
        {!isEditable && (
          <div className="read-only-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>You have view-only access to this document. Editing is disabled.</span>
          </div>
        )}

        <TipTapEditor
          ref={editorRef}
          initialContent={document.content}
          onUpdate={handleContentUpdate}
          editable={isEditable}
          onEditorReady={(editor) => setEditorInstance(editor)}
        />
      </main>

      {/* Document Stats Footer */}
      <footer className="editor-footer">
        <div className="footer-content">
          <span>{wordCount} {wordCount === 1 ? "word" : "words"}</span>
          <span>•</span>
          <span>TipTap / ProseMirror Engine</span>
        </div>
      </footer>

      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          documentId={document.id}
          documentTitle={document.title}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      <style jsx>{`
        .editor-page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
        }

        .editor-header {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          min-width: 0;
        }

        .btn-return {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .btn-return:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .title-section {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          min-width: 0;
        }

        .doc-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 380px;
        }

        .doc-heading.clickable {
          cursor: pointer;
          border-radius: 4px;
          padding: 0.1rem 0.3rem;
          margin-left: -0.3rem;
          transition: background 0.15s;
        }

        .doc-heading.clickable:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .title-input-active {
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
          background: #1e1e2d;
          border: 1px solid #6366f1;
          border-radius: 6px;
          padding: 0.15rem 0.5rem;
          outline: none;
          max-width: 380px;
        }

        .status-meta {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .save-tag {
          font-size: 0.725rem;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .save-tag.clickable {
          cursor: pointer;
          border-radius: 4px;
          padding: 0.1rem 0.3rem;
          transition: background 0.15s;
        }

        .save-tag.clickable:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .save-tag.idle {
          color: #64748b;
        }

        .save-tag.saving {
          color: #a5b4fc;
        }

        .save-tag.saved {
          color: #86efac;
        }

        .save-tag.error {
          color: #fca5a5;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6366f1;
        }

        .pulse {
          animation: pulse 1s infinite alternate;
        }

        @keyframes pulse {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        .permission-badge {
          font-size: 0.675rem;
          font-weight: 600;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .permission-badge.owner {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
        }

        .permission-badge.edit {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
        }

        .permission-badge.view {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .doc-owner-info {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0.3rem 0.6rem;
          border-radius: 20px;
          font-size: 0.775rem;
          color: #cbd5e1;
        }

        .btn-share-trigger {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          border: none;
          padding: 0.55rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-share-trigger:hover {
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        .btn-delete-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-delete-trigger:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ffffff;
        }

        .sticky-toolbar-wrapper {
          position: sticky;
          top: 61px;
          z-index: 30;
          display: flex;
          justify-content: center;
          padding: 0.65rem 1rem;
          background: rgba(10, 10, 15, 0.6);
          backdrop-filter: blur(8px);
        }

        .editor-workspace {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem 4rem;
        }

        .read-only-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.25);
          color: #93c5fd;
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          max-width: 840px;
          width: 100%;
        }

        .editor-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.6rem 1.5rem;
          font-size: 0.75rem;
          color: #64748b;
          background: #0d0d14;
        }

        .footer-content {
          max-width: 840px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}
