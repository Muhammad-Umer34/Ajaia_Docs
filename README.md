# Ajaia Docs — Collaborative Rich-Text Document Editor

A lightweight, modern collaborative document editor inspired by Google Docs, built with Next.js 15, TipTap (ProseMirror), Prisma ORM, and PostgreSQL (Neon Serverless).

---

## 🌟 Live Demo & Demo Accounts

🔗 **Production URL:** [https://ajaia-docs.vercel.app](https://ajaia-docs.vercel.app) *(or your deployed Vercel URL)*

### Pre-Seeded Demo Accounts
For frictionless evaluation, 3 reviewer accounts are pre-seeded in the database:

| Account | Email | Password | Role / Starting State |
|---|---|---|---|
| **Alice Johnson** | `alice@ajaia.com` | `password123` | Document Owner ("Welcome to Ajaia Docs") |
| **Bob Smith** | `bob@ajaia.com` | `password123` | Collaborator with edit access on Alice's doc; Owner of "Roadmap Doc" |
| **Charlie Brown** | `charlie@ajaia.com` | `password123` | Team Member for testing new share invitations |

> 💡 **Tip:** The `/login` page features **1-Click Autofill buttons** for all demo accounts to make reviewer testing instant.

---

## 🚀 Core Features

### 1. Document Creation & Rich Text Editing
- **ProseMirror / TipTap Engine**: Headless, fast, and accessible rich-text editing.
- **Formatting Toolbar**: Bold, Italic, Underline, Strikethrough, Headings (H1, H2, H3), Bullet Lists, Numbered Lists, Blockquotes, and Undo / Redo.
- **Keyboard Shortcuts**: Native `Ctrl/Cmd+B`, `Ctrl/Cmd+I`, `Ctrl/Cmd+U`, `Ctrl/Cmd+Z`, and `Ctrl/Cmd+Y`.
- **Inline Title Renaming**: Click document title in the editor or dashboard menu to rename.
- **Debounced Auto-Save Engine**: 1,500ms debounce with visual status badges (*Saving...*, *Saved ✓*, *Error*).

### 2. Multi-Format File Import
- Upload and convert `.txt`, `.md`, and `.docx` files directly into editable documents.
- Preserves markdown structures (headings, bold/italic, lists, quotes) and Word formatting via `mammoth.js`.
- File validation with size limits (Max 5MB) and user-friendly error handling.

### 3. Granular Document Sharing & Access Control
- Document owners can invite team members by email with **Can Edit** or **Can View** permissions.
- **Permission Enforcement**:
  - `owner`: Full privileges (edit, rename, share, delete).
  - `edit`: Collaborative editing privileges (cannot delete or re-share).
  - `view`: Read-only mode with disabled toolbar and alert banner.
- **Dashboard Separation**: Clear distinction between **My Documents** and **Shared with Me** (showing owner avatar and permission badge).

### 4. Robust Persistence & Infrastructure
- Persistent PostgreSQL database powered by Neon Serverless.
- Relational schema with cascade rules and unique compound constraints to prevent duplicate shares.
- Edge-compatible authentication middleware via NextAuth v5.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Editor**: [TipTap](https://tiptap.dev/) (ProseMirror AST)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/)
- **ORM**: [Prisma ORM](https://www.prisma.io/)
- **Auth**: [NextAuth.js v5](https://authjs.dev/) (Credentials Provider + JWT sessions)
- **Styling**: Vanilla CSS & Custom Design System Tokens (Dark Mode first with Glassmorphism)
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library (16 passing tests)

---

## 💻 Local Setup Instructions

### Prerequisites
- Node.js 18.x or 20.x+
- npm 9+ or pnpm / yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/ajaia-docs.git
cd ajaia-docs
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://user:password@your-neon-endpoint.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="ajaia-docs-super-secret-jwt-key-32-chars-long"
AUTH_SECRET="ajaia-docs-super-secret-jwt-key-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Synchronize Database & Seed Demo Data
```bash
# Push schema to database
npx prisma db push

# Seed demo users and initial documents
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Tests
```bash
npm test
```

---

## 📁 Repository Structure

```
├── docs/                      # Architectural notes & implementation logs
│   ├── 00-overview.md
│   ├── ARCHITECTURE.md        # Deep architectural tradeoffs note
│   ├── AI-WORKFLOW.md         # AI-native development note
│   └── IMPLEMENTATION_LOG.md  # Live step-by-step engineering log
├── prisma/
│   ├── schema.prisma          # Database models (User, Document, DocumentShare)
│   └── seed.ts                # Demo account seeder
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page with demo autofill
│   │   ├── (dashboard)/       # Dashboard page & layout
│   │   ├── (editor)/document/ # Interactive TipTap document editor
│   │   └── api/               # API route handlers (auth, documents, share, upload)
│   ├── components/
│   │   ├── dashboard/         # DocumentCard, DocumentGrid, UploadModal, ShareModal
│   │   ├── editor/            # TipTapEditor, EditorToolbar
│   │   ├── layout/            # Sticky Header & Navigation
│   │   └── ui/                # Reusable Avatar, Badges
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── parsers/           # TXT, Markdown, and DOCX parsers
│   │   └── utils.ts           # Debounce, date formatting, and text extraction
│   └── types/                 # NextAuth type extensions
├── tests/                     # Vitest automated test suites
├── SUBMISSION.md              # Submission summary & evaluation guide
└── WALKTHROUGH.md             # Walkthrough video outline
```
