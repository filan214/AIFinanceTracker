# Smart Finn Track — Frontend UI/UX Refinement Prompt

> Paste everything below this line into a fresh Claude conversation.
> Attach your Dashboard.html file alongside this prompt.

---

## Context

I have a working frontend implementation of **Smart Finn Track** — an AI-powered personal finance web app. I'm attaching my `Dashboard.html` as the design reference. I want you to apply the **exact same design system, tokens, components, and patterns** from the dashboard to every other page in the app.

**This is a frontend-only task. Do not touch any backend logic, API routes, data fetching, or business logic.**

---

## Design system extracted from the dashboard (use these exactly)

### CSS variables
```css
:root {
  --bg: #fafaf9;
  --bg-soft: #f4f4f5;
  --bg-muted: #e4e4e7;
  --surface: #ffffff;
  --border: #e4e4e7;
  --border-strong: #d4d4d8;
  --ink: #09090b;
  --ink-2: #27272a;
  --ink-3: #52525b;
  --ink-4: #71717a;
  --ink-5: #a1a1aa;
  --accent: #10b981;
  --accent-2: #059669;
  --accent-soft: #ecfdf5;
  --danger: #f43f5e;
  --danger-soft: #fff1f2;
  --amber: #f59e0b;
  --amber-soft: #fffbeb;
  --shadow-sm: 0 1px 2px rgba(9,9,11,0.04), 0 1px 1px rgba(9,9,11,0.03);
  --shadow-md: 0 4px 12px -2px rgba(9,9,11,0.06), 0 2px 6px -2px rgba(9,9,11,0.04);
  --shadow-lg: 0 24px 48px -16px rgba(9,9,11,0.16), 0 8px 16px -8px rgba(9,9,11,0.08);
}
```

### Typography
- Body font: `Inter` (with font-feature-settings: 'cv11','ss01','ss03')
- Monospace: `JetBrains Mono` — used for all currency amounts
- `-webkit-font-smoothing: antialiased`

### Animations (reuse these exact keyframes)
```css
@keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
@keyframes shimmer { 0%{ background-position:-1000px 0; } 100%{ background-position:1000px 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes modalIn { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
@keyframes backdropIn { from { opacity:0; } to { opacity:1; } }
```

Use `.fade-in` and `.slide-up` utility classes consistently across all pages.

### Layout
- Authenticated pages: `display:grid; grid-template-columns:240px 1fr; min-height:100vh`
- Sidebar: 240px fixed, same `<Sidebar>` component from dashboard
- Main content padding: `24px 32px 40px`
- Card gap: `14px`
- Border radius: `12px` for cards, `8px` for buttons/inputs, `6px` for badges

### Skeleton loading pattern (from shimmer animation)
```css
.skeleton {
  background: linear-gradient(90deg, var(--bg-soft) 25%, var(--bg-muted) 50%, var(--bg-soft) 75%);
  background-size: 1000px 100%;
  animation: shimmer 1.6s infinite;
  border-radius: 6px;
}
```

---

## Multi-language pattern

Every page must follow this exact COPY object pattern from the dashboard:

```js
const COPY = {
  pageName: {
    title:   { id: 'Judul Halaman',  en: 'Page Title' },
    subtitle: { id: 'Subtitle',      en: 'Subtitle' },
    // ... all strings bilingual
  }
}

// Usage
const t = (obj) => obj[lang] ?? obj.en;
// e.g. t(COPY.pageName.title)
```

`lang` prop is passed down from App component. Every hardcoded string must be replaced with `t(COPY.x.y)`.

---

## Pages to implement / refine

Apply the dashboard design system to all pages below. The dashboard itself is the reference — match its visual quality exactly.

---

### 1. Transactions page (`/transactions`)

**Layout:** Same sidebar + main layout as dashboard.

**Page header:** Same `<PageHeader>` pattern — title, subtitle, month picker, + "Add transaction" button.

**Filter bar (sticky below header):**
```
[ 🔍 Search... ] [ Category ▾ ] [ Type ▾ ] [ Date range ]
```
- Background: `var(--surface)`, border-bottom: `1px solid var(--border)`
- Input style: match the modal inputs from dashboard

**Transaction table:**
- Columns: Date | Description | Category badge | Amount | Actions
- Amount: `font-family: JetBrains Mono` — green (`var(--accent)`) for income, red (`var(--danger)`) for expense
- Category badge: colored pill, same style as in the dashboard transaction list
- Actions: edit icon + delete icon, appear on row hover
- Row hover: `background: var(--bg-soft)`
- "AI is categorizing..." state: same `pulse-dot` animation from dashboard

