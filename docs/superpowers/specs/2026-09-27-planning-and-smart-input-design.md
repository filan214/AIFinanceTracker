# Planning & Smart Input — Design Spec

_Date: 2026-09-27 · Status: approved in chat, pending written-spec review_

## 1. Goal

Add six features to Smart Finn Track so the portfolio demo shows both deeper
AI use and solid full-stack work:

| # | Feature | Group |
|---|---|---|
| 1 | Quick-add from natural-language text | Smart input |
| 2 | Receipt scan (photo → draft transaction) | Smart input |
| 3 | Category budgets | Planning |
| 4 | Savings goals | Planning |
| 5 | Recurring transactions | Planning |
| 6 | Bank CSV import | Smart input |

Plus: chat advisor tools for budgets/goals, and a demo seed so every feature
looks alive on the demo account.

### Constraints

- Rp 0/month operating cost (Vercel Hobby, Supabase free, OpenRouter Gemini).
- Fully bilingual (`messages/en.json` + `messages/id.json`); no hardcoded UI strings.
- Mobile-friendly; existing desktop layout unchanged.
- RLS on every new table.
- No Supabase service-role key and no Supabase CLI in the project: schema
  changes are SQL files the user runs in the Supabase SQL Editor.
- Vercel request body limit 4.5 MB.

### Success criteria

- Each feature works end-to-end on production with the demo account, desktop
  and 375px.
- Pure logic covered by vitest; `npm test`, `typecheck`, `lint`, `build` clean.
- AI failure never blocks a user flow (PRD §14 availability rule).

### Out of scope (YAGNI)

Per-month budget overrides, weekly/yearly recurrence, goal withdrawals,
storing receipt images, bank-specific CSV presets, AI-based CSV column
detection, multi-currency.

## 2. Architecture

Follow the existing pattern (approach A):

- **API routes** under `src/app/api/...`, each: `createServerSupabase()` →
  `auth.getUser()` → 401 if absent → zod-validate body → query with explicit
  `.eq("user_id", user.id)` in addition to RLS.
- **Client fetch helpers** in `src/lib/api.ts` (same style as
  `fetchTransactions`/`createTransaction`).
- **Pure logic** in small modules under `src/lib/`, each with a colocated
  `*.test.ts`. UI and routes call these; they have no I/O.
- **AI calls** go through `src/lib/llm.ts` (OpenRouter →
  `google/gemini-2.5-flash`). A new helper is added there for multimodal
  (image) prompts.

### New files (planned)

```
supabase/planning.sql                         schema changes (user runs)
supabase/Seed Planning for Demo User.sql      demo seed (user runs)

src/lib/quick-parse.ts (+test)                rule-based text → draft
src/lib/budget-progress.ts (+test)            budget math
src/lib/goal-progress.ts (+test)              goal math
src/lib/recurring-due.ts (+test)              due-occurrence calculation
src/lib/csv/parse.ts (+test)                  CSV text → rows
src/lib/csv/map.ts (+test)                    column guessing, value parsing, dedupe
src/lib/csv/batch.ts (+test)                  batching + AI category parsing
src/lib/image-resize.ts                       browser-side downscale (no test; DOM)

src/app/api/ai/parse/route.ts                 quick-add AI
src/app/api/ai/receipt/route.ts               receipt AI
src/app/api/budgets/route.ts                  GET/POST(upsert)/DELETE
src/app/api/goals/route.ts                    GET/POST/PATCH/DELETE
src/app/api/goals/contributions/route.ts      POST/DELETE
src/app/api/recurring/route.ts                GET/POST/PATCH/DELETE
src/app/api/recurring/run/route.ts            catch-up materialization
src/app/api/transactions/import/route.ts      bulk insert + AI categorize

src/app/(app)/planning/page.tsx               tabs: budgets | goals | recurring
src/components/planning/*                     budget list/row/form, goal card/form,
                                              contribution form, recurring list/form
src/components/dashboard/budget-card.tsx
src/components/dashboard/goal-card.tsx
src/components/transactions/smart-input.tsx   quick-add box + receipt button
src/components/transactions/csv-import-modal.tsx
src/components/recurring-runner.tsx           mounts in (app)/layout, runs once/session
```

Modified: `transaction-modal.tsx` (accepts prefilled draft, hosts smart input),
`transactions/page.tsx` (Import button), `dashboard/page.tsx` (two cards),
`(app)/layout.tsx` (recurring runner), `sidebar.tsx` (Planning nav item),
`settings/page.tsx` (Planning link), `src/lib/ai/tools.ts` + `prompts.ts`
(chat tools), `src/lib/llm.ts` (image helper), `src/lib/api.ts`, both message files.

