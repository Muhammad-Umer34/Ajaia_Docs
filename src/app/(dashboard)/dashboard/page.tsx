"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DocumentGrid from "@/components/dashboard/DocumentGrid";
import UploadModal from "@/components/dashboard/UploadModal";
import ShareModal from "@/components/dashboard/ShareModal";
import { useToast } from "@/components/ui/Toast";

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

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [ownedDocs, setOwnedDocs] = useState<DocumentItem[]>([]);
  const [sharedDocs, setSharedDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeShareDoc, setActiveShareDoc] = useState<{ id: string; title: string } | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setOwnedDocs(data.owned || []);
        setSharedDocs(data.shared || []);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Document" }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        toast.success("Document created");
        router.push(`/document/${newDoc.id}`);
      }
    } catch (err) {
      toast.error("Failed to create document");
      setIsCreating(false);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        setOwnedDocs((prev) =>
          prev.map((d) => (d.id === id ? { ...d, title: newTitle, updatedAt: new Date().toISOString() } : d))
        );
        toast.success(`Renamed to "${newTitle}"`);
      } else {
        toast.error("Failed to rename document");
      }
    } catch (err) {
      toast.error("Failed to rename document");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOwnedDocs((prev) => prev.filter((d) => d.id !== id));
        toast.success("Document deleted");
      } else {
        toast.error("Failed to delete document");
      }
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const handleOpenShare = (id: string) => {
    const doc = ownedDocs.find((d) => d.id === id);
    if (doc) {
      setActiveShareDoc({ id: doc.id, title: doc.title });
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="skeleton-header" />
        <div className="skeleton-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>

        <style jsx>{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }
          .skeleton-header {
            height: 48px;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 12px;
            animation: pulse 1.5s infinite;
          }
          .skeleton-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.25rem;
          }
          .skeleton-card {
            height: 180px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            animation: pulse 1.5s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <DocumentGrid
        ownedDocs={ownedDocs}
        sharedDocs={sharedDocs}
        onCreateNew={handleCreateNew}
        onOpenUpload={() => setIsUploadOpen(true)}
        onRename={handleRename}
        onDelete={handleDelete}
        onShare={handleOpenShare}
        isCreating={isCreating}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      {activeShareDoc && (
        <ShareModal
          isOpen={!!activeShareDoc}
          documentId={activeShareDoc.id}
          documentTitle={activeShareDoc.title}
          onClose={() => setActiveShareDoc(null)}
        />
      )}
    </>
  );
}
