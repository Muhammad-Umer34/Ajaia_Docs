"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["txt", "md", "docx"].includes(ext)) {
      setError("Please select a supported file (.txt, .md, or .docx)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB maximum size limit.");
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to upload file");
        setIsUploading(false);
      } else {
        toast.success(`Imported "${data.title}" successfully`);
        onClose();
        router.push(`/document/${data.documentId}`);
      }
    } catch (err) {
      setError("Network error occurred during upload. Please try again.");
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="upload-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h2>Import Document</h2>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className="modal-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div
          className={`dropzone ${isDragging ? "dragging" : ""} ${selectedFile ? "has-file" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {selectedFile ? (
            <div className="selected-file-info">
              <div className="file-type-badge">
                {selectedFile.name.split(".").pop()?.toUpperCase()}
              </div>
              <div className="file-details">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{formatFileSize(selectedFile.size)}</div>
              </div>
              <button
                type="button"
                className="btn-remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="dropzone-prompt">
              <div className="cloud-icon">☁️</div>
              <div className="drop-title">Click to browse or drag file here</div>
              <div className="drop-desc">Automatically parses formatting and creates an editable document</div>
            </div>
          )}
        </div>

        <div className="format-badges">
          <span className="badge">.txt</span>
          <span className="badge">.md</span>
          <span className="badge">.docx</span>
          <span className="max-size-hint">Max file size: 5MB</span>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button
            className="btn-submit"
            onClick={handleUploadSubmit}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <span className="uploading-state">
                <span className="spinner" />
                Converting & Importing...
              </span>
            ) : (
              "Import & Open in Editor"
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
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

        .modal-card {
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

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .upload-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
        }

        .modal-title-wrap h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
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

        .modal-error {
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

        .dropzone {
          border: 2px dashed rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 2.25rem 1.5rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
          transition: all 0.2s;
        }

        .dropzone:hover,
        .dropzone.dragging {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
        }

        .dropzone.has-file {
          border-style: solid;
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(99, 102, 241, 0.08);
          padding: 1.25rem;
        }

        .cloud-icon {
          font-size: 2.2rem;
          margin-bottom: 0.5rem;
        }

        .drop-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 0.25rem;
        }

        .drop-desc {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        .selected-file-info {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          text-align: left;
        }

        .file-type-badge {
          background: #6366f1;
          color: #ffffff;
          padding: 0.5rem 0.65rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .file-details {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 0.775rem;
          color: #94a3b8;
        }

        .btn-remove-file {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #cbd5e1;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-remove-file:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        .format-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          margin-bottom: 1.5rem;
        }

        .badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #a5b4fc;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .max-size-hint {
          margin-left: auto;
          font-size: 0.75rem;
          color: #64748b;
        }

        .modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
        }

        .btn-submit {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          border: none;
          padding: 0.65rem 1.35rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.45);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .uploading-state {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
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
      `}</style>
    </div>
  );
}
