# Ajaia Docs — Collaborative Document Editor

## Project Overview

A lightweight collaborative document editor inspired by Google Docs, built as a full-stack application demonstrating document creation, editing, file handling, sharing, and usability.

**Product Name:** Ajaia Docs

---

## Tech Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Full-stack in one repo — API routes + React SSR + SSG. Industry standard. |
| **Language** | TypeScript | Type safety, better DX, catch bugs at compile time. |
| **Rich Text Editor** | TipTap (ProseMirror-based) | Best balance of power & ease. Headless, extensible, excellent React integration. StarterKit gives us Bold/Italic/Underline/Headings/Lists out of the box. |
| **Database** | PostgreSQL via Neon (serverless) | Free tier, serverless-compatible, works with Vercel. No ephemeral file system issues. |
| **ORM** | Prisma | Best-in-class TypeScript ORM. Schema-first, auto-generates types, migrations. |
| **Auth** | NextAuth.js v5 (Credentials) | Lightweight auth with JWT strategy. Simulated users with seeded accounts. |
| **Styling** | Vanilla CSS + CSS Variables | Maximum control, premium design system, no framework lock-in. |
| **Deployment** | Vercel | Free tier, instant deploys, perfect Next.js integration. |
| **Testing** | Vitest + React Testing Library | Fast, modern, works great with Next.js. |
| **File Upload** | Next.js API Routes + Vercel Blob (or local) | Handle .txt, .md, .docx imports → convert to editable document content. |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                   │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth     │  │  Dashboard   │  │  Document Editor  │  │
│  │  Pages    │  │  (My Docs +  │  │  (TipTap +        │  │
│  │          │  │   Shared)    │  │   Toolbar)        │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│                        │                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              API Layer (Next.js API Routes)          │ │
│  │  /api/auth  /api/documents  /api/share  /api/upload │ │
│  └─────────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Prisma ORM + Neon PostgreSQL            │ │
│  │  Users | Documents | Shares | Uploads               │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Phase Breakdown

| Phase | Focus | Est. Time | Priority |
|---|---|---|---|
| **Phase 1** | Project Setup & Database Schema | 30 min | 🔴 Critical |
| **Phase 2** | Authentication (Seeded Users + Login) | 45 min | 🔴 Critical |
| **Phase 3** | Document CRUD + Rich Text Editor | 90 min | 🔴 Critical |
| **Phase 4** | File Upload & Import | 45 min | 🟡 High |
| **Phase 5** | Document Sharing | 45 min | 🟡 High |
| **Phase 6** | UI/UX Polish & Design System | 45 min | 🟡 High |
| **Phase 7** | Testing & Deployment | 30 min | 🔴 Critical |
| **Phase 8** | Documentation & Submission | 30 min | 🔴 Critical |

**Total Estimated:** ~5.5 hours (within 4-6 hour window)

---

## Intentional Scope Cuts

These are features we deliberately **will not** build:

1. **Real-time collaboration** — Would require WebSocket infrastructure (e.g., Yjs/Hocuspocus). High complexity, low ROI for this scope.
2. **Enterprise access control** — Simple owner + shared-with model is sufficient to demonstrate the concept.
3. **Image embedding in documents** — Adds storage complexity without demonstrating core competency.
4. **Document version history** — Would be a stretch goal if time permits.
5. **Export to PDF** — Stretch goal only.
6. **Comments/suggestions mode** — Stretch goal only.

---

## What We WILL Nail

1. ✅ Premium, polished UI with dark mode, animations, and modern design
2. ✅ Smooth rich-text editing with TipTap (Bold, Italic, Underline, Headings, Lists)
3. ✅ Full document CRUD (create, rename, edit, save, reopen)
4. ✅ File upload (.txt, .md) → converted to editable documents
5. ✅ Simple but working sharing model (owner → share with user → user sees it)
6. ✅ Persistent data across refreshes (PostgreSQL)
7. ✅ Seeded demo users for easy reviewer testing
8. ✅ Live deployment on Vercel
9. ✅ Automated tests
10. ✅ Clear documentation

---

## Directory Structure (Target)

```
ajaia-docs/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed demo users
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (editor)/
│   │   │   ├── document/[id]/page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── documents/route.ts
│   │   │   ├── documents/[id]/route.ts
│   │   │   ├── documents/[id]/share/route.ts
│   │   │   └── upload/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── editor/
│   │   │   ├── TipTapEditor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   └── EditorMenuBar.tsx
│   │   ├── dashboard/
│   │   │   ├── DocumentCard.tsx
│   │   │   ├── DocumentGrid.tsx
│   │   │   └── ShareModal.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Avatar.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── AuthGuard.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── auth.ts             # NextAuth config
│   │   └── utils.ts            # Shared utilities
│   └── types/
│       └── index.ts            # TypeScript types
├── tests/
│   ├── api/
│   │   └── documents.test.ts
│   └── components/
│       └── Editor.test.tsx
├── docs/                       # This folder
├── public/
├── .env.example
├── next.config.js
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```
