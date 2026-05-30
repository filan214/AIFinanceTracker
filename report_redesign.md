# Report Page — Redesign Implementation
# PRD v1.3 Gap Analysis + Full Spec

---

## Gap analysis — PRD vs screenshot

PRD mendefinisikan report page hanya 4 hal:
- Narrative text AI (4-5 kalimat, disimpan di `ai_insights`)
- Skeleton: "3 paragraph lines per report card"
- Empty state: "Your first report will appear at the start of next month"
- API endpoint `POST /api/ai/report` yang return plain text

**Seluruh layout, visualisasi, dan 7 dari 8 section di screenshot tidak terdefinisi di PRD.**

| Section | Di PRD | Di screenshot | Gap |
|---|---|---|---|
| Dark header banner | ❌ | ✅ | Missing |
| 4 metric cards | ❌ | ✅ | Missing |
| Savings rate + status | ❌ | ✅ | Missing |
| AI summary card (3 paragraf) | ❌ (hanya disebutkan, tanpa UI spec) | ✅ | Missing |
| Category breakdown + donut | ❌ | ✅ | Missing |
| 6-month trend bar chart | ❌ | ✅ | Missing |
| Biggest movers section | ❌ | ✅ | Missing |
| Highlights 2×2 grid | ❌ | ✅ | Missing |
| AI recommendations (3 cards) | ❌ (hanya "2-3 tips" teks) | ✅ | Missing |
| Bottom CTA bar (Ask Advisor) | ❌ | ✅ | Missing |
| Month navigation | ❌ | ❌ (implied) | Missing |

---

## Arsitektur data — apa yang dihitung vs AI-generated

Penting untuk memisahkan mana yang perlu AI call dan mana yang
dihitung langsung dari database.

| Section | Sumber data |
|---|---|
| Metric cards (spent, income, saved, rate) | **Dihitung dari DB** |
| AI summary (3 paragraf) | **AI-generated** |
| Category breakdown + donut | **Dihitung dari DB** |
| 6-month trend chart | **Dihitung dari DB** |
| Biggest movers | **Dihitung dari DB** |
| Highlights (most exp day, top cat, tx count, new subs) | **Dihitung dari DB** |
| AI recommendations (3 cards) | **AI-generated** |
| Bottom CTA | **Static UI** |

Artinya: **2 API calls** untuk halaman ini.

```
GET  /api/reports/data?month=2026-05   ← semua data kalkulasi dari DB
POST /api/ai/report                    ← hanya narrative + recommendations
```

---

## TypeScript types

```ts
// types/report.ts

export interface ReportData {
  month: string                    // "2026-05"
  generatedAt: string              // ISO date

  // Section 2 — Metric cards
  metrics: {
    totalSpent: number
    totalIncome: number
    saved: number
    savingsRate: number            // percentage, e.g. 24
    spentChange: number            // % vs last month, e.g. 18 (positive = up)
    incomeChange: number | null
    savingsRateStatus: 'above_average' | 'average' | 'below_average'
  }

  // Section 4 — Category breakdown
  categoryBreakdown: {
    categoryKey: string
    total: number
    vsLastMonth: number            // % change
  }[]

  // Section 4 — 6-month trend
  monthlyTrend: {
    month: string                  // "2025-12", "2026-01", ...
    totalSpent: number
  }[]

  // Section 5 — Biggest movers
  biggestMovers: {
    categoryKey: string
    previousMonth: number
    thisMonth: number
    changePercent: number
    changeAbsolute: number
    direction: 'up' | 'down'
  }[]

  // Section 5 — Highlights
  highlights: {
    mostExpensiveDay: { date: string; description: string; amount: number }
    topCategory: { categoryKey: string; percentage: number }
    transactionCount: { total: number; averageAmount: number }
    newSubscriptions: { count: number; names: string[] }
  }
}

export interface AIReportContent {
  // Section 3 — Narrative summary (3 paragraphs)
  summary: {
    paragraph1: string   // overall spending + income + savings rate
    paragraph2: string   // biggest category change + why
    paragraph3: string   // positive note + outlier transaction
  }

  // Section 6 — AI recommendations
  recommendations: {
    id: '01' | '02' | '03'
    title: string
    description: string
    outcome: string      // short outcome label, e.g. "Save Rp 60K"
  }[]
}
```

