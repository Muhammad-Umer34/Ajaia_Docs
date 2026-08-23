"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Avatar from "@/components/ui/Avatar";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="header-container">
        <Link href="/dashboard" className="logo-link">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <span className="logo-text">Ajaia Docs</span>
        </Link>

        {session?.user && (
          <div className="user-profile-wrapper" ref={menuRef}>
            <button
              className="user-trigger-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="User menu"
            >
              <Avatar
                name={session.user.name}
                color={session.user.avatarColor}
                size="md"
              />
              <span className="user-name">{session.user.name}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="info-name">{session.user.name}</div>
                  <div className="info-email">{session.user.email}</div>
                </div>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item logout"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .app-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.75rem 1.5rem;
        }

        .header-container {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-link {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-decoration: none;
          color: inherit;
        }

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }

        .logo-text {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f8fafc;
        }

        .user-profile-wrapper {
          position: relative;
        }

        .user-trigger-btn {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.35rem 0.75rem 0.35rem 0.35rem;
          border-radius: 24px;
          color: #f1f5f9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-trigger-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 220px;
          background: #161622;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          animation: slideDown 0.15s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-user-info {
          padding: 0.5rem 0.75rem;
        }

        .info-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #f8fafc;
        }

        .info-email {
          font-size: 0.775rem;
          color: #94a3b8;
          word-break: break-all;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 0.4rem 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          padding: 0.55rem 0.75rem;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: #cbd5e1;
          font-size: 0.85rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .dropdown-item.logout {
          color: #fca5a5;
        }

        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.12);
        }
      `}</style>
    </header>
  );
}
