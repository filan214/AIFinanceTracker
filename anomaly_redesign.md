# Anomaly Alert — Redesign Implementation
# Gap Analysis: Concept vs Current Implementation

---

## Gap analysis

### Problem 1 — AI mengembalikan raw markdown, bukan structured data

**Current (salah):**
AI mengembalikan teks naratif panjang dengan markdown mentah:
```
**Week 0:** * **Education:** This is a new, extremely large expense...
* **Savings:** This is a new, substantial category...
**Week 3:** * **Food:** This expense is significantly lower...
```
Teks ini ditampilkan as-is — asterisks terlihat, tidak ada struktur visual.

**Target (benar):**
AI mengembalikan JSON terstruktur yang di-parse frontend menjadi
komponen visual dengan bars, badges, dan transaction list.

---

### Problem 2 — Tidak ada visual comparison bars

**Current:** Tidak ada.

**Target:**
```
■ This week    Rp 327,000  ████████████████████████  ]
■ Typical      Rp 230,000  ████████████████          ]
                                              +42%
                                         ENTERTAINMENT
```
Bar merah untuk "this week", abu-abu untuk "typical".
Persentase besar di kanan sebagai highlight utama.

---

### Problem 3 — Tidak ada triggered transactions list

**Current:** Tidak ada list transaksi penyebab anomali.

**Target:**
```
2 TRANSACTIONS TRIGGERED THIS ALERT
┌──────────────────────────────────────────────────────┐
│ ✦  Netflix — new subscription    [New]  -Rp 65,000  │
│ ✦  Spotify — new subscription    [New]  -Rp 54,000  │
└──────────────────────────────────────────────────────┘
```
Transaksi spesifik yang menyebabkan anomali ditampilkan
dengan badge "New" untuk langganan yang baru pertama muncul.

---

### Problem 4 — Action buttons tidak lengkap

**Current:** Hanya "Ask Advisor →" link teks.

**Target:**
```
[≡ Review transactions]  [✦ Ask Advisor]  [Dismiss]
```
Tiga tombol dengan hierarki visual jelas:
- Primary (hitam): Review transactions
- Secondary (border): Ask Advisor
- Tertiary (teks): Dismiss

---

### Problem 5 — Header badges tidak sesuai

**Current:** Hanya badge "AI" dengan background oranye solid.

**Target:**
- Badge "NEEDS ATTENTION" (amber/kuning)
- Badge "AI" (hijau/teal kecil)
- Orange pulsing dot di kiri judul
- Tombol × untuk close di kanan

---

### Problem 6 — Layout dan border accent

**Current:** Background oranye solid di icon area, no left border accent.

**Target:**
- Background: `var(--surface)` putih bersih
- Left border accent: `4px solid var(--amber)`
- Subtle shadow: `var(--shadow-md)`
- Border radius: `12px`

---

## Root cause

Masalah utama ada di **dua tempat**:

1. **Prompt AI `/api/ai/anomaly`** — harus diubah agar return JSON
   terstruktur, bukan naratif panjang dengan markdown
2. **Frontend component `AnomalyAlert`** — harus di-rebuild untuk
   render structured data, bukan raw text dump

---

## Solution Part 1 — Ubah AI prompt ke structured JSON output

### Prompt baru untuk `/api/ai/anomaly`

```
You are a financial anomaly detector for a personal finance app.

Analyze the weekly spending data below and detect ONE most significant anomaly.

Weekly spending by category (last 4 weeks, in IDR):
{data_json}

All transactions this week:
{this_week_transactions}

If you detect an anomaly, respond ONLY with valid JSON in this exact format:
{
  "detected": true,
  "category": "entertainment",
  "categoryLabel": "Entertainment",
  "thisWeek": 327000,
  "typical": 230000,
  "percentageChange": 42,
  "direction": "up",
  "summary": "Entertainment spending is up 42% this week — well above your 4-week average.",
  "triggeredTransactions": [
    {
      "id": "uuid-here",
      "description": "Netflix — new subscription",
      "amount": 65000,
      "isNew": true
    },
    {
      "id": "uuid-here",
      "description": "Spotify — new subscription",
      "amount": 54000,
      "isNew": true
    }
  ]
}

If NO significant anomaly detected, respond ONLY with:
{ "detected": false }

Rules:
- Return ONLY valid JSON — no markdown, no explanation outside the JSON
- "typical" = average of the 3 previous weeks for that category
- "isNew" = true if this description never appeared in the previous 3 weeks
- "triggeredTransactions" = max 3 transactions most responsible for the spike
- "summary" must be in {language === 'en' ? 'English' : 'Bahasa Indonesia'}
- "categoryLabel" must be in {language === 'en' ? 'English' : 'Bahasa Indonesia'}
```

