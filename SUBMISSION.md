# Project Submission: Ajaia Docs

## 📌 Submission Overview

| Deliverable | Location |
|---|---|
| **Google Drive Deliverables Folder** | [https://drive.google.com/drive/folders/1FPInL9sDnc8TcKIt1GWlRRH3mXyfGDd3?usp=sharing](https://drive.google.com/drive/folders/1FPInL9sDnc8TcKIt1GWlRRH3mXyfGDd3?usp=sharing) |
| **Live Product URL** | [https://ajaia-six.vercel.app/](https://ajaia-six.vercel.app/) |
| **Walkthrough Video (Loom)** | [https://www.loom.com/share/844a2813571949aa8222cc8e9307687c](https://www.loom.com/share/844a2813571949aa8222cc8e9307687c) |
| **GitHub Repository** | [https://github.com/Muhammad-Umer34/Ajaia_Docs](https://github.com/Muhammad-Umer34/Ajaia_Docs) |
| **README & Setup Guide** | [README.md](./README.md) |
| **Architecture Note** | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| **AI Workflow Note** | [docs/AI-WORKFLOW.md](./docs/AI-WORKFLOW.md) |
| **Full Implementation Log** | [docs/IMPLEMENTATION_LOG.md](./docs/IMPLEMENTATION_LOG.md) |

---

## 🔑 Demo Reviewer Accounts

All accounts are pre-seeded in the database (Default Password: `password123`):

| User | Email | Role in Demo |
|---|---|---|
| **Alice Johnson** | `alice@ajaia.com` | Document Owner ("Welcome to Ajaia Docs") |
| **Bob Smith** | `bob@ajaia.com` | Collaborator with edit access on Alice's doc; Owner of "Roadmap Doc" |
| **Charlie Brown** | `charlie@ajaia.com` | Team Member (Use to test sharing new documents) |

> 🚀 **Quick Login**: The `/login` screen includes 1-click autofill buttons for these accounts.

---

## 🧪 How to Verify Core Functionalities End-to-End

### 1. Document Creation & Rich Text Editing:
- Log in as **Alice** (`alice@ajaia.com`).
- Open **"Welcome to Ajaia Docs"** or click **"+ New Document"**.
- Format text with Bold, Italic, Underline, Headings 1-3, Bullet/Numbered Lists, Blockquotes, and Code blocks.
- Edit the title inline.
- Observe auto-save status (*Saving...* -> *Saved ✓* -> *idle*), or press **`Ctrl + S`** for instant save.

### 2. Multi-Format File Upload:
- On Dashboard, click **"Import File"**.
- Drag & drop or choose any `.txt`, `.md`, or `.docx` file.
- The system parses the document into TipTap AST JSON and opens a new editable document instantly.

### 3. Granular Sharing & Access Control:
- Click **"Share"** in the editor header.
- Invite `bob@ajaia.com` or `charlie@ajaia.com` with **Can Edit** or **Can View**.
- Log in as Bob in another window or incognito session:
  - Under **"Shared with Me"**, open the document.
  - If **Can Edit**: Editing and toolbar are enabled.
  - If **View Only**: Editor is locked, toolbar is disabled, and a view-only alert banner appears.

### 4. Real-Time WebSocket Synchronization (Stretch Feature):
- Open the document simultaneously as Alice and Bob.
- Type in Alice's window $\to$ content syncs instantly across to Bob's screen over WebSockets.
- Downgrade Bob's permission to **Can view** in Alice's Share modal $\to$ Bob's editor locks immediately in real time.

### 5. Multi-Format Document Export (Stretch Feature):
- In the editor header, click the **"Export"** dropdown.
- Download the document as **Markdown (`.md`)** with headings, bold, lists, and code blocks preserved.
- Download as **Plain Text (`.txt`)** or export as a print-formatted **PDF (`.pdf`)**.

### 6. Durable Cloud Persistence:
- Refresh the browser (F5) or restart the server $\to$ all documents, formatting, shares, and timestamps persist in PostgreSQL.

---

## ✅ What is Working End-to-End

- [x] **Document Creation & Editing**: Create, rename, edit, save, reopen documents.
- [x] **Rich Text Formatting**: Bold, Italic, Underline, Strikethrough, Headings 1-3, Bullet/Numbered Lists, Blockquotes, Undo/Redo.
- [x] **Auto-Save Engine**: 1,200ms debounced persistence to PostgreSQL with visual state feedback + `Ctrl+S` instant save.
- [x] **Multi-Format Ingestion**: Ingests `.txt`, `.md`, and `.docx` files via custom AST parsers.
- [x] **Multi-Format Export**: 1-click export to Markdown (`.md`), Plain Text (`.txt`), and formatted PDF (`.pdf`).
- [x] **Sharing & Access Control**: Owner-managed invitation model with `edit` and `view` permissions.
- [x] **Live WebSocket Collaboration**: Room-based WebSocket server streaming keystrokes, titles, and live permission changes.
- [x] **Durable Persistence**: Neon PostgreSQL database with relational cascade rules via Prisma.
- [x] **Automated Tests**: 20 passing unit and integration tests across parsers, export, helpers, and components (`npm test`).
- [x] **Production Grade Build**: Clean Next.js 15 compilation with 0 errors and 0 warnings (`npm run build`).

---

## ⏳ Intentional Scope Cuts & Tradeoffs

1. **CRDT Merge Conflicts (Yjs / OT)**: Implemented room-based WebSocket broadcasting with debounce persistence rather than full CRDTs to maximize reliability and avoid unnecessary operational complexity within the timebox.
2. **Version History Diffs**: Deprioritized in favor of multi-format file ingestion (.txt, .md, .docx).
3. **PDF Export**: Deprioritized in favor of zero-dependency native browser print styling.

---

## 🚀 Next Steps (With 2-4 Additional Hours)

1. **Presence Cursors**: Showing live cursor positions and user selection highlights.
2. **Full-text content search**: Using PostgreSQL tsvector indexes for search within document contents.
3. **Version snapshots**: Storing historical revision snapshots with 1-click restore.