**Skeleton loading (while fetching):**
- 8 rows, each: shimmer rectangle full width, h-48px
- Vary widths of description column (w-60%, w-75%, w-50%) to look natural

**Empty state:**
```
[empty chart illustration - SVG]
"Belum ada transaksi" / "No transactions yet"
"Tambah transaksi pertamamu untuk memulai."
[+ Tambah transaksi] button — accent color, same style as header button
```

**Pagination:**
- Simple prev/next with page count
- Style: same as modal cancel/save button pattern

---

### 2. Reports page (`/reports`)

**Layout:** Same sidebar + main layout.

**Page header:** Title + subtitle, no month picker (reports are by month, selected differently).

**Month selector row:**
- Horizontal scrollable chips: `[Jan] [Feb] [Mar] [Apr] [May ✓] [Jun]`
- Active chip: `background: var(--ink); color: #fff`
- Inactive: `background: var(--bg-soft); color: var(--ink-3)`
- Border radius: 999px (pill)

**Report card (one per month):**
```
┌─────────────────────────────────────────┐
│ 🗓 Mei 2026              [Generated]    │
│                                         │
│ AI narrative text here — 4-5 sentences  │
│ about spending patterns and tips.       │
│                                         │
│ ──────────────────────────────────────  │
│ Rp 2.340.000 total    ↑18% vs Apr       │
└─────────────────────────────────────────┘
```
- Card style: `background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; box-shadow: var(--shadow-sm)`
- Narrative text: `font-size: 14px; color: var(--ink-3); line-height: 1.7`
- Total amount: JetBrains Mono, `var(--ink)`
- Percentage change: green if negative (spent less), red if positive (spent more)

**Skeleton loading:**
- 3 paragraph lines per card: `w-full`, `w-4/5`, `w-3/5` shimmer

**Empty state:**
- "Laporan pertamamu akan muncul di awal bulan depan."
- Soft icon, muted text, no CTA button needed

---

### 3. Chat advisor page (`/chat`)

**Layout:** Same sidebar, but main area is a full-height chat interface.

**Chat container:**
```
┌─────────────────────────────────────────┐
│  Smart Finn Track AI          [Clear]   │  ← sticky header
├─────────────────────────────────────────┤
│                                         │
│  [AI bubble]                            │  ← messages area
│              [User bubble]              │    scrollable
│  [AI bubble]                            │
│                                         │
├─────────────────────────────────────────┤
│  [ Type a question...        ] [Send]   │  ← sticky input bar
└─────────────────────────────────────────┘
```

**AI bubble:**
- Left aligned, `background: var(--bg-soft)`, `border-radius: 12px 12px 12px 0`
- Small label above: "Smart Finn Track AI" — `font-size: 11px; color: var(--ink-5)`

**User bubble:**
- Right aligned, `background: var(--accent)`, `color: #fff`, `border-radius: 12px 12px 0 12px`

**AI typing indicator:**
- Three dots with `pulseDot` animation (same as dashboard categorizing state)

**Suggested prompts (when chat is empty):**
```
┌──────────────────────────────┐
│ 💡 Berapa pengeluaran makan  │
│    bulan ini?                │
└──────────────────────────────┘
```
- 3 suggestion cards in a grid
- Clickable, `border: 1px solid var(--border)`, hover: `border-color: var(--accent)`

**Input bar:**
- `background: var(--surface)`, `border-top: 1px solid var(--border)`
- Input: same style as modal inputs
- Send button: `background: var(--accent)`, icon only on mobile

**Skeleton loading (loading previous messages):**
- 3 alternating skeleton bubbles (left/right), varying widths

---

### 4. Settings page (`/settings`)

**Layout:** Same sidebar + main layout.

**Page header:** "Pengaturan" / "Settings" — no buttons.

**Settings sections — each in a card:**

**Profile section:**
```
┌─────────────────────────────────────────┐
│ Avatar  Name                            │
│         email@example.com               │
│                          [Edit profile] │
└─────────────────────────────────────────┘
```
- Avatar: circle initials, `background: var(--accent-soft); color: var(--accent-2)`

**Language section:**
```
┌─────────────────────────────────────────┐
│ 🌐 Bahasa / Language                    │
│                                         │
│ [  Bahasa Indonesia  ] [    English    ]│
└─────────────────────────────────────────┘
```
- Same toggle button style as the TweaksPanel in dashboard (exact same pattern)
- Active: `background: var(--ink); color: #fff`

**Appearance section:**
```
┌─────────────────────────────────────────┐
│ 🎨 Accent color                         │
│                                         │
│ [●] [●] [●] [●] [●]  ← color swatches  │
└─────────────────────────────────────────┘
```
- Same color swatch pattern as TweaksPanel

