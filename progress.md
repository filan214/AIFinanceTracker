# Progress — Smart Finn Track

_Last updated: 2026-09-28 · branch `main` · pushed through `6ed6e48`, live on production_

## Completed ✅

All items below are on `main` (`293e9b2..6ed6e48`) and live on production.
No uncommitted changes, no new environment variables.

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

Schema: `supabase/planning.sql` + `supabase/Seed Planning for Demo User.sql`
(run by the user in the Supabase SQL Editor; seeded rows verified).

Quality gates at HEAD: **134 tests pass** (31 before this plan + 103 new),
typecheck, lint, build, and en/id i18n parity all clean. Every new API route
was checked live; Chrome click-through done on production earlier this
session (before the free-model switch and the review-minor fixes below).

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
- **AI model: free tier over paid.** No free `gemini-2.5-flash` exists on
  OpenRouter, so the model was switched to `google/gemma-4-26b-a4b-it:free`
  when the account ran out of credits. A move to TokenRouter/MiniMax-M3 with
  the user's own key was evaluated and rejected — the key had no working
  quota for any model it could access. No code depends on TokenRouter.
- **API routes validate id shape (`z.uuid()`) before hitting the DB**, and
  use `.maybeSingle()` + an explicit 404 instead of `.single()`'s 500 on a
  missing row — pattern now consistent across budgets/goals/recurring.
- **Commit to `main` directly; user pushes.**

## Pending / unfinished

Nothing is half-built. Open items, all needing a human or an external system:

- [ ] **Remove the unused `TOKENROUTER_API_KEY`** from the Vercel project's
  environment variables (added, then the switch was called off; the app
  never reads it). Also revoke that key on TokenRouter's side since it was
  shared in chat.
- [ ] **Receipt camera on a real phone** — never tested outside a desktop browser.
- [ ] **Hardened keep-alive workflow run** (carried over from before this
  plan) — dispatch it manually in GitHub Actions to confirm green.
- [ ] **Click-through of this session's last 6 commits** (`c4a1769` through
  `6ed6e48`) in a browser — Chrome was disconnected for that whole stretch;
  they're verified by typecheck/lint/build/tests and code review only. See
  `handoff.md` for the exact list.
- [ ] **Free model rate limits remain a fact of life.** `google/gemma-4-26b-a4b-it:free`
  sits on a shared pool and can still 429 under load; the fallbacks and the
  chat retry soften this but don't eliminate it.

## Next steps

See `handoff.md` for the immediate next action with exact files.

1. Reconnect Chrome and click through the 6 UI-only fixes below.
2. Remove `TOKENROUTER_API_KEY` from Vercel; revoke the TokenRouter key.
3. Test the receipt camera on a real phone.
4. Dispatch the keep-alive GitHub Action manually.
5. (Backlog) `transaction-modal.tsx` pre-existing dead code (`CATEGORY_KEYS`,
   `tCat`) still left alone deliberately.

## Last touched files / sections

- `src/app/api/{budgets,goals,goals/contributions,recurring}/route.ts` — id/month validation, 404s, atomic contribution
- `src/lib/ymd.ts` (`isValidMonth`), `src/lib/draft.ts` (`MAX_AMOUNT` exported), `src/lib/receipt.ts` — validation fixes
- `src/components/recurring-runner.tsx` — per-user session key
- `src/app/(app)/dashboard/page.tsx` — first-fetch dataVersion fix
- `src/components/transactions/smart-input.tsx` — Fill disabled during scan
- `src/components/transactions/csv-import-modal.tsx` — reset-effect deps, header row
- `src/app/(app)/planning/page.tsx` — `useSearchParams` + `router.replace` for tab sync
- `src/lib/anomaly.ts` (`filterTriggeredTransactions`), `src/app/api/ai/anomaly/route.ts` — category-mismatch fix
- `src/app/api/ai/chat/route.ts`, `src/app/(app)/chat/page.tsx` — retry + error message
- `handoff.md`, `progress.md` — this documentation
