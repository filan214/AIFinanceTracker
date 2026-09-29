# Progress — Smart Finn Track

_Last updated: 2026-09-30 · branch `main` · pushed through `87f6fb6`; `d7dfe88` and the commits after it await push_

## Completed ✅

Items 1–10 are on `main` (`293e9b2..6ed6e48`); 11–12 were added 2026-09-30.
New environment variable: `GOOGLE_GENERATIVE_AI_API_KEY` (in `.env.local` and Vercel).

1. **Quick-add from text** — type "kopi 25rb kemarin" in the transaction modal;
   AI (with keyword-then-rule fallback) prefills amount, type, category, date, description.
2. **Receipt scan** — photo → downscaled JPEG → AI → draft transaction (total,
   date, merchant); localized error on failure, form stays usable; total is
   capped at the same max as every other amount in the app.
3. **Category budgets** — new `/planning` page, Budgets tab (ok / warn at 80% /
   over 100%), dashboard budget card.
4. **Savings goals** — Goals tab with manual contributions (mirrored as `savings`
   expenses, insert now rolled back if the mirror fails), monthly amount
   needed to hit the target date, dashboard goal card.
5. **Recurring transactions** — Recurring tab; missed occurrences are created on
   app open (catch-up, now keyed per user not per browser session), no
   duplicates across tabs/refreshes, pausing then resuming does not
   back-fill the paused months.
6. **Bank CSV import** — Transactions → Import: auto-guessed column mapping
   (incl. an optional Type column) and date format (editable), invalid rows
   and likely duplicates unchecked (manual checks now survive a background
   transaction-list reload), keyword-then-AI categorization in batches of
   50, max 1 MB / 500 rows, preview table now has a header row.
7. **Chat tools** — the advisor can call `getBudgets` and `getGoals`; the
   route now retries up to 4x (~30s) on the free model's `429`s, and always
   shows the localized error message instead of raw SDK text.
8. **Free OpenRouter model** (`google/gemma-4-26b-a4b-it:free`) with a keyword
   category fallback (`src/lib/category-rules.ts`) wired into quick-add, the
   background categorizer, and CSV import — so a rate-limited model still
   produces sensible categories instead of always defaulting to `shopping`.
9. **Dashboard anomaly alert** no longer mixes transactions from unrelated
   categories into a spending spike (e.g. a savings goal top-up swept into a
   shopping alert) — both a better prompt and a deterministic server-side filter.
10. **All 10 minor review findings fixed**: bad ids on budgets/goals/
    contributions/recurring DELETE now 400 (were 500); PATCH on a
    nonexistent id now 404 (was 500); `/api/budgets?month=2026-13` now 400;
    dashboard cards no longer double-fetch on mount; Planning's active tab
    now always matches `?tab=` across every navigation, not just first mount.
11. **AI moved off OpenRouter to Google AI Studio directly** (`87f6fb6`,
    live on prod). Receipt scans "couldn't read" clear receipts because the
    free OpenRouter model's shared upstream pool 429'd every request and the
    route's catch-all reported it as `unreadable`. Now `@ai-sdk/google` →
    `gemini-3.5-flash`, thinking disabled. Verified live on prod: receipt,
    quick-add (`ai:true`), and streaming chat with tool calls.
12. **AI request diet** (`d7dfe88`) against the 20/day quota: simple tasks
    (categorize, CSV import, quick-add parse, chat title, anomaly) run on
    `gemini-3.5-flash-lite` (separate quota); keyword rules run before AI
    for single + CSV categorization; the anomaly route skips AI when no
    category is >20% above its 3-week average; `isNew` computed in code,
    compact anomaly prompt. Lite categorize + anomaly verified live locally.

Schema: `supabase/planning.sql` + `supabase/Seed Planning for Demo User.sql`
(run by the user in the Supabase SQL Editor; seeded rows verified).

Quality gates at HEAD: **153 tests pass** (134 before 2026-09-30 + 19 new),
typecheck, lint, build, and en/id i18n parity all clean. Every new API route
was checked live; full Chrome click-through of all 5 pending UI fixes done
on production 2026-09-29 (see `handoff.md`) — all PASS. A second real
account (`ferdiputra1404@gmail.com`) now exists on prod, useful for future
multi-user testing.

## Key decisions

- **Draft-then-confirm for all AI input**; the user always presses Save.
- **Every AI path has a fallback**: keyword categorization (quick-add,
  categorizer, CSV) or a usable error state (receipt). Chat has none, but
  now retries automatically before failing.
