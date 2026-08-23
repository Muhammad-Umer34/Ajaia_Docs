# 3-5 Minute Walkthrough Video Guide

## 🎥 Video Link
- **Loom Walkthrough URL:** [https://www.loom.com/share/844a2813571949aa8222cc8e9307687c](https://www.loom.com/share/844a2813571949aa8222cc8e9307687c)
- **Live Product URL:** [https://ajaia-six.vercel.app/](https://ajaia-six.vercel.app/)

---

## ⏱️ Recommended 3-5 Minute Video Script & Flow

### 1. Introduction & Architecture (0:00 - 0:45)
- **Introduction**: Introduce Ajaia Docs — a lightweight, AI-native collaborative document editor inspired by Google Docs.
- **Tech Stack Overview**: Next.js 15 App Router, TipTap (ProseMirror AST), Prisma ORM, and Neon Serverless PostgreSQL.
- **Problem Formulation**: Discuss prioritizing editor fidelity, durable persistence, file ingestion, and rock-solid access control within the time limit.

### 2. Document Creation & Rich Text Editing (0:45 - 1:45)
- **Login Flow**: Demonstrate 1-click login as Alice (`alice@ajaia.com`).
- **Editor Demo**:
  - Open "Welcome to Ajaia Docs".
  - Demonstrate formatting: Headings, Bold, Italic, Underline, Bullet Lists, and Blockquotes.
  - Highlight the **debounced auto-save engine** (*Saving...* -> *Saved ✓*).
  - Demonstrate **inline title renaming**.

### 3. File Ingestion (.txt, .md, .docx) (1:45 - 2:30)
- Return to Dashboard -> Click **Import File**.
- Drag and drop or select a Markdown (`.md`) or Word (`.docx`) file.
- Show how the parser converts markdown headings and lists directly into a new editable document.

### 4. Sharing & Role-Based Permissions (2:30 - 3:30)
- On a document, click **Share** -> Invite Charlie (`charlie@ajaia.com`) with **Can View** or **Can Edit**.
- Sign out and switch to Charlie.
- Show how the document appears under **Shared with Me** with Alice's avatar and permission badge.
- Demonstrate that `view-only` permissions disable the toolbar and render the read-only alert.

### 5. Engineering Quality, Tradeoffs & AI Workflow (3:30 - 4:30)
- **Automated Tests**: Mention 16 passing Vitest unit & integration tests covering parsers and helpers.
- **Tradeoffs**: Explain why real-time WebSockets were deprioritized in favor of rock-solid persistence and RBAC.
- **AI-Native Workflow**: Summarize how AI accelerated parser lexing and test scaffolding while human judgment rejected SQLite on serverless and refined Edge runtime configurations.
