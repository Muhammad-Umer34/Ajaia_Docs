import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ textAlign: "center", maxWidth: "600px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "1rem" }}>
          Ajaia Docs
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.125rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          A lightweight collaborative document editor with rich-text formatting, file imports, and seamless document sharing.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link
            href="/login"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go to Login
          </Link>
          <Link
            href="/dashboard"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#f1f5f9",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