## 3. Data model (`supabase/planning.sql`)

All tables: `id uuid pk default gen_random_uuid()`, `user_id uuid not null
references auth.users(id) on delete cascade`, RLS enabled with policy
`for all using (auth.uid() = user_id) with check (auth.uid() = user_id)`.
The file is idempotent (`if not exists`, `drop policy if exists`).

### `budgets`
| column | type | notes |
|---|---|---|
| category_key | text not null | check in expense keys (food, transport, entertainment, shopping, bills, health, education, savings) |
| amount | numeric not null | check `> 0` |
| created_at / updated_at | timestamptz | default now() |

`unique (user_id, category_key)`. One limit applies to every month.

### `savings_goals`
| column | type | notes |
|---|---|---|
| name | text not null | check length 1–60 |
| target_amount | numeric not null | check `> 0` |
| target_date | date | nullable |
| created_at | timestamptz | default now() |

### `goal_contributions`
| column | type | notes |
|---|---|---|
| goal_id | uuid not null | references savings_goals(id) on delete cascade |
| amount | numeric not null | check `> 0` |
| date | date not null | default current_date |
| created_at | timestamptz | default now() |

Index `(goal_id, date desc)`.

### `recurring_rules`
| column | type | notes |
|---|---|---|
| description | text not null | |
| amount | numeric not null | check `> 0` |
| type | text not null | check in ('income','expense') |
| category_key | text not null | |
| day_of_month | int not null | check 1–31 |
| start_date | date not null | default current_date |
| last_generated_month | text | 'YYYY-MM', nullable = never generated |
| active | boolean not null | default true |
| created_at | timestamptz | default now() |

### `transactions` change
- `add column if not exists recurring_rule_id uuid references recurring_rules(id) on delete set null`
- `create unique index if not exists uq_tx_recurring_occurrence on transactions(recurring_rule_id, date) where recurring_rule_id is not null`

The partial unique index makes materialization idempotent under races
(`upsert ... onConflict ignoreDuplicates`).

## 4. Features

### 4.1 Quick-add from text

**UI.** `TransactionModal` gets a ✨ text box at the top ("e.g. makan siang 35rb
kemarin") and a **Fill** button. On success the form fields are prefilled; the
user reviews and presses Save as before. Never auto-saves.

**Logic.**
1. `quickParse(text, today)` (pure, `src/lib/quick-parse.ts`) extracts:
   - amount: `35rb`/`35k` → 35000, `1,5jt`/`1.5jt`/`1.5m` → 1500000,
     `Rp 12.000` → 12000, plain `50000`.
   - date: `kemarin`/`yesterday` → today−1, `hari ini`/`today` → today,
     anything else → today.
   - type: income keywords (`gaji`, `salary`, `income`, `bonus`, `freelance`,
     `refund`, `dapat`, `terima`) → income, else expense.
   - description: text with amount/date tokens removed, trimmed, capitalized.
2. `POST /api/ai/parse { text }` → server runs `quickParse` first, then asks
   the LLM for JSON `{amount, type, description, date, category_key}` given the
   text + today (Asia/Jakarta). Response validated with zod; any invalid field
   falls back to the rule-based value. If the LLM call throws, returns the
   rule-based result with `category_key` = `shopping` (expense) or `income` (income). default

3. Client prefills the modal from the response.

### 4.2 Receipt scan

**UI.** 📷 button next to the quick-add box. `<input type="file"
accept="image/*" capture="environment">`. Spinner while reading.

**Logic.**
1. `resizeImage(file, 1600)` in the browser → JPEG quality 0.8 → base64 data URL.
   Reject if result > 3 MB (well under 4.5 MB body limit).
2. `POST /api/ai/receipt { image: dataUrl }` → zod checks it is a
   `data:image/(jpeg|png|webp);base64,` string ≤ 4 MB. New `askLLMWithImage`
   helper in `llm.ts` sends a multimodal message. Prompt asks for JSON
   `{total, date, merchant, category_key}`; the grand total, not subtotal.
3. Response validated; maps to a draft (`type: "expense"`, description =
   merchant). Missing date → today. If nothing usable, 422 with a localized
   "Couldn't read receipt" message; modal stays open for manual entry.
4. Image is never stored.

### 4.3 Planning page `/planning`

New sidebar item "Planning" (icon `Target`) between Transactions and Reports.
Mobile bottom bar unchanged; mobile users reach it via the dashboard cards and
a Settings link. Three tabs with URL state `?tab=budgets|goals|recurring`
(default budgets). Each tab: skeleton while loading, empty state with CTA.

#### Budgets tab
- Month picker (reuse `components/ui/month-picker.tsx`), default current month.
- Row per budget: category badge, progress bar, "Rp spent of Rp limit",
  remaining or over amount, days left in month (only for current month).
- Add/edit via a small form (category select limited to categories without a
  budget + amount). Delete with the existing confirm pattern (no `window.confirm`).
- `budgetProgress(spent, limit)` → `{ pct, status: "ok"|"warn"|"over" }`,
  `ok` < 80%, `warn` 80–100%, `over` > 100%.
- Data: `GET /api/budgets?month=YYYY-MM` returns budgets joined with that
  month's expense totals per category (computed server-side from
  `transactions`).

