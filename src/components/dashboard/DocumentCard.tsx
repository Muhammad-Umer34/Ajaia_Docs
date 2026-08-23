"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, extractTextSnippet } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";

interface DocumentCardProps {
  id: string;
  title: string;
  content: any;
  updatedAt: string;
  isOwner: boolean;
  permission?: string;
  owner?: {
    name: string;
    avatarColor: string;
  };
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShare?: (id: string) => void;
}

export default function DocumentCard({
  id,
  title,
  content,
  updatedAt,
  isOwner,
  permission = "owner",
  owner,
  onRename,
  onDelete,
  onShare,
}: DocumentCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const snippet = extractTextSnippet(content);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleSaveRename = async () => {
    if (renameValue.trim() && renameValue.trim() !== title) {
      await onRename(id, renameValue.trim());
    } else {
      setRenameValue(title);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setRenameValue(title);
      setIsRenaming(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);

    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className={`doc-card ${!isOwner ? "shared-card" : ""}`}>
      {/* Header with Icon and Options Menu (Outside Link) */}
      <div className="card-header">
        <Link href={`/document/${id}`} className="doc-icon-link">
          <div className="doc-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
        </Link>

        <div className="card-menu-wrapper" ref={menuRef}>
          <button
            type="button"
            className="menu-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {menuOpen && (
            <div className="card-menu">
              {isOwner && (
                <button
                  type="button"
                  className="menu-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    setIsRenaming(true);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename
                </button>
              )}

              {isOwner && onShare && (
                <button
                  type="button"
                  className="menu-item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onShare(id);
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              )}

              {isOwner && (
                <button
                  type="button"
                  className="menu-item delete"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              )}

              {!isOwner && (
                <div className="menu-info">Shared with you ({permission === "edit" ? "Can Edit" : "View Only"})</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Clickable Card Body & Footer */}
      {isRenaming ? (
        <div className="rename-input-container">
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={handleKeyDown}
            className="rename-input"
          />
        </div>
      ) : (
        <Link href={`/document/${id}`} className="card-link">
          <div className="card-body">
            <h3 className="doc-title" title={title}>
              {title}
            </h3>
            <p className="doc-snippet">{snippet}</p>
          </div>

          <div className="card-footer">
            {isOwner ? (
              <>
                <span className="time-badge" suppressHydrationWarning>{formatDate(updatedAt)}</span>
                <span className="owner-status-tag">Owner</span>
              </>
            ) : (
              <>
                {owner ? (
                  <div className="owner-badge">
                    <Avatar name={owner.name} color={owner.avatarColor} size="sm" />
                    <span className="owner-name">{owner.name}</span>
                  </div>
                ) : (
                  <span className="time-badge" suppressHydrationWarning>{formatDate(updatedAt)}</span>
                )}

                <span className={`perm-tag ${permission}`}>
                  {permission === "edit" ? "Can Edit" : "View Only"}
                </span>
              </>
            )}
          </div>
        </Link>
      )}

      <style jsx>{`
        .doc-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 1.25rem;
        }

        .doc-card:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(99, 102, 241, 0.35);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.15);
        }

        .shared-card {
          border-left: 3px solid #8b5cf6;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.85rem;
        }

        .doc-icon-link {
          text-decoration: none;
        }

        .doc-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
          transition: background 0.2s;
        }

        .doc-icon:hover {
          background: rgba(99, 102, 241, 0.25);
        }

        .card-menu-wrapper {
          position: relative;
        }

        .menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.15s;
        }

        .menu-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
        }

        .card-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          width: 140px;
          background: #181824;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.4rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          z-index: 20;
          animation: menuFade 0.15s ease;
        }

        @keyframes menuFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.65rem;
          border-radius: 6px;
          background: transparent;
          border: none;
          color: #cbd5e1;
          font-size: 0.8rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }

        .menu-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
        }

        .menu-item.delete {
          color: #fca5a5;
        }

        .menu-item.delete:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        .menu-info {
          font-size: 0.725rem;
          color: #94a3b8;
          padding: 0.4rem;
          text-align: center;
        }

        .card-link {
          display: flex;
          flex-direction: column;
          flex: 1;
          text-decoration: none;
          color: inherit;
        }

        .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-bottom: 1.15rem;
        }

        .doc-title {
          font-size: 1.05rem;
          font-weight: 600;
          color: #f8fafc;
          margin-bottom: 0.45rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rename-input-container {
          margin-bottom: 0.45rem;
          padding: 0.5rem 0;
        }

        .rename-input {
          width: 100%;
          background: #1e1e2d;
          border: 1px solid #6366f1;
          color: #ffffff;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          outline: none;
        }

        .doc-snippet {
          font-size: 0.825rem;
          color: #94a3b8;
          line-height: 1.5;
          min-height: 2.5em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.85rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.775rem;
          min-height: 38px;
          margin-top: auto;
        }

        .time-badge {
          color: #64748b;
          font-weight: 500;
        }

        .owner-status-tag {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.12);
          color: #a5b4fc;
        }

        .owner-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .owner-name {
          color: #cbd5e1;
          font-weight: 500;
          max-width: 110px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .perm-tag {
          font-size: 0.7rem;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
          font-weight: 600;
        }

        .perm-tag.edit {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
        }

        .perm-tag.view {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }
      `}</style>
    </div>
  );
}
