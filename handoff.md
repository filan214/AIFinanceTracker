# Handoff — Smart Finn Track

_Last updated: 2026-09-28 · branch `main` · planning + smart input (22 commits since `9405889`)_

## Current status

The **planning + smart input** plan
(`docs/superpowers/plans/2026-09-27-planning-and-smart-input.md`, spec in
`docs/superpowers/specs/2026-09-27-planning-and-smart-input-design.md`) is fully
implemented and **committed to local `main`. Not pushed yet** — the user pushes;
Vercel deploys automatically. No new environment variables are needed.

**Blocker outside the code: the OpenRouter account is out of credits.** Every AI
call now returns `402 "This request requires more credits, or fewer max_tokens …
can only afford ~716"`. The chat advisor (asks for 2048 tokens) fails completely;
quick-add, receipt scan, and CSV categorization fall back as designed
(rule-based parse / localized error / `shopping`). Top up at
https://openrouter.ai/settings/credits, then re-check the AI items below.

Still needs a human / browser (Chrome extension was never connected this session):
- The UI click-through of every new screen at desktop and 375px (Planning tabs,
  dashboard cards, quick-add box, receipt camera button, CSV import modal,
  Settings → Planning link, EN/ID strings). All APIs behind them were verified live.
- Chat: "Am I over budget this month?" → "budget data" chip; "Kapan target laptop
  saya tercapai?" → "target tabungan" chip (needs credits).
- Receipt camera on a real phone.
- Reports → Export downloads a PDF (left over from the previous session).
- Production spot-check with the demo account after the push.

## Work done this session (22 commits)

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

## SQL the user ran (Supabase SQL Editor)

- `supabase/planning.sql` — `budgets`, `savings_goals`, `goal_contributions`,
  `recurring_rules` (all with RLS `auth.uid() = user_id`), `transactions.recurring_rule_id`
  (FK `on delete set null`) + unique index `(recurring_rule_id, date)`.
- `supabase/Seed Planning for Demo User.sql` — seeds the **Try-the-demo** account
  (`NEXT_PUBLIC_DEMO_EMAIL`): 4 budgets, 2 goals, 6 contributions, 3 recurring rules.
  Verified: budgets 4, savings_goals 2, goal_contributions 6, recurring_rules 3.

## Files changed this session

See the plan's **File Map** for the full list. New pure modules (all with tests):
`src/lib/{ymd,draft,quick-parse,llm-json,receipt,budget-progress,goal-progress,recurring-due}.ts`,
`src/lib/csv/{parse,map,batch}.ts`. New routes: `/api/ai/parse`, `/api/ai/receipt`,
`/api/budgets`, `/api/goals`, `/api/goals/contributions`, `/api/recurring`,
`/api/recurring/run`, `/api/transactions/import`. New page: `/planning`
(Budgets / Goals / Recurring tabs, `?tab=`). Chat tools `getBudgets` / `getGoals`
in `src/lib/ai/tools.ts`.

## Why these technical decisions (so they don't need re-explaining)

- **AI inputs are draft-then-confirm.** Quick-add text and receipt scans only
  prefill the transaction form; the user always saves. AI output is validated
  (`mergeAiDraft`, `normalizeReceipt`): bad/zero/huge amounts leave the field
  empty, impossible or future dates fall back to today.
- **Every AI path has a deterministic fallback** — rule-based quick-add parse,
  localized receipt error with a usable form, `shopping` for CSV rows. This is
  exactly what is keeping the app usable while OpenRouter has no credits.
- **Recurring = lazy materialization on app open.** `RecurringRunner` calls
  `/api/recurring/run` once per session; it creates any missed occurrences
  (catch-up) and bumps `last_generated_month`. No cron, Rp 0 cost.
- **The recurring unique index is NOT partial** (spec deviation). PostgREST's
  upsert `ON CONFLICT (recurring_rule_id, date)` can't target a partial index; a
  plain one behaves the same because NULLs are distinct, so normal transactions
  never conflict. Two concurrent runs were tested live: no duplicates.
- **Goal top-ups are manual contributions**, each mirrored as a `savings` expense
  so balances stay honest.
- **CSV import auto-guesses the mapping** (header keywords in ID/EN, then value
  patterns) and the date format, but every column + the format stay editable in
  the modal. Short keywords (`cr`, `db`) must be whole words so
  "Description" isn't read as credit. Rows matching an existing transaction
  (date + amount + normalized description) start unchecked as "Duplicate?";
  identical rows *inside* one file are not flagged (two coffees a day is normal).
- **CSV categorization in batches of 50** → at most 10 AI calls for the 500-row cap.
- **Duplicate check uses the Transactions page's loaded list** (500 most recent)
  instead of a separate fetch — `/api/transactions` only filters by month.
- **Planning client helpers live in `src/lib/planning/api.ts`**; server loaders
  (`budgets-server.ts`, `goals-server.ts`) are shared by the routes and the chat tools.
- **Seed targets the Try-the-demo account**, not a personal test account.
- **Committed to `main` directly**, user pushes. Matches the established repo workflow.

## Tests — status

- **`npm test` (vitest): 115 pass, 0 fail, 15 files** (31 before this plan + 84 new).
- **`npm run typecheck`**, **`npm run lint`**, **`npm run build`**: all clean.
- **i18n parity** (`messages/en.json` vs `messages/id.json`): identical key sets.
- **Live API checks** (demo login against a local dev server) passed for every
  route: budgets, goals + contributions, recurring (catch-up, concurrency,
  idempotency, FK set null), CSV import (201/400/401), plus the chat tools
  executed directly against the demo DB (Entertainment over, Food warn; Laptop
  baru Rp 1.375.000/month for 4 months).

## Last command run + result

`npm test && npm run typecheck && npm run lint && npm run build` → all exit 0,
115 tests pass. `/api/ai/chat` → stream error 402 (OpenRouter credits).
