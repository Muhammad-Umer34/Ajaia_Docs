"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const DEMO_USERS = [
  { name: "Alice Johnson", email: "alice@ajaia.com", role: "Owner (Welcome Doc)", color: "#6366f1" },
  { name: "Bob Smith", email: "bob@ajaia.com", role: "Editor / Roadmap Owner", color: "#ec4899" },
  { name: "Charlie Brown", email: "charlie@ajaia.com", role: "Team Member", color: "#f59e0b" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="login-container">
      <div className="login-backdrop">
        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="logo-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h1>Ajaia Docs</h1>
          <p>Collaborative rich-text document workspace</p>
        </div>

        {error && (
          <div className="error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="alice@ajaia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-container">
                <span className="spinner" />
                Signing in...
              </span>
            ) : (
              "Sign In to Workspace"
            )}
          </button>
        </form>

        <div className="demo-accounts-section">
          <div className="divider">
            <span>Or select a demo reviewer account</span>
          </div>

          <div className="demo-users-list">
            {DEMO_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                className="demo-user-card"
                onClick={() => handleQuickLogin(user.email)}
              >
                <div
                  className="user-avatar"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-role">{user.role}</div>
                </div>
                <span className="fill-pill">Autofill</span>
              </button>
            ))}
          </div>
          <p className="demo-note">Default demo password for all accounts: <code>password123</code></p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          background: #0a0a0f;
          overflow: hidden;
        }

        .login-backdrop {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.25;
        }

        .orb-1 {
          top: -10%;
          left: 20%;
          width: 500px;
          height: 500px;
          background: #6366f1;
        }

        .orb-2 {
          bottom: -10%;
          right: 20%;
          width: 450px;
          height: 450px;
          background: #8b5cf6;
        }

        .login-card {
          width: 100%;
          max-width: 460px;
          background: rgba(18, 18, 26, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 2.25rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1);
          position: relative;
          z-index: 1;
        }

        .login-header {
          text-align: center;
          margin-bottom: 1.75rem;
        }

        .logo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          margin-bottom: 1rem;
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
        }

        .login-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          margin-bottom: 0.35rem;
        }

        .login-header p {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.825rem;
          font-weight: 500;
          color: #cbd5e1;
        }

        .form-group input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.925rem;
          color: #f8fafc;
          transition: all 0.2s;
          outline: none;
        }

        .form-group input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
          background: rgba(255, 255, 255, 0.07);
        }

        .submit-btn {
          margin-top: 0.5rem;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
          border: none;
          padding: 0.85rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .demo-accounts-section {
          margin-top: 1.75rem;
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 1rem;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .divider span {
          padding: 0 0.75rem;
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .demo-users-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .demo-user-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.85rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }

        .demo-user-card:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(99, 102, 241, 0.3);
          transform: translateY(-1px);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffffff;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #f1f5f9;
        }

        .user-role {
          font-size: 0.725rem;
          color: #94a3b8;
        }

        .fill-pill {
          font-size: 0.7rem;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          font-weight: 500;
        }

        .demo-note {
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.85rem;
        }

        .demo-note code {
          color: #a5b4fc;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.1rem 0.3rem;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
