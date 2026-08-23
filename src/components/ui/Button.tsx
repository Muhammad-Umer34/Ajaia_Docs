"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn-root ${variant} ${size} ${loading ? "loading" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : (
        icon && <span className="btn-icon">{icon}</span>
      )}
      <span className="btn-label">{children}</span>

      <style jsx>{`
        .btn-root {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: var(--font-ui);
          font-weight: 600;
          border-radius: var(--radius-md, 10px);
          cursor: pointer;
          transition: all var(--transition-base, 0.2s);
          outline: none;
          user-select: none;
          text-decoration: none;
        }

        /* Sizes */
        .btn-root.sm {
          padding: 0.45rem 0.85rem;
          font-size: 0.8rem;
        }

        .btn-root.md {
          padding: 0.65rem 1.25rem;
          font-size: 0.875rem;
        }

        .btn-root.lg {
          padding: 0.85rem 1.65rem;
          font-size: 1rem;
        }

        /* Variants */
        .btn-root.primary {
          background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6));
          color: #ffffff;
          border: none;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }

        .btn-root.primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .btn-root.secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f1f5f9;
        }

        .btn-root.secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .btn-root.ghost {
          background: transparent;
          border: 1px solid transparent;
          color: #94a3b8;
        }

        .btn-root.ghost:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
        }

        .btn-root.danger {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .btn-root.danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.25);
          border-color: rgba(239, 68, 68, 0.5);
          color: #ffffff;
        }

        .btn-root:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-spinner {
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

        .btn-icon {
          display: flex;
          align-items: center;
        }
      `}</style>
    </button>
  );
}
