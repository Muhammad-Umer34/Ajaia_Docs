# Architecture & Engineering Note: Ajaia Docs

## 1. Executive Summary

Ajaia Docs is built as a focused, high-fidelity collaborative document editor designed to move teams faster on shared documentation. The architecture prioritizes **clarity of boundary**, **durable persistence**, **rich user experience**, and **bulletproof access control** within the timebox constraints of the assignment.

---

## 2. What We Prioritized and Why

| Area | Decision | Strategic Rationale |
|---|---|---|
| **Editor Foundation** | TipTap (ProseMirror AST) | TipTap provides an extensible ProseMirror engine without forcing bloated UI components. Storing content natively as structured JSON preserves the full document tree without brittle HTML sanitization or serialization overhead. |
| **Durable Persistence** | PostgreSQL via Neon Serverless | SQLite files on ephemeral serverless platforms (like Vercel) lose data upon function recycling. Using managed serverless PostgreSQL guarantees persistence across cold starts, concurrent connections, and deployments. |
| **Multi-Format File Ingestion** | Custom Markdown & Plain Text Lexers + Mammoth DOCX Engine | Instead of treating uploads as detached static attachments, we built ingestion pipelines that convert `.txt`, `.md`, and `.docx` files directly into editable ProseMirror document trees. |
| **Sharing & RBAC Model** | Relational Junction with Enum Permissions (`owner`, `edit`, `view`) | Rather than mocking access control in memory, we built full server-side authorization checks on all mutating API routes, coupled with conditional UI state rendering (disabled toolbar, view-only banner). |
| **Reviewer Experience** | 1-Click Seeded Demo Authentication | Pre-seeding Alice, Bob, and Charlie accounts eliminates the friction of OAuth configurations or manual sign-ups during evaluation. |

---

## 3. Real-Time Synchronization & Deployment Architecture

To achieve both **instant real-time collaboration** and **100% serverless deployment compatibility (e.g. on Vercel)**, we engineered a **resilient hybrid synchronization pipeline**:

```
                              ┌───────────────────────────────────────────────┐
                              │           Client (Document Editor)            │
                              └───────┬───────────────────────────────┬───────┘
                                      │                               │
                      WebSocket OPEN? │ YES                           │ NO (e.g. Vercel Serverless)
                                      ▼                               ▼
                 ┌───────────────────────────────┐   ┌───────────────────────────────┐
                 │  ws:// Persistent Connection  │   │   Adaptive Serverless Poll    │
                 │  - Instant keystroke sync     │   │   - Idle 2.0s cooldown check  │
                 │  - Instant live title updates │   │   - Active typing suppression │
                 │  - Instant permission lock    │   │   - In-flight save coalescing │
                 └───────────────┬───────────────┘   └───────────────┬───────────────┘
                                 │                                   │
                                 ▼                                   ▼
                 ┌───────────────────────────────┐   ┌───────────────────────────────┐
                 │  server.ts (Node Container)   │   │  Next.js 15 Serverless APIs   │
                 └───────────────┬───────────────┘   └───────────────┬───────────────┘
                                 │                                   │
                                 └─────────────────┬─────────────────┘
                                                   ▼
                                 ┌───────────────────────────────────┐
                                 │   Neon PostgreSQL (Durable DB)    │
                                 └───────────────────────────────────┘
```

1. **Stateful Container Environments (Local, Render, Railway, Docker)**:
   - [`server.ts`](file:///d:/AAJIA/server.ts) mounts a native `ws` WebSocket server on port 3000 alongside Next.js.
   - Connected clients join document rooms (`joinRoom(docId)`) and stream live edits, titles, and permission changes directly between users with near-zero latency.
2. **Serverless Platforms (Vercel)**:
   - When deployed to serverless environments where persistent stateful TCP sockets are terminated, the client automatically detects `!ws.isConnected` and switches to **Adaptive Cooldown Polling** (2.0s interval when idle).
   - This prevents connection stampedes on Neon PostgreSQL while ensuring that viewers and editors receive updates automatically without manual page refreshes.

---

## 4. Data Architecture & Relational Schema

```
┌─────────────────────────────────────────────────────────────┐
│                           User                              │
├─────────────────────────────────────────────────────────────┤
│ id: String (cuid)                                           │
│ name: String                                                │
│ email: String (unique)                                      │
│ passwordHash: String                                        │
│ avatarColor: String (UI token)                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1:N
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         Document                            │
├─────────────────────────────────────────────────────────────┤
│ id: String (cuid)                                           │
│ title: String                                               │
│ content: Json (ProseMirror AST Node Tree)                   │
│ ownerId: String (FK -> User)                                │
│ createdAt / updatedAt: DateTime                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1:N (Cascade Delete)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      DocumentShare                          │
├─────────────────────────────────────────────────────────────┤
│ id: String (cuid)                                           │
│ documentId: String (FK -> Document)                         │
│ userId: String (FK -> User)                                 │
│ permission: String ("edit" | "view")                        │
│ @@unique([documentId, userId])                              │
└─────────────────────────────────────────────────────────────┘
```

### Relational Integrity Highlights
- **`@@unique([documentId, userId])`**: Guarantees a document cannot have duplicate share records for the same user.
- **`onDelete: Cascade`**: Automatically purges document shares when a document or user is deleted, preventing orphan rows.
- **JSON Field Serialization**: Preserves ProseMirror formatting, heading levels, and lists natively without converting between strings and DOM nodes.

---

## 5. Security & Access Control Enforcement

Access control is enforced at both the API and client presentation layers:

1. **Authentication Guard (`src/middleware.ts`)**:
   - Inspects JWT session cookies at the edge.
   - Redirects unauthenticated traffic attempting to access `/dashboard` or `/document/*` directly to `/login`.
2. **API Route Authorization**:
   - `PATCH /api/documents/[id]`: Rejects edits from users who are neither the owner nor possess `permission: "edit"`.
   - `DELETE /api/documents/[id]`: Strictly restricted to `ownerId === session.user.id`.
   - `GET / POST / DELETE /api/documents/[id]/share`: Restricted exclusively to the document owner.
3. **UI Enforcement**:
   - Users with `view` permission receive a read-only TipTap instance (`editable={false}`) with a disabled toolbar and informative alert banners.

---

## 6. What We Would Build Next (2-4 Additional Hours)

If allocated additional engineering time, the immediate next roadmap priorities would be:
1. **Real-Time Collaboration Engine**: Integrate `@tiptap/extension-collaboration` with a Yjs WebSocket provider for live multi-user cursor presence.
2. **Full-Text Document Search**: Leverage PostgreSQL `to_tsvector` and `to_tsquery` to provide instant search across document content bodies in addition to titles.
3. **Document Version History**: Append immutable change snapshots into a `DocumentVersion` table with a rollback interface.
4. **Markdown / PDF Export**: Client-side document export to `.md` and formatted PDF via `@react-pdf/renderer`.