---

## API 1 — `/api/reports/data`

### Method + params

```
GET /api/reports/data?month=2026-05
```

### Queries yang dijalankan

```ts
// 1. Metric cards — bulan ini
SELECT type, SUM(amount) FROM transactions
WHERE user_id = X AND date_trunc('month', date) = $month
GROUP BY type

// 2. Metric cards — bulan lalu (untuk % change)
SELECT type, SUM(amount) FROM transactions
WHERE user_id = X AND date_trunc('month', date) = $prev_month
GROUP BY type

// 3. Category breakdown
SELECT category_key, SUM(amount) as total
FROM transactions
WHERE user_id = X AND type = 'expense'
  AND date_trunc('month', date) = $month
GROUP BY category_key ORDER BY total DESC

// 4. Category breakdown bulan lalu (untuk % change)
SELECT category_key, SUM(amount) as total
FROM transactions
WHERE user_id = X AND type = 'expense'
  AND date_trunc('month', date) = $prev_month
GROUP BY category_key

// 5. 6-month trend
SELECT date_trunc('month', date) as month, SUM(amount) as total
FROM transactions
WHERE user_id = X AND type = 'expense'
  AND date >= $6_months_ago
GROUP BY 1 ORDER BY 1 ASC

// 6. Most expensive single transaction (highlights)
SELECT description, amount, date FROM transactions
WHERE user_id = X AND type = 'expense'
  AND date_trunc('month', date) = $month
ORDER BY amount DESC LIMIT 1

// 7. Transaction count + average
SELECT COUNT(*), AVG(amount) FROM transactions
WHERE user_id = X AND date_trunc('month', date) = $month

// 8. New subscriptions (descriptions that appear this month but not last)
SELECT DISTINCT description FROM transactions
WHERE user_id = X AND date_trunc('month', date) = $month
  AND description NOT IN (
    SELECT description FROM transactions
    WHERE user_id = X
      AND date_trunc('month', date) = $prev_month
  )
  AND LOWER(description) SIMILAR TO '%netflix%|%spotify%|%youtube%|
    %subscription%|%langganan%|%premium%|%plus%'
LIMIT 5
```

### Kalkulasi savings rate

```ts
const savingsRate = Math.round((saved / totalIncome) * 100)

// Savings rate benchmark (rule of thumb)
const savingsRateStatus =
  savingsRate >= 20 ? 'above_average' :
  savingsRate >= 10 ? 'average' :
  'below_average'
```

---

## API 2 — `/api/ai/report` (update prompt lama)

### Perubahan dari prompt lama

**Prompt lama (PRD v1.3):**
Return plain narrative text, 4-5 kalimat.

**Prompt baru:**
Return structured JSON dengan `summary` (3 paragraf) dan
`recommendations` (3 card dengan title, description, outcome).

### Prompt baru

