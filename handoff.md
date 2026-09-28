# Handoff — Smart Finn Track

_Last updated: 2026-09-28 · branch `main` · planning + smart input (31 commits since `9405889`)_

## Current status

The **planning + smart input** plan
(`docs/superpowers/plans/2026-09-27-planning-and-smart-input.md`, spec in
`docs/superpowers/specs/2026-09-27-planning-and-smart-input-design.md`) is fully
implemented, reviewed, and **pushed to `main` through `ed77b7a` — live on
production**. No uncommitted changes, no new environment variables.

**AI model: OpenRouter, `google/gemma-4-26b-a4b-it:free`** (`src/lib/llm.ts`).
The user's OpenRouter account ran out of paid credits; there is no free
`gemini-2.5-flash` slug, so the model was switched to a free one. Tradeoffs:
- **No cost**, but **not unlimited** — shared free pool, documented OpenRouter
  limits are 20 req/min and 50–1000 req/day. Returns `429` under load.
- Supports image input (receipt scan) and tool calling (chat's
  `getBudgets`/`getGoals`), confirmed live.
- Can emit a receipt total as a raw JSON number with the ID thousands
  separator misread as a decimal (`"57.720"` → `57.72`) — fixed in
  `normalizeReceipt` (scales a non-integer number ×1000).
- **Every AI path now has a keyword fallback**, not just a `shopping` default:
  `src/lib/category-rules.ts` (`guessCategory`) covers quick-add
  (`quick-parse.ts`), the background categorizer
  (`/api/ai/categorize`), and CSV import (`csv/batch.ts`,
  `fallbackCategories`). Chat has no fallback — it just fails on a busy
  model; the user retries.
- **The user evaluated switching to TokenRouter with MiniMax-M3 and a
  personal key and decided against it**: the key only had access to
  MiniMax-M3, and that model's gift credit balance couldn't pay for any call
  (`403 insufficient_user_quota`). No code change was made; the
  `TOKENROUTER_API_KEY` that was briefly added to `.env.local` was removed
  (never committed — `.env.local` is gitignored). A `TOKENROUTER_API_KEY` may
  still exist in the Vercel project's environment variables; the app doesn't
  read it, so it's inert until someone removes it there.

Still needs a human / browser:
- **Chat tool chips** ("budget data", "target tabungan") and general chat
  quality — needs the free model to not be rate-limited at the moment tested.
- **Receipt camera on a real phone.**
- **Reports → Export PDF** — verified working on production (valid `%PDF-`
  blob generated and downloaded).
- **General click-through of every screen** was done in Chrome on production
  this session (see below) but a second look after the latest fixes wouldn't hurt.

## Work done this session (31 commits)

| Commit | What |
|---|---|
| `293e9b2` | Implementation plan |
| `43c0eaf` | Rule-based quick-add parser + draft helpers |
| `19c7240` | AI quick-add parse endpoint with rule-based fallback |
| `dbbbed1` | Quick-add from natural-language text in the transaction modal |
| `20cef6b` | Scan a receipt photo into a draft transaction |
| `de9fbd0` | Planning schema + demo seed SQL |
| `daa7887` | Budget progress calculations |
| `ef30f88` | Budgets API |
| `c40f3c4` | Seed planning data into the Try-the-demo account |
| `91198d8` | Planning page with category budgets |
| `d895de9` | Budget progress card on the dashboard |
| `2e772c1` | Savings goal progress calculations |
| `8b39945` | Savings goals API |
| `6f2e318` | Savings goals tab + dashboard goal card |
| `c959750` | Recurring schedule calculations |
| `d8091fd` | Recurring rules API + catch-up endpoint |
| `56780b8` | Recurring tab + catch-up on app open |
| `51cf81b` | CSV parser for bank imports |
| `4b8b063` | CSV column mapping, amount/date parsing, duplicate detection |
| `15f02eb` | Bank CSV import endpoint with batched AI categorization |
| `2de3bc9` | CSV import modal on the Transactions page |
| `65db2ec` | Chat advisor reads budgets and savings goals |
| `ee0c1be` | Handoff + progress docs |
| `ea98a5c` | Review fix: quick-add can't save `"42.000"` as 42, an expense as `income`, or a rule-based fallback as AI |
| `7c0eeef` | Review fix: resuming a paused recurring rule skips the paused months |
| `f46d085` | Review fix: CSV Type column (CR/DB, K/D); `Cr/Dr` header no longer read as credit |
| `bd7281b` | Handoff + progress updated with the review fixes |
| `42ed430` | Fix: dashboard alert overflow at 375px; sidebar not sticky on tall pages |
| `ee071e6` | Fix: switch to a free OpenRouter model; fix a receipt-total scaling bug it exposed |
| `ea3502b` | Fix: keyword fallback in the background categorizer |
| `ed77b7a` | Fix: keyword fallback in quick-add and CSV import |

## SQL the user ran (Supabase SQL Editor)

- `supabase/planning.sql` — `budgets`, `savings_goals`, `goal_contributions`,
  `recurring_rules` (all with RLS `auth.uid() = user_id`), `transactions.recurring_rule_id`
  (FK `on delete set null`) + unique index `(recurring_rule_id, date)`.
