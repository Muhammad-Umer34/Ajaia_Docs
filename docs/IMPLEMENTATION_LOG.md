# Ajaia Docs — Live Implementation Log & Engineering Notes

This document provides a detailed, step-by-step engineering journal of how Ajaia Docs is constructed across each phase, including architecture decisions, security patterns, data schemas, and API contracts.

---

## 📋 Table of Contents
1. [Phase 1: Project Setup & Neon Database Engine](#phase-1-project-setup--neon-database-engine)
2. [Phase 2: NextAuth v5 Authentication & Route Protection](#phase-2-nextauth-v5-authentication--route-protection)
3. [Phase 3: Document CRUD & TipTap Rich-Text Editor](#phase-3-document-crud--tiptap-rich-text-editor)
4. [Phase 4: Multi-Format File Import Engine](#phase-4-multi-format-file-import-engine)
5. [Phase 5: Granular Sharing & Access Control](#phase-5-granular-sharing--access-control)
6. [Phase 6: Design System & Micro-Interactions](#phase-6-design-system--micro-interactions)
7. [Phase 7: Automated Testing & Verification](#phase-7-automated-testing--verification)

---

## Phase 1: Project Setup & Neon Database Engine

### 1.1 Technology Choices & Rationale
- **Next.js 15 (App Router)**: Leveraged for React Server Components, server-side data fetching, and API routes within a single deployable repository.
- **TypeScript**: Strict type checking across the entire full-stack boundary.
- **Neon Serverless PostgreSQL**: Provides durable, scalable relational storage without the cold-start and ephemeral disk limitations of SQLite on serverless hosts (such as Vercel).
- **Prisma ORM**: Type-safe query builder and automatic migration engine.

### 1.2 Database Schema (`prisma/schema.prisma`)
```prisma
model User {
  id            String     @id @default(cuid())
  name          String
  email         String     @unique
  passwordHash  String
  avatarColor   String     @default("#6366f1")
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  ownedDocuments  Document[]      @relation("DocumentOwner")
  sharedDocuments DocumentShare[] @relation("SharedWith")
  @@map("users")
}

model Document {
  id        String   @id @default(cuid())
  title     String   @default("Untitled Document")
  content   Json?    // Native TipTap ProseMirror document tree
  ownerId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner  User            @relation("DocumentOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  shares DocumentShare[]
  @@index([ownerId])
  @@map("documents")
}

model DocumentShare {
  id          String   @id @default(cuid())
  documentId  String
  userId      String
  permission  String   @default("view") // "view" | "edit"
  createdAt   DateTime @default(now())

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user     User     @relation("SharedWith", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([documentId, userId])
  @@index([userId])
  @@map("document_shares")
}
```

### 1.3 Key Architectural Decisions
- **`content` stored as native `Json`**: ProseMirror / TipTap represent rich text as an abstract syntax tree (AST) JSON structure. Storing JSON directly avoids serialization bugs, maintains node metadata, and allows future schema expansions (like embedded mentions or tables).
- **Prisma Client Singleton (`src/lib/prisma.ts`)**: In Next.js development mode, hot module reloading (HMR) can exhaust database connection pools. Attaching the Prisma client to `globalThis` ensures only one connection pool exists.

---

## Phase 2: NextAuth v5 Authentication & Route Protection

### 2.1 Edge Runtime vs. Node Runtime Architecture
Next.js middleware executes in the Edge Runtime (which lacks native Node modules like `crypto` or `setImmediate` used by `bcryptjs`). 

To resolve this cleanly:
- **`src/lib/auth.config.ts`**: Contains Edge-safe configuration (JWT callbacks, session validation, route authorization logic).
- **`src/middleware.ts`**: Consumes `authConfig` at the edge to inspect JWT session tokens and protect routes without importing heavy database or crypto packages.
- **`src/lib/auth.ts`**: Extends `authConfig` with the Node-based `CredentialsProvider` and `bcrypt.compare` database verification.

### 2.2 Seeded Accounts for Frictionless Evaluation
The database is seeded with 3 distinct accounts (password: `password123`):
1. `alice@ajaia.com`: Primary document owner.
2. `bob@ajaia.com`: Collaborator with edit access on Alice's doc and owner of a roadmap doc.
3. `charlie@ajaia.com`: General workspace member for testing access control.

The login page (`src/app/(auth)/login/page.tsx`) includes 1-click quick autofill buttons so reviewers can instantly test permission boundaries without manual typing.

---

## Phase 3: Document CRUD & TipTap Rich-Text Editor

### 3.1 Document CRUD API Layer
- **`GET /api/documents`**:
  - Automatically queries documents where `ownerId === session.user.id`.
  - Queries `DocumentShare` table to retrieve documents shared with the user, along with the owner's profile metadata (`name`, `avatarColor`).
  - Returns clean categorized payload `{ owned: Document[], shared: Document[] }`.
- **`POST /api/documents`**:
  - Creates a new document assigned to the authenticated user with a default title (`"Untitled Document"`) and ProseMirror document template.
- **`GET /api/documents/[id]`**:
  - Resolves document and computes permission tier (`owner` | `edit` | `view`).
  - Rejects unauthorized users with `403 Access Denied`.
- **`PATCH /api/documents/[id]`**:
  - Validates that the caller is the owner or holds `edit` permission before updating `title` or `content`.
- **`DELETE /api/documents/[id]`**:
  - Restricts deletion exclusively to the document owner. Cascades deletion of all share records in PostgreSQL.

### 3.2 TipTap Editor Architecture & Auto-Save
- **Extensions Stack**:
  - `@tiptap/starter-kit`: Core ProseMirror nodes (Paragraphs, Headings 1-3, Bullet Lists, Numbered Lists, Blockquotes, Code Blocks, History / Undo-Redo).
  - `@tiptap/extension-underline`: Underline mark support.
  - `@tiptap/extension-placeholder`: Dynamic placeholder for empty states.
- **Debounced Auto-Save Engine**:
  - Changes in the editor trigger a debounced `PATCH` request (1,500ms debounce delay).
  - Visual status pill communicates save lifecycle states:
    - `saving`: Displays animated pulse dot with *"Saving..."*
    - `saved`: Displays green checkmark with *"✓ Saved"*
    - `error`: Displays warning state with *"⚠ Error saving"*
    - `idle`: Displays *"Last updated [relative timestamp]"*
- **Role-Based UI Rendering**:
  - For users with `view` permission: Editor is toggled to `editable={false}`, the formatting toolbar is disabled, and an informative *"View Only Access"* banner is rendered.

### 3.3 Dashboard Experience (`/dashboard`)
- **Card-Based Visual Distinction**:
  - Owned documents display clean time badges and full 3-dot menus (Rename, Share, Delete).
  - Shared documents feature a distinctive violet accent border, the owner's Avatar & name, and a permission tag (`Can Edit` vs `View Only`).
- **Live Search Filtering**:
  - Client-side real-time filter across document titles and owner names.
- **Micro-Interactions**:
  - Glassmorphic card elevation on hover with accent glow.
  - Inline title renaming with `Enter` / `Escape` keyboard shortcuts.

---

## Phase 4: Multi-Format File Import Engine

### 4.1 File Parsers Architecture (`src/lib/parsers/`)
- **Plain Text (`txt-parser.ts`)**:
  - Splits input streams by line breaks, sanitizes empty whitespace lines, and constructs an array of ProseMirror `paragraph` nodes.
- **Markdown (`md-parser.ts`)**:
  - Implements a resilient regex-based lexical tokenizer converting markdown primitives into TipTap JSON nodes:
    - Headings (`#`, `##`, `###` -> `heading` node with `level` attributes 1-3).
    - Blockquotes (`> ` -> `blockquote` node).
    - Bullet & Ordered lists (`-`, `*`, `1.` -> `bulletList`, `orderedList`, `listItem`).
    - Inline mark parser for bold (`**text**`), italic (`*text*` / `_text_`), and inline code (`` `code` ``).
- **Microsoft Word DOCX (`docx-parser.ts`)**:
  - Consumes file `ArrayBuffer` via `mammoth.convertToHtml()` to generate clean semantic HTML.
  - Converts semantic HTML into ProseMirror AST JSON via `@tiptap/html` using matching schema extensions (`StarterKit`, `Underline`).

### 4.2 Upload API (`/api/upload`) & Security Validation
- Rejects unauthenticated sessions with `401 Unauthorized`.
- Limits file size to 5MB (`MAX_FILE_SIZE = 5 * 1024 * 1024`).
- Whitelists extensions (`.txt`, `.md`, `.docx`).
- Automatically extracts document title from sanitized file basename and persists a new `Document` entity in PostgreSQL.
- Returns `{ documentId }` for instant client redirection.

### 4.3 Upload Modal UX (`UploadModal.tsx`)
- Drag & Drop zone with active drop visual state.
- Format badges and file size limit indicators.
- Instant transition to document editor upon conversion.

---

## Phase 5: Granular Sharing & Access Control

### 5.1 Sharing Data Model & Relational Constraints
- Relational junction model `DocumentShare` (`documentId`, `userId`, `permission`).
- Unique compound constraint `@@unique([documentId, userId])` prevents duplicate share entries.
- Cascade deletion ensures deleting a document or user automatically purges associated shares without orphaned records.

### 5.2 Share API Endpoints (`/api/documents/[id]/share`)
- **`GET`**: Returns the document owner along with an array of all active shares and recipient user profiles. Restricted to document owner (`403 Forbidden` for non-owners).
- **`POST`**: Accepts `{ email, permission }`. Looks up target user by email in PostgreSQL, rejects self-sharing attempts (`400 Bad Request`), and performs an idempotent `upsert` of the share record.
- **`DELETE`**: Accepts target `userId` query parameter and revokes access instantly.

### 5.3 Share Modal Experience (`ShareModal.tsx`)
- Displays current document owner badge.
- Lists collaborators with permissions (`Can edit` vs `Can view`) and revoke buttons.
- "Copy Document Link" button with instant clipboard feedback.
- Accessible directly from both the Dashboard and the Document Editor header.

---

## Phase 6: UI/UX Polish & Design System

### 6.1 Design Tokens & Typography Foundation (`src/app/globals.css`)
- **Typography**:
  - `Inter` (Google Fonts): Modern, legible sans-serif for UI chrome, navigation, toolbars, and metadata.
  - `Merriweather` (Google Fonts): High-readability serif font engineered for long-form document reading and writing.
  - `JetBrains Mono` (Google Fonts): Clean monospace font for code blocks and snippets.
- **Glassmorphism & Depth Tokens**:
  - `--glass-bg`: `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(12px)`.
  - `--glass-border`: `rgba(255, 255, 255, 0.08)` providing crisp edge definition on dark surfaces.
  - `--accent-gradient`: `linear-gradient(135deg, #6366f1, #8b5cf6)` for primary calls-to-action.
  - Subtle micro-animations on hover (`transform: translateY(-2px)`, dynamic shadow glow).

### 6.2 Component Library (`src/components/ui/`)
- **`Toast.tsx` / `ToastProvider`**:
  - Global reactive toast notification queue supporting `success`, `error`, and `info` notification states.
  - Auto-dismisses after 3.5s with slide-in spring animation.
  - Integrated across all user actions (creating documents, renaming, deleting, uploading files, inviting teammates, revoking access).
- **`Button.tsx`**:
  - Reusable button primitives supporting `primary`, `secondary`, `ghost`, and `danger` styling variants with loading spinners.
- **`Input.tsx`**:
  - Form input wrapper supporting inline SVG icons, floating labels, and red accent error validation states.
- **`Modal.tsx`**:
  - Accessibility-first modal dialog with background body scrolling locks and `Escape` key listeners.
- **`Skeleton.tsx`**:
  - Shimmer loading placeholders replacing layout shifts during data fetching.
## Phase 7 & Live Collaboration Sync

### 7.1 Cross-Tab & Polling Sync Engine (`src/app/(editor)/document/[id]/page.tsx`)
- **WebSocket Real-Time Pipeline** (replaced BroadcastChannel + HTTP Polling):
  - Custom `server.ts` runs Next.js + a native `ws` WebSocket server on the same HTTP port (3000).
  - **Room-based architecture**: Each document ID maps to a WebSocket room. All connected clients editing/viewing the same document are in the same room.
  - When User A types, their editor broadcasts a `doc:update` message via WebSocket to the server, which relays it to all other clients in the room instantly.
  - Title changes are broadcast via `doc:title` messages.
  - After a successful database save (`PATCH /api/documents/[id]`), a `doc:saved` notification is sent with the new `updatedAt` timestamp.

- **WebSocket Client (`src/lib/ws-client.ts`)**:
  - Singleton pattern — one WebSocket connection per browser tab.
  - Automatic reconnection with exponential backoff (1s → 2s → 4s → ... → 30s max, 10 attempts).
  - Keepalive ping every 30 seconds to prevent connection timeout.
  - Typed message routing via `on(type, handler)` / `off(type, handler)` API.

- **TipTap Remote Content Guard (`TipTapEditor.tsx`)**:
  - Uses `forwardRef` + `useImperativeHandle` to expose a `setRemoteContent()` method.
  - This method sets a synchronous `isRemoteUpdateRef` flag before calling `editor.commands.setContent()`, preventing the `onUpdate` callback from firing and triggering a save loop.
  - The flag is cleared on the next `requestAnimationFrame`, ensuring it stays true through all synchronous and microtask callbacks.

- **Save Status State Machine**:
  - `idle` → (user types) → `saving` → (PATCH 200) → `saved` → (2s timer) → `idle`
  - Uses React functional state updates `setSaveStatus(s => s === "saved" ? "idle" : s)` to avoid race conditions.

---

*(All Phases 1 through 8 Complete, WebSocket Real-Time Sync Active, and Documented)*