**Notifications section:**
```
┌─────────────────────────────────────────┐
│ 🔔 Notifikasi                           │
│ ─────────────────────────────────────── │
│ Anomaly alerts        [toggle ●──]      │
│ Monthly report        [toggle ──●]      │
└─────────────────────────────────────────┘
```
- Toggle: same toggle pattern as TweaksPanel `showAnomaly` toggle

**Danger zone section:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Danger zone                          │
│ ─────────────────────────────────────── │
│ Delete all data        [Delete]         │
│ Sign out               [Sign out]       │
└─────────────────────────────────────────┘
```
- Delete button: `color: var(--danger); border: 1px solid var(--danger-soft)`
- Sign out: standard secondary button style

**Skeleton loading:**
- Avatar circle + 2 lines for profile section

---

### 5. Landing page (`/`)

**No sidebar.** Full-width layout.

**Navbar:**
```
Smart Finn Track (logo)          [Log in]  [Get started →]
```
- `background: rgba(250,250,249,0.8); backdrop-filter: blur(12px)`
- Sticky at top
- Logo: font-weight 600, accent dot or mark

**Hero section:**
```
        Your AI-powered
        personal finance
        companion.

  Track smarter. Spend wiser. Save more.

  [Get started free →]   [See how it works]

  [── dashboard screenshot / mockup ──]
```
- Heading: `font-size: clamp(36px, 5vw, 64px); font-weight: 700; color: var(--ink)`
- Subtext: `font-size: 18px; color: var(--ink-3)`
- Primary CTA: `background: var(--ink); color: #fff; padding: 12px 24px; border-radius: 10px`
- Secondary CTA: `border: 1px solid var(--border); color: var(--ink-2)`

**Feature highlights (3 cards):**
```
[ 🤖 AI Categorization ]  [ 📊 Smart Insights ]  [ 🌐 EN / ID ]
Auto-categorizes every    Monthly reports in     Switch between
transaction instantly.    plain language.        languages freely.
```
- Card: `background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px`
- Icon container: `background: var(--accent-soft); color: var(--accent); border-radius: 10px; padding: 10px`

**Footer:**
- Simple single line: "© 2026 Smart Finn Track — Built with Next.js & Supabase"
- `color: var(--ink-5); font-size: 13px`

---

### 6. Auth pages (`/login`, `/register`)

**No sidebar.** Centered card layout.

```
         Smart Finn Track
              (logo)

    ┌──────────────────────────┐
    │   Masuk ke akun          │
    │   ─────────────────────  │
    │   Email                  │
    │   [____________________] │
    │                          │
    │   Password               │
    │   [____________________] │
    │                          │
    │   [     Masuk →        ] │
    │                          │
    │   Belum punya akun?      │
    │   Daftar sekarang        │
    └──────────────────────────┘
```

- Page background: `var(--bg)`
- Card: `background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px 36px; box-shadow: var(--shadow-md); width: 400px`
- Inputs: same style as `<AddTxnModal>` inputs from dashboard
- Submit button: `background: var(--ink); color: #fff` — same width as inputs
- Error state: `border-color: var(--danger)` on input + small error text below in `var(--danger)`

---

## Components to keep consistent across all pages

These already exist in the dashboard — reuse them everywhere, do not recreate:

| Component | Already in dashboard | Use on |
|---|---|---|
| `<Sidebar>` | ✅ | All authenticated pages |
| `<PageHeader>` | ✅ | Dashboard, Transactions, Reports, Chat, Settings |
| `<AnomalyAlert>` | ✅ | Dashboard only |
| `<AddTxnModal>` | ✅ | Dashboard + Transactions |
| Category badge | ✅ (in TransactionsList) | Transactions, Dashboard |
| Skeleton shimmer | ✅ (animation defined) | All pages |
| Toggle switch | ✅ (in TweaksPanel) | Settings |
| Color swatches | ✅ (in TweaksPanel) | Settings |

---

## What to avoid

- No new color palette — use only the CSS variables already defined
- No new fonts — Inter + JetBrains Mono only
- No third-party component libraries (no shadcn, no MUI, no Chakra)
- No changes to data, API calls, or state management
- No new animation keyframes — reuse the existing ones
- Do not change the sidebar or its navigation items

---

## Deliverable

For each page, provide:
1. The complete updated component code (React + inline styles matching the design system)
2. Any new COPY entries needed for that page (bilingual id/en)
3. The skeleton loading component for that page

Start with the **Transactions page** first, then proceed page by page.