### Parse AI response di API route

```ts
// /api/ai/anomaly/route.ts
const raw = await gemini.generateContent(prompt)
const text = raw.response.text().trim()

// Strip markdown fences jika AI wrap dengan ```json
const clean = text.replace(/```json|```/g, '').trim()

try {
  const result = JSON.parse(clean)
  return Response.json(result)
} catch {
  // Fallback jika AI tidak return valid JSON
  return Response.json({ detected: false })
}
```

### TypeScript type

```ts
// types/anomaly.ts
export type AnomalyResult =
  | { detected: false }
  | {
      detected: true
      category: string
      categoryLabel: string
      thisWeek: number
      typical: number
      percentageChange: number
      direction: 'up' | 'down'
      summary: string
      triggeredTransactions: {
        id: string
        description: string
        amount: number
        isNew: boolean
      }[]
    }
```

---

## Solution Part 2 — Rebuild AnomalyAlert component

### Component props

```ts
interface AnomalyAlertProps {
  anomaly: AnomalyResult & { detected: true }
  onDismiss: () => void
  onReviewTransactions: () => void
  onAskAdvisor: (prefill: string) => void
  lang: 'id' | 'en'
}
```

### Visual structure

```
┌──────────────────────────────────────────────────────── ×
│ ● 🔔 Unusual spending detected  [NEEDS ATTENTION] [AI]
│
│ Entertainment spending is up 42% this week —
│ well above your 4-week average.
│
│ ┌─────────────────────────────────────────────────────┐
│ │ ■ This week   Rp 327,000  ██████████████████████   │
│ │ ■ Typical     Rp 230,000  ████████████████         │  +42%
│ └─────────────────────────────────────────────────────┘ ENTERTAINMENT
│
│ 2 TRANSACTIONS TRIGGERED THIS ALERT
│ ┌──────────────────────────────────────────────────┐
│ │ ✦  Netflix — new subscription   [New] -Rp 65,000 │
│ │ ✦  Spotify — new subscription   [New] -Rp 54,000 │
│ └──────────────────────────────────────────────────┘
│
│ [≡ Review transactions]  [✦ Ask Advisor]  [Dismiss]
└────────────────────────────────────────────────────────
```

### Bilingual COPY object

```ts
const COPY = {
  anomaly: {
    title:           { id: 'Pengeluaran tidak biasa terdeteksi', en: 'Unusual spending detected' },
    needs_attention: { id: 'PERLU PERHATIAN',                    en: 'NEEDS ATTENTION' },
    this_week:       { id: 'Minggu ini',                         en: 'This week' },
    typical:         { id: 'Rata-rata',                          en: 'Typical' },
    triggered:       { id: '{n} TRANSAKSI MEMICU ALERT INI',     en: '{n} TRANSACTIONS TRIGGERED THIS ALERT' },
    review:          { id: 'Lihat transaksi',                    en: 'Review transactions' },
    ask_advisor:     { id: 'Tanya Advisor',                      en: 'Ask Advisor' },
    dismiss:         { id: 'Abaikan',                            en: 'Dismiss' },
    new_badge:       { id: 'Baru',                               en: 'New' },
  }
}
```

### CSS (gunakan CSS variables yang sudah ada)

```css
.anomaly-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--amber);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: slideUp 0.3s ease;
  position: relative;
}