```
You are a personal finance advisor writing a monthly report.

User's financial data for {month}:
- Total spent: Rp {totalSpent}
- Total income: Rp {totalIncome}
- Saved: Rp {saved} ({savingsRate}% savings rate)
- Spending change vs last month: {spentChange}%
- Category breakdown: {categoryBreakdown_json}
- Biggest category change: {biggestMover} ({biggestMoverChange}%)
- New subscriptions detected: {newSubscriptions}
- Most expensive single transaction: Rp {maxTx} ({maxTxDesc})

Respond ONLY with valid JSON in this exact format:
{
  "summary": {
    "paragraph1": "Overall spending and income summary with savings rate.",
    "paragraph2": "Analysis of the biggest category change and what drove it.",
    "paragraph3": "A positive observation or notable outlier, reassuring tone."
  },
  "recommendations": [
    {
      "id": "01",
      "title": "Short action title",
      "description": "2-3 sentences. Specific, data-driven, actionable.",
      "outcome": "Short result label e.g. Save Rp 60K"
    },
    {
      "id": "02",
      "title": "Short action title",
      "description": "2-3 sentences.",
      "outcome": "Short result label"
    },
    {
      "id": "03",
      "title": "Short action title",
      "description": "2-3 sentences.",
      "outcome": "Short result label"
    }
  ]
}

Rules:
- Respond in {language === 'en' ? 'English' : 'Bahasa Indonesia'}
- Tone: friendly, direct, second-person ("you" / "kamu")
- Use specific numbers from the data — never guess
- Bold key numbers and percentages using **bold** markdown inside paragraph strings
- "paragraph1" covers: total spend, income, savings rate
- "paragraph2" covers: biggest mover category + driver (new subscriptions if applicable)
- "paragraph3" covers: something positive (a category that decreased, or good savings rate)
- Each recommendation must reference a specific number from the data
- "outcome" must be concise (max 4 words)
- Return ONLY valid JSON, no markdown fences
```

### Parse response

```ts
const raw = await gemini.generateContent(prompt)
const text = raw.response.text().trim().replace(/```json|```/g, '')

try {
  const aiContent: AIReportContent = JSON.parse(text)
  return Response.json(aiContent)
} catch {
  return Response.json({
    summary: { paragraph1: '', paragraph2: '', paragraph3: '' },
    recommendations: []
  })
}
```

### Cache AI content ke `ai_insights`

```ts
// Simpan ke DB agar tidak re-generate setiap load
await supabase.from('ai_insights').upsert({
  user_id: userId,
  type: 'monthly_report',
  month: month,          // "2026-05"
  language: language,
  content: JSON.stringify(aiContent),
  is_read: false,
})

// Cek cache sebelum AI call:
const cached = await supabase
  .from('ai_insights')
  .select('content')
  .eq('user_id', userId)
  .eq('type', 'monthly_report')
  .eq('month', month)
  .eq('language', language)
  .single()

if (cached.data) return Response.json(JSON.parse(cached.data.content))
// else → generate baru
```

---

## Section 1 — Dark header banner

```tsx
<div className="report-header">
  {/* Background: var(--ink) dark */}
  <div className="report-header-content">
    <div>
      <h1 className="report-month">{monthLabel} {year}</h1>
      <p className="report-meta">
        <CalendarIcon />
        {dateRange} · {t('report.generated_on', lang)} {generatedDate}
      </p>
    </div>
    <button className="export-btn" title="Export PDF">
      <DownloadIcon />
    </button>
  </div>
</div>
```

### CSS
```css
.report-header {
  background: var(--ink);
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 20px;
}
.report-month {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px;
}
.report-meta {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.export-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}
.export-btn:hover { background: rgba(255,255,255,0.18); }
```

---

## Section 2 — 4 metric cards

```tsx
<div className="metrics-grid">

  <MetricCard
    label={t('report.total_spent', lang)}
    value={fmt(metrics.totalSpent)}
    change={metrics.spentChange}
    changeLabel={t('report.vs_last_month', lang)}
  />

  <MetricCard
    label={t('report.total_income', lang)}
    value={fmt(metrics.totalIncome)}
  />

  <MetricCard
    label={t('report.saved', lang)}
    value={fmt(metrics.saved)}
    accent
  />

  {/* Savings rate card — special styling */}
  <div className="metric-card savings-rate-card">
    <span className="metric-label">{t('report.savings_rate', lang)}</span>
    <span className="metric-value accent">
      {metrics.savingsRate}%
    </span>
    <span className={`rate-status ${metrics.savingsRateStatus}`}>
      {savingsRateLabel[metrics.savingsRateStatus][lang]}
      {metrics.savingsRateStatus === 'above_average' && ' 🔥'}
    </span>
  </div>

</div>
```

