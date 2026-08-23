# Phase 6: UI/UX Polish & Design System

**Estimated Time:** 45 minutes  
**Priority:** 🟡 High  
**Dependencies:** Phase 3 (Dashboard + Editor exist)

---

## 6.1 — Design Philosophy

### Goal: A premium, modern document editor that feels alive.

**Design Pillars:**
1. **Dark Mode First** — Rich, deep backgrounds with vibrant accents
2. **Glassmorphism** — Frosted glass effects on cards and modals
3. **Micro-animations** — Hover effects, transitions, loading states
4. **Typography** — Inter font for UI, Georgia/Merriweather for documents
5. **Color Harmony** — Curated palette, not generic bootstrap colors

---

## 6.2 — Color Palette

### CSS Variables (Design Tokens)

```css
:root {
  /* ── Background Layers ── */
  --bg-primary: #0a0a0f;          /* Deepest background */
  --bg-secondary: #12121a;        /* Card/surface background */
  --bg-tertiary: #1a1a2e;         /* Elevated surfaces */
  --bg-hover: #22223a;            /* Hover state */

  /* ── Glass Effect ── */
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-hover: rgba(255, 255, 255, 0.06);

  /* ── Accent Colors ── */
  --accent-primary: #6366f1;       /* Indigo — primary actions */
  --accent-primary-hover: #818cf8;
  --accent-secondary: #8b5cf6;     /* Violet — secondary emphasis */
  --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  --accent-glow: 0 0 20px rgba(99, 102, 241, 0.3);

  /* ── Text Colors ── */
  --text-primary: #f1f5f9;         /* High emphasis */
  --text-secondary: #94a3b8;       /* Medium emphasis */
  --text-muted: #475569;           /* Low emphasis */
  --text-accent: #a5b4fc;          /* Accented text */

  /* ── Status Colors ── */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* ── Borders ── */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.15);
  --border-focus: var(--accent-primary);

  /* ── Shadows ── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 30px rgba(99, 102, 241, 0.15);

  /* ── Spacing ── */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* ── Transitions ── */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Typography ── */
  --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-document: 'Merriweather', 'Georgia', serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 6.3 — Typography

### Google Font Import:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@300;400;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Usage:
| Context | Font | Weight |
|---|---|---|
| UI text, buttons, labels | Inter | 400-600 |
| Document content | Merriweather | 300-700 |
| Code blocks | JetBrains Mono | 400 |
| Headings | Inter | 600-700 |

---

## 6.4 — Component Styles

### 6.4.1 — Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--accent-gradient);
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm), var(--accent-glow);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md), 0 0 30px rgba(99, 102, 241, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-ghost:hover {
  background: var(--glass-hover);
  color: var(--text-primary);
  border-color: var(--border-hover);
}
```

### 6.4.2 — Cards (Document Cards)

```css
.document-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  cursor: pointer;
  transition: all var(--transition-slow);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.document-card:hover {
  background: var(--glass-hover);
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.document-card.shared {
  border-left: 3px solid var(--accent-secondary);
}
```

### 6.4.3 — Modals

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  width: 90%;
  max-width: 480px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 6.4.4 — Input Fields

```css
.input {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0.625rem 0.875rem;
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: 0.875rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.input::placeholder {
  color: var(--text-muted);
}
```

---

## 6.5 — Animations & Micro-Interactions

### 6.5.1 — Page Transitions
```css
.page-enter {
  animation: pageEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 6.5.2 — Document Card Stagger
```css
.document-grid > * {
  animation: cardEnter 0.4s ease backwards;
}

.document-grid > *:nth-child(1) { animation-delay: 0.05s; }
.document-grid > *:nth-child(2) { animation-delay: 0.10s; }
.document-grid > *:nth-child(3) { animation-delay: 0.15s; }
.document-grid > *:nth-child(4) { animation-delay: 0.20s; }
/* ... etc */

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

### 6.5.3 — Toolbar Button Press
```css
.toolbar-btn {
  transition: all var(--transition-fast);
}

.toolbar-btn:hover {
  background: var(--glass-hover);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

.toolbar-btn.active {
  background: var(--accent-primary);
  color: white;
}
```

