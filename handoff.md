# Handoff — Smart Finn Track

_Last updated: 2026-11-05 · branch `main` · pushed through `6c8a6f9`; `5bb2772`, `75732ab`, `b6e62b9`, `fd259fd` and this docs commit await push_

## Pick up here

**Nothing is mid-edit; five commits are unpushed.** The 2026-11-05 session made
advisor replies readable (real lists and paragraphs, plus format rules in the
prompt), fixed the message box focus ring, and removed the register
placeholders (`progress.md` **Completed** 20-22). On 2026-11-04 the failed "Keep
Supabase alive" Action was traced to the project pausing; the user restored it,
and the ping now runs 3 times a day instead of every 3 days (**Completed** 19).
Since the 2026-10-06 UI/UX pass (**Completed** 14) came the PDF, README, link
preview and login fixes (15-18).

### First thing to do

1. **The user pushes** (`git status -sb` shows `ahead 5` until then), then checks
   an advisor reply on prod. We commit to `main`; the user pushes.
2. **On or after 2026-11-11, confirm Supabase stayed awake**, with no pause
   warning email, and that scheduled runs on the new cron passed. So far only
   a manual run is proven (`41805184783`, HTTP 200). If a warning arrives, the
   anon pings likely don't count as activity and the ping needs changing.
3. **Check the refinements on a real phone, in light and dark mode.** The
   click-through ran on desktop Chrome via DOM measurements at 390px; light
   mode was checked by measured contrast only, because the Chrome window was
   hidden during that part.
4. Then the carried-over prod smoke test: quick-add ("kopi 25rb kemarin" →
   `ai:true`), one chat message, dashboard load, ideally a real receipt scan
   on the phone. Receipt already passed on prod at `d4e863f`.

### Watch out: `Could not resolve host` in keep-alive may mean a pause

The Oct 22 to Nov 1 failures all show this error for the project host, and it
cleared after the user's restore. Check the Supabase dashboard before debugging
DNS or secrets; if paused, restore it, then dispatch the workflow. Supabase docs
don't mention DNS, so this is observed behavior from one confirmed restore.

### Watch out: the quota is tiny — don't burn it testing

- `gemini-3.5-flash`: a 429 said `limit: 20`, but a call worked ~30 min
  later, before the daily reset — so it's most likely **20 per minute**,
  with an unknown daily cap. Not confirmed: read aistudio.google.com/rate-limit.
  Used by chat, receipt, and reports only.
- `gemini-3.5-flash-lite`: separate quota, limit unknown (ask the user to
  read aistudio.google.com/rate-limit). Used by categorize, CSV import,
  quick-add, chat titles, anomaly.
- On 2026-09-30 a burst of test calls hit that 429. Every live probe
  counts — prefer unit tests and mocks, and space out live checks. When a
  429 comes back, log the full error (it names the quota window) instead
  of truncating it.

### Open items (see `progress.md` → Pending)

- **User:** remove `OPENROUTER_API_KEY` from Vercel (unused since `87f6fb6`);
  retest the receipt camera on a real phone.
- **Not traced:** a `Failed to fetch` in 1 of 3 local chat test runs, and the
  Next.js dev badge's "2 Issues" on the chat page (`progress.md` → Pending).
- **Link preview on `/`:** prod serves correct tags; a missing image is most
  likely the chat app's cache. No code change needed (`progress.md` → Pending).
- **If a receipt scan fails on prod:** "AI is busy or at today's limit"
  means quota/overload (`503`) — wait for the reset, don't debug the photo.
  "Couldn't read the receipt" (`422`) means the model saw no total.
- **Feature gap (needs a decision, not UI work):** transactions can't be
  edited at all; there's no PATCH route and the modal has no edit mode.
- **Optional follow-up UI pass** on pre-existing items outside the approved
  list: 23 em dashes in en/id copy, small `zinc-400` labels that fail AA in
  untouched components, the landing "See how it works" link, the mobile
  Transactions filter bar. Listed in `progress.md` → Pending.
- **Backlog:** dead `CATEGORY_KEYS` / `tCat` in
  `src/components/transactions/transaction-modal.tsx` (grep first, then
  delete, then run typecheck + lint + tests).

### Working on the UI

- The **antislop** Claude Code plugin is installed; it asks DURING or AFTER
  once per session (no saved preference). This session used DURING.
- Check contrast with its script instead of by eye:
  `python <antislop-human skill dir>/contrast-check.py "#fg" "#bg"`.
- New primary-colored UI uses `bg-[color:var(--accent-solid)]` (white text)
  or `text-[color:var(--accent-fg)]`, not `emerald-*`, so the accent picker
  applies. Income/expense colors stay `emerald`/`rose`.
- In local dev, the Next.js overlay has shown "1 issue": a hydration warning
  about `bis_skin_checked` attributes injected by a browser extension
  (Bitdefender). Not an app bug. It showed "2 Issues" on 2026-11-05 in a
  headless browser, so that count has another source; nobody has opened it yet.
- Advisor reply format lives in two places: `src/lib/ai/prompts.ts` asks for it
  and `src/lib/chat-markdown.ts` renders it. A new markup type needs both.
- Stopping a background `next dev` by task ID can leave its child processes
  holding the port, so tests hit a stale server (one bounced to `/login`). Check
  for leftover `next dev` node processes before restarting.
- In Puppeteer, set `isMobile`/`hasTouch` before loading the chat page. Changing
  them later reloads the page and clears the conversation.
- If Chrome screenshots time out while JavaScript still runs, check
  `document.visibilityState`; a hidden window stops painting.

## State snapshot

- **Git**: `main` is `ahead 5` of `origin/main` (`5bb2772`, `75732ab`, `b6e62b9`,
  `fd259fd`, this docs commit). No stash, no worktree.
  `smart-finn-track-report-2026-10.pdf` in the root is the user's own untracked
  file; leave it alone.
- **Tests**: `npm test` → 177/177, `typecheck` and `lint` exit 0 (2026-11-05).
  `build` last run in the 2026-10-06 pass.
- **Keep-alive**: `.github/workflows/keep-alive.yml`, cron `0 */8 * * *`. Repo
  secrets are the `NEXT_PUBLIC_` names; the editor warning about
  `SUPABASE_URL` / `SUPABASE_ANON_KEY` is harmless, the workflow falls back.
- **AI**: `src/lib/llm.ts` → `@ai-sdk/google`. `askLLM(prompt, { lite })`
  picks the model; `modelSettings()` gives 3.5 Flash `thinkingBudget: 0`
  (its thinking tokens would truncate short JSON replies) and gives Lite no
  thinking config (it rejects one with 400). Chat uses `google(DEFAULT_MODEL)`
  + `NO_THINKING` directly.
- **Env**: `.env.local` has `GOOGLE_GENERATIVE_AI_API_KEY` (a new-style
  `AQ.…` key, regenerated by the user after the first one was pasted in
  chat) — also set on Vercel. `OPENROUTER_API_KEY` is still in both, unused.
- **Accounts on prod**: demo (`demouser@gmail.com`, via "Try the demo") and a
  second real account (`ferdiputra1404@gmail.com`) for multi-user checks.
- **Prod live-check trick** (no browser needed): sign in via Supabase
  `/auth/v1/token?grant_type=password` with the demo creds, send the session
  as the `sb-<ref>-auth-token` cookie (`base64-` + base64url JSON), then POST
  to the `/api/ai/*` routes.

## Full history

For the commit-by-commit history and the design rationale behind every
decision, see `progress.md` — it's kept current and isn't duplicated here.