### Savings rate labels
```ts
const savingsRateLabel = {
  above_average: { id: 'Di atas rata-rata', en: 'Above average' },
  average:       { id: 'Rata-rata',         en: 'Average' },
  below_average: { id: 'Di bawah rata-rata',en: 'Below average' },
}
```

### CSS
```css
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
@media (max-width: 768px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
.savings-rate-card {
  background: var(--accent-soft);
  border: 1px solid rgba(16,185,129,0.2);
}
.savings-rate-card .metric-value { color: var(--accent); }
.rate-status {
  font-size: 12px;
  font-weight: 500;
  margin-top: 2px;
}
.rate-status.above_average { color: var(--accent-2); }
.rate-status.average       { color: var(--amber); }
.rate-status.below_average { color: var(--danger); }
```

---

## Section 3 — AI Summary card

```tsx
<div className="summary-card">

  <div className="summary-header">
    <div className="summary-icon">
      <SparkleIcon />
    </div>
    <div>
      <h3>{t('report.summary_title', lang)}</h3>
      <span className="ai-label">{t('report.ai_generated', lang)}</span>
    </div>
    <button className="close-btn" onClick={dismissSummary}>×</button>
  </div>

  <div className="summary-body">
    {/* Render paragraf dengan **bold** markdown inline */}
    <p>{renderBold(aiContent.summary.paragraph1)}</p>
    <p>{renderBold(aiContent.summary.paragraph2)}</p>
    <p>{renderBold(aiContent.summary.paragraph3)}</p>
  </div>

</div>
```

### renderBold helper (parse `**text**` → `<strong>`)
```ts
function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: 'var(--ink)' }}>{part}</strong>
      : part
  )
}
```

---

## Section 4 — Category breakdown + 6-month trend (2-column)

```tsx
<div className="two-col-grid">

  {/* Left: Category breakdown */}
  <div className="card">
    <div className="card-header">
      <PieIcon />
      <h4>{t('report.category_breakdown', lang)}</h4>
    </div>
    <div className="breakdown-layout">
      <DonutChart data={categoryBreakdown} />
      <ul className="breakdown-list">
        {categoryBreakdown.map(cat => (
          <li key={cat.categoryKey}>
            <span className="cat-dot" style={{ background: categoryColor[cat.categoryKey] }} />
            <span className="cat-name">{t(`categories.${cat.categoryKey}`, lang)}</span>
            <span className={`cat-change ${cat.vsLastMonth > 0 ? 'up' : 'down'}`}>
              {cat.vsLastMonth > 0 ? '↑' : '↓'}{Math.abs(cat.vsLastMonth)}%
            </span>
            <span className="cat-total mono">{shortFmt(cat.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>

  {/* Right: 6-month trend */}
  <div className="card">
    <div className="card-header">
      <BarChartIcon />
      <h4>{t('report.six_month_trend', lang)}</h4>
    </div>
    <TrendBarChart data={monthlyTrend} currentMonth={month} />
  </div>

</div>
```

### TrendBarChart — current month darker
```tsx
// Bar warna: bulan ini = var(--ink), bulan lalu = var(--bg-muted)
// Label nilai di atas bar: shortFmt (e.g. 2.3M)
// Label bulan di bawah bar: "Dec", "Jan", etc.
```

---

## Section 5 — Biggest movers + Highlights (2-column)

