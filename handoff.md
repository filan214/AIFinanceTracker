# Handoff — Smart Finn Track

_Last updated: 2026-09-28 · branch `main` · pushed through `6ed6e48` — live on production_

## Pick up here

**Nothing is broken and nothing is mid-edit.** The planning/smart-input plan,
its code review, and all 10 minor review findings are done, tested, and
pushed. The one thing left that's actually a "next step" for a coding
session is verification, not new code:

### Immediate next step: click through 6 commits in a real browser

Chrome was disconnected for the last stretch of this session
(`c4a1769`..`6ed6e48`). Those fixes are correct by typecheck/lint/build/test
and careful code review, but nobody has clicked them. If you reconnect
Chrome (`/mcp` → claude-in-chrome, or just do it yourself), check each of
these against **production** (`https://ai-finance-tracker-delta-drab.vercel.app`,
Try the demo):

1. **`src/components/recurring-runner.tsx`** — sign out, sign in as a
   *different* account in the same browser tab, confirm the "N recurring
   added" toast can fire again for the new user (it was previously silenced
   by a global, not per-user, sessionStorage flag).
2. **`src/app/(app)/dashboard/page.tsx`** — open DevTools Network tab, load
   `/dashboard`, confirm `/api/budgets` and `/api/goals` each fire once on
   load, not twice.
3. **`src/components/transactions/smart-input.tsx`** — in Add transaction,
   click the camera button, and while it's scanning, confirm the Fill button
   is greyed out (not just the camera button).
4. **`src/components/transactions/csv-import-modal.tsx`** — open Import,
   load a CSV, manually toggle a checkbox, then (in another tab) add a
   transaction so `TRANSACTIONS_CHANGED` fires while the modal is still
   open; confirm your checkbox toggle survived. Also just look: the preview
   table should now have a header row (Date / Description / Amount).
5. **`src/app/(app)/planning/page.tsx`** — go to `/planning?tab=goals`, then
   click the sidebar's "Planning" link (which points at bare `/planning`);
   confirm the tab actually switches back to Budgets and the tab bar matches
   the URL. This was the one that stayed stuck before.

If any of these misbehave, the relevant commit + its "why" is documented in
`progress.md`'s **Key decisions**.

### After that, three items only a human can do

- **Vercel + TokenRouter cleanup**: remove `TOKENROUTER_API_KEY` from the
  Vercel project's environment variables (unused — the switch was called
  off), and revoke that key on TokenRouter's side (it was pasted into chat).
- **Receipt camera on a real phone**: never tested outside a desktop
  browser file picker.
- **GitHub Actions**: manually dispatch the keep-alive workflow once to
  confirm it's still green (carried over from well before this plan).

None of these block anything else. There is no other planned work queued.

## State snapshot (so you don't have to re-derive it)

- **Git**: `main` is pushed through `6ed6e48`, matches `origin/main` exactly.
  No worktree, no stash, no uncommitted changes.
- **Tests**: `npm test` → 134/134. `npm run typecheck`, `npm run lint`,
  `npm run build` all exit 0.
- **AI model**: `src/lib/llm.ts` → `google/gemma-4-26b-a4b-it:free` on
  OpenRouter. Free, not unlimited — expect occasional `429`s. Every AI path
  except chat has a keyword/rule fallback for exactly that reason; chat now
  retries up to ~30s before showing a (localized) error.
- **`.env.local`**: 5 vars only (Supabase URL/anon key, demo email/password,
  OpenRouter key). No `TOKENROUTER_API_KEY` — it was added then removed
  during this session and never committed (`.env.local` is gitignored).
- **Chrome/claude-in-chrome**: was connected and used earlier this session
  (verified dashboard, Planning tabs, CSV import, recurring pause/resume,
  Settings link, EN/ID, 375px width, Reports PDF export — all on production)
  but disconnected again before the last 6 commits above.

## Full history

For the complete commit-by-commit history, the design rationale behind every
decision (recurring's non-partial index, draft-then-confirm AI, CSV
auto-guess, etc.), and the SQL the user already ran, see `progress.md` —
it's kept current and isn't duplicated here.
