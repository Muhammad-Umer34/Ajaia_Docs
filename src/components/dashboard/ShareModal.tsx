import { useState, useEffect, useCallback } from "react";
import Avatar from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { getWSClient } from "@/lib/ws-client";

interface ShareModalProps {
  isOpen: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

interface ShareItem {
  id: string;
  userId: string;
  permission: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
}

interface OwnerItem {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export default function ShareModal({
  isOpen,
  documentId,
  documentTitle,
  onClose,
}: ShareModalProps) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [owner, setOwner] = useState<OwnerItem | null>(null);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchShares = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}/share`);
      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
        setShares(data.shares || []);
      }
    } catch (err) {
      console.error("Failed to load shares:", err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen, fetchShares]);

  if (!isOpen) return null;

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), permission }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to share document");
      } else {
        toast.success(`Shared with ${email.trim()}`);
        setEmail("");
        fetchShares();

        // Broadcast permission change to connected clients
        try {
          const ws = getWSClient();
          ws.sendPermissionsUpdate();
        } catch (e) {}
      }
    } catch (err) {
      setError("Network error while sharing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (userId: string, userName: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share?userId=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShares((prev) => prev.filter((s) => s.userId !== userId));
        toast.info(`Revoked access for ${userName}`);

        // Broadcast permission change to connected clients
        try {
          const ws = getWSClient();
          ws.sendPermissionsUpdate();
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to revoke share:", err);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/document/${documentId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.info("Document link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-backdrop" onClick={onClose}>
      <div className="share-card" onClick={(e) => e.stopPropagation()}>
        <div className="share-header">
          <div className="title-group">
            <div className="share-badge-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div>
              <h2>Share Document</h2>
              <p className="doc-subtitle">"{documentTitle}"</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="share-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Invite Form */}
        <form onSubmit={handleShareSubmit} className="invite-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter teammate email (e.g. bob@ajaia.com)..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "edit" | "view")}
              className="perm-select"
            >
              <option value="edit">Can edit</option>
              <option value="view">Can view</option>
            </select>
          </div>

          <button type="submit" className="btn-share-submit" disabled={isSubmitting || !email.trim()}>
            {isSubmitting ? "Inviting..." : "Share"}
          </button>
        </form>

        {/* Collaborators List */}
        <div className="access-list-section">
          <div className="section-label">People with access</div>

          {loading ? (
            <div className="loading-shares">Loading access list...</div>
          ) : (
            <div className="members-list">
              {/* Owner */}
              {owner && (
                <div className="member-row">
                  <Avatar name={owner.name} color={owner.avatarColor} size="md" />
                  <div className="member-info">
                    <div className="member-name">{owner.name} (You)</div>
                    <div className="member-email">{owner.email}</div>
                  </div>
                  <span className="owner-tag">Owner</span>
                </div>
              )}

              {/* Shared Members */}
              {shares.map((item) => (
                <div key={item.id} className="member-row">
                  <Avatar name={item.user.name} color={item.user.avatarColor} size="md" />
                  <div className="member-info">
                    <div className="member-name">{item.user.name}</div>
                    <div className="member-email">{item.user.email}</div>
                  </div>
                  <div className="member-action-right">
                    <span className={`perm-label ${item.permission}`}>
                      {item.permission === "edit" ? "Can edit" : "Can view"}
                    </span>
                    <button
                      type="button"
                      className="btn-revoke"
                      onClick={() => handleRevoke(item.userId, item.user.name)}
                      title="Revoke access"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {shares.length === 0 && (
                <div className="no-shares-hint">
                  No other collaborators yet. Add an email above to share.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer & Copy Link */}
        <div className="modal-footer-row">
          <button className="btn-copy-link" onClick={handleCopyLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{copied ? "Link Copied! ✓" : "Copy Document Link"}</span>
          </button>

          <button className="btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        .share-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .share-card {
          width: 100%;
          max-width: 500px;
          background: #14141e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.15);
          animation: scaleUp 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .share-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .share-badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
        }

        .title-group h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .doc-subtitle {
          font-size: 0.8rem;
          color: #94a3b8;
          max-width: 320px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .btn-close:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }

        .share-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.65rem 0.85rem;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .invite-form {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .input-group {
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.35rem 0.65rem;
          transition: all 0.2s;
        }

        .input-group:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .input-group input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          font-size: 0.875rem;
          min-width: 0;
        }

        .perm-select {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          border-radius: 6px;
          padding: 0.3rem 0.5rem;
          font-size: 0.775rem;
          outline: none;
          cursor: pointer;
        }

        .btn-share-submit {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          border: none;
          padding: 0 1.25rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-share-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        .btn-share-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .access-list-section {
          margin-bottom: 1.5rem;
        }

        .section-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          max-height: 220px;
          overflow-y: auto;
        }

        .member-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.65rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .member-info {
          flex: 1;
          min-width: 0;
        }

        .member-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #f1f5f9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-email {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .owner-tag {
          font-size: 0.725rem;
          font-weight: 600;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.15);
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
        }

        .member-action-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .perm-label {
          font-size: 0.725rem;
          font-weight: 600;
          padding: 0.2rem 0.55rem;
          border-radius: 6px;
        }

        .perm-label.edit {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
        }

        .perm-label.view {
          background: rgba(59, 130, 246, 0.15);
          color: #93c5fd;
        }

        .btn-revoke {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
        }

        .btn-revoke:hover {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.15);
        }

        .no-shares-hint {
          font-size: 0.825rem;
          color: #64748b;
          text-align: center;
          padding: 1rem;
        }

        .loading-shares {
          font-size: 0.825rem;
          color: #94a3b8;
          text-align: center;
          padding: 1rem;
        }

        .modal-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-copy-link {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 0.55rem 0.9rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-copy-link:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .btn-done {
          background: #6366f1;
          color: #ffffff;
          border: none;
          padding: 0.55rem 1.25rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-done:hover {
          background: #4f46e5;
        }
      `}</style>
    </div>
  );
}
