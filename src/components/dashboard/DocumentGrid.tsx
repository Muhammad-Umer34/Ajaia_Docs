"use client";

import { useState, useMemo } from "react";
import DocumentCard from "./DocumentCard";

interface DocumentItem {
  id: string;
  title: string;
  content: any;
  updatedAt: string;
  permission?: string;
  owner?: {
    name: string;
    avatarColor: string;
  };
}

interface DocumentGridProps {
  ownedDocs: DocumentItem[];
  sharedDocs: DocumentItem[];
  onCreateNew: () => void;
  onOpenUpload: () => void;
  onRename: (id: string, newTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onShare: (id: string) => void;
  isCreating?: boolean;
}

export default function DocumentGrid({
  ownedDocs,
  sharedDocs,
  onCreateNew,
  onOpenUpload,
  onRename,
  onDelete,
  onShare,
  isCreating = false,
}: DocumentGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOwned = useMemo(() => {
    if (!searchQuery.trim()) return ownedDocs;
    return ownedDocs.filter((doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [ownedDocs, searchQuery]);

  const filteredShared = useMemo(() => {
    if (!searchQuery.trim()) return sharedDocs;
    return sharedDocs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        doc.owner?.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [sharedDocs, searchQuery]);

  return (
    <div className="grid-wrapper">
      {/* Action Bar */}
      <div className="action-bar">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search documents by title or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        <div className="buttons-group">
          <button className="btn-upload" onClick={onOpenUpload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Import File</span>
          </button>

          <button className="btn-create" onClick={onCreateNew} disabled={isCreating}>
            {isCreating ? (
              <span className="spinner-sm" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            <span>New Document</span>
          </button>
        </div>
      </div>

      {/* Section 1: My Documents */}
      <section className="doc-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h2>My Documents</h2>
            <span className="count-pill">{filteredOwned.length}</span>
          </div>
        </div>

        {filteredOwned.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>{searchQuery ? "No matching documents found" : "No documents created yet"}</h3>
            <p>
              {searchQuery
                ? "Try searching for a different keyword or clear the search bar."
                : "Create your first document or import a file from your computer."}
            </p>
            {!searchQuery && (
              <button className="empty-action-btn" onClick={onCreateNew}>
                + Create Document
              </button>
            )}
          </div>
        ) : (
          <div className="cards-grid">
            {filteredOwned.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                content={doc.content}
                updatedAt={doc.updatedAt}
                isOwner={true}
                onRename={onRename}
                onDelete={onDelete}
                onShare={onShare}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Shared with Me */}
      <section className="doc-section shared-section">
        <div className="section-header">
          <div className="section-title-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2>Shared with Me</h2>
            <span className="count-pill shared-pill">{filteredShared.length}</span>
          </div>
        </div>

        {filteredShared.length === 0 ? (
          <div className="empty-state minimal">
            <div className="empty-icon">🔗</div>
            <h3>{searchQuery ? "No shared documents match your search" : "No shared documents yet"}</h3>
            <p>Documents shared with you by teammates will appear here in real-time.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {filteredShared.map((doc) => (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                content={doc.content}
                updatedAt={doc.updatedAt}
                isOwner={false}
                permission={doc.permission}
                owner={doc.owner}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .grid-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.65rem 1rem;
          color: #94a3b8;
          flex: 1;
          min-width: 260px;
          max-width: 480px;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
          background: rgba(255, 255, 255, 0.07);
        }

        .search-box input {
          background: transparent;
          border: none;
          outline: none;
          color: #f1f5f9;
          font-size: 0.9rem;
          width: 100%;
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 0.2rem;
        }

        .buttons-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-upload {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.65rem 1.1rem;
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-upload:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .btn-create {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }

        .btn-create:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .btn-create:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-sm {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .doc-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .section-title-wrap h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.01em;
        }

        .count-pill {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.15rem 0.55rem;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
        }

        .count-pill.shared-pill {
          background: rgba(139, 92, 246, 0.15);
          color: #c4b5fd;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }

        .empty-state {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 3rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .empty-state.minimal {
          padding: 2rem 1.5rem;
        }

        .empty-icon {
          font-size: 2rem;
          margin-bottom: 0.25rem;
        }

        .empty-state h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: #e2e8f0;
        }

        .empty-state p {
          color: #94a3b8;
          font-size: 0.875rem;
          max-width: 420px;
        }

        .empty-action-btn {
          margin-top: 0.75rem;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #a5b4fc;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .empty-action-btn:hover {
          background: rgba(99, 102, 241, 0.25);
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