/* Header */
.anomaly-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.anomaly-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  flex: 1;
}
.close-btn {
  background: none;
  border: none;
  color: var(--ink-5);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.close-btn:hover { color: var(--ink); }

/* Badges */
.badge.needs-attention {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--amber-soft);
  color: var(--amber);
  border: 1px solid rgba(245,158,11,0.2);
}
.badge.ai {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--accent-soft);
  color: var(--accent-2);
}
.badge.new-tx {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--amber-soft);
  color: var(--amber);
  flex-shrink: 0;
}

/* Summary */
.anomaly-summary {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.5;
  margin: 0;
}

/* Comparison bars */
.comparison-section {
  display: flex;
  gap: 16px;
  align-items: center;
  background: var(--bg-soft);
  border-radius: 8px;
  padding: 14px 16px;
}
.bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.bar-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bar-dot.red { background: var(--danger); }
.bar-dot.gray { background: var(--ink-5); }
.bar-row .bar-label {
  color: var(--ink-3);
  min-width: 72px;
  font-size: 13px;
}
.bar-row .bar-amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--ink);
  min-width: 88px;
  text-align: right;
}
.bar-track {
  flex: 1;
  height: 6px;
  background: var(--bg-muted);
  border-radius: 3px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.bar-fill.red { background: var(--danger); }
.bar-fill.gray { background: var(--ink-5); }

/* Percentage highlight */
.pct-highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 72px;
  text-align: center;
}
.pct-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--danger);
  font-family: 'JetBrains Mono', monospace;
  line-height: 1;
}
.pct-category {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ink-4);
  text-transform: uppercase;
}

/* Triggered transactions */
.triggered-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.triggered-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--ink-4);
  text-transform: uppercase;
}
.triggered-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 13px;
}
.triggered-row .tx-desc {
  flex: 1;
  color: var(--ink-2);
}
.triggered-row .tx-amount {
  font-family: 'JetBrains Mono', monospace;
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
}

/* Action buttons */
.anomaly-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 2px;
}
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--ink);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-primary:hover { opacity: 0.85; }
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s;
}
.btn-secondary:hover { border-color: var(--ink-3); }
.btn-ghost {
  background: transparent;
  color: var(--ink-4);
  border: none;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
}
.btn-ghost:hover { color: var(--ink); }
```

---

## Files yang perlu diubah

| File | Jenis perubahan |
|---|---|
| `app/api/ai/anomaly/route.ts` | Ganti prompt + tambah JSON parse |
| `types/anomaly.ts` | Buat baru — AnomalyResult type |
| `components/AnomalyAlert.tsx` | Rebuild penuh sesuai spec |
| `app/(app)/dashboard/page.tsx` | Update props yang di-pass ke AnomalyAlert |

---

## Prompt untuk Claude Code

```
Read anomaly_redesign.md fully before making any changes.

There are 2 parts to implement:

PART 1 — app/api/ai/anomaly/route.ts:
- Replace the current AI prompt with the new JSON-returning prompt from the doc
- Add JSON parsing with try/catch fallback to { detected: false }
- Strip markdown fences before parsing
- Do NOT change any other API route

PART 2 — components/AnomalyAlert.tsx:
- Create types/anomaly.ts with the AnomalyResult type first
- Rebuild AnomalyAlert to accept structured AnomalyResult props
- Implement all sections: header badges, summary, comparison bars,
  triggered transactions list, action buttons
- Use ONLY CSS variables already defined in the app (--amber, --danger, --surface, etc.)
- Use ONLY animation keyframes already defined (slideUp, fadeIn)
- Add bilingual COPY object exactly as defined in the doc
- onAskAdvisor must pre-fill chat with: "Why did my {categoryLabel} spending spike this week?"
- onReviewTransactions must navigate to /transactions with category filter pre-applied

PART 3 — app/(app)/dashboard/page.tsx:
- Update how AnomalyAlert is consumed to pass the new structured props
- Ensure the JSON from the API is properly typed as AnomalyResult

Do NOT modify any other component, page, or API route.
After finishing, confirm which 4 files were modified.
```