#### Goals tab
- Goal cards: name, progress bar, "Rp saved of Rp target", target date, and
  "Rp X/month needed" when a target date exists and the goal is not met.
- `goalProgress(saved, target, targetDate, today)` →
  `{ pct, remaining, monthsLeft, perMonth, status: "active"|"done"|"overdue" }`.
  `monthsLeft` counts whole calendar months including the current one, min 1.
- **Add top-up** form: amount, date (default today), checkbox "Also record as a
  Savings expense". When checked the route also inserts a normal
  `transactions` row (`type expense`, `category_key savings`, description
  `"<goal name>"`). The two rows are not linked.
- Expandable history of contributions with delete.
- CRUD: `/api/goals` (GET returns goals with summed contributions),
  `/api/goals/contributions` (POST, DELETE).

#### Recurring tab
- Rule list: description, amount (colored by type), "Every <day>", next date,
  active toggle, edit/delete.
- Form: description, amount, type, category, day of month, start date.
- Deleting a rule keeps already-generated transactions (FK `on delete set null`).

### 4.4 Dashboard cards

Below the chart row, a two-column row (stacked on mobile):
- **BudgetCard**: top 3 budgets by `pct` for the dashboard's selected month +
  "View all →" `/planning?tab=budgets`. Empty: "Set a budget" CTA.
- **GoalCard**: the active goal with the highest `pct` (or nearest target date
  when tied) + "View all →". Empty: "Create a goal" CTA.

### 4.5 Recurring materialization

`recurringDue(rule, today)` (pure) → list of `YYYY-MM-DD` dates to generate:
- Iterate months from `max(start month, last_generated_month + 1)` to the
  current month.
- Occurrence date = `min(day_of_month, lastDayOfMonth)`.
- Include only if `date >= start_date` and `date <= today`.
- Inactive rule → empty list.
- Also returns `newLastGeneratedMonth` = month of the last included occurrence
  (unchanged if none).

`POST /api/recurring/run`: for each active rule, compute due dates, upsert
transactions with `recurring_rule_id` (`onConflict: "recurring_rule_id,date",
ignoreDuplicates: true`), update `last_generated_month`, return
`{ created: number }`.

`<RecurringRunner />` in `(app)/layout.tsx`: runs once per browser session
(`sessionStorage` flag, wrapped in try/catch), shows a toast
"N recurring transactions added" when `created > 0`, and dispatches a
`transactions:changed` window event that dashboard/transactions pages listen to
for refetch. Failure is logged to console only.

### 4.6 Bank CSV import

**UI.** "Import" button on the Transactions page header opens
`CsvImportModal`:
1. File picker (`.csv`, ≤ 1 MB).
2. Mapping row: dropdowns for Date, Description, Amount, and optional
   Debit/Credit or Type columns, prefilled by guesses; date-format select
   (`dd/mm/yyyy` default, `mm/dd/yyyy`, `yyyy-mm-dd`).
3. Preview table (first 500 rows): checkbox, date, description, amount, type.
   Invalid rows shown disabled with reason. Likely duplicates unchecked with a
   "duplicate?" badge.
4. **Import N** button → progress → toast "N imported" → refetch.

**Logic (pure).**
- `parseCsv(text)`: auto-detect delimiter (`,` `;` `\t`) from the header line;
  RFC-4180 quoting; strips BOM; skips empty lines.
- `guessMapping(headers, sampleRows)`: header keywords — date: `tanggal, tgl,
  date`; description: `keterangan, deskripsi, description, uraian, remark`;
  amount: `jumlah, amount, nominal, mutasi`; debit: `debit, db, keluar`; credit:
  `kredit, credit, cr, masuk`. Falls back to value patterns (date-like, numeric).
