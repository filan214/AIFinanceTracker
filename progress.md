# Progress — Smart Finn Track

_Last updated: 2026-09-28 · branch `main` · pushed through `ed77b7a`, live on production_

## Completed ✅

All items below are on `main` (`293e9b2..ed77b7a`) and live on production.
No uncommitted changes, no new environment variables.

1. **Quick-add from text** — type "kopi 25rb kemarin" in the transaction modal;
   AI (with keyword-then-rule fallback) prefills amount, type, category, date, description.
2. **Receipt scan** — photo → downscaled JPEG → AI → draft transaction (total,
   date, merchant); localized error on failure, form stays usable.
3. **Category budgets** — new `/planning` page, Budgets tab (ok / warn at 80% /
   over 100%), dashboard budget card.
4. **Savings goals** — Goals tab with manual contributions (mirrored as `savings`
   expenses), monthly amount needed to hit the target date, dashboard goal card.
5. **Recurring transactions** — Recurring tab; missed occurrences are created on
   app open (catch-up), no duplicates across tabs/refreshes, pausing then
   resuming does not back-fill the paused months.
6. **Bank CSV import** — Transactions → Import: auto-guessed column mapping
   (incl. an optional Type column) and date format (editable), invalid rows
   and likely duplicates unchecked, keyword-then-AI categorization in batches
   of 50, max 1 MB / 500 rows.
7. **Chat tools** — the advisor can call `getBudgets` and `getGoals`.
8. **Free OpenRouter model** (`google/gemma-4-26b-a4b-it:free`) with a keyword
   category fallback (`src/lib/category-rules.ts`) wired into quick-add, the
   background categorizer, and CSV import — so a rate-limited model still
   produces sensible categories instead of always defaulting to `shopping`.

Schema: `supabase/planning.sql` + `supabase/Seed Planning for Demo User.sql`
(run by the user in the Supabase SQL Editor; seeded rows verified).

Quality gates at HEAD: **128 tests pass** (31 before this plan + 97 new),
typecheck, lint, build, and en/id i18n parity all clean. Every new API route
was checked live; Chrome click-through done on production this session.
Final whole-branch review: 0 Critical, 5 Important (all fixed with tests), 10
Minor (backlog, below).

## Key decisions

- **Draft-then-confirm for all AI input**; the user always presses Save.
- **Every AI path has a fallback**: keyword categorization (quick-add,
  categorizer, CSV) or a usable error state (receipt). Chat has none.
- **Recurring = lazy materialization on app open** + a **non-partial** unique
  index on `transactions(recurring_rule_id, date)` (PostgREST upsert can't
  target a partial index; NULLs are distinct so ordinary rows never conflict).
  Resuming a paused rule skips occurrences dated before today.
- **Manual goal top-ups**, each recorded as a `savings` expense.
- **CSV: auto-guess + editable mapping**; duplicates = same date + amount +
  normalized description vs. the 500 most recent transactions.
- **AI model: free tier over paid.** No free `gemini-2.5-flash` exists on
  OpenRouter, so the model was switched to `google/gemma-4-26b-a4b-it:free`
  when the account ran out of credits. A move to TokenRouter/MiniMax-M3 with
  the user's own key was evaluated and rejected — the key had no working
  quota for any model it could access. No code depends on TokenRouter.
- **Commit to `main` directly; user pushes.**

## Pending / unfinished

Nothing is half-built. Open items:

- [ ] **Free model rate limits.** `google/gemma-4-26b-a4b-it:free` sits on a
  shared pool (documented limits: 20 req/min, 50–1000 req/day) and returns
  `429` under load. Quick-add/categorize/CSV degrade to keyword rules; **chat
  has no fallback and just fails** — worth adding a retry-with-backoff.
- [ ] **Remove the unused `TOKENROUTER_API_KEY`** from the Vercel project's
  environment variables (added, then the switch was called off; the app
  never reads it). Also revoke that key on TokenRouter's side since it was
  shared in chat.
- [ ] **Receipt camera on a real phone.**
- [ ] **10 review minors** (none break anything):
  receipt total has no max; goal contribution + mirrored expense not atomic;
  recurring runner session flag not per-user; DELETE/PATCH on a bad id → 500
  not 400/404; `/api/budgets` accepts month `2026-13`; dashboard cards fetch
  twice on mount; CSV modal resets manual checks when the list reloads; Fill
  enabled during a receipt scan; Planning reads `?tab` only on mount; CSV
  preview has no header row.
- [ ] **Hardened keep-alive workflow run** (carried over from before this
  plan) — dispatch it manually in GitHub Actions to confirm green.

## Next steps

1. Add a retry-with-backoff to the chat route for `429`s from the free model.
2. Decide on the 10 review minors — fix a few or leave as backlog.
3. Remove `TOKENROUTER_API_KEY` from Vercel; revoke the TokenRouter key.
4. Test the receipt camera on a real phone.
5. (Backlog) `transaction-modal.tsx` pre-existing dead code (`CATEGORY_KEYS`,
   `tCat`) still left alone deliberately.

## Last touched files / sections

- `src/lib/llm.ts` — `DEFAULT_MODEL` switched to the free tier
- `src/lib/category-rules.ts` (new) + `src/lib/quick-parse.ts`,
  `src/lib/csv/batch.ts`, `src/app/api/ai/categorize/route.ts` — keyword fallback
- `src/lib/receipt.ts` — fractional-total scaling fix
- `src/components/dashboard/anomaly-alert.tsx`, `src/components/layout/sidebar.tsx` — layout fixes
- `handoff.md`, `progress.md` — this documentation
