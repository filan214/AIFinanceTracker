# Progress — Smart Finn Track

_Last updated: 2026-09-28 · branch `main` · committed locally, **not pushed yet**_

## Completed ✅

All items below are committed on local `main` (`293e9b2..65db2ec`). The user
pushes; Vercel deploys automatically. No new environment variables.

1. **Quick-add from text** — type "kopi 25rb kemarin" in the transaction modal;
   AI (with rule-based fallback) prefills amount, type, category, date, description.
2. **Receipt scan** — photo → downscaled JPEG → AI → draft transaction (total,
   date, merchant); localized error on failure, form stays usable.
3. **Category budgets** — new `/planning` page, Budgets tab (ok / warn at 80% /
   over 100%), dashboard budget card.
4. **Savings goals** — Goals tab with manual contributions (mirrored as `savings`
   expenses), monthly amount needed to hit the target date, dashboard goal card.
5. **Recurring transactions** — Recurring tab; missed occurrences are created on
   app open (catch-up), no duplicates across tabs/refreshes.
6. **Bank CSV import** — Transactions → Import: auto-guessed column mapping and
   date format (editable), invalid rows and likely duplicates unchecked, AI
   categorization in batches of 50, max 1 MB / 500 rows.
7. **Chat tools** — the advisor can call `getBudgets` and `getGoals`.

Schema: `supabase/planning.sql` + `supabase/Seed Planning for Demo User.sql`
(run by the user in the Supabase SQL Editor; seeded rows verified).

Quality gates at HEAD: **115 tests pass** (31 before + 84 new), typecheck, lint,
build, and en/id i18n parity all clean. Every new API route was checked live.

## Key decisions

- **Draft-then-confirm for all AI input**; the user always presses Save.
- **Every AI path has a fallback** (rule parse / error message / `shopping`).
- **Recurring = lazy materialization on app open** + a **non-partial** unique
  index on `transactions(recurring_rule_id, date)` (PostgREST upsert can't
  target a partial index; NULLs are distinct so ordinary rows never conflict).
- **Manual goal top-ups**, each recorded as a `savings` expense.
- **CSV: auto-guess + editable mapping**; duplicates = same date + amount +
  normalized description vs. the 500 most recent transactions.
- **Batch-of-50 AI categorization** for CSV imports.
- **Commit to `main` directly; user pushes.**

## Pending / unfinished

Nothing is half-built. Open items:

- [ ] **OpenRouter credits are exhausted** (402: "can only afford ~716 tokens").
  Chat advisor is fully down (asks for 2048); quick-add/receipt/CSV run on
  their fallbacks. Top up at https://openrouter.ai/settings/credits.
- [ ] **Browser pass of the new UI** (desktop + 375px, EN/ID) — the Chrome
  extension never connected this session, so screens were verified through
  typecheck/build and live API calls, not by clicking.
- [ ] **Chat tool chips** ("budget data", "target tabungan") — needs credits.
- [ ] **Receipt camera on a real phone.**
- [ ] **Reports → Export PDF download** (carried over from 2026-08-11).
- [ ] **Hardened keep-alive workflow run** (carried over) — dispatch it manually in GitHub Actions.

## Next steps

1. `git push` (Vercel deploys).
2. Top up OpenRouter credits.
3. Spot-check production with **Try the demo**: Dashboard cards, Planning tabs,
   Transactions → quick-add / receipt / Import, Chat budget + goal questions,
   Settings → Planning link, language switch EN/ID, 375px width.
4. (Backlog) `transaction-modal.tsx` pre-existing dead code (`CATEGORY_KEYS`,
   `tCat`) still left alone deliberately.

## Last touched files / sections

- `src/lib/ai/tools.ts`, `src/lib/ai/prompts.ts`, `src/app/(app)/chat/page.tsx` — chat tools
- `src/components/transactions/csv-import-modal.tsx`, `src/app/(app)/transactions/page.tsx` — CSV import UI
- `src/lib/csv/*`, `src/app/api/transactions/import/route.ts` — CSV pipeline
- `handoff.md`, `progress.md` — this documentation
