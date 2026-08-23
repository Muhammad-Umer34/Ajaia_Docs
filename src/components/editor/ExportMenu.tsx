"use client";

import { useState, useRef, useEffect } from "react";
import {
  exportDocumentToMarkdown,
  exportDocumentToText,
  exportDocumentToPDF,
} from "@/lib/export";
import { useToast } from "@/components/ui/Toast";

interface ExportMenuProps {
  title: string;
  getContent: () => any;
}

export default function ExportMenu({ title, getContent }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleExportMarkdown = () => {
    try {
      const content = getContent();
      exportDocumentToMarkdown(title, content);
      toast.success("Exported as Markdown (.md)");
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to export Markdown");
    }
  };

  const handleExportText = () => {
    try {
      const content = getContent();
      exportDocumentToText(title, content);
      toast.success("Exported as Plain Text (.txt)");
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to export Plain Text");
    }
  };

  const handleExportPDF = () => {
    try {
      setIsOpen(false);
      toast.info("Preparing PDF print dialog...");
      setTimeout(() => {
        exportDocumentToPDF(title);
      }, 200);
    } catch (e) {
      toast.error("Failed to prepare PDF");
    }
  };

  return (
    <div className="export-menu-wrapper" ref={menuRef}>
      <button
        type="button"
        className="btn-export-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Export or download document"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="export-dropdown">
          <div className="dropdown-header">Export Format</div>

          <button
            type="button"
            className="dropdown-item"
            onClick={handleExportMarkdown}
          >
            <span className="item-icon">📄</span>
            <div className="item-details">
              <span className="item-title">Markdown</span>
              <span className="item-desc">.md formatted file</span>
            </div>
          </button>

          <button
            type="button"
            className="dropdown-item"
            onClick={handleExportText}
          >
            <span className="item-icon">📝</span>
            <div className="item-details">
              <span className="item-title">Plain Text</span>
              <span className="item-desc">.txt raw text file</span>
            </div>
          </button>

          <button
            type="button"
            className="dropdown-item"
            onClick={handleExportPDF}
          >
            <span className="item-icon">📑</span>
            <div className="item-details">
              <span className="item-title">PDF Document</span>
              <span className="item-desc">Print-to-PDF layout</span>
            </div>
          </button>
        </div>
      )}

      <style jsx>{`
        .export-menu-wrapper {
          position: relative;
        }

        .btn-export-trigger {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 0.55rem 0.95rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-export-trigger:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .export-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: #14141e;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 0.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          z-index: 50;
          animation: slideDown 0.15s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.4rem 0.6rem 0.3rem;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.5rem 0.6rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .item-icon {
          font-size: 1.1rem;
        }

        .item-details {
          display: flex;
          flex-direction: column;
        }

        .item-title {
          font-size: 0.825rem;
          font-weight: 600;
          color: #f1f5f9;
        }

        .item-desc {
          font-size: 0.7rem;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
