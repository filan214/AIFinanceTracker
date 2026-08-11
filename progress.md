# Progress — Smart Finn Track

_Last updated: 2026-08-11 · branch `main` · HEAD `d8fe869` (pushed, deployed, verified)_

## Completed ✅

All five items below are committed, pushed, and verified live on production
(https://ai-finance-tracker-delta-drab.vercel.app).

1. **`/api/health` route** (`5dd6dc0`) — the keep-alive workflow was curling a
   route that didn't exist (404 → job failed before it could ping Supabase).
2. **Mobile responsive pass** (`069f2c7`) — full audit + fix across Dashboard,
   Transactions, Chat, Reports, Settings, and the app shell. 14 fixes; desktop
   left pixel-identical. Verified: the responsive CSS is present in the live
   production bundle.
3. **Favicon** (`9e0b86e`) — `/favicon.ico` and `/favicon.png` were 404ing (no
   icon declared). Added an ICO (generated from the app logo) + PNG. Verified 200
   on prod with the correct byte sizes; tab icon now shows.
4. **Report PDF export** (`9631628`) — Reports "Export" now downloads a real,
   selectable, multi-page A4 PDF (was `window.print()` → print dialog). Built
   client-side from report data with jsPDF, lazy-loaded, bilingual (id/en).
5. **Keep-alive workflow hardening** (`d8fe869`) — after fixing a missing-secret
   failure (`curl exit 6`), made the workflow resilient: secret preflight check,
   retries, best-effort app ping, tighter schedule.

Quality gates at HEAD: **31 tests pass**, typecheck/lint/build all clean.

## Key decisions

- **Every mobile fix is gated** (`sm:`/`lg:` or `[@media(hover:none)]`) so desktop
  is untouched. Most mobile bugs were **inline `style` attributes overriding
  Tailwind responsive classes** (main padding; dashboard grid columns) — fixed by
  removing the inline styles and using arbitrary responsive utilities.
- **Touch reveal via `[@media(hover:none)]`, not a width breakpoint** — hover-only
  edit/delete actions were unreachable on touch; this targets touch capability
  and preserves desktop hover behavior.
- **`100dvh`** on chat so the composer clears the mobile URL bar.
- **Favicon = `app/favicon.ico` + `public/favicon.png`**, generated from `LogoMark`
  via **sharp** (Windows `convert` is the NTFS tool, not ImageMagick; `png-to-ico`
  not installed, so the ICO is hand-assembled).
- **PDF = data-driven jsPDF, not html2canvas** (user's explicit choice): selectable
  text, multi-page, theme-independent, no chart/dark-mode capture glitches.
  Lazy-loaded to keep the bundle small; split into a pure `buildReportDoc` +
  `downloadReportPdf` for testability; text sanitized for jsPDF's WinAnsi fonts.
- **Keep-alive**: `exit 6` was a blank `SUPABASE_URL` secret → added a preflight
  check, retries, and an every-3-days cadence (under the ~7-day pause window).
- **Demo credentials stay in Vercel only** — not needed in GitHub secrets (the
  workflows don't build/run the app).
- **Commit to `main` directly; user pushes.**

## Pending / unfinished

Nothing is half-built. Two items are **verified-by-proxy only** and want a human
pass:

- [ ] **PDF download** — confirmed it *generates* valid PDF bytes; the actual
  browser download (client-side, behind auth) wasn't exercised. Test via demo.
- [ ] **Hardened keep-alive run** — the new workflow YAML is pushed but hasn't run
  live yet; needs a manual GitHub Actions dispatch to confirm green.
- [ ] **Live 375px visual check** — verified via CSS + build, not screenshots.

## Next steps

1. Open the site → **Try the demo → Reports → Export**; confirm a PDF downloads and
   its spacing/sections look right. Report back any layout tweak and it's a quick
   nudge in `src/lib/report-pdf.ts`.
2. GitHub → **Actions → Keep Supabase alive → Run workflow**; confirm green.
3. (Optional) Eyeball Dashboard + Chat at 375px in browser device mode.
4. (Backlog) `transaction-modal.tsx` has pre-existing dead code (`CATEGORY_KEYS`,
   `tCat` unused) — left alone deliberately; remove if desired.
5. (Backlog) GitHub disables scheduled workflows after 60 days of repo inactivity —
   the only way the keep-alive can still stop. No workflow-level fix; a paid
   Supabase tier (no auto-pause) is the real solution if it ever matters.

## Last touched files / sections

- `.github/workflows/keep-alive.yml` — whole file (hardened; `d8fe869`)
- `src/lib/report-pdf.ts` + `src/lib/report-pdf.test.ts` — new (PDF generator)
- `src/app/(app)/reports/page.tsx` — `handleExport` + `tCat` (export wiring)
- `handoff.md`, `progress.md` — this documentation (new)