- `parseAmount(raw)`: handles `1.234.567,00` (ID) and `1,234,567.00` (EN),
  `Rp`, spaces, parentheses/leading minus as negative, trailing `CR`/`DB`.
  Sign or CR/DB or separate debit/credit columns determine type.
- `parseDate(raw, format)` → `YYYY-MM-DD` or null.
- `markDuplicates(rows, existing)`: key = `date|amount|normalized description`.

**Server.** `POST /api/transactions/import { rows: Draft[] }` (zod, 1–500 rows):
1. Split expense rows into batches of 50 (`chunk`), one LLM call per batch
   returning a JSON array of category keys in order; `parseCategoryBatch`
   validates length/keys, falling back to `shopping` per invalid entry and for
   the whole batch on error. Income rows get `income` without AI.
2. Single bulk insert. Returns `{ inserted }`.

Existing transactions for duplicate detection are fetched client-side via
`fetchTransactions` for the CSV's date range.

### 4.7 Chat advisor tools

Add to `buildChatTools`:
- `getBudgets({ month? })` → budgets with spent/pct/status for the month
  (default current).
- `getGoals()` → goals with saved/pct/perMonth/targetDate.

System prompt gains one line: use these tools for budget or goal questions.

### 4.8 i18n

New namespaces `planning`, `smartInput`, `csvImport`, plus keys in
`dashboard`, `nav`, `settings`. Both files kept in identical key structure.
AI outputs that surface to the user (none of these features produce prose
except error messages) use localized strings from the message files.

## 5. Error handling

| Case | Behavior |
|---|---|
| LLM error / invalid JSON (quick-add) | Return rule-based parse; UI still prefills |
| LLM error (receipt) | 422 + localized message; manual entry |
| LLM error (CSV categorize) | Default category, import continues |
| Invalid request body | 400 with zod message |
| Not logged in | 401 |
| Recurring run failure | Console log only; retry next session |
| Oversize image / CSV | Blocked client-side with localized message |
| Duplicate recurring occurrence | Ignored by unique index |

## 6. Testing

TDD with vitest for every pure module in §2. Key cases:

- **quick-parse**: `35rb`, `35k`, `1,5jt`, `1.5jt`, `Rp 12.000`, `50000`; kemarin,
  yesterday, default today; income keywords; description cleanup; no amount → 0.
- **budget-progress**: 0%, 79.9% ok, 80% warn, 100% warn, 100.1% over, limit
  guards.
- **goal-progress**: done, active with/without date, overdue, months-left
  rounding, perMonth.
- **recurring-due**: day 31 in Feb (leap and non-leap), 30-day months,
  multi-month catch-up across year boundary, start mid-month after the day,
  future start, inactive, already generated this month, occurrence later this
  month not yet due.
- **csv/parse**: comma/semicolon/tab, quoted fields with delimiters and escaped
  quotes, BOM, CRLF, empty lines.
- **csv/map**: header guessing (ID + EN), value-pattern fallback, amount formats,
  CR/DB, debit/credit columns, date formats, duplicate marking.
- **csv/batch**: chunk sizes, category response parsing (valid, wrong length,
  unknown key, non-JSON).

Plus `npm run typecheck`, `lint`, `build` per phase, and a Chrome check on the
demo account at desktop and 375px after the final phase (including the
leftover Reports PDF download check).

## 7. Demo seed (`supabase/Seed Planning for Demo User.sql`)

Idempotent (deletes the demo user's rows in the new tables and Aug–Sep 2026
transactions first). Looks up the demo user by email like the existing seeds.
- Transactions for **Aug and Sep 2026** following the existing seed's style, so
  the current month is not empty.
- Budgets: food, transport, entertainment, shopping (one near/over its limit
  for visual interest).
- Goals: "Laptop baru" (target Rp 12.000.000, Dec 2026, several top-ups);
  "Dana darurat" (no target date).
- Recurring: monthly salary (25th, income), Spotify (5th), kos rent (1st),
  with `last_generated_month = '2026-09'` so the runner does not duplicate seeded
  September rows.

## 8. Rollout (phases, one commit each to `main`; user pushes)

1. Quick-add
2. Receipt scan
3. `planning.sql` + demo seed → **user runs both in SQL Editor** → Planning
   page shell + Budgets + BudgetCard
4. Goals + GoalCard
5. Recurring rules + runner
6. CSV import
7. Chat tools + Chrome verification + update `handoff.md` / `progress.md`
