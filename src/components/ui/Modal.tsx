"use client";

import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "520px",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-root" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-box-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal-box-body">{children}</div>
      </div>

      <style jsx>{`
        .modal-overlay-root {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 150;
          padding: 1.25rem;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-box {
          width: 100%;
          background: #14141e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-xl, 20px);
          padding: 1.75rem;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6), 0 0 32px rgba(99, 102, 241, 0.12);
          animation: modalScaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-box-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f8fafc;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .modal-close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