### 6.5.4 — Save Status Animation
```css
.save-indicator {
  transition: all var(--transition-base);
}

.save-indicator.saving {
  color: var(--text-muted);
}

.save-indicator.saved {
  color: var(--success);
  animation: savedPulse 1s ease;
}

@keyframes savedPulse {
  0% { opacity: 0; transform: translateY(-4px); }
  30% { opacity: 1; transform: translateY(0); }
  100% { opacity: 1; }
}
```

### 6.5.5 — Login Background Gradient
```css
.login-bg {
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;
}

.login-bg::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 50%,
    rgba(99, 102, 241, 0.08) 0%,
    transparent 50%
  ),
  radial-gradient(
    circle at 70% 30%,
    rgba(139, 92, 246, 0.06) 0%,
    transparent 40%
  );
  animation: gradientMove 15s ease infinite alternate;
}

@keyframes gradientMove {
  0% { transform: translate(0, 0) rotate(0deg); }
  100% { transform: translate(30px, 20px) rotate(5deg); }
}
```

---

## 6.6 — Avatar Component

### File: `src/components/ui/Avatar.tsx`

```tsx
// Generates a colored circle with user initials
// Uses the avatarColor from user profile

interface AvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
}

// Sizes: sm=28px, md=36px, lg=44px
// Shows first letter of first + last name
// Example: "Alice Johnson" → "AJ"
```

---

## 6.7 — Toast/Notification System

### File: `src/components/ui/Toast.tsx`

Simple toast notification system for feedback:

```
┌──────────────────────────────────┐
│ ✅ Document shared with Bob      │  ← Success toast
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ ❌ Failed to save document       │  ← Error toast
└──────────────────────────────────┘
```

- Auto-dismiss after 3 seconds
- Slide in from top-right
- Multiple toasts stack vertically
- Context-appropriate colors (success=green, error=red, info=blue)

---

## 6.8 — Loading States

### Skeleton Screens:
- Dashboard: Skeleton document cards during initial load
- Editor: Skeleton toolbar + content area during document fetch
- Share modal: Skeleton rows during share list load

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## 6.9 — Responsive Design

### Breakpoints:
```css
/* Mobile first */
@media (max-width: 640px) {
  .document-grid {
    grid-template-columns: 1fr;
  }

  .editor-toolbar {
    flex-wrap: wrap;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .document-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .document-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1440px) {
  .document-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 6.10 — Empty States

### No Documents:
```
┌──────────────────────────────────────┐
│                                      │
│         📝                           │
│                                      │
│    No documents yet                  │
│    Create your first document or     │
│    upload a file to get started.     │
│                                      │
│    [+ New Document]  [📤 Upload]     │
│                                      │
└──────────────────────────────────────┘
```

### No Shared Documents:
```
┌──────────────────────────────────────┐
│                                      │
│         🔗                           │
│                                      │
│    Nothing shared with you yet       │
│    When someone shares a document,   │
│    it will appear here.              │
│                                      │
└──────────────────────────────────────┘
```

---

## 6.11 — Verification Checklist

- [ ] Dark mode renders correctly across all pages
- [ ] Google Fonts (Inter, Merriweather) load properly
- [ ] Document cards have glassmorphism effect
- [ ] Hover animations work on cards and buttons
- [ ] Page transitions are smooth
- [ ] Login page has animated gradient background
- [ ] Modal animations (slide up, fade in) work
- [ ] Save indicator animates correctly
- [ ] Toolbar buttons show active state
- [ ] Skeleton loading states display before content loads
- [ ] Toast notifications appear and auto-dismiss
- [ ] Responsive layout works at mobile, tablet, desktop sizes
- [ ] Empty states display when no content exists
- [ ] Avatars render with correct colors and initials
- [ ] Overall feel is "premium" — not basic/generic

---

## Files Created/Modified in This Phase

| File | Purpose |
|---|---|
| `src/app/globals.css` | Full design system + CSS variables |
| `src/components/ui/Avatar.tsx` | User avatar component |
| `src/components/ui/Toast.tsx` | Toast notification system |
| `src/components/ui/Button.tsx` | Styled button variants |
| `src/components/ui/Input.tsx` | Styled input component |
| `src/components/ui/Modal.tsx` | Styled modal wrapper |
| `src/components/ui/Skeleton.tsx` | Loading skeleton component |
| Updated all existing components | Apply design system tokens |