- `supabase/Seed Planning for Demo User.sql` — seeds the **Try-the-demo** account
  (`NEXT_PUBLIC_DEMO_EMAIL`): 4 budgets, 2 goals, 6 contributions, 3 recurring rules.
  Verified: budgets 4, savings_goals 2, goal_contributions 6, recurring_rules 3.

## Files changed this session

See the plan's **File Map** for the full list. New pure modules (all with tests):
`src/lib/{ymd,draft,quick-parse,llm-json,receipt,budget-progress,goal-progress,recurring-due,category-rules}.ts`,
`src/lib/csv/{parse,map,batch}.ts`. New routes: `/api/ai/parse`, `/api/ai/receipt`,
`/api/budgets`, `/api/goals`, `/api/goals/contributions`, `/api/recurring`,
`/api/recurring/run`, `/api/transactions/import`. New page: `/planning`
(Budgets / Goals / Recurring tabs, `?tab=`). Chat tools `getBudgets` / `getGoals`
in `src/lib/ai/tools.ts`. Pre-existing files touched for unrelated bugs found
during the browser pass: `src/components/dashboard/anomaly-alert.tsx`,
`src/components/layout/sidebar.tsx`.

## Why these technical decisions (so they don't need re-explaining)

- **AI inputs are draft-then-confirm.** Quick-add text and receipt scans only
  prefill the transaction form; the user always saves. AI output is validated
  (`mergeAiDraft`, `normalizeReceipt`): bad/zero/huge amounts leave the field
  empty, impossible or future dates fall back to today.
- **Every AI path has a deterministic fallback.** Quick-add and CSV import use
  `guessCategory` keyword rules (ID/EN, whole-word match) before defaulting to
  `shopping`; receipt scan shows a localized error and leaves the form usable;
  chat has none and just fails. This is what keeps the app usable on a
  rate-limited free model.
- **`normalizeReceipt` scales a non-integer numeric total ×1000** — a real
  receipt total is never fractional, so a model that emits `57.72` for
  "Rp 57.720" almost certainly meant the thousands-separator form.
- **Recurring = lazy materialization on app open.** `RecurringRunner` calls
  `/api/recurring/run` once per session; it creates any missed occurrences
  (catch-up) and bumps `last_generated_month`. No cron, Rp 0 cost.
- **The recurring unique index is NOT partial** (spec deviation). PostgREST's
  upsert `ON CONFLICT (recurring_rule_id, date)` can't target a partial index; a
  plain one behaves the same because NULLs are distinct, so normal transactions
  never conflict. Two concurrent runs were tested live: no duplicates.
- **Resuming a paused recurring rule skips every occurrence dated before
  today** (sets `last_generated_month` forward) — "paused" means those months
  are not charged.
- **Goal top-ups are manual contributions**, each mirrored as a `savings` expense
  so balances stay honest.
- **CSV import auto-guesses the mapping** (header keywords in ID/EN, then value
  patterns, including an optional Type/CR-DB column) and the date format, but
  every column + the format stay editable in the modal. Short keywords (`cr`,
  `db`) must be whole words so "Description" isn't read as credit, and a
  header like "Cr/Dr" maps to Type rather than Credit. Rows matching an
  existing transaction (date + amount + normalized description) start
  unchecked as "Duplicate?"; identical rows *inside* one file are not flagged.
- **CSV categorization in batches of 50** → at most 10 AI calls for the 500-row cap.
- **Duplicate check uses the Transactions page's loaded list** (500 most recent)
  instead of a separate fetch — `/api/transactions` only filters by month.
- **Planning client helpers live in `src/lib/planning/api.ts`**; server loaders
  (`budgets-server.ts`, `goals-server.ts`) are shared by the routes and the chat tools.
- **Quick-add marks a draft as AI-filled only when the AI answered** (`ai` flag
  from `/api/ai/parse`); flipping the type afterwards clears it so the
  background categorizer runs, and an expense can never be saved as `income`.
- **Seed targets the Try-the-demo account**, not a personal test account.
- **Committed to `main` directly**, user pushes. Matches the established repo workflow.

## Tests — status

- **`npm test` (vitest): 128 pass, 0 fail, 16 files** (31 before this plan + 97 new).
- **`npm run typecheck`**, **`npm run lint`**, **`npm run build`**: all clean.
- **i18n parity** (`messages/en.json` vs `messages/id.json`): identical key sets.
- **Live checks against production** (Chrome, demo login): dashboard cards,
  all 3 Planning tabs + `?tab=`, quick-add fill + type-flip category clear,
  CSV import with a Type column, pause/resume a recurring rule (no back-fill),
  Settings → Planning link, EN/ID strings in every Planning form, 375px width
  (no horizontal scroll after the layout fixes), Reports → Export PDF (valid
  `%PDF-` blob).
- **Live checks against a local dev server**: every new API route
  (budgets, goals + contributions, recurring catch-up/concurrency/idempotency,
  CSV import 201/400/401), the chat tools executed directly against the demo
  DB, and the keyword fallback for quick-add/categorize/CSV while the free
  model was returning 429.

## Last command run + result

`npm test && npm run typecheck && npm run lint && npm run build` → all exit 0,
128 tests pass.