- **Recurring = lazy materialization on app open**, keyed per user id in
  `sessionStorage` + a **non-partial** unique index on
  `transactions(recurring_rule_id, date)` (PostgREST upsert can't target a
  partial index; NULLs are distinct so ordinary rows never conflict).
  Resuming a paused rule skips occurrences dated before today.
- **Manual goal top-ups**, each recorded as a `savings` expense, with the
  contribution rolled back if that expense insert fails.
- **CSV: auto-guess + editable mapping**; duplicates = same date + amount +
  normalized description vs. the 500 most recent transactions.
- **AI model: free tier, never paid — Google AI Studio direct.** OpenRouter
  was dropped: its `:free` vision models sit on saturated shared pools, and
  paid models bill credits (no reset; account at 0 credits). Google's free
  tier is a per-project, per-model daily quota that resets at midnight
  Pacific (~14:00 WIB) and 429s instead of billing. `gemini-2.5-flash` is
  closed to new projects; 3.7/3.8 Flash ignore `thinkingBudget` (their
  thinking tokens would truncate categorize's 16-token reply) and 503 often.
  So: `gemini-3.5-flash` (**20 req/day**, confirmed from a 429) for chat,
  receipt, reports; `gemini-3.5-flash-lite` (own quota, rejects a
  thinkingConfig with 400) for everything simple. TokenRouter was evaluated
  earlier and rejected; no code depends on it.
- **Request count is the cost, not tokens.** Prefer skipping a call
  (keyword rules, anomaly spike gate, caching) over trimming prompts.
- **API routes validate id shape (`z.uuid()`) before hitting the DB**, and
  use `.maybeSingle()` + an explicit 404 instead of `.single()`'s 500 on a
  missing row — pattern now consistent across budgets/goals/recurring.
- **Commit to `main` directly; user pushes.**

## Pending / unfinished

Nothing is half-built. Open items, all needing a human or an external system:

- [x] **Remove the unused `TOKENROUTER_API_KEY`** from Vercel — done by the
  user 2026-09-30.
- [ ] **Push** `d7dfe88` (request diet) and the commits after it.
- [ ] **Remove `OPENROUTER_API_KEY`** from Vercel (and `.env.local`) — no
  code reads it since `87f6fb6`.
- [ ] **Receipt camera on a real phone** — user tried 2026-09-30 and got
  "couldn't read"; root cause was the OpenRouter 429 (fixed in `87f6fb6`).
  Needs a retest on the phone now that Gemini is live.
- [ ] **Hardened keep-alive workflow run** (carried over) — dispatch it
  manually in GitHub Actions to confirm green.
- [x] **Click-through of the 5 UI fixes** — done 2026-09-29, all PASS.
- [ ] **20/day on 3.5 Flash is tight.** Receipt, chat and report still share
  it. When it's out they error until midnight Pacific; categorize and
  quick-add fall back to keyword rules. Flash-Lite's own daily limit is
  still unknown — check at aistudio.google.com/rate-limit.
- [x] **Receipt errors are honest now** — `readReceipt()` in
  `src/lib/receipt.ts`: an AI call failure (quota/overload, after the SDK's
  own 2 retries) → `503 busy` → "AI is busy or at today's limit"; only a
  model reply with no total → `422 unreadable`. Verified live against a real
  quota 429.

## Next steps

See `handoff.md` for state.

1. Push `d7dfe88`; after the quota reset, smoke-test prod (quick-add,
   receipt, chat, dashboard anomaly) — ideally on the phone.
2. Remove `OPENROUTER_API_KEY` from Vercel.
3. Dispatch the keep-alive GitHub Action manually.
4. (Backlog) `transaction-modal.tsx` pre-existing dead code (`CATEGORY_KEYS`,
   `tCat`) still left alone deliberately.

## Last touched files / sections

- `src/lib/llm.ts` — Google provider, `DEFAULT_MODEL`/`LITE_MODEL`, `modelSettings()`, thinking off
- `src/lib/categorize.ts` (new) — keyword-first single categorization; `src/app/api/ai/categorize/route.ts` uses it
- `src/lib/csv/batch.ts` (`categorizeKeywordFirst`), `src/app/api/transactions/import/route.ts`
- `src/lib/anomaly.ts` (`hasSpendingSpike`, `markNewTransactions`), `src/app/api/ai/anomaly/route.ts` — gate + compact prompt
- `src/app/api/ai/parse/route.ts`, `src/lib/chat/title.ts` — lite model
- `src/app/api/ai/chat/route.ts` — Google model, key check; `src/lib/ai/tools.ts` — `getTransactions` drops `id`
- `package.json` — `+@ai-sdk/google`, `-@ai-sdk/openai`; `README.md` — setup/stack
- `handoff.md`, `progress.md` — this documentation
