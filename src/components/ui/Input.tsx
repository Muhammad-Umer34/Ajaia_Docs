"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`input-wrapper ${error ? "has-error" : ""} ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}

      <div className="input-field-box">
        {icon && <span className="input-icon">{icon}</span>}
        <input id={inputId} className="input-element" {...props} />
      </div>

      {error && <span className="input-error-msg">{error}</span>}

      <style jsx>{`
        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          width: 100%;
        }

        .input-label {
          font-size: 0.825rem;
          font-weight: 500;
          color: #cbd5e1;
        }

        .input-field-box {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md, 10px);
          padding: 0.65rem 0.85rem;
          transition: all 0.2s;
        }

        .input-field-box:focus-within {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          background: rgba(255, 255, 255, 0.07);
        }

        .has-error .input-field-box {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        .input-icon {
          display: flex;
          align-items: center;
          margin-right: 0.5rem;
          color: #94a3b8;
        }

        .input-element {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #f8fafc;
          font-size: 0.9rem;
          font-family: inherit;
          min-width: 0;
        }

        .input-element::placeholder {
          color: #64748b;
        }

        .input-error-msg {
          font-size: 0.775rem;
          color: #fca5a5;
        }
      `}</style>
    </div>
  );
}