```tsx
<div className="two-col-grid">

  {/* Left: Biggest movers */}
  <div className="card">
    <div className="card-header">
      <TrendingIcon />
      <h4>{t('report.biggest_movers', lang)}</h4>
    </div>
    <ul className="movers-list">
      {biggestMovers.map(mover => (
        <li key={mover.categoryKey} className="mover-row">
          <span className={`mover-arrow ${mover.direction}`}>
            {mover.direction === 'up' ? '↗' : '↘'}
          </span>
          <div className="mover-info">
            <span className="mover-name">
              {t(`categories.${mover.categoryKey}`, lang)}
            </span>
            <span className="mover-range mono">
              Rp {shortFmt(mover.previousMonth)} → Rp {shortFmt(mover.thisMonth)}
            </span>
          </div>
          <div className="mover-delta">
            <span className={`mover-pct ${mover.direction}`}>
              {mover.direction === 'up' ? '+' : ''}{mover.changePercent}%
            </span>
            <span className={`mover-abs mono ${mover.direction}`}>
              {mover.direction === 'up' ? '+' : ''}Rp {shortFmt(mover.changeAbsolute)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  </div>

  {/* Right: Highlights 2x2 grid */}
  <div className="card">
    <div className="card-header">
      <SparkleIcon />
      <h4>{t('report.highlights', lang)}</h4>
    </div>
    <div className="highlights-grid">

      <div className="highlight-card red">
        <span className="highlight-label">
          {t('report.most_expensive_day', lang)}
        </span>
        <span className="highlight-value">
          {formatDate(highlights.mostExpensiveDay.date, lang)}
        </span>
        <span className="highlight-sub">
          {highlights.mostExpensiveDay.description} Rp {shortFmt(highlights.mostExpensiveDay.amount)}K
        </span>
      </div>

      <div className="highlight-card amber">
        <span className="highlight-label">
          {t('report.top_category', lang)}
        </span>
        <span className="highlight-value">
          {t(`categoriesShort.${highlights.topCategory.categoryKey}`, lang)}
        </span>
        <span className="highlight-sub">
          {highlights.topCategory.percentage}% {t('report.of_spending', lang)}
        </span>
      </div>

      <div className="highlight-card blue">
        <span className="highlight-label">
          {t('report.transactions', lang)}
        </span>
        <span className="highlight-value">
          {highlights.transactionCount.total} {t('report.transactions_unit', lang)}
        </span>
        <span className="highlight-sub">
          Rp {shortFmt(highlights.transactionCount.averageAmount)}K {t('report.average', lang)}
        </span>
      </div>

      <div className="highlight-card green">
        <span className="highlight-label">
          {t('report.new_subscriptions', lang)}
        </span>
        <span className="highlight-value">
          {highlights.newSubscriptions.count} {t('report.detected', lang)}
        </span>
        <span className="highlight-sub">
          {highlights.newSubscriptions.names.join(', ')}
        </span>
      </div>

    </div>
  </div>

</div>
```

### CSS highlights
```css
.highlights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.highlight-card {
  background: var(--bg-soft);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.highlight-label {
  font-size: 11px;
  color: var(--ink-5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.highlight-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
}
.highlight-sub {
  font-size: 12px;
  color: var(--ink-4);
}

/* Accent dot per card type */
.highlight-card.red    { border-left: 3px solid var(--danger); }
.highlight-card.amber  { border-left: 3px solid var(--amber); }
.highlight-card.blue   { border-left: 3px solid #3b82f6; }
.highlight-card.green  { border-left: 3px solid var(--accent); }
```

---

## Section 6 — AI Recommendations

```tsx
<div className="card recommendations-card">

  <div className="rec-header">
    <div className="rec-icon"><SparkleIcon /></div>
    <div>
      <h3>{t('report.ai_recommendations', lang)}</h3>
      <span className="rec-subtitle">
        {t('report.steps_next_month', lang)}
      </span>
    </div>
    <span className="badge ai">AI</span>
  </div>

  <div className="rec-grid">
    {aiContent.recommendations.map(rec => (
      <div key={rec.id} className="rec-card">
        <div className="rec-number">{rec.id}</div>
        <h4 className="rec-title">{rec.title}</h4>
        <p className="rec-desc">{rec.description}</p>
        <div className="rec-outcome">
          <CheckIcon />
          <span>{rec.outcome}</span>
        </div>
      </div>
    ))}
  </div>

</div>
```

