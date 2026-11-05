# Progress — Smart Finn Track

_Last updated: 2026-11-05 · branch `main` · pushed through `6c8a6f9`; `5bb2772`, `75732ab`, `b6e62b9`, `fd259fd` and this docs commit await push_

## Completed ✅

Items 1–10 are on `main` (`293e9b2..6ed6e48`); 11–13 were added 2026-09-30
(`87f6fb6..d4e863f`); 14 on 2026-10-06 (`85f5573`, `0acab75`); 15-18 between
2026-10-06 and 2026-10-16; 19 on 2026-11-04 (`6c8a6f9`), all pushed. 20-22 were
added 2026-11-05 (`75732ab`, `b6e62b9`, `fd259fd`) and are not pushed yet.
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
12. **AI request diet** (`d7dfe88`) against the small free quota: simple tasks
    (categorize, CSV import, quick-add parse, chat title, anomaly) run on
    `gemini-3.5-flash-lite` (separate quota); keyword rules run before AI
    for single + CSV categorization; the anomaly route skips AI when no
    category is >20% above its 3-week average; `isNew` computed in code,
    compact anomaly prompt. Lite categorize + anomaly verified live locally.
13. **Honest receipt errors** (`bc6f0a9`): `readReceipt()` in
    `src/lib/receipt.ts` splits an AI call failure (quota/overload, after
    the SDK's own 2 retries) → `503 busy` → "AI is busy or at today's limit"
    from a model reply with no total → `422 unreadable` → "couldn't read".
    No extra retry, so a spent daily quota isn't hammered. Verified live
    against a real quota 429.
14. **UI/UX refinement pass** (2026-10-06, `85f5573` + `0acab75`), from an
    audit of every page on prod (desktop, 390px, light and dark). UI only,
    no API or schema change. Highlights:
    - Money: Balance and Saved keep their minus (`formatNetCurrency`) and
      turn rose when negative; the balance card always renders (it hid
      when income was 0) with Healthy / Warning / Deficit; the fake
      "0.0% vs last month" is gone.
    - Mobile: transaction rows reflow (names were cut to "Spotif..."); Chat
      no longer overflows (`min-w-0` on the app column); Planning is in
      the tab bar, Settings moved to a header gear; dashboard header fits.
    - Fake UI made honest: "Quick insight" is now a Month summary built by
      `summarizeMonth()` from loaded data (no AI request); the sidebar tip
      opens Chat with a prefilled question; the accent picker now drives
      buttons, active nav, focus rings, toggles and Chat; the anomaly-alert
      toggle is saved and the dashboard skips the alert and the request
      when it's off; the monthly-report toggle (wired to nothing) is gone;
      the chat privacy line names Google Gemini.
    - Charts: the daily trend zero-fills days without spending
      (`dailySeries()`) and offers 7D / Month instead of 30D / 90D buttons
      that drew the same chart; the Reports 6-month chart is HTML bars with
      fixed-size labels; tooltips follow the theme.
    - Dead controls removed: the transaction row pencil (editing doesn't
      exist), and the recurring toggle knob that sat outside its track.
    - Contrast: category pills measured 1.99 to 3.50:1 in light mode and
      are now 5:1 or more in both themes (`CATEGORY_TEXT` color-mix); new
      text measured 4.83 to 7.73 (light) and 6.23 to 11.99 (dark).
    - Polish: compact anomaly alert (23% shorter, transactions behind a
      disclosure), donut legend no longer wraps amounts, theme control
      gains System, landing "Try the demo" lines up.
    Verified by a click-through on localhost plus DOM measurements at 390px.
15. **PDF report tables** (`db9e9c3`, `src/lib/report-pdf.ts`): `columnLayout()`
    aligns each header with its column; Saved keeps its minus and turns rose
    when negative.
16. **README rewritten for the portfolio** (`7735701`). `PRD.md` is now local
    only (`552a0f4`, gitignored); it still exists in history from `c520a90`.
17. **Link preview** (`f26f527`): `src/app/opengraph-image.png` and
    `twitter-image.png` are a real 1200x630 capture of the demo dashboard;
    `layout.tsx` adds `metadataBase` and share title/description. Verified
    with WhatsApp and Facebook crawler user agents on prod.
18. **Login form** (`f99b0df`): input placeholders removed, labels linked to
    their fields with `htmlFor`/`id`.
19. **Keep-alive pings more often** (`6c8a6f9`). The Supabase project paused
    again; all 5 runs from Oct 22 to Nov 1 failed with `curl: (6) Could not
    resolve host`. The pause most likely came first: the Oct 19 ping returned
    200, and one missed ping 3 days later can't trip a 7-day rule. One request
    every 3 days is below Supabase's guidance of a few per day, so the cron is
    now `0 */8 * * *`. Failed runs also no longer print
    `Supabase ping OK: HTTP 000`. Verified: manual run `41805184783` passed on
    `6c8a6f9` with HTTP 200. Whether it prevents the next pause is not proven
    yet (see Pending).
20. **Advisor replies are readable** (`75732ab`). The chat bubble only handled
    `**bold**`, so line breaks collapsed, a list ran together into one
    paragraph, and `*italic*` markers showed literally.
    `src/lib/chat-markdown.ts` (new, 8 tests) parses paragraphs, flat lists,
    bold and italic; saved chats benefit too. `src/lib/ai/prompts.ts` now sets
    the structure: answer first, one item per line
    (`**Name**: Rp X · Category · 5 Nov`), one short bold-labeled tip, no
    headings, tables or emoji. Verified with real replies on localhost at
    desktop and 390px width: list renders, no stray asterisks, no sideways
    scroll. Test chats deleted from the demo account. Not checked on prod or a
    real phone yet. The model usually follows the format but isn't guaranteed
    to; for example, one reply left out the total.
21. **Message box focus** (`b6e62b9`, `chat-composer.tsx`). The global focus ring
    drew a rectangle on the textarea inside the composer's rounded border. The
    composer now carries focus alone, in the accent color, and its border also
    changes in dark mode, where `dark:border-zinc-700` overrode the old focus
    color. Computed styles checked in light, dark and rose accent, by click and
    Tab; all 5 accents measure 4.99:1 or more in both themes.
22. **Register form** (`fd259fd`): placeholders removed and labels linked to
    their fields, matching login. Checked in a browser without submitting, so
    no account was created.

Schema: `supabase/planning.sql` + `supabase/Seed Planning for Demo User.sql`
(run by the user in the Supabase SQL Editor; seeded rows verified).

Quality gates: **177 tests pass**, typecheck and lint are clean at `fd259fd`,
re-run 2026-11-05. Build and en/id i18n parity were last run for item 14. Every new API route
was checked live; full Chrome click-through of all 5 pending UI fixes done
on production 2026-09-29 (see `handoff.md`) — all PASS. A second real
account now exists on prod, useful for future multi-user testing.

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
  So: `gemini-3.5-flash` for chat,
  receipt, reports; `gemini-3.5-flash-lite` (own quota, rejects a
  thinkingConfig with 400) for everything simple. TokenRouter was evaluated
  earlier and rejected; no code depends on it.
- **Request count is the cost, not tokens.** Prefer skipping a call
  (keyword rules, anomaly spike gate, caching) over trimming prompts.
- **API routes validate id shape (`z.uuid()`) before hitting the DB**, and
  use `.maybeSingle()` + an explicit 404 instead of `.single()`'s 500 on a
  missing row — pattern now consistent across budgets/goals/recurring.
- **UI refinements don't touch data logic.** Display values come from data
  the page already loaded, through small tested helpers (`formatNetCurrency`,
  `dailySeries`, `summarizeMonth`), never from new API calls.
- **Accent is brand and CTA only**: primary buttons, active nav, focus
  rings, toggles, Chat. Income stays green and expense red whatever the
  accent. Each accent has AA-checked shades in `globals.css`
  (`[data-accent]`: `--accent-solid` behind white text, `--accent-fg` for
  text and rings); `src/lib/accent.ts` applies the choice.
- **antislop plugin, DURING mode, for UI work**: no em dashes in new copy,
  contrast measured with its checker (never eyeballed), 44px touch targets,
  no dead controls, a recorded click-through before calling UI done.
- **Keep-alive: several pings a day, not "one inside the 7-day window".**
  Supabase judges activity over the past week and gives no exact threshold.
  `Could not resolve host` on the ping cleared after the November 2026 restore.
  Earlier failure clusters show the same error, but no restore was recorded
  for them, and Supabase docs don't mention DNS. Treat the link as likely.
- **Keep the current `*.vercel.app` domain.** Changing it would also mean
  Supabase Auth Site URL and Redirect URLs, `metadataBase` in `layout.tsx`,
  `APP_URL` in `keep-alive.yml`, and the README links.
- **Chat renders a small markdown subset, with no library.** Paragraphs, flat
  lists, bold and italic are enough for what the prompt allows, and model text
  only ever becomes React text nodes, never HTML. Anything else, such as a
  table, shows as plain text.
- **Commit to `main` directly; user pushes.**

## Pending / unfinished

Nothing is half-built. Open items, all needing a human or an external system:

- [x] **Remove the unused `TOKENROUTER_API_KEY`** from Vercel — done by the
  user 2026-09-30.
- [x] **Push** `d7dfe88..d4e863f` — done by the user 2026-09-30.
- [ ] **Smoke-test prod**: receipt already passed on prod at `d4e863f`;
  still to do — quick-add, one chat message, dashboard load (the
  `d7dfe88` lite-model paths, unit-tested + checked live locally only).
- [ ] **Remove `OPENROUTER_API_KEY`** from Vercel (and `.env.local`) — no
  code reads it since `87f6fb6`.
- [ ] **Receipt camera on a real phone** — user tried 2026-09-30 and got
  "couldn't read"; root cause was the OpenRouter 429 (fixed in `87f6fb6`).
  Needs a retest on the phone now that Gemini is live.
- [x] **Hardened keep-alive workflow run** — dispatched manually 2026-11-04,
  green with HTTP 200 (run `41805184783`).
- [ ] **Check Supabase is still awake on or after 2026-11-11**, with no pause
  warning email. Also confirm the first scheduled run on the new cron passed.
  If a warning arrives anyway, the anon pings likely don't count as activity
  and the ping itself needs changing. The Supabase pause email would also
  confirm the pause date for item 19.
- [x] **Click-through of the 5 UI fixes** — done 2026-09-29, all PASS.
- [ ] **3.5 Flash's exact limits are unknown.** A burst of ~10 test calls
  hit a 429 naming `generate_content_free_tier_requests, limit: 20`, but
  a prod call succeeded ~30 min later, before the midnight-Pacific reset —
  so that 20 is most likely a **per-minute** cap, not per-day (the error
  text was truncated; its window wasn't captured). Read the real RPM/RPD
  for 3.5 Flash and 3.5 Flash-Lite at aistudio.google.com/rate-limit. When
  a quota is out, receipt shows "AI busy", chat/report error; categorize
  and quick-add fall back to keyword rules.
- [x] **Receipt errors are honest now** — see Completed #13.
- [x] **Push** `85f5573`, `0acab75` and later commits through `6c8a6f9` — done
  by the user.
- [x] **Register page placeholders** — removed in `fd259fd`, see Completed #22.
- [ ] **Push** `5bb2772`, `75732ab`, `b6e62b9`, `fd259fd` and this docs commit.
- [ ] **See the chat format on prod and a real phone** after the push.
- [ ] **Unexplained local dev signals, not traced.** One of 3 chat test runs on
  2026-11-05 logged `ERR_CONNECTION_RESET` and `TypeError: Failed to fetch`
  (the reply still rendered). The Next.js dev badge showed "1 Issue" on chat
  and "2 Issues" later on the chat page; it was never opened, so its contents
  and any link to these changes are unknown.
- [ ] **Link preview on the root URL**: the user saw no image when sharing `/`,
  while `/dashboard` worked. Prod serves correct tags on both, so this is most
  likely the chat app's cached preview; no code change. Refresh it with
  Facebook's Sharing Debugger, or share `/?v=2`.
- [ ] **Look at the refinements on a real phone, in both themes.** The
  click-through ran on desktop Chrome; the window went hidden partway, so
  light mode was verified by measured contrast, not screenshots, and the
  touch-only sizes (`[@media(hover:none)]`) by code only.
- [ ] **(Feature gap, outside UI scope) Transactions can't be edited.** No
  PATCH API and no edit mode in the modal, though the PRD promises inline
  edit and a manual category change. The dead pencil button was removed in
  `85f5573`; editing needs an API and a decision.
- [ ] **(Pre-existing, outside the approved refinement list)** 23 em dashes
  remain in en/id copy; small `zinc-400` labels on white (2.56:1, below
  AA) in components this pass didn't touch, e.g. the metric card's "vs last
  month" and the sidebar section labels; landing "See how it works" links to
  `/dashboard`, which sends a logged-out visitor to login; the mobile
  Transactions filter bar stacks three rows; the sidebar language toggle
  leaves empty space. A follow-up pass was offered, not started.

## Next steps

See `handoff.md` for state.

1. Push, then look at an advisor reply on prod.
2. On or after 2026-11-11, confirm Supabase stayed awake (see Pending).
3. Check the app on a phone in light and dark mode.
4. Smoke-test prod (quick-add, chat, dashboard anomaly; receipt already
   passed). Read real RPM/RPD at aistudio.google.com/rate-limit.
5. Remove `OPENROUTER_API_KEY` from Vercel.
6. (Optional) Follow-up UI pass on the pre-existing items in Pending.
7. (Backlog) `transaction-modal.tsx` pre-existing dead code (`CATEGORY_KEYS`,
   `tCat`) still left alone deliberately.

## Last touched files / sections

2026-11-05:
- `src/lib/chat-markdown.ts` + test (new), `src/lib/ai/prompts.ts`, `src/components/chat/{chat-bubble,chat-composer}.tsx`
- `src/app/register/page.tsx`
- `handoff.md`, `progress.md`: this documentation

2026-10-06 to 2026-11-04, after the refinement pass:
- `.github/workflows/keep-alive.yml` (cron, OK output)
- `src/app/login/page.tsx`; `src/app/layout.tsx` (share metadata); `src/app/{opengraph,twitter}-image.{png,alt.txt}`
- `src/lib/report-pdf.ts` + test (`columnLayout`); `README.md`; `.gitignore` (`PRD.md`)
- `handoff.md`, `progress.md`: this documentation

2026-10-06 UI/UX refinement pass:
- `src/lib/format.ts` (`formatNetCurrency`), `src/lib/daily-series.ts`, `src/lib/month-summary.ts` (new, with tests), `src/lib/chart-theme.ts`, `src/lib/accent.ts` (new)
- `src/lib/anomaly-cache.ts` (`anomalyAlertsEnabled` / `setAnomalyAlertsEnabled`)
- `src/app/globals.css` (`--accent-solid`, `--accent-fg`, `[data-accent]` blocks, focus ring, selection)
- `src/components/dashboard/{metric-card,insight-card,daily-line,category-donut,anomaly-alert}.tsx`, `src/app/(app)/dashboard/page.tsx`
- `src/components/transactions/transaction-row.tsx` (`TABLE_COLS_SM`), `src/app/(app)/transactions/page.tsx`, `src/components/category-badge.tsx` (`CATEGORY_ICON`, `CATEGORY_TEXT`)
- `src/components/layout/{mobile-nav,mobile-header,sidebar,page-header}.tsx`, `src/app/(app)/layout.tsx`
- `src/app/(app)/reports/components/{metrics-row,trend-bar-chart}.tsx`, `src/app/(app)/settings/page.tsx`, `src/components/theme-toggle.tsx`, `src/components/planning/switch.tsx`
- `src/components/chat/{suggested-prompts,chat-bubble,chat-composer}.tsx`, `src/app/(app)/chat/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/page.tsx`, `src/components/ui/button.tsx`, `src/components/accent-init.tsx`
- `messages/{en,id}.json` (Month summary, trend, balance, tip, accent names, privacy; removed `insightText`, `insightActionable`, `thDate`, `aiTip`, `seeHow`, `monthlyReport*`)
- `handoff.md`, `progress.md`: this documentation