### CSS
```css
.rec-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
}
@media (max-width: 768px) {
  .rec-grid { grid-template-columns: 1fr; }
}
.rec-card {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.rec-number {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-5);
  letter-spacing: 0.06em;
}
.rec-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}
.rec-desc {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.5;
  flex: 1;
  margin: 0;
}
.rec-outcome {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--accent-2);
  margin-top: 4px;
}
```

---

## Section 7 — Bottom CTA bar

```tsx
<div className="report-cta-bar">
  <span>{t('report.cta_question', lang)}</span>
  <button
    className="cta-ask-btn"
    onClick={() => router.push(`/chat?q=Tell me more about my ${monthLabel} report`)}
  >
    {t('report.ask_advisor', lang)} →
  </button>
</div>
```

### CSS
```css
.report-cta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--ink);
  color: #fff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-top: 24px;
  font-size: 14px;
}
.cta-ask-btn {
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.cta-ask-btn:hover { background: rgba(255,255,255,0.18); }
```

---

## Month navigation

### Behaviour
- Pengguna bisa navigasi ke laporan bulan sebelumnya
- Navigasi via URL: `/reports?month=2026-04`
- Default: bulan terakhir yang ada laporannya di `ai_insights`
- Jika bulan yang dipilih belum ada laporan → tampilkan empty state

### Component
```tsx
<div className="month-nav">
  <button onClick={prevMonth} disabled={!hasPrevReport}>
    ← {prevMonthLabel}
  </button>
  <span className="current-month">{currentMonthLabel}</span>
  <button onClick={nextMonth} disabled={isCurrentMonth}>
    {nextMonthLabel} →
  </button>
</div>
```

---

## Bilingual COPY object (additions)

```ts
report: {
  generated_on:       { id: 'Dibuat pada',         en: 'Generated on' },
  total_spent:        { id: 'Total Pengeluaran',    en: 'Total Spent' },
  total_income:       { id: 'Total Pemasukan',      en: 'Total Income' },
  saved:              { id: 'Tersimpan',            en: 'Saved' },
  savings_rate:       { id: 'Tingkat Tabungan',     en: 'Savings Rate' },
  vs_last_month:      { id: 'vs bulan lalu',        en: 'vs last month' },
  summary_title:      { id: 'Ringkasan',            en: 'Summary' },
  ai_generated:       { id: 'Dibuat AI',            en: 'AI-generated' },
  category_breakdown: { id: 'Breakdown Kategori',   en: 'Category breakdown' },
  six_month_trend:    { id: 'Tren 6 Bulan',         en: '6-month trend' },
  biggest_movers:     { id: 'Perubahan Terbesar',   en: 'Biggest movers' },
  highlights:         { id: 'Sorotan',              en: 'Highlights' },
  most_expensive_day: { id: 'Hari termahal',        en: 'Most expensive day' },
  top_category:       { id: 'Kategori teratas',     en: 'Top category' },
  transactions:       { id: 'Transaksi',            en: 'Transactions' },
  transactions_unit:  { id: 'transaksi',            en: 'transactions' },
  average:            { id: 'rata-rata',            en: 'average' },
  new_subscriptions:  { id: 'Langganan baru',       en: 'New subscriptions' },
  detected:           { id: 'terdeteksi',           en: 'detected' },
  of_spending:        { id: 'dari pengeluaran',     en: 'of spending' },
  ai_recommendations: { id: 'Rekomendasi AI',       en: 'AI recommendations' },
  steps_next_month:   { id: '3 langkah bulan depan', en: '3 steps for next month' },
  cta_question:       { id: 'Ada pertanyaan tentang laporan ini?', en: 'Have questions about this report?' },
  ask_advisor:        { id: 'Tanya Advisor',        en: 'Ask the Advisor' },
  empty_state:        { id: 'Laporan pertamamu akan muncul di awal bulan depan.', en: 'Your first report will appear at the start of next month.' },
  loading:            { id: 'Memuat laporan...',    en: 'Loading report...' },
}
```

---

## Skeleton loading (update dari PRD)

PRD mendefinisikan skeleton hanya "3 paragraph lines". Ini spec lengkap:

```tsx
// Skeleton untuk semua section
<SkeletonReportHeader />       {/* dark bar h-20 */}
<SkeletonMetricsRow />         {/* 4 cards h-24 */}
<SkeletonSummaryCard />        {/* paragraph lines w-full, w-4/5, w-3/5 */}
<SkeletonTwoColRow />          {/* 2 cards h-64 side by side */}
<SkeletonTwoColRow />          {/* 2 cards h-64 side by side */}
<SkeletonRecommendations />    {/* 3 cards h-40 */}
```

---

## Empty state (update dari PRD)

PRD: satu copy string.
Spec baru: full empty state component.

```tsx
// Kondisi 1: Belum ada data bulan ini
<EmptyState
  icon={<DocumentIcon />}
  title={t('report.empty_state', lang)}
  subtitle={t('report.empty_sub', lang)}
  // Tidak ada CTA — user hanya perlu menunggu
/>

// Kondisi 2: Data bulan ada tapi AI report belum di-generate
<GeneratingState
  title={t('report.generating', lang)}
  subtitle={t('report.generating_sub', lang)}
  // Spinner + progress text
/>
```

---

## Files yang perlu dibuat / diubah

| File | Jenis |
|---|---|
| `types/report.ts` | Buat baru — ReportData + AIReportContent types |
| `app/api/reports/data/route.ts` | Buat baru — kalkulasi data dari DB |
| `app/api/ai/report/route.ts` | Update — prompt baru + return JSON + caching |
| `app/(app)/reports/page.tsx` | Rebuild penuh sesuai spec |
| `app/(app)/reports/components/ReportHeader.tsx` | Buat baru |
| `app/(app)/reports/components/MetricsRow.tsx` | Buat baru |
| `app/(app)/reports/components/SummaryCard.tsx` | Buat baru |
| `app/(app)/reports/components/CategoryBreakdown.tsx` | Buat baru |
| `app/(app)/reports/components/TrendBarChart.tsx` | Buat baru |
| `app/(app)/reports/components/BiggestMovers.tsx` | Buat baru |
| `app/(app)/reports/components/HighlightsGrid.tsx` | Buat baru |
| `app/(app)/reports/components/AIRecommendations.tsx` | Buat baru |
| `app/(app)/reports/components/ReportCTABar.tsx` | Buat baru |
| `app/(app)/reports/components/SkeletonReport.tsx` | Buat baru |

---



The report page needs to be built from near-scratch.
The PRD only defined narrative text — the full layout with 8 sections
is new and defined entirely in this document.
Implement in this order:

1. types/report.ts — ReportData and AIReportContent interfaces

2. app/api/reports/data/route.ts
   - GET with ?month=YYYY-MM param
   - Run all 8 Supabase queries defined in the doc
   - Calculate savings rate + status
   - Return typed ReportData JSON

3. app/api/ai/report/route.ts
   - Check ai_insights cache first (same month + language)
   - If cache hit: return cached content
   - If cache miss: call Gemini with new JSON prompt, parse, cache, return
   - Return typed AIReportContent JSON

4. Build components in this order (simplest first):
   ReportHeader → MetricsRow → SummaryCard → TrendBarChart
   → CategoryBreakdown → BiggestMovers → HighlightsGrid
   → AIRecommendations → ReportCTABar → SkeletonReport

5. app/(app)/reports/page.tsx
   - Fetch both APIs in parallel (Promise.all)
   - Show SkeletonReport while loading
   - Compose all 8 sections
   - Add month navigation via URL param

Constraints:
- Use ONLY CSS variables from the design system (--ink, --surface, --accent, etc.)
- Use ONLY animation keyframes already defined (fadeIn, slideUp, shimmer)
- Use existing COPY pattern (t('key', lang) function)
- Do NOT modify any existing page or component outside /reports
- TrendBarChart and DonutChart: use SVG only — do not add recharts for this page
```
