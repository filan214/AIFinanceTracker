# Planning & Smart Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add quick-add from text, receipt scan, category budgets, savings goals, recurring transactions, bank CSV import, and budget/goal chat tools to Smart Finn Track.

**Architecture:** Same pattern as the existing app: Next.js API routes per resource (auth via `createServerSupabase()` + explicit `user_id` filter on top of RLS), client fetch helpers, and all non-trivial logic in small pure modules under `src/lib/` with colocated vitest tests. AI goes through OpenRouter → `google/gemini-2.5-flash` via `src/lib/llm.ts`; every AI path has a deterministic fallback. Schema changes are SQL files the user runs in the Supabase SQL Editor.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v3, next-intl 3, Supabase (`@supabase/ssr`), AI SDK 6 (`ai` + `@ai-sdk/openai` pointed at OpenRouter), zod 4, vitest 4, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-27-planning-and-smart-input-design.md`

## Global Constraints

- Operating cost Rp 0/month: no new paid services, no new npm dependencies.
- Every user-facing string lives in BOTH `messages/en.json` and `messages/id.json` with identical key structure.
- Existing desktop layout must not change except for the additions described here; mobile bottom bar (`src/components/layout/mobile-nav.tsx`) stays unchanged.
- Every new table has RLS: `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)`.
- Every new API route: 401 when no user, 400 on zod validation failure, explicit `.eq("user_id", user.id)` on every query.
- Vercel request body limit is 4.5 MB; receipt data URLs are capped at 4,000,000 chars.
- Categories: expense keys are `food, transport, entertainment, shopping, bills, health, education, savings`; `income` is only for income.
- CSV import: file ≤ 1 MB, ≤ 500 rows per import, AI categorization in batches of 50.
- AI failure never blocks a flow: quick-add falls back to rule-based parse, receipt shows a localized error and leaves the form usable, CSV import keeps `shopping`.
- Commit to `main` directly (repo convention); the user pushes. Every commit message ends with the line `Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK`.
- Run commands from the repo root: `D:\TUGAS\C Path\Portfolio\WEB\AIFinanceTracker_claude` (bash: `/d/TUGAS/C Path/Portfolio/WEB/AIFinanceTracker_claude`).

## Review Focus

1. A quick-add note with no amount (or the AI returning 0, a negative, a huge number, or a non-number) must leave the amount empty so the form can't be saved with a bogus value — pinned in Task 1 (`quickParse("kopi")`, `mergeAiDraft` rejection cases).
2. The receipt model returning the total as a formatted string (`"Rp 125.000"`) or a future / impossible date must still produce a sane draft (parsed amount, date = today) — pinned in Task 4.
3. PostgREST returns `numeric` columns as strings in some cases; budgets and goals must sum `"1500000"` correctly instead of concatenating — pinned in Tasks 6 and 10.
4. Recurring catch-up running again in the same month (second tab, refresh after clearing sessionStorage) must not create duplicates — pinned in Task 13 (`recurringDue` returns nothing once `last_generated_month` is current) and by the unique index in Task 5.
5. A CSV with only a header row, blank lines, or a header like `Transaction Description` (contains "cr") must not crash or mis-map description as credit — pinned in Tasks 16 and 17.

## Spec deviations (decided while planning)

- **Recurring unique index is NOT partial.** PostgREST's upsert (`ON CONFLICT (recurring_rule_id, date)`) cannot target a partial index. A plain unique index on `(recurring_rule_id, date)` works identically because NULLs are distinct in Postgres, so ordinary transactions never conflict. Task 5 updates the spec line.
- **Client helpers for planning live in `src/lib/planning/api.ts`** (like `src/lib/chat/api.ts`) instead of growing `src/lib/api.ts`. Quick-add, receipt, and CSV import helpers still go in `src/lib/api.ts` next to `createTransaction`.
- **Date helpers** (`isValidYmd`, `addDays`, `localToday`) go in a new `src/lib/ymd.ts`; `todayYmd()` (Jakarta) is added to `src/lib/ai/dates.ts`.
- **One commit per task** (more granular than "one per phase"); each phase still ends in a working, building state.
- **CSV duplicate detection uses the Transactions page's already-loaded list** (up to 500 most recent rows) instead of a separate date-range fetch — `/api/transactions` only filters by month, and the page already holds the data.

## File Map

```
Create
  src/lib/ymd.ts (+ ymd.test.ts)                       date-string helpers
  src/lib/draft.ts (+ draft.test.ts)                   Draft type, expense keys, mergeAiDraft
  src/lib/quick-parse.ts (+ test)                      rule-based text → Draft, parseRupiahNumber
  src/lib/llm-json.ts (+ test)                         extractJson for LLM replies
  src/lib/receipt.ts (+ test)                          normalizeReceipt, size cap
  src/lib/image-resize.ts                              browser downscale → JPEG data URL
  src/lib/budget-progress.ts (+ test)                  budget math + summarizeBudgets
  src/lib/goal-progress.ts (+ test)                    goal math + summarizeGoals + pickFeaturedGoal
  src/lib/recurring-due.ts (+ test)                    due occurrences, next occurrence
  src/lib/csv/parse.ts (+ test)                        CSV text → string[][]
  src/lib/csv/map.ts (+ test)                          column guess, amount/date parse, drafts, duplicates
  src/lib/csv/batch.ts (+ test)                        chunking + AI category parsing
  src/lib/events.ts                                    TRANSACTIONS_CHANGED event name
  src/lib/planning/api.ts                              client fetch helpers (budgets/goals/recurring)
  src/lib/planning/budgets-server.ts                   loadBudgetsWithSpent (route + chat tool)
  src/lib/planning/goals-server.ts                     loadGoals (route + chat tool)
  src/app/api/ai/parse/route.ts
  src/app/api/ai/receipt/route.ts
  src/app/api/budgets/route.ts
  src/app/api/goals/route.ts
  src/app/api/goals/contributions/route.ts
  src/app/api/recurring/route.ts
  src/app/api/recurring/run/route.ts
  src/app/api/transactions/import/route.ts
  src/app/(app)/planning/page.tsx
  src/components/transactions/smart-input.tsx
  src/components/transactions/csv-import-modal.tsx
  src/components/planning/{field,amount-input,progress-bar,confirm-delete,list-skeleton}.tsx
  src/components/planning/{budget-form,budgets-tab}.tsx
  src/components/planning/{goal-form,contribution-form,goal-item,goals-tab}.tsx
  src/components/planning/{switch,recurring-form,recurring-tab}.tsx
  src/components/dashboard/{budget-card,goal-card}.tsx
  src/components/recurring-runner.tsx
  supabase/planning.sql
  supabase/Seed Planning for Demo User.sql

Modify
  src/lib/ai/dates.ts (+ dates.test.ts)                add todayYmd()
  src/lib/llm.ts                                       add askLLMWithImage()
  src/lib/api.ts                                       parseQuickText, scanReceipt, importTransactions
  src/lib/ai/tools.ts, src/lib/ai/prompts.ts           getBudgets / getGoals tools
  src/lib/supabase/middleware.ts                       protect /planning
  src/components/transactions/transaction-modal.tsx    SmartInput + prefill + skipCategorize
  src/app/(app)/transactions/page.tsx                  skipCategorize, Import button, event refetch
  src/app/(app)/dashboard/page.tsx                     skipCategorize, cards row, event refetch
  src/app/(app)/layout.tsx                             <RecurringRunner />
  src/app/(app)/settings/page.tsx                      Planning section link
  src/app/(app)/chat/page.tsx                          tool labels
  src/components/layout/sidebar.tsx                    Planning nav item
  messages/en.json, messages/id.json
```

---

## Phase 1 — Quick-add from text

### Task 1: Date helpers, Draft type, and rule-based quick parser

**Files:**
- Create: `src/lib/ymd.ts`, `src/lib/ymd.test.ts`
- Create: `src/lib/draft.ts`, `src/lib/draft.test.ts`
- Create: `src/lib/quick-parse.ts`, `src/lib/quick-parse.test.ts`

**Interfaces:**
- Produces:
  - `isValidYmd(s: string): boolean`, `addDays(ymd: string, days: number): string`, `localToday(): string` (from `@/lib/ymd`)
  - `type Draft = { amount: number; type: TransactionType; description: string; date: string; category_key: CategoryKey }`
  - `type ExpenseCategoryKey = Exclude<CategoryKey, "income">`, `EXPENSE_CATEGORY_KEYS: ExpenseCategoryKey[]`
  - `mergeAiDraft(base: Draft, ai: unknown): Draft` (from `@/lib/draft`)
  - `parseRupiahNumber(raw: string): number | null`, `quickParse(text: string, today: string): Draft` (from `@/lib/quick-parse`)

- [ ] **Step 1: Write the failing tests**

`src/lib/ymd.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isValidYmd, addDays } from "./ymd";

describe("isValidYmd", () => {
  it("accepts real dates", () => {
    expect(isValidYmd("2026-09-27")).toBe(true);
    expect(isValidYmd("2028-02-29")).toBe(true);
  });
  it("rejects impossible or malformed dates", () => {
    expect(isValidYmd("2026-02-30")).toBe(false);
    expect(isValidYmd("2026-13-01")).toBe(false);
    expect(isValidYmd("27/09/2026")).toBe(false);
    expect(isValidYmd("")).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
```

`src/lib/draft.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mergeAiDraft, EXPENSE_CATEGORY_KEYS, type Draft } from "./draft";

const BASE: Draft = {
  amount: 35000,
  type: "expense",
  description: "Makan siang",
  date: "2026-09-26",
  category_key: "shopping",
};

describe("EXPENSE_CATEGORY_KEYS", () => {
  it("has every category except income", () => {
    expect(EXPENSE_CATEGORY_KEYS).toHaveLength(8);
    expect(EXPENSE_CATEGORY_KEYS).not.toContain("income");
  });
});

describe("mergeAiDraft", () => {
  it("takes valid AI fields", () => {
    const out = mergeAiDraft(BASE, {
      amount: 36000,
      type: "expense",
      description: "Makan siang warteg",
      date: "2026-09-25",
      category_key: "food",
    });
    expect(out).toEqual({
      amount: 36000,
      type: "expense",
      description: "Makan siang warteg",
      date: "2026-09-25",
      category_key: "food",
    });
  });

  it("keeps base values for invalid AI fields", () => {
    const out = mergeAiDraft(BASE, {
      amount: -5,
      type: "loan",
      description: "",
      date: "2026-02-30",
      category_key: "groceries",
    });
    expect(out).toEqual(BASE);
  });

  it("rejects zero, huge, and non-numeric amounts", () => {
    expect(mergeAiDraft(BASE, { amount: 0 }).amount).toBe(35000);
    expect(mergeAiDraft(BASE, { amount: 1e13 }).amount).toBe(35000);
    expect(mergeAiDraft(BASE, { amount: "abc" }).amount).toBe(35000);
  });

  it("accepts a numeric string amount", () => {
    expect(mergeAiDraft(BASE, { amount: "42000" }).amount).toBe(42000);
  });

  it("forces income category for income and never income for expense", () => {
    expect(mergeAiDraft(BASE, { type: "income", category_key: "food" }).category_key).toBe("income");
    expect(mergeAiDraft(BASE, { type: "expense", category_key: "income" }).category_key).toBe("shopping");
  });

  it("returns base for non-object input", () => {
    expect(mergeAiDraft(BASE, null)).toEqual(BASE);
    expect(mergeAiDraft(BASE, "food")).toEqual(BASE);
  });
});
```

`src/lib/quick-parse.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { quickParse, parseRupiahNumber } from "./quick-parse";

const TODAY = "2026-09-27";

describe("parseRupiahNumber", () => {
  it("parses thousands separators", () => {
    expect(parseRupiahNumber("Rp 12.000")).toBe(12000);
    expect(parseRupiahNumber("12,500")).toBe(12500);
    expect(parseRupiahNumber("1.500.000")).toBe(1500000);
    expect(parseRupiahNumber("50000")).toBe(50000);
  });
  it("drops a 1-2 digit decimal tail", () => {
    expect(parseRupiahNumber("12.000,50")).toBe(12000);
  });
  it("returns null without digits", () => {
    expect(parseRupiahNumber("abc")).toBeNull();
  });
});

describe("quickParse", () => {
  it("parses rb suffix and kemarin", () => {
    expect(quickParse("makan siang 35rb kemarin", TODAY)).toEqual({
      amount: 35000,
      type: "expense",
      description: "Makan siang",
      date: "2026-09-26",
      category_key: "shopping",
    });
  });

  it("parses jt with a decimal comma and detects income", () => {
    const d = quickParse("Gaji September 8,5jt", TODAY);
    expect(d.amount).toBe(8500000);
    expect(d.type).toBe("income");
    expect(d.category_key).toBe("income");
    expect(d.description).toBe("Gaji September");
    expect(d.date).toBe(TODAY);
  });

  it("parses 1.5jt, 35k, and today", () => {
    expect(quickParse("laptop service 1.5jt", TODAY).amount).toBe(1500000);
    const d = quickParse("35k grab today", TODAY);
    expect(d.amount).toBe(35000);
    expect(d.description).toBe("Grab");
    expect(d.date).toBe(TODAY);
  });

  it("parses Rp prefix", () => {
    const d = quickParse("Rp 12.000 parkir", TODAY);
    expect(d.amount).toBe(12000);
    expect(d.description).toBe("Parkir");
  });

  it("uses the largest plain number", () => {
    const d = quickParse("kopi 2 25000", TODAY);
    expect(d.amount).toBe(25000);
    expect(d.description).toBe("Kopi 2");
  });

  it("parses yesterday in English", () => {
    expect(quickParse("coffee 30rb yesterday", TODAY).date).toBe("2026-09-26");
  });

  it("returns amount 0 when there is no number", () => {
    const d = quickParse("kopi", TODAY);
    expect(d.amount).toBe(0);
    expect(d.description).toBe("Kopi");
  });

  it("handles empty input", () => {
    expect(quickParse("", TODAY)).toEqual({
      amount: 0,
      type: "expense",
      description: "",
      date: TODAY,
      category_key: "shopping",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/ymd.test.ts src/lib/draft.test.ts src/lib/quick-parse.test.ts`
Expected: FAIL — cannot resolve `./ymd`, `./draft`, `./quick-parse`.

- [ ] **Step 3: Implement**

`src/lib/ymd.ts`:
```ts
// Helpers for "YYYY-MM-DD" date strings. Arithmetic runs in UTC so a date
// string never drifts by a day because of the host's timezone.

export function isValidYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Today in the browser's local timezone (matches the month the dashboard shows).
export function localToday(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
```

`src/lib/draft.ts`:
```ts
import { z } from "zod";
import { CATEGORY_KEYS, type CategoryKey, type TransactionType } from "./mock-data";
import { isValidYmd } from "./ymd";

// A transaction the user has not saved yet (quick-add, receipt scan, CSV row).
export type Draft = {
  amount: number;
  type: TransactionType;
  description: string;
  date: string; // YYYY-MM-DD
  category_key: CategoryKey;
};

export type ExpenseCategoryKey = Exclude<CategoryKey, "income">;

export const EXPENSE_CATEGORY_KEYS = CATEGORY_KEYS.filter(
  (k): k is ExpenseCategoryKey => k !== "income"
);

const MAX_AMOUNT = 1_000_000_000_000;

const FIELD = {
  amount: z.number().positive().max(MAX_AMOUNT),
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(1).max(120),
  date: z.string().refine(isValidYmd),
  category_key: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
};

function pick<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const r = schema.safeParse(value);
  return r.success ? r.data : fallback;
}

// Merge an untrusted AI JSON object onto a rule-based draft: each field is
// taken from the AI only when it validates, otherwise the base value stays.
export function mergeAiDraft(base: Draft, ai: unknown): Draft {
  const o = (ai && typeof ai === "object" ? ai : {}) as Record<string, unknown>;
  const amountRaw = typeof o.amount === "string" ? Number(o.amount) : o.amount;
  const type = pick(FIELD.type, o.type, base.type);
  let category_key = pick(FIELD.category_key, o.category_key, base.category_key);
  if (type === "income") category_key = "income";
  else if (category_key === "income") {
    category_key = base.category_key === "income" ? "shopping" : base.category_key;
  }
  return {
    amount: Math.round(pick(FIELD.amount, amountRaw, base.amount)),
    type,
    description: pick(FIELD.description, o.description, base.description),
    date: pick(FIELD.date, o.date, base.date),
    category_key,
  };
}
```

`src/lib/quick-parse.ts`:
```ts
import { addDays } from "./ymd";
import type { Draft } from "./draft";

const INCOME_WORDS = /\b(gaji|salary|income|bonus|freelance|refund|dapat|terima)\b/i;
const YESTERDAY = /\b(kemarin|yesterday)\b/i;
const TODAY = /\b(hari ini|today)\b/i;
const SUFFIX = /(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m)\b/i;
const RP = /rp\.?\s*(\d[\d.,]*)/i;
const PLAIN = /\d[\d.,]*/g;

// "12.000" / "12,000" / "12.000,50" → 12000. Rupiah has no minor unit in
// practice, so a trailing 1–2 digit group after the last separator is dropped.
export function parseRupiahNumber(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;
  const decimal = s.match(/[.,](\d{1,2})$/);
  const intPart = decimal ? s.slice(0, decimal.index) : s;
  const n = Number(intPart.replace(/[.,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Rule-based parse of a short note like "makan siang 35rb kemarin". Runs
// before (and as the fallback for) the AI parse, so it must never throw.
export function quickParse(text: string, today: string): Draft {
  let rest = ` ${text} `;
  let amount = 0;

  const suffix = rest.match(SUFFIX);
  if (suffix) {
    const base = Number(suffix[1].replace(",", "."));
    const unit = suffix[2].toLowerCase();
    const mult = unit === "rb" || unit === "ribu" || unit === "k" ? 1_000 : 1_000_000;
    amount = Math.round(base * mult);
    rest = rest.replace(suffix[0], " ");
  } else {
    const rp = rest.match(RP);
    if (rp) {
      amount = parseRupiahNumber(rp[1]) ?? 0;
      rest = rest.replace(rp[0], " ");
    } else {
      let best = "";
      for (const n of rest.match(PLAIN) ?? []) {
        const v = parseRupiahNumber(n) ?? 0;
        if (v > amount) {
          amount = v;
          best = n;
        }
      }
      if (best) rest = rest.replace(best, " ");
    }
  }

  let date = today;
  if (YESTERDAY.test(rest)) {
    date = addDays(today, -1);
    rest = rest.replace(YESTERDAY, " ");
  } else if (TODAY.test(rest)) {
    rest = rest.replace(TODAY, " ");
  }

  const type = INCOME_WORDS.test(text) ? "income" : "expense";
  const cleaned = rest
    .replace(/\s+/g, " ")
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "")
    .trim();
  const description = cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "";

  return {
    amount,
    type,
    description,
    date,
    category_key: type === "income" ? "income" : "shopping",
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/ymd.test.ts src/lib/draft.test.ts src/lib/quick-parse.test.ts`
Expected: PASS (all tests in 3 files).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ymd.ts src/lib/ymd.test.ts src/lib/draft.ts src/lib/draft.test.ts src/lib/quick-parse.ts src/lib/quick-parse.test.ts
git commit -m "feat: add rule-based quick-add parser and draft helpers" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 2: AI parse route, JSON extraction, and Jakarta today

**Files:**
- Create: `src/lib/llm-json.ts`, `src/lib/llm-json.test.ts`
- Modify: `src/lib/ai/dates.ts` (append `todayYmd`), `src/lib/ai/dates.test.ts` (append test)
- Create: `src/app/api/ai/parse/route.ts`
- Modify: `src/lib/api.ts` (append `parseQuickText`)

**Interfaces:**
- Consumes: `quickParse`, `mergeAiDraft`, `Draft` (Task 1); `askLLM` from `@/lib/llm`; `todayParts`, `ymd` from `@/lib/ai/dates`.
- Produces:
  - `extractJson(raw: string): unknown` (returns `null` when nothing parses)
  - `todayYmd(): string` — Jakarta "today" as `YYYY-MM-DD`
  - `POST /api/ai/parse { text }` → `200 { data: Draft }`; 400 on invalid text; 401 when logged out
  - `parseQuickText(text: string): Promise<Draft>` (throws on non-2xx)

- [ ] **Step 1: Write the failing tests**

`src/lib/llm-json.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { extractJson } from "./llm-json";

describe("extractJson", () => {
  it("parses a fenced object", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });
  it("parses an object surrounded by prose", () => {
    expect(extractJson('Sure! {"amount": 5} Hope that helps.')).toEqual({ amount: 5 });
  });
  it("parses an array", () => {
    expect(extractJson('["food","transport"]')).toEqual(["food", "transport"]);
  });
  it("returns null for garbage or empty input", () => {
    expect(extractJson("no json here")).toBeNull();
    expect(extractJson("{broken")).toBeNull();
    expect(extractJson("")).toBeNull();
  });
});
```

Append to `src/lib/ai/dates.test.ts` (add `todayYmd` to its existing import from `./dates`):
```ts
describe("todayYmd", () => {
  it("returns the Jakarta date as YYYY-MM-DD", () => {
    const { y, m, d } = todayParts();
    expect(todayYmd()).toBe(ymd(y, m, d));
    expect(todayYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```
(If `todayParts`/`ymd` are not already imported in that file, add them to the import.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/llm-json.test.ts src/lib/ai/dates.test.ts`
Expected: FAIL — `./llm-json` not found; `todayYmd` is not exported.

- [ ] **Step 3: Implement**

`src/lib/llm-json.ts`:
```ts
// Pull the first JSON object/array out of an LLM reply (models often wrap
// JSON in ``` fences or add a sentence around it). Returns null if none parses.
export function extractJson(raw: string): unknown {
  const s = raw.replace(/```(?:json)?/gi, "").trim();
  const obj = s.indexOf("{");
  const arr = s.indexOf("[");
  const useArr = arr >= 0 && (obj < 0 || arr < obj);
  const open = useArr ? arr : obj;
  if (open < 0) return null;
  const close = s.lastIndexOf(useArr ? "]" : "}");
  if (close <= open) return null;
  try {
    return JSON.parse(s.slice(open, close + 1));
  } catch {
    return null;
  }
}
```

Append to `src/lib/ai/dates.ts`:
```ts
// Jakarta "today" as YYYY-MM-DD.
export function todayYmd(): string {
  const { y, m, d } = todayParts();
  return ymd(y, m, d);
}
```

`src/app/api/ai/parse/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import { extractJson } from "@/lib/llm-json";
import { quickParse } from "@/lib/quick-parse";
import { mergeAiDraft } from "@/lib/draft";
import { todayYmd } from "@/lib/ai/dates";

const Body = z.object({ text: z.string().trim().min(1).max(200) });

function buildPrompt(text: string, today: string): string {
  return `You convert a short personal-finance note into one transaction.
Today is ${today} (Asia/Jakarta).
Note: ${JSON.stringify(text)}

Return ONLY a JSON object:
{"amount": number, "type": "income" | "expense", "description": string, "date": "YYYY-MM-DD", "category_key": string}

Rules:
- amount: whole Rupiah. "rb"/"ribu"/"k" = thousand, "jt"/"juta" = million. "35rb" = 35000, "1,5jt" = 1500000.
- date: resolve relative words (kemarin/yesterday, lusa, "2 hari lalu", weekday names) against today. Default today.
- description: short title of what it was, in the same language as the note, without the amount or date words. Capitalize the first letter.
- category_key: one of food, transport, entertainment, shopping, bills, health, education, savings, income. Use income only when type is income.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const today = todayYmd();
  const base = quickParse(parsed.data.text, today);
  try {
    const raw = await askLLM(buildPrompt(parsed.data.text, today), { maxOutputTokens: 256 });
    return NextResponse.json({ data: mergeAiDraft(base, extractJson(raw)) });
  } catch {
    // AI down or misconfigured: the rule-based parse is still useful.
    return NextResponse.json({ data: base });
  }
}
```

Append to `src/lib/api.ts` (add `import type { Draft } from "./draft";` to the imports at the top):
```ts
// Quick-add: turn a note like "makan siang 35rb kemarin" into a draft.
export async function parseQuickText(text: string): Promise<Draft> {
  const res = await fetch("/api/ai/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("parse_failed");
  const json = await res.json();
  return json.data;
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npx vitest run src/lib/llm-json.test.ts src/lib/ai/dates.test.ts && npm run typecheck`
Expected: tests PASS; typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/llm-json.ts src/lib/llm-json.test.ts src/lib/ai/dates.ts src/lib/ai/dates.test.ts src/app/api/ai/parse/route.ts src/lib/api.ts
git commit -m "feat: add AI quick-add parse endpoint with rule-based fallback" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 3: Smart input box in the transaction modal

**Files:**
- Create: `src/components/transactions/smart-input.tsx`
- Modify: `src/components/transactions/transaction-modal.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx` (`addTransaction`)
- Modify: `src/app/(app)/transactions/page.tsx` (`addTransaction`)
- Modify: `messages/en.json`, `messages/id.json` (new `smartInput` namespace)

**Interfaces:**
- Consumes: `parseQuickText` (Task 2), `Draft` (Task 1), `CategoryBadge` from `@/components/category-badge`.
- Produces:
  - `<SmartInput onDraft={(d: Draft) => void} />` — Task 4 adds a receipt button inside it.
  - `export type TransactionDraft = Draft & { skipCategorize?: boolean }` from `transaction-modal.tsx` (replaces the old local type; same fields plus the flag).

- [ ] **Step 1: Add i18n keys**

In `messages/en.json` add a top-level key right after the `"transactions"` block:
```json
"smartInput": {
  "label": "Quick add with AI",
  "placeholder": "e.g. makan siang 35rb kemarin",
  "fill": "Fill",
  "error": "Couldn't understand that — fill the form manually.",
  "aiFilled": "Filled by AI — check before saving.",
  "aiCategory": "AI category"
},
```
In `messages/id.json` at the same position:
```json
"smartInput": {
  "label": "Tambah cepat dengan AI",
  "placeholder": "mis. makan siang 35rb kemarin",
  "fill": "Isi",
  "error": "Tidak bisa dipahami — isi form secara manual.",
  "aiFilled": "Diisi oleh AI — cek sebelum menyimpan.",
  "aiCategory": "Kategori AI"
},
```

- [ ] **Step 2: Create `src/components/transactions/smart-input.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { parseQuickText } from "@/lib/api";
import type { Draft } from "@/lib/draft";

// One-line natural-language input that fills the transaction form. Never saves.
export function SmartInput({ onDraft }: { onDraft: (d: Draft) => void }) {
  const t = useTranslations("smartInput");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fill() {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      onDraft(await parseQuickText(value));
      setText("");
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[10px] border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
        <Sparkles className="h-3 w-3" />
        {t("label")}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter would submit the surrounding transaction form.
            if (e.key === "Enter") {
              e.preventDefault();
              fill();
            }
          }}
          placeholder={t("placeholder")}
          maxLength={200}
          className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <Button
          type="button"
          size="sm"
          className="h-9"
          onClick={fill}
          disabled={busy || !text.trim()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("fill")}
        </Button>
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire it into `transaction-modal.tsx`**

Replace the local `TransactionDraft` type definition:
```ts
export type TransactionDraft = {
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  category_key: CategoryKey;
};
```
with:
```ts
// skipCategorize: the category already came from AI (quick-add / receipt),
// so the page should not run the background categorizer again.
export type TransactionDraft = Draft & { skipCategorize?: boolean };
```
Add imports:
```ts
import { SmartInput } from "@/components/transactions/smart-input";
import { CategoryBadge } from "@/components/category-badge";
import type { Draft } from "@/lib/draft";
```
Add a translator and state next to the existing ones:
```ts
const tSmart = useTranslations("smartInput");
const [aiFilled, setAiFilled] = useState(false);
```
In the `useEffect` that resets on `open`, add `setAiFilled(false);`.

Add this function after the `useEffect` (before `if (!open) return null;`):
```ts
function applyDraft(d: Draft) {
  setType(d.type);
  setAmount(d.amount > 0 ? String(d.amount) : "");
  setDescription(d.description);
  setDate(d.date);
  setCategory(d.category_key);
  setAiFilled(true);
}
```
In `submit`, change the `onSave({...})` object to include the flag:
```ts
onSave({
  amount: numAmount,
  type,
  description: description.trim(),
  date,
  category_key: type === "income" ? "income" : category,
  skipCategorize: aiFilled,
});
```
Insert `<SmartInput onDraft={applyDraft} />` as the first child of `<form className="space-y-3.5 px-6 py-4" ...>` (before the type selector `<div>`).

Replace the hint under the description input (the `<div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400">…</div>` block) with:
```tsx
{aiFilled ? (
  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
    <Sparkles className="h-2.5 w-2.5" />
    {tSmart("aiFilled")}
    {type === "expense" && (
      <span className="inline-flex items-center gap-1 text-zinc-500">
        · {tSmart("aiCategory")}: <CategoryBadge categoryKey={category} />
      </span>
    )}
  </div>
) : (
  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400">
    <Sparkles className="h-2.5 w-2.5" />
    {locale === "id"
      ? "AI akan otomatis memilih kategori dari deskripsi ini."
      : "AI will pick a category from this description."}
  </div>
)}
```
Leave the `CategoryKey` / `CATEGORY_KEYS` imports alone if still referenced; remove `type CategoryKey` from the import only if TypeScript/ESLint reports it unused because of this change.

- [ ] **Step 4: Respect `skipCategorize` in both pages**

`src/app/(app)/dashboard/page.tsx`, inside `addTransaction`, replace
```ts
categorizeTransaction(created.id, d.description, d.type).catch(() => {});
```
with
```ts
if (!d.skipCategorize) {
  categorizeTransaction(created.id, d.description, d.type).catch(() => {});
}
```

`src/app/(app)/transactions/page.tsx`, inside `addTransaction`:
- change the optimistic item's `category_key: d.type === "income" ? "income" : "shopping",` to
  `category_key: d.type === "income" ? "income" : d.skipCategorize ? d.category_key : "shopping",`
- wrap the `categorizeTransaction(created.id, d.description, d.type).then(...)` call in `if (!d.skipCategorize) { ... }`.

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all exit 0; test count = previous 31 + new tests, all passing.

Then run `npm run dev`, log in with **Try the demo**, open **Transactions → Add**, type `makan siang 35rb kemarin`, press **Fill**. Expected: amount 35000, description filled, date = yesterday, "Filled by AI" line with a Food badge. Press **Save**; the row appears with the Food category. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/transactions/smart-input.tsx src/components/transactions/transaction-modal.tsx "src/app/(app)/dashboard/page.tsx" "src/app/(app)/transactions/page.tsx" messages/en.json messages/id.json
git commit -m "feat: quick-add transactions from natural-language text" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

---

## Phase 2 — Receipt scan

### Task 4: Receipt scan (image → draft)

**Files:**
- Create: `src/lib/receipt.ts`, `src/lib/receipt.test.ts`
- Create: `src/lib/image-resize.ts`
- Modify: `src/lib/llm.ts` (append `askLLMWithImage`)
- Create: `src/app/api/ai/receipt/route.ts`
- Modify: `src/lib/api.ts` (append `scanReceipt`)
- Modify: `src/components/transactions/smart-input.tsx` (camera button)
- Modify: `messages/en.json`, `messages/id.json` (`smartInput` additions)

**Interfaces:**
- Consumes: `Draft`, `EXPENSE_CATEGORY_KEYS`, `ExpenseCategoryKey` (Task 1), `isValidYmd` (Task 1), `parseRupiahNumber` (Task 1), `extractJson`, `todayYmd` (Task 2).
- Produces:
  - `MAX_RECEIPT_DATA_URL_CHARS = 4_000_000`
  - `normalizeReceipt(ai: unknown, today: string): Draft | null`
  - `resizeImageToDataUrl(file: File, maxDim?: number, quality?: number): Promise<string>`
  - `askLLMWithImage(prompt: string, imageDataUrl: string, opts?: { maxOutputTokens?: number }): Promise<string>`
  - `POST /api/ai/receipt { image }` → `200 { data: Draft }` | `422 { error: "unreadable" }` | 400 | 401
  - `scanReceipt(image: string): Promise<Draft>` (throws on non-2xx)

- [ ] **Step 1: Write the failing test**

`src/lib/receipt.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { normalizeReceipt } from "./receipt";

const TODAY = "2026-09-27";

describe("normalizeReceipt", () => {
  it("maps a clean AI reply to an expense draft", () => {
    expect(
      normalizeReceipt(
        { total: 125000, date: "2026-09-20", merchant: " Indomaret ", category_key: "food" },
        TODAY
      )
    ).toEqual({
      amount: 125000,
      type: "expense",
      description: "Indomaret",
      date: "2026-09-20",
      category_key: "food",
    });
  });

  it("parses a formatted string total", () => {
    expect(normalizeReceipt({ total: "Rp 125.000", merchant: "Alfamart" }, TODAY)?.amount).toBe(125000);
  });

  it("falls back to today for missing, invalid, or future dates", () => {
    expect(normalizeReceipt({ total: 1000 }, TODAY)?.date).toBe(TODAY);
    expect(normalizeReceipt({ total: 1000, date: "2026-02-30" }, TODAY)?.date).toBe(TODAY);
    expect(normalizeReceipt({ total: 1000, date: "2027-01-01" }, TODAY)?.date).toBe(TODAY);
  });

  it("uses shopping for unknown or income categories and empty description without merchant", () => {
    const d = normalizeReceipt({ total: 1000, category_key: "income" }, TODAY);
    expect(d?.category_key).toBe("shopping");
    expect(d?.description).toBe("");
  });

  it("returns null when there is no usable total", () => {
    expect(normalizeReceipt({ total: null }, TODAY)).toBeNull();
    expect(normalizeReceipt({ total: 0 }, TODAY)).toBeNull();
    expect(normalizeReceipt({ total: "n/a" }, TODAY)).toBeNull();
    expect(normalizeReceipt(null, TODAY)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/receipt.test.ts`
Expected: FAIL — `./receipt` not found.

- [ ] **Step 3: Implement `src/lib/receipt.ts`**

```ts
import { EXPENSE_CATEGORY_KEYS, type Draft, type ExpenseCategoryKey } from "./draft";
import { parseRupiahNumber } from "./quick-parse";
import { isValidYmd } from "./ymd";

// Base64 data URL of a ~3 MB image; Vercel's request body limit is 4.5 MB.
export const MAX_RECEIPT_DATA_URL_CHARS = 4_000_000;

// Turn the model's receipt JSON into an expense draft, or null if no total.
export function normalizeReceipt(ai: unknown, today: string): Draft | null {
  const o = (ai && typeof ai === "object" ? ai : {}) as Record<string, unknown>;
  const total =
    typeof o.total === "number"
      ? o.total
      : typeof o.total === "string"
        ? parseRupiahNumber(o.total)
        : null;
  if (total === null || !Number.isFinite(total) || total <= 0) return null;

  const date =
    typeof o.date === "string" && isValidYmd(o.date) && o.date <= today ? o.date : today;
  const merchant = typeof o.merchant === "string" ? o.merchant.trim().slice(0, 120) : "";
  const category_key =
    typeof o.category_key === "string" &&
    (EXPENSE_CATEGORY_KEYS as string[]).includes(o.category_key)
      ? (o.category_key as ExpenseCategoryKey)
      : "shopping";

  return { amount: Math.round(total), type: "expense", description: merchant, date, category_key };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/receipt.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the image LLM helper, resize helper, route, and client helper**

Append to `src/lib/llm.ts`:
```ts
// Multimodal prompt (text + one image). Uses the Chat Completions endpoint,
// which is OpenRouter's primary API and accepts base64 images.
export async function askLLMWithImage(
  prompt: string,
  imageDataUrl: string,
  opts: { maxOutputTokens?: number } = {}
): Promise<string> {
  const comma = imageDataUrl.indexOf(",");
  const mediaType = imageDataUrl.slice(5, imageDataUrl.indexOf(";")); // "data:<type>;base64,"
  const { text } = await generateText({
    model: openrouter.chat(DEFAULT_MODEL),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: imageDataUrl.slice(comma + 1), mediaType },
        ],
      },
    ],
    maxOutputTokens: opts.maxOutputTokens ?? 512,
  });
  return text.trim();
}
```

`src/lib/image-resize.ts`:
```ts
// Downscale a photo in the browser so it fits well under Vercel's 4.5 MB body
// limit, and re-encode as JPEG (also normalizes PNG/WebP).
export async function resizeImageToDataUrl(
  file: File,
  maxDim = 1600,
  quality = 0.8
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}
```

`src/app/api/ai/receipt/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLMWithImage } from "@/lib/llm";
import { extractJson } from "@/lib/llm-json";
import { normalizeReceipt, MAX_RECEIPT_DATA_URL_CHARS } from "@/lib/receipt";
import { todayYmd } from "@/lib/ai/dates";

const Body = z.object({
  image: z
    .string()
    .max(MAX_RECEIPT_DATA_URL_CHARS)
    .regex(/^data:image\/(jpeg|png|webp);base64,/),
});

function buildPrompt(today: string): string {
  return `You read shopping receipts. Today is ${today}.
Return ONLY a JSON object:
{"total": number, "date": "YYYY-MM-DD" or null, "merchant": string, "category_key": string}
- total: the final amount paid (grand total after tax and discounts), whole Rupiah, digits only.
- date: the transaction date printed on the receipt, or null if not visible.
- merchant: the store or restaurant name, short.
- category_key: one of food, transport, entertainment, shopping, bills, health, education, savings.
If the image is not a receipt, return {"total": null}.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid image" }, { status: 400 });

  const today = todayYmd();
  try {
    const raw = await askLLMWithImage(buildPrompt(today), parsed.data.image, {
      maxOutputTokens: 256,
    });
    const draft = normalizeReceipt(extractJson(raw), today);
    if (!draft) return NextResponse.json({ error: "unreadable" }, { status: 422 });
    return NextResponse.json({ data: draft });
  } catch {
    return NextResponse.json({ error: "unreadable" }, { status: 422 });
  }
}
```

Append to `src/lib/api.ts`:
```ts
// Receipt scan: send a downscaled JPEG data URL, get a draft back.
export async function scanReceipt(image: string): Promise<Draft> {
  const res = await fetch("/api/ai/receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  if (!res.ok) throw new Error("receipt_unreadable");
  const json = await res.json();
  return json.data;
}
```

- [ ] **Step 6: Add i18n keys** (inside the existing `smartInput` objects)

en:
```json
"scan": "Scan receipt",
"scanning": "Reading receipt…",
"scanError": "Couldn't read the receipt — fill the form manually.",
"tooLarge": "Image is too large. Try a smaller photo."
```
id:
```json
"scan": "Pindai struk",
"scanning": "Membaca struk…",
"scanError": "Struk tidak terbaca — isi form secara manual.",
"tooLarge": "Gambar terlalu besar. Coba foto yang lebih kecil."
```

- [ ] **Step 7: Add the camera button to `smart-input.tsx`**

Add imports: `import { useRef } from "react";` (merge into the existing `react` import), `Camera` into the lucide import, and:
```ts
import { scanReceipt } from "@/lib/api";
import { resizeImageToDataUrl } from "@/lib/image-resize";
import { MAX_RECEIPT_DATA_URL_CHARS } from "@/lib/receipt";
```
(merge `scanReceipt` into the existing `@/lib/api` import.)

Add state/ref inside the component:
```ts
const fileRef = useRef<HTMLInputElement>(null);
const [scanning, setScanning] = useState(false);

async function onPhoto(file: File | undefined) {
  if (!file) return;
  setError(null);
  if (!file.type.startsWith("image/")) {
    setError(t("scanError"));
    return;
  }
  setScanning(true);
  try {
    const dataUrl = await resizeImageToDataUrl(file);
    if (dataUrl.length > MAX_RECEIPT_DATA_URL_CHARS) {
      setError(t("tooLarge"));
      return;
    }
    onDraft(await scanReceipt(dataUrl));
  } catch {
    setError(t("scanError"));
  } finally {
    setScanning(false);
    if (fileRef.current) fileRef.current.value = "";
  }
}
```
Inside the `<div className="flex gap-2">`, after the Fill `<Button>`, add:
```tsx
<input
  ref={fileRef}
  type="file"
  accept="image/*"
  capture="environment"
  className="sr-only"
  onChange={(e) => onPhoto(e.target.files?.[0])}
/>
<Button
  type="button"
  variant="secondary"
  size="sm"
  className="h-9"
  onClick={() => fileRef.current?.click()}
  disabled={scanning || busy}
  aria-label={t("scan")}
  title={t("scan")}
>
  {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
</Button>
```
Below the error paragraph add:
```tsx
{scanning && (
  <p className="mt-1.5 text-[11px] text-zinc-500">{t("scanning")}</p>
)}
```

- [ ] **Step 8: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all exit 0.

Live check: `npm run dev`, demo login, **Transactions → Add → camera button**, pick any receipt photo (a photo of a printed receipt or a receipt image downloaded from the web). Expected: amount/date/description filled, "Filled by AI" line. Pick a non-receipt image (e.g. `public/favicon.png`) → expected: localized "Couldn't read the receipt" error, form still usable. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add src/lib/receipt.ts src/lib/receipt.test.ts src/lib/image-resize.ts src/lib/llm.ts src/app/api/ai/receipt/route.ts src/lib/api.ts src/components/transactions/smart-input.tsx messages/en.json messages/id.json
git commit -m "feat: scan a receipt photo into a draft transaction" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

---

## Phase 3 — Schema, Planning page, Budgets

### Task 5: Schema + demo seed SQL (user runs them)

**Files:**
- Create: `supabase/planning.sql`
- Create: `supabase/Seed Planning for Demo User.sql`
- Modify: `docs/superpowers/specs/2026-09-27-planning-and-smart-input-design.md` (index line)

**Interfaces:**
- Produces tables `budgets`, `savings_goals`, `goal_contributions`, `recurring_rules`; column `transactions.recurring_rule_id`; unique index `uq_tx_recurring_occurrence (recurring_rule_id, date)`. Column names exactly as in the SQL below — later tasks select them by these names.

- [ ] **Step 1: Write `supabase/planning.sql`**

```sql
-- Smart Finn Track — Planning features: budgets, savings goals, recurring.
-- Run in the Supabase SQL Editor after schema.sql. Safe to re-run.

-- 1. budgets: one monthly limit per expense category, applies every month
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_key text not null check (category_key in
    ('food','transport','entertainment','shopping','bills','health','education','savings')),
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_key)
);

alter table public.budgets enable row level security;
drop policy if exists "Users access own budgets" on public.budgets;
create policy "Users access own budgets"
  on public.budgets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. savings_goals
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  target_amount numeric not null check (target_amount > 0),
  target_date date,
  created_at timestamptz not null default now()
);

alter table public.savings_goals enable row level security;
drop policy if exists "Users access own goals" on public.savings_goals;
create policy "Users access own goals"
  on public.savings_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. goal_contributions: manual top-ups toward a goal
create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_goal_contributions_goal_date
  on public.goal_contributions(goal_id, date desc);

alter table public.goal_contributions enable row level security;
drop policy if exists "Users access own contributions" on public.goal_contributions;
create policy "Users access own contributions"
  on public.goal_contributions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. recurring_rules: monthly transactions generated when the app opens
create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null check (char_length(description) between 1 and 120),
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category_key text not null check (category_key in
    ('food','transport','entertainment','shopping','bills','health','education','savings','income')),
  day_of_month int not null check (day_of_month between 1 and 31),
  start_date date not null default current_date,
  last_generated_month text check (last_generated_month ~ '^\d{4}-\d{2}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.recurring_rules enable row level security;
drop policy if exists "Users access own recurring rules" on public.recurring_rules;
create policy "Users access own recurring rules"
  on public.recurring_rules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. transactions: link generated occurrences to their rule.
alter table public.transactions
  add column if not exists recurring_rule_id uuid
  references public.recurring_rules(id) on delete set null;

-- Not a partial index on purpose: PostgREST upserts (ON CONFLICT
-- (recurring_rule_id, date)) cannot target a partial index. NULLs are distinct,
-- so ordinary transactions (recurring_rule_id is null) never conflict.
create unique index if not exists uq_tx_recurring_occurrence
  on public.transactions(recurring_rule_id, date);
```

- [ ] **Step 2: Write `supabase/Seed Planning for Demo User.sql`**

```sql
-- Seed Aug + Sep 2026 transactions and planning data (budgets, goals,
-- recurring rules) for the demo user. Run AFTER planning.sql.
-- Re-runnable: clears this user's planning rows and Aug–Sep 2026 transactions first.
-- Sep budget story: food 90% (warn), transport 70%, entertainment over, shopping ~44%.

DO $$
DECLARE
  demo_user_id uuid;
  goal_laptop uuid;
  goal_emergency uuid;
BEGIN
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'ferdiputra1404@gmail.com';
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Update the email or paste a UUID above.';
  END IF;

  DELETE FROM public.budgets WHERE user_id = demo_user_id;
  DELETE FROM public.savings_goals WHERE user_id = demo_user_id; -- cascades contributions
  DELETE FROM public.recurring_rules WHERE user_id = demo_user_id;
  DELETE FROM public.transactions
  WHERE user_id = demo_user_id AND date >= '2026-08-01' AND date < '2026-10-01';

  INSERT INTO public.transactions (user_id, amount, type, description, category_key, date) VALUES
  -- ========== AUGUST 2026 ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',              'income',        '2026-08-25'),
  (demo_user_id,   45000, 'expense', 'Nasi padang siang',         'food',          '2026-08-03'),
  (demo_user_id,   32000, 'expense', 'Kopi susu',                 'food',          '2026-08-05'),
  (demo_user_id,  280000, 'expense', 'Belanja bulanan Indomaret', 'food',          '2026-08-08'),
  (demo_user_id,   65000, 'expense', 'Makan malam bakso',         'food',          '2026-08-12'),
  (demo_user_id,  120000, 'expense', 'Makan bareng teman',        'food',          '2026-08-16'),
  (demo_user_id,   38000, 'expense', 'Sarapan bubur',             'food',          '2026-08-20'),
  (demo_user_id,  250000, 'expense', 'Belanja sayur & lauk',      'food',          '2026-08-24'),
  (demo_user_id,   55000, 'expense', 'Martabak',                  'food',          '2026-08-29'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-08-04'),
  (demo_user_id,   42000, 'expense', 'Grab ke kampus',            'transport',     '2026-08-11'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-08-18'),
  (demo_user_id,   25000, 'expense', 'Parkir mall',               'transport',     '2026-08-23'),
  (demo_user_id,   54990, 'expense', 'Spotify Premium',           'entertainment', '2026-08-05'),
  (demo_user_id,   65000, 'expense', 'Tiket bioskop',             'entertainment', '2026-08-15'),
  (demo_user_id,  120000, 'expense', 'Top up game',               'entertainment', '2026-08-27'),
  (demo_user_id,  189000, 'expense', 'Kaos baru',                 'shopping',      '2026-08-10'),
  (demo_user_id,   95000, 'expense', 'Skincare',                  'shopping',      '2026-08-22'),
  (demo_user_id,  750000, 'expense', 'Bayar kos',                 'bills',         '2026-08-01'),
  (demo_user_id,  350000, 'expense', 'Internet rumah',            'bills',         '2026-08-07'),
  (demo_user_id,  100000, 'expense', 'Pulsa & data',              'bills',         '2026-08-14'),
  (demo_user_id,   85000, 'expense', 'Vitamin',                   'health',        '2026-08-19'),
  (demo_user_id,  500000, 'expense', 'Laptop baru',               'savings',       '2026-08-26'),
  -- ========== SEPTEMBER 2026 (through the 27th) ==========
  (demo_user_id, 8500000, 'income',  'Gaji bulanan',              'income',        '2026-09-25'),
  (demo_user_id,  750000, 'income',  'Freelance desain logo',     'income',        '2026-09-12'),
  (demo_user_id,   48000, 'expense', 'Nasi padang siang',         'food',          '2026-09-01'),
  (demo_user_id,   35000, 'expense', 'Kopi susu',                 'food',          '2026-09-03'),
  (demo_user_id,  310000, 'expense', 'Belanja bulanan Indomaret', 'food',          '2026-09-06'),
  (demo_user_id,  150000, 'expense', 'Makan bareng teman',        'food',          '2026-09-09'),
  (demo_user_id,   42000, 'expense', 'Mie ayam',                  'food',          '2026-09-11'),
  (demo_user_id,  275000, 'expense', 'Belanja sayur & lauk',      'food',          '2026-09-14'),
  (demo_user_id,  185000, 'expense', 'Dinner ulang tahun teman',  'food',          '2026-09-18'),
  (demo_user_id,   60000, 'expense', 'Martabak',                  'food',          '2026-09-20'),
  (demo_user_id,   95000, 'expense', 'Sushi',                     'food',          '2026-09-23'),
  (demo_user_id,  150000, 'expense', 'Belanja buah',              'food',          '2026-09-26'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-09-02'),
  (demo_user_id,   48000, 'expense', 'Grab ke kampus',            'transport',     '2026-09-08'),
  (demo_user_id,  150000, 'expense', 'Isi bensin',                'transport',     '2026-09-16'),
  (demo_user_id,   72000, 'expense', 'Gojek ke bandara',          'transport',     '2026-09-21'),
  (demo_user_id,   54990, 'expense', 'Spotify Premium',           'entertainment', '2026-09-05'),
  (demo_user_id,   90000, 'expense', 'Tiket bioskop IMAX',        'entertainment', '2026-09-13'),
  (demo_user_id,  200000, 'expense', 'Tiket konser',              'entertainment', '2026-09-19'),
  (demo_user_id,  250000, 'expense', 'Sepatu lari',               'shopping',      '2026-09-10'),
  (demo_user_id,  100000, 'expense', 'Casing HP',                 'shopping',      '2026-09-22'),
  (demo_user_id,  750000, 'expense', 'Bayar kos',                 'bills',         '2026-09-01'),
  (demo_user_id,  350000, 'expense', 'Internet rumah',            'bills',         '2026-09-07'),
  (demo_user_id,  100000, 'expense', 'Pulsa & data',              'bills',         '2026-09-15'),
  (demo_user_id,  120000, 'expense', 'Obat & vitamin',            'health',        '2026-09-17'),
  (demo_user_id,   99000, 'expense', 'Kursus online Udemy',       'education',     '2026-09-24'),
  (demo_user_id,  500000, 'expense', 'Laptop baru',               'savings',       '2026-09-26');

  INSERT INTO public.budgets (user_id, category_key, amount) VALUES
  (demo_user_id, 'food',          1500000),
  (demo_user_id, 'transport',      600000),
  (demo_user_id, 'entertainment',  300000),
  (demo_user_id, 'shopping',       800000);

  INSERT INTO public.savings_goals (user_id, name, target_amount, target_date)
  VALUES (demo_user_id, 'Laptop baru', 12000000, '2026-12-31')
  RETURNING id INTO goal_laptop;

  INSERT INTO public.savings_goals (user_id, name, target_amount, target_date)
  VALUES (demo_user_id, 'Dana darurat', 10000000, NULL)
  RETURNING id INTO goal_emergency;

  INSERT INTO public.goal_contributions (goal_id, user_id, amount, date) VALUES
  (goal_laptop,    demo_user_id, 3000000, '2026-06-26'),
  (goal_laptop,    demo_user_id, 2500000, '2026-07-26'),
  (goal_laptop,    demo_user_id,  500000, '2026-08-26'),
  (goal_laptop,    demo_user_id,  500000, '2026-09-26'),
  (goal_emergency, demo_user_id, 1500000, '2026-07-10'),
  (goal_emergency, demo_user_id,  750000, '2026-09-12');

  -- last_generated_month = '2026-09': September's rows above already exist,
  -- so the runner starts generating from October.
  INSERT INTO public.recurring_rules
    (user_id, description, amount, type, category_key, day_of_month, start_date, last_generated_month)
  VALUES
  (demo_user_id, 'Gaji bulanan',    8500000, 'income',  'income',        25, '2026-08-01', '2026-09'),
  (demo_user_id, 'Spotify Premium',   54990, 'expense', 'entertainment',  5, '2026-08-01', '2026-09'),
  (demo_user_id, 'Bayar kos',        750000, 'expense', 'bills',          1, '2026-08-01', '2026-09');
END $$;
```

- [ ] **Step 3: Update the spec's index line**

In `docs/superpowers/specs/2026-09-27-planning-and-smart-input-design.md` §3 "`transactions` change", replace the bullet
`` - `create unique index if not exists uq_tx_recurring_occurrence on transactions(recurring_rule_id, date) where recurring_rule_id is not null` ``
with
`` - `create unique index if not exists uq_tx_recurring_occurrence on transactions(recurring_rule_id, date)` — not partial, because PostgREST upserts cannot target a partial index; NULLs are distinct so normal transactions never conflict. ``
and in the paragraph below it replace "The partial unique index" with "The unique index".

- [ ] **Step 4: Commit**

```bash
git add supabase/planning.sql "supabase/Seed Planning for Demo User.sql" docs/superpowers/specs/2026-09-27-planning-and-smart-input-design.md
git commit -m "feat: add planning schema and demo seed SQL" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

- [ ] **Step 5: CHECKPOINT — user runs the SQL**

Stop and ask the user to open the Supabase dashboard → SQL Editor and run, in order:
1. the full contents of `supabase/planning.sql`
2. the full contents of `supabase/Seed Planning for Demo User.sql`

Both should finish with "Success. No rows returned." Wait for the user to confirm before continuing.

- [ ] **Step 6: Verify the tables and seed as the demo user**

Write this script to the session scratchpad as `verify-planning.mjs`:
```js
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({
  email: env.NEXT_PUBLIC_DEMO_EMAIL,
  password: env.NEXT_PUBLIC_DEMO_PASSWORD,
});
if (authErr) throw authErr;
for (const t of ["budgets", "savings_goals", "goal_contributions", "recurring_rules"]) {
  const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
  console.log(t, error ? `ERROR ${error.message}` : count);
}
const { count, error } = await sb
  .from("transactions")
  .select("*", { count: "exact", head: true })
  .gte("date", "2026-09-01")
  .lt("date", "2026-10-01");
console.log("sep transactions", error ? `ERROR ${error.message}` : count);
```
Run from the repo root (so `@supabase/supabase-js` resolves from the repo's `node_modules`):
`node --input-type=module -e "$(cat "<scratchpad>/verify-planning.mjs")"`
Expected output:
```
budgets 4
savings_goals 2
goal_contributions 6
recurring_rules 3
sep transactions 27
```

### Task 6: Budget math

**Files:**
- Create: `src/lib/budget-progress.ts`, `src/lib/budget-progress.test.ts`

**Interfaces:**
- Consumes: `CategoryKey` from `@/lib/mock-data`.
- Produces:
  - `type BudgetStatus = "ok" | "warn" | "over"`
  - `budgetProgress(spent: number, limit: number): { pct: number; status: BudgetStatus; remaining: number }`
  - `type BudgetRow = { id: string; category_key: CategoryKey; amount: number | string }`
  - `type BudgetWithSpent = { id: string; category_key: CategoryKey; amount: number; spent: number; pct: number; status: BudgetStatus; remaining: number }`
  - `summarizeBudgets(budgets: BudgetRow[], expenses: { category_key: string; amount: number | string }[]): BudgetWithSpent[]` — sorted by `pct` descending
  - `daysLeftInMonth(month: string, today: string): number | null` — counts today; null when `month` is not today's month

- [ ] **Step 1: Write the failing test**

`src/lib/budget-progress.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { budgetProgress, summarizeBudgets, daysLeftInMonth } from "./budget-progress";

describe("budgetProgress", () => {
  it("is ok below 80%", () => {
    expect(budgetProgress(0, 1000)).toEqual({ pct: 0, status: "ok", remaining: 1000 });
    expect(budgetProgress(799, 1000).status).toBe("ok");
  });
  it("warns from 80% up to and including 100%", () => {
    expect(budgetProgress(800, 1000).status).toBe("warn");
    expect(budgetProgress(1000, 1000).status).toBe("warn");
  });
  it("is over above 100% with negative remaining", () => {
    expect(budgetProgress(1001, 1000)).toMatchObject({ status: "over", remaining: -1 });
  });
  it("guards a zero limit", () => {
    expect(budgetProgress(500, 0)).toEqual({ pct: 0, status: "ok", remaining: -500 });
  });
});

describe("summarizeBudgets", () => {
  it("sums numeric-string amounts per category and sorts by pct", () => {
    const out = summarizeBudgets(
      [
        { id: "a", category_key: "food", amount: "1500000" },
        { id: "b", category_key: "transport", amount: 600000 },
        { id: "c", category_key: "shopping", amount: "800000" },
      ],
      [
        { category_key: "food", amount: "1000000" },
        { category_key: "food", amount: "350000" },
        { category_key: "transport", amount: 420000 },
        { category_key: "health", amount: 99999 },
      ]
    );
    expect(out.map((b) => b.id)).toEqual(["a", "b", "c"]);
    expect(out[0]).toMatchObject({ amount: 1500000, spent: 1350000, pct: 90, status: "warn" });
    expect(out[1]).toMatchObject({ spent: 420000, pct: 70, status: "ok" });
    expect(out[2]).toMatchObject({ spent: 0, pct: 0, remaining: 800000 });
  });
});

describe("daysLeftInMonth", () => {
  it("counts today for the current month", () => {
    expect(daysLeftInMonth("2026-09", "2026-09-27")).toBe(4);
    expect(daysLeftInMonth("2026-09", "2026-09-30")).toBe(1);
    expect(daysLeftInMonth("2026-02", "2026-02-01")).toBe(28);
  });
  it("is null for other months", () => {
    expect(daysLeftInMonth("2026-08", "2026-09-27")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/budget-progress.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/budget-progress.ts`**

```ts
import type { CategoryKey } from "./mock-data";

export type BudgetStatus = "ok" | "warn" | "over";

const WARN_AT = 80;

export function budgetProgress(
  spent: number,
  limit: number
): { pct: number; status: BudgetStatus; remaining: number } {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const status: BudgetStatus = pct > 100 ? "over" : pct >= WARN_AT ? "warn" : "ok";
  return { pct, status, remaining: limit - spent };
}

export type BudgetRow = { id: string; category_key: CategoryKey; amount: number | string };

export type BudgetWithSpent = {
  id: string;
  category_key: CategoryKey;
  amount: number;
  spent: number;
  pct: number;
  status: BudgetStatus;
  remaining: number;
};

// PostgREST may return numeric columns as strings, hence Number() everywhere.
export function summarizeBudgets(
  budgets: BudgetRow[],
  expenses: { category_key: string; amount: number | string }[]
): BudgetWithSpent[] {
  const spentBy = new Map<string, number>();
  for (const e of expenses) {
    spentBy.set(e.category_key, (spentBy.get(e.category_key) ?? 0) + Number(e.amount));
  }
  return budgets
    .map((b) => {
      const amount = Number(b.amount);
      const spent = spentBy.get(b.category_key) ?? 0;
      return { id: b.id, category_key: b.category_key, amount, spent, ...budgetProgress(spent, amount) };
    })
    .sort((a, b) => b.pct - a.pct);
}

// Days left in `month` counting today, or null when `month` isn't today's month.
export function daysLeftInMonth(month: string, today: string): number | null {
  if (today.slice(0, 7) !== month) return null;
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return last - Number(today.slice(8, 10)) + 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/budget-progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/budget-progress.ts src/lib/budget-progress.test.ts
git commit -m "feat: add budget progress calculations" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 7: Budgets API and client helpers

**Files:**
- Create: `src/lib/planning/budgets-server.ts`
- Create: `src/app/api/budgets/route.ts`
- Create: `src/lib/planning/api.ts`

**Interfaces:**
- Consumes: `summarizeBudgets`, `BudgetRow`, `BudgetWithSpent` (Task 6); `EXPENSE_CATEGORY_KEYS`, `ExpenseCategoryKey` (Task 1); `monthRange`, `currentMonth` from `@/lib/ai/dates`.
- Produces:
  - `loadBudgetsWithSpent(supabase: SupabaseClient, userId: string, month: string): Promise<BudgetWithSpent[]>` (throws on DB error) — also used by the chat tool in Task 20
  - `GET /api/budgets?month=YYYY-MM` → `{ data: BudgetWithSpent[], month }`; `POST /api/budgets { category_key, amount }` (upsert) → `{ data }`; `DELETE /api/budgets?id=` → `{ ok: true }`
  - In `src/lib/planning/api.ts`: internal `send<T>(url, init?)` and `jsonInit(method, body)`; exported `fetchBudgets(month: string): Promise<BudgetWithSpent[]>`, `saveBudget(category_key: ExpenseCategoryKey, amount: number): Promise<void>`, `deleteBudget(id: string): Promise<void>`

- [ ] **Step 1: Create `src/lib/planning/budgets-server.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/ai/dates";
import { summarizeBudgets, type BudgetRow, type BudgetWithSpent } from "@/lib/budget-progress";

// Budgets joined with that month's expense totals. Shared by /api/budgets
// and the chat advisor's getBudgets tool.
export async function loadBudgetsWithSpent(
  supabase: SupabaseClient,
  userId: string,
  month: string
): Promise<BudgetWithSpent[]> {
  const { from, to } = monthRange(month);
  const [budgets, expenses] = await Promise.all([
    supabase.from("budgets").select("id, category_key, amount").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("category_key, amount")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("date", from)
      .lte("date", to),
  ]);
  if (budgets.error) throw new Error(budgets.error.message);
  if (expenses.error) throw new Error(expenses.error.message);
  return summarizeBudgets((budgets.data ?? []) as BudgetRow[], expenses.data ?? []);
}
```

- [ ] **Step 2: Create `src/app/api/budgets/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { currentMonth } from "@/lib/ai/dates";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";
import { loadBudgetsWithSpent } from "@/lib/planning/budgets-server";

const MONTH = /^\d{4}-\d{2}$/;

const Upsert = z.object({
  category_key: z.enum(EXPENSE_CATEGORY_KEYS as [ExpenseCategoryKey, ...ExpenseCategoryKey[]]),
  amount: z.number().positive().max(1_000_000_000_000),
});

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month") || currentMonth();
  if (!MONTH.test(month)) return NextResponse.json({ error: "Invalid month" }, { status: 400 });

  try {
    const data = await loadBudgetsWithSpent(supabase, user.id, month);
    return NextResponse.json({ data, month });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Upsert.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      { user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category_key" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create `src/lib/planning/api.ts`**

```ts
import type { BudgetWithSpent } from "@/lib/budget-progress";
import type { ExpenseCategoryKey } from "@/lib/draft";

async function send<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ---- Budgets ----

export async function fetchBudgets(month: string): Promise<BudgetWithSpent[]> {
  return (await send<{ data: BudgetWithSpent[] }>(`/api/budgets?month=${month}`)).data;
}

export async function saveBudget(category_key: ExpenseCategoryKey, amount: number): Promise<void> {
  await send("/api/budgets", jsonInit("POST", { category_key, amount }));
}

export async function deleteBudget(id: string): Promise<void> {
  await send(`/api/budgets?id=${id}`, { method: "DELETE" });
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0. (Route behaviour is exercised through the UI in Task 8.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/planning/budgets-server.ts src/app/api/budgets/route.ts src/lib/planning/api.ts
git commit -m "feat: add budgets API" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 8: Planning page, navigation, and Budgets tab

**Files:**
- Create: `src/components/planning/field.tsx`, `amount-input.tsx`, `progress-bar.tsx`, `confirm-delete.tsx`, `list-skeleton.tsx`, `budget-form.tsx`, `budgets-tab.tsx`
- Create: `src/app/(app)/planning/page.tsx`
- Modify: `src/components/layout/sidebar.tsx` (nav item)
- Modify: `src/lib/supabase/middleware.ts` (protect `/planning`)
- Modify: `src/app/(app)/settings/page.tsx` (Planning section)
- Modify: `messages/en.json`, `messages/id.json` (`planning` namespace, `nav.planning`, settings keys)

**Interfaces:**
- Consumes: `fetchBudgets`, `saveBudget`, `deleteBudget` (Task 7); `BudgetWithSpent`, `daysLeftInMonth` (Task 6); `EXPENSE_CATEGORY_KEYS`, `ExpenseCategoryKey`, `localToday` (Task 1); `MonthPicker`, `Button`, `EmptyState`, `Skeleton`, `CategoryBadge`, `formatCurrency`, `useLocale`, `cn` (existing).
- Produces (reused by Tasks 9, 12, 15):
  - `fieldClass: string`, `<Field label children />`
  - `<AmountInput value onChange autoFocus? />` (value is a digits-only string)
  - `<ProgressBar pct tone={"ok"|"warn"|"over"} />`
  - `<ConfirmDelete onConfirm />`
  - `<ListSkeleton rows? />`
  - Planning page `TABS` / `TAB_LABEL` pattern — later tasks append a tab.

- [ ] **Step 1: Add i18n keys**

`messages/en.json`:
- in `"nav"` add `"planning": "Planning",`
- in `"settings"` add:
```json
"planningSection": "Planning",
"planningLabel": "Budgets, goals & recurring",
"planningDesc": "Manage monthly limits, savings goals, and automatic transactions.",
"planningOpen": "Open",
```
- new top-level namespace after `"smartInput"`:
```json
"planning": {
  "title": "Planning",
  "subtitle": "Budgets, savings goals, and recurring transactions.",
  "tabBudgets": "Budgets",
  "addBudget": "Add budget",
  "budgetCategory": "Category",
  "budgetLimit": "Monthly limit",
  "budgetsEmptyTitle": "No budgets yet",
  "budgetsEmptySub": "Set a monthly limit per category and track it as you spend.",
  "spentOf": "{spent} of {limit}",
  "remaining": "{amount} left",
  "overBy": "Over by {amount}",
  "daysLeft": "{count, plural, one {# day left} other {# days left}}",
  "confirmDelete": "Delete?",
  "yes": "Yes",
  "no": "No",
  "saveError": "Couldn't save. Try again.",
  "loadError": "Couldn't load data. Refresh to try again."
},
```
`messages/id.json` (same positions):
- `"nav"`: `"planning": "Perencanaan",`
- `"settings"`:
```json
"planningSection": "Perencanaan",
"planningLabel": "Anggaran, target & transaksi berulang",
"planningDesc": "Kelola batas bulanan, target tabungan, dan transaksi otomatis.",
"planningOpen": "Buka",
```
- namespace:
```json
"planning": {
  "title": "Perencanaan",
  "subtitle": "Anggaran, target tabungan, dan transaksi berulang.",
  "tabBudgets": "Anggaran",
  "addBudget": "Tambah anggaran",
  "budgetCategory": "Kategori",
  "budgetLimit": "Batas bulanan",
  "budgetsEmptyTitle": "Belum ada anggaran",
  "budgetsEmptySub": "Atur batas bulanan per kategori dan pantau saat kamu belanja.",
  "spentOf": "{spent} dari {limit}",
  "remaining": "Sisa {amount}",
  "overBy": "Lebih {amount}",
  "daysLeft": "{count} hari lagi",
  "confirmDelete": "Hapus?",
  "yes": "Ya",
  "no": "Tidak",
  "saveError": "Gagal menyimpan. Coba lagi.",
  "loadError": "Gagal memuat data. Muat ulang untuk mencoba lagi."
},
```

- [ ] **Step 2: Shared planning components**

`src/components/planning/field.tsx`:
```tsx
export const fieldClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
```

`src/components/planning/amount-input.tsx`:
```tsx
import { cn } from "@/lib/cn";
import { fieldClass } from "./field";

// Rupiah input: digits only, "Rp" prefix. Value is a digits-only string.
export function AmountInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-400">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        placeholder="0"
        className={cn(fieldClass, "pl-10 font-mono")}
      />
    </div>
  );
}
```

`src/components/planning/progress-bar.tsx`:
```tsx
import { cn } from "@/lib/cn";

const TONE = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  over: "bg-rose-500",
} as const;

export function ProgressBar({ pct, tone }: { pct: number; tone: keyof typeof TONE }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
    >
      <div
        className={cn("h-full rounded-full transition-all", TONE[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
```

`src/components/planning/confirm-delete.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

// Inline two-step delete (no window.confirm — it blocks browser automation).
export function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        aria-label={tCommon("delete")}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-zinc-500">{t("confirmDelete")}</span>
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className="rounded px-1.5 py-0.5 font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
      >
        {t("yes")}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {t("no")}
      </button>
    </span>
  );
}
```

`src/components/planning/list-skeleton.tsx`:
```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Budget form and tab**

`src/components/planning/budget-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ExpenseCategoryKey } from "@/lib/draft";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function BudgetForm({
  categories,
  initial,
  onSubmit,
  onCancel,
}: {
  categories: ExpenseCategoryKey[];
  initial?: { category_key: ExpenseCategoryKey; amount: number };
  onSubmit: (category: ExpenseCategoryKey, amount: number) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [category, setCategory] = useState<ExpenseCategoryKey>(
    initial?.category_key ?? categories[0]
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = Number(amount) || 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (num <= 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(category, num); // parent unmounts the form on success
    } catch {
      setError(t("saveError"));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("budgetCategory")}>
          <select
            value={category}
            disabled={!!initial}
            onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey)}
            className={fieldClass}
          >
            {categories.map((k) => (
              <option key={k} value={k}>
                {tCat(k)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("budgetLimit")}>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={num <= 0 || saving}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
```

`src/components/planning/budgets-tab.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthPicker } from "@/components/ui/month-picker";
import { CategoryBadge } from "@/components/category-badge";
import { useLocale } from "@/i18n/locale-provider";
import { daysLeftInMonth, type BudgetWithSpent } from "@/lib/budget-progress";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { localToday } from "@/lib/ymd";
import { deleteBudget, fetchBudgets, saveBudget } from "@/lib/planning/api";
import { BudgetForm } from "./budget-form";
import { ConfirmDelete } from "./confirm-delete";
import { ListSkeleton } from "./list-skeleton";
import { ProgressBar } from "./progress-bar";

export function BudgetsTab() {
  const t = useTranslations("planning");
  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const [items, setItems] = useState<BudgetWithSpent[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // "new" or a budget id

  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await fetchBudgets(month));
    } catch {
      setError(true);
      setItems([]);
    }
  }, [month]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  function changeMonth(idx: number) {
    if (idx < 0) {
      setMonthIdx(11);
      setYear((y) => y - 1);
    } else if (idx > 11) {
      setMonthIdx(0);
      setYear((y) => y + 1);
    } else {
      setMonthIdx(idx);
    }
  }

  async function save(category: ExpenseCategoryKey, amount: number) {
    await saveBudget(category, amount);
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    await deleteBudget(id).catch(() => {});
    await load();
  }

  const daysLeft = daysLeftInMonth(month, localToday());
  const used = new Set((items ?? []).map((b) => b.category_key));
  const available = EXPENSE_CATEGORY_KEYS.filter((k) => !used.has(k));

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MonthPicker monthIdx={monthIdx} year={year} onChange={changeMonth} />
        {items !== null && available.length > 0 && editing === null && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            {t("addBudget")}
          </Button>
        )}
      </div>

      {editing === "new" && (
        <BudgetForm categories={available} onSubmit={save} onCancel={() => setEditing(null)} />
      )}

      {items === null ? (
        <ListSkeleton />
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadError")}</p>
      ) : items.length === 0 ? (
        editing === null && (
          <EmptyState
            icon={Target}
            title={t("budgetsEmptyTitle")}
            subtitle={t("budgetsEmptySub")}
            action={
              <Button size="sm" onClick={() => setEditing("new")}>
                <Plus className="h-3.5 w-3.5" />
                {t("addBudget")}
              </Button>
            }
          />
        )
      ) : (
        <div className="animate-slide-up divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[var(--shadow-sm)] dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((b) =>
            editing === b.id ? (
              <div key={b.id} className="p-3">
                <BudgetForm
                  categories={[b.category_key as ExpenseCategoryKey]}
                  initial={{ category_key: b.category_key as ExpenseCategoryKey, amount: b.amount }}
                  onSubmit={save}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <BudgetRowView
                key={b.id}
                budget={b}
                daysLeft={daysLeft}
                onEdit={() => setEditing(b.id)}
                onDelete={() => remove(b.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function BudgetRowView({
  budget: b,
  daysLeft,
  onEdit,
  onDelete,
}: {
  budget: BudgetWithSpent;
  daysLeft: number | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  return (
    <div className="space-y-2 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge categoryKey={b.category_key} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={tCommon("edit")}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDelete onConfirm={onDelete} />
        </div>
      </div>
      <ProgressBar pct={b.pct} tone={b.status} />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-mono text-zinc-600 dark:text-zinc-300">
          {t("spentOf", {
            spent: formatCurrency(b.spent, locale),
            limit: formatCurrency(b.amount, locale),
          })}
        </span>
        <span
          className={cn(
            "font-medium",
            b.status === "over"
              ? "text-rose-600 dark:text-rose-400"
              : b.status === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-500"
          )}
        >
          {b.remaining >= 0
            ? t("remaining", { amount: formatCurrency(b.remaining, locale) })
            : t("overBy", { amount: formatCurrency(-b.remaining, locale) })}
          {daysLeft !== null && ` · ${t("daysLeft", { count: daysLeft })}`}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Planning page**

`src/app/(app)/planning/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetsTab } from "@/components/planning/budgets-tab";
import { cn } from "@/lib/cn";

const TABS = ["budgets"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { budgets: "tabBudgets" };

export default function PlanningPage() {
  const t = useTranslations("planning");
  const [tab, setTab] = useState<Tab>("budgets");

  // Read ?tab= after mount (same approach as the transactions page) so the
  // page needs no Suspense boundary for useSearchParams.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q && (TABS as readonly string[]).includes(q)) setTab(q as Tab);
  }, []);

  function select(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `/planning?tab=${next}`);
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div
        role="tablist"
        className="inline-grid grid-flow-col gap-1 rounded-[9px] bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => select(k)}
            className={cn(
              "rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium transition-all",
              tab === k
                ? "bg-white text-zinc-900 shadow-[var(--shadow-sm)] dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            {t(TAB_LABEL[k])}
          </button>
        ))}
      </div>
      {tab === "budgets" && <BudgetsTab />}
    </div>
  );
}
```

- [ ] **Step 5: Navigation, auth guard, Settings link**

`src/components/layout/sidebar.tsx`:
- add `Target,` to the lucide import list
- change the `labelKey` union to `"dashboard" | "transactions" | "planning" | "reports" | "chat" | "settings"`
- insert `{ href: "/planning", labelKey: "planning", icon: Target },` after the `/transactions` entry in `NAV`.

`src/lib/supabase/middleware.ts`: in `isAppPage`, add `pathname.startsWith("/planning") ||` after the `/transactions` line.

`src/app/(app)/settings/page.tsx`:
- add `import Link from "next/link";`
- add `Target,` and `ArrowRight,` to the lucide import list
- insert after the closing `</Section>` of the Profile section (the one with `title={t("profile")}`):
```tsx
<Section title={t("planningSection")} icon={Target}>
  <Row label={t("planningLabel")} desc={t("planningDesc")}>
    <Link
      href="/planning"
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {t("planningOpen")}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  </Row>
</Section>
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all exit 0.

Live: `npm run dev`, demo login. Sidebar shows **Planning** between Transactions and Reports. Open it → Budgets tab for September 2026 shows 4 rows sorted Entertainment (red, over) → Food (amber, 90%) → Transport (70%) → Shopping, each with "N days left". Add a Bills budget of 1500000 → appears. Edit it → amount changes. Delete it via the two-step confirm → gone. Switch to August → no "days left". Settings shows a Planning section whose **Open** link goes to `/planning`. In a private window (logged out) open `/planning` → redirected to login. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/components/planning "src/app/(app)/planning/page.tsx" src/components/layout/sidebar.tsx src/lib/supabase/middleware.ts "src/app/(app)/settings/page.tsx" messages/en.json messages/id.json
git commit -m "feat: add Planning page with category budgets" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 9: Dashboard budget card

**Files:**
- Create: `src/components/dashboard/budget-card.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `messages/en.json`, `messages/id.json` (`dashboard` keys)

**Interfaces:**
- Consumes: `fetchBudgets` (Task 7), `BudgetWithSpent` (Task 6), `ProgressBar` (Task 8), `CategoryBadge`, `Skeleton` (existing).
- Produces: `<BudgetCard month={string} refreshKey={number} />`; dashboard state `dataVersion` (incremented after each successful `fetchData`) and the cards row `<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">` — Task 12 adds `<GoalCard refreshKey={dataVersion} />` into this row.

- [ ] **Step 1: Add i18n keys** (inside `"dashboard"`)

en: `"budgetsTitle": "Budgets", "budgetsEmpty": "No budgets set yet.", "budgetsCta": "Set a budget",`
id: `"budgetsTitle": "Anggaran", "budgetsEmpty": "Belum ada anggaran.", "budgetsCta": "Atur anggaran",`

- [ ] **Step 2: Create `src/components/dashboard/budget-card.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/category-badge";
import { ProgressBar } from "@/components/planning/progress-bar";
import { fetchBudgets } from "@/lib/planning/api";
import type { BudgetWithSpent } from "@/lib/budget-progress";

// Top 3 budgets closest to (or over) their limit for the dashboard's month.
export function BudgetCard({ month, refreshKey }: { month: string; refreshKey: number }) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [items, setItems] = useState<BudgetWithSpent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBudgets(month)
      .then((d) => {
        if (!cancelled) setItems(d);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{t("budgetsTitle")}</h3>
        <Link
          href="/planning?tab=budgets"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {tCommon("viewAll")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {items === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-zinc-500">{t("budgetsEmpty")}</p>
          <Link
            href="/planning?tab=budgets"
            className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {t("budgetsCta")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 3).map((b) => (
            <div key={b.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <CategoryBadge categoryKey={b.category_key} />
                <span className="font-mono text-zinc-500">{Math.round(b.pct)}%</span>
              </div>
              <ProgressBar pct={b.pct} tone={b.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add it to the dashboard**

In `src/app/(app)/dashboard/page.tsx`:
- import: `import { BudgetCard } from "@/components/dashboard/budget-card";`
- state next to `recent`: `const [dataVersion, setDataVersion] = useState(0);`
- in `fetchData`, after `setRecent(curRes.data.slice(0, 8));` add `setDataVersion((v) => v + 1);`
- between the charts grid (the `<div>` wrapping `<CategoryDonut …/>` and `<DailyLine …/>`) and `<InsightCard />`, insert:
```tsx
<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
  <BudgetCard month={monthKey} refreshKey={dataVersion} />
</div>
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all exit 0; build output lists `/planning`.

Live: `npm run dev`, demo dashboard (September 2026) shows the Budgets card with Entertainment, Food, Transport. Quick-add `tiket nonton 50rb` (entertainment) and save → the card's percentage updates. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/budget-card.tsx "src/app/(app)/dashboard/page.tsx" messages/en.json messages/id.json
git commit -m "feat: show budget progress on the dashboard" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

---

## Phase 4 — Savings goals

### Task 10: Goal math

**Files:**
- Create: `src/lib/goal-progress.ts`, `src/lib/goal-progress.test.ts`

**Interfaces:**
- Produces:
  - `type GoalStatus = "active" | "done" | "overdue"`
  - `type GoalProgress = { saved: number; pct: number; remaining: number; monthsLeft: number | null; perMonth: number | null; status: GoalStatus }`
  - `goalProgress(saved: number, target: number, targetDate: string | null, today: string): GoalProgress` — `pct` capped at 100; `monthsLeft` counts calendar months including the current one (min 1); `perMonth = ceil(remaining / monthsLeft)`; both null when done, overdue, or no target date
  - `type GoalRow = { id: string; name: string; target_amount: number | string; target_date: string | null; created_at: string; goal_contributions: { id: string; amount: number | string; date: string }[] | null }`
  - `type Contribution = { id: string; amount: number; date: string }`
  - `type GoalView = GoalProgress & { id: string; name: string; target_amount: number; target_date: string | null; contributions: Contribution[] }` — contributions sorted newest first
  - `summarizeGoals(rows: GoalRow[], today: string): GoalView[]` (keeps input order)
  - `pickFeaturedGoal<T extends { pct: number; status: GoalStatus; target_date: string | null }>(goals: T[]): T | null`

- [ ] **Step 1: Write the failing test**

`src/lib/goal-progress.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { goalProgress, summarizeGoals, pickFeaturedGoal } from "./goal-progress";

const TODAY = "2026-09-27";

describe("goalProgress", () => {
  it("computes months left including the current month and per-month need", () => {
    expect(goalProgress(6_500_000, 12_000_000, "2026-12-31", TODAY)).toEqual({
      saved: 6_500_000,
      pct: (6_500_000 / 12_000_000) * 100,
      remaining: 5_500_000,
      monthsLeft: 4,
      perMonth: 1_375_000,
      status: "active",
    });
  });

  it("rounds per-month up", () => {
    expect(goalProgress(0, 1000, "2026-11-15", TODAY).perMonth).toBe(334); // 1000 / 3
  });

  it("uses at least one month when the target is this month", () => {
    expect(goalProgress(0, 500, "2026-09-30", TODAY)).toMatchObject({ monthsLeft: 1, perMonth: 500 });
  });

  it("has no per-month need without a target date", () => {
    expect(goalProgress(100, 1000, null, TODAY)).toMatchObject({
      status: "active",
      monthsLeft: null,
      perMonth: null,
    });
  });

  it("is done when saved reaches the target (pct capped at 100)", () => {
    expect(goalProgress(1200, 1000, "2026-12-31", TODAY)).toMatchObject({
      status: "done",
      pct: 100,
      remaining: 0,
      perMonth: null,
    });
  });

  it("is overdue past the target date", () => {
    expect(goalProgress(100, 1000, "2026-09-26", TODAY)).toMatchObject({
      status: "overdue",
      perMonth: null,
    });
  });
});

describe("summarizeGoals", () => {
  it("sums string amounts and sorts contributions newest first", () => {
    const [g] = summarizeGoals(
      [
        {
          id: "g1",
          name: "Laptop",
          target_amount: "12000000",
          target_date: null,
          created_at: "2026-06-01T00:00:00Z",
          goal_contributions: [
            { id: "c1", amount: "3000000", date: "2026-06-26" },
            { id: "c2", amount: 500000, date: "2026-09-26" },
          ],
        },
      ],
      TODAY
    );
    expect(g.saved).toBe(3_500_000);
    expect(g.target_amount).toBe(12_000_000);
    expect(g.contributions.map((c) => c.id)).toEqual(["c2", "c1"]);
  });

  it("handles a goal with no contributions", () => {
    const [g] = summarizeGoals(
      [{ id: "g", name: "X", target_amount: 100, target_date: null, created_at: "", goal_contributions: null }],
      TODAY
    );
    expect(g).toMatchObject({ saved: 0, pct: 0, contributions: [] });
  });
});

describe("pickFeaturedGoal", () => {
  it("prefers the unfinished goal with the highest pct, then the nearest date", () => {
    const goals = [
      { id: "a", pct: 50, status: "active" as const, target_date: "2027-01-01" },
      { id: "b", pct: 50, status: "active" as const, target_date: "2026-12-01" },
      { id: "c", pct: 100, status: "done" as const, target_date: null },
      { id: "d", pct: 10, status: "active" as const, target_date: null },
    ];
    expect(pickFeaturedGoal(goals)?.id).toBe("b");
  });
  it("falls back to a done goal, and null when empty", () => {
    expect(pickFeaturedGoal([{ id: "c", pct: 100, status: "done" as const, target_date: null }])?.id).toBe("c");
    expect(pickFeaturedGoal([])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/goal-progress.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/goal-progress.ts`**

```ts
export type GoalStatus = "active" | "done" | "overdue";

export type GoalProgress = {
  saved: number;
  pct: number;
  remaining: number;
  monthsLeft: number | null;
  perMonth: number | null;
  status: GoalStatus;
};

export function goalProgress(
  saved: number,
  target: number,
  targetDate: string | null,
  today: string
): GoalProgress {
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const remaining = Math.max(0, target - saved);
  const none = { monthsLeft: null, perMonth: null };
  if (remaining === 0) return { saved, pct, remaining, ...none, status: "done" };
  if (!targetDate) return { saved, pct, remaining, ...none, status: "active" };
  if (targetDate < today) return { saved, pct, remaining, ...none, status: "overdue" };

  const [ty, tm] = targetDate.split("-").map(Number);
  const [y, m] = today.split("-").map(Number);
  const monthsLeft = Math.max(1, (ty - y) * 12 + (tm - m) + 1);
  return {
    saved,
    pct,
    remaining,
    monthsLeft,
    perMonth: Math.ceil(remaining / monthsLeft),
    status: "active",
  };
}

export type GoalRow = {
  id: string;
  name: string;
  target_amount: number | string;
  target_date: string | null;
  created_at: string;
  goal_contributions: { id: string; amount: number | string; date: string }[] | null;
};

export type Contribution = { id: string; amount: number; date: string };

export type GoalView = GoalProgress & {
  id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  contributions: Contribution[];
};

// PostgREST may return numeric columns as strings, hence Number() everywhere.
export function summarizeGoals(rows: GoalRow[], today: string): GoalView[] {
  return rows.map((r) => {
    const contributions = (r.goal_contributions ?? [])
      .map((c) => ({ id: c.id, amount: Number(c.amount), date: c.date }))
      .sort((a, b) => b.date.localeCompare(a.date));
    const saved = contributions.reduce((s, c) => s + c.amount, 0);
    const target = Number(r.target_amount);
    return {
      id: r.id,
      name: r.name,
      target_amount: target,
      target_date: r.target_date,
      contributions,
      ...goalProgress(saved, target, r.target_date, today),
    };
  });
}

// Dashboard highlight: the unfinished goal closest to completion (ties → nearest date).
export function pickFeaturedGoal<
  T extends { pct: number; status: GoalStatus; target_date: string | null }
>(goals: T[]): T | null {
  if (goals.length === 0) return null;
  const open = goals.filter((g) => g.status !== "done");
  const pool = open.length > 0 ? open : goals;
  const far = "9999-12-31";
  return [...pool].sort(
    (a, b) => b.pct - a.pct || (a.target_date ?? far).localeCompare(b.target_date ?? far)
  )[0];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/goal-progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/goal-progress.ts src/lib/goal-progress.test.ts
git commit -m "feat: add savings goal progress calculations" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 11: Goals API and client helpers

**Files:**
- Create: `src/lib/planning/goals-server.ts`
- Create: `src/app/api/goals/route.ts`
- Create: `src/app/api/goals/contributions/route.ts`
- Modify: `src/lib/planning/api.ts` (append goals section)

**Interfaces:**
- Consumes: `summarizeGoals`, `GoalRow`, `GoalView` (Task 10); `isValidYmd` (Task 1); `todayYmd` (Task 2); `send`, `jsonInit` (Task 7, same file).
- Produces:
  - `loadGoals(supabase: SupabaseClient, userId: string, today: string): Promise<GoalView[]>` (throws on DB error) — also used by the chat tool in Task 20
  - `GET /api/goals` → `{ data: GoalView[] }`; `POST /api/goals { name, target_amount, target_date }` → `{ data }`; `PATCH /api/goals { id, name, target_amount, target_date }` → `{ data }`; `DELETE /api/goals?id=` → `{ ok: true }`
  - `POST /api/goals/contributions { goal_id, amount, date, record_as_expense }` → `{ ok: true }` (404 if goal not owned); `DELETE /api/goals/contributions?id=` → `{ ok: true }`
  - Client: `type GoalInput = { name: string; target_amount: number; target_date: string | null }`, `type ContributionInput = { amount: number; date: string; record_as_expense: boolean }`, `fetchGoals(): Promise<GoalView[]>`, `createGoal(input: GoalInput): Promise<void>`, `updateGoal(id: string, input: GoalInput): Promise<void>`, `deleteGoal(id: string): Promise<void>`, `addContribution(goal_id: string, input: ContributionInput): Promise<void>`, `deleteContribution(id: string): Promise<void>`

- [ ] **Step 1: Create `src/lib/planning/goals-server.ts`**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { summarizeGoals, type GoalRow, type GoalView } from "@/lib/goal-progress";

// Goals with their contributions and progress. Shared by /api/goals and the
// chat advisor's getGoals tool.
export async function loadGoals(
  supabase: SupabaseClient,
  userId: string,
  today: string
): Promise<GoalView[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("id, name, target_amount, target_date, created_at, goal_contributions(id, amount, date)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return summarizeGoals((data ?? []) as GoalRow[], today);
}
```

- [ ] **Step 2: Create `src/app/api/goals/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { todayYmd } from "@/lib/ai/dates";
import { isValidYmd } from "@/lib/ymd";
import { loadGoals } from "@/lib/planning/goals-server";

const GoalInput = z.object({
  name: z.string().trim().min(1).max(60),
  target_amount: z.number().positive().max(1_000_000_000_000),
  target_date: z.string().refine(isValidYmd).nullable(),
});
const GoalPatch = GoalInput.extend({ id: z.uuid() });

async function getUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ data: await loadGoals(supabase, user.id, todayYmd()) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = GoalInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data, error } = await supabase
    .from("savings_goals")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = GoalPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id, ...fields } = parsed.data;
  const { data, error } = await supabase
    .from("savings_goals")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("savings_goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create `src/app/api/goals/contributions/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { isValidYmd } from "@/lib/ymd";

const Body = z.object({
  goal_id: z.uuid(),
  amount: z.number().positive().max(1_000_000_000_000),
  date: z.string().refine(isValidYmd),
  record_as_expense: z.boolean(),
});

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { goal_id, amount, date, record_as_expense } = parsed.data;

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("name")
    .eq("id", goal_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const { error } = await supabase
    .from("goal_contributions")
    .insert({ goal_id, user_id: user.id, amount, date });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optional mirror as a normal expense so the monthly balance stays honest.
  // Not linked to the contribution: deleting one never deletes the other.
  if (record_as_expense) {
    const { error: txErr } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount,
      type: "expense",
      description: goal.name,
      category_key: "savings",
      date,
    });
    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Append goals helpers to `src/lib/planning/api.ts`**

Add `import type { GoalView } from "@/lib/goal-progress";` to the imports, then append:
```ts
// ---- Goals ----

export type GoalInput = { name: string; target_amount: number; target_date: string | null };
export type ContributionInput = { amount: number; date: string; record_as_expense: boolean };

export async function fetchGoals(): Promise<GoalView[]> {
  return (await send<{ data: GoalView[] }>("/api/goals")).data;
}

export async function createGoal(input: GoalInput): Promise<void> {
  await send("/api/goals", jsonInit("POST", input));
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  await send("/api/goals", jsonInit("PATCH", { id, ...input }));
}

export async function deleteGoal(id: string): Promise<void> {
  await send(`/api/goals?id=${id}`, { method: "DELETE" });
}

export async function addContribution(goal_id: string, input: ContributionInput): Promise<void> {
  await send("/api/goals/contributions", jsonInit("POST", { goal_id, ...input }));
}

export async function deleteContribution(id: string): Promise<void> {
  await send(`/api/goals/contributions?id=${id}`, { method: "DELETE" });
}
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/planning/goals-server.ts src/app/api/goals src/lib/planning/api.ts
git commit -m "feat: add savings goals API" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 12: Goals tab and dashboard goal card

**Files:**
- Create: `src/components/planning/goal-form.tsx`, `contribution-form.tsx`, `goal-item.tsx`, `goals-tab.tsx`
- Create: `src/components/dashboard/goal-card.tsx`
- Modify: `src/app/(app)/planning/page.tsx` (register tab)
- Modify: `src/app/(app)/dashboard/page.tsx` (add GoalCard to the cards row)
- Modify: `messages/en.json`, `messages/id.json`

**Interfaces:**
- Consumes: goals client helpers + `GoalInput`, `ContributionInput` (Task 11); `GoalView`, `pickFeaturedGoal` (Task 10); `Field`, `fieldClass`, `AmountInput`, `ProgressBar`, `ConfirmDelete`, `ListSkeleton` (Task 8); `localToday`, `isValidYmd` (Task 1); `formatCurrency`, `formatDate` (existing).
- Produces: `<GoalsTab />`, `<GoalCard refreshKey={number} />`.

- [ ] **Step 1: Add i18n keys**

en, inside `"planning"`:
```json
"tabGoals": "Goals",
"addGoal": "New goal",
"goalName": "Goal name",
"goalNamePlaceholder": "e.g. New laptop",
"goalTarget": "Target amount",
"goalTargetDate": "Target date (optional)",
"goalsEmptyTitle": "No savings goals yet",
"goalsEmptySub": "Create a goal and add top-ups as you save.",
"savedOf": "{saved} of {target}",
"perMonthNeeded": "Save {amount}/month for {months, plural, one {# month} other {# months}} to reach it on time",
"targetBy": "Target: {date}",
"noTargetDate": "No target date",
"statusDone": "Reached",
"statusOverdue": "Overdue",
"addTopUp": "Add top-up",
"topUpAmount": "Amount",
"topUpDate": "Date",
"recordAsExpense": "Also record as a Savings expense",
"history": "History",
"noTopUps": "No top-ups yet."
```
en, inside `"dashboard"`: `"goalsTitle": "Savings goal", "goalsEmpty": "No savings goals yet.", "goalsCta": "Create a goal",`

id, inside `"planning"`:
```json
"tabGoals": "Target",
"addGoal": "Target baru",
"goalName": "Nama target",
"goalNamePlaceholder": "mis. Laptop baru",
"goalTarget": "Jumlah target",
"goalTargetDate": "Tanggal target (opsional)",
"goalsEmptyTitle": "Belum ada target tabungan",
"goalsEmptySub": "Buat target dan tambahkan setoran saat kamu menabung.",
"savedOf": "{saved} dari {target}",
"perMonthNeeded": "Sisihkan {amount}/bulan selama {months} bulan agar tepat waktu",
"targetBy": "Target: {date}",
"noTargetDate": "Tanpa tanggal target",
"statusDone": "Tercapai",
"statusOverdue": "Lewat target",
"addTopUp": "Tambah setoran",
"topUpAmount": "Jumlah",
"topUpDate": "Tanggal",
"recordAsExpense": "Catat juga sebagai pengeluaran Tabungan",
"history": "Riwayat",
"noTopUps": "Belum ada setoran."
```
id, inside `"dashboard"`: `"goalsTitle": "Target tabungan", "goalsEmpty": "Belum ada target tabungan.", "goalsCta": "Buat target",`

- [ ] **Step 2: Forms**

`src/components/planning/goal-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { GoalInput } from "@/lib/planning/api";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function GoalForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: GoalInput;
  onSubmit: (input: GoalInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(initial ? String(initial.target_amount) : "");
  const [date, setDate] = useState(initial?.target_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = Number(target) || 0;
  const valid = name.trim().length > 0 && num > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), target_amount: num, target_date: date || null });
    } catch {
      setError(t("saveError"));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <Field label={t("goalName")}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoFocus
          placeholder={t("goalNamePlaceholder")}
          className={fieldClass}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("goalTarget")}>
          <AmountInput value={target} onChange={setTarget} />
        </Field>
        <Field label={t("goalTargetDate")}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </Field>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={!valid || saving}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
```

`src/components/planning/contribution-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ContributionInput } from "@/lib/planning/api";
import { isValidYmd, localToday } from "@/lib/ymd";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function ContributionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: ContributionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localToday());
  const [recordAsExpense, setRecordAsExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = Number(amount) || 0;
  const valid = num > 0 && isValidYmd(date);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ amount: num, date, record_as_expense: recordAsExpense });
    } catch {
      setError(t("saveError"));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("topUpAmount")}>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <Field label={t("topUpDate")}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={recordAsExpense}
          onChange={(e) => setRecordAsExpense(e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        {t("recordAsExpense")}
      </label>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={!valid || saving}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Goal item and tab**

`src/components/planning/goal-item.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { GoalView } from "@/lib/goal-progress";
import {
  addContribution,
  deleteContribution,
  deleteGoal,
  updateGoal,
} from "@/lib/planning/api";
import { ConfirmDelete } from "./confirm-delete";
import { ContributionForm } from "./contribution-form";
import { GoalForm } from "./goal-form";
import { ProgressBar } from "./progress-bar";

export function GoalItem({ goal, onChanged }: { goal: GoalView; onChanged: () => Promise<void> }) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [mode, setMode] = useState<"view" | "edit" | "topup">("view");
  const [showHistory, setShowHistory] = useState(false);

  if (mode === "edit") {
    return (
      <GoalForm
        initial={{ name: goal.name, target_amount: goal.target_amount, target_date: goal.target_date }}
        onSubmit={async (input) => {
          await updateGoal(goal.id, input);
          setMode("view");
          await onChanged();
        }}
        onCancel={() => setMode("view")}
      />
    );
  }

  return (
    <div className="animate-slide-up space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{goal.name}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {goal.target_date
              ? t("targetBy", { date: formatDate(goal.target_date, locale) })
              : t("noTargetDate")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {goal.status !== "active" && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                goal.status === "done"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
              )}
            >
              {goal.status === "done" ? t("statusDone") : t("statusOverdue")}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMode("edit")}
            aria-label={tCommon("edit")}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDelete
            onConfirm={async () => {
              await deleteGoal(goal.id).catch(() => {});
              await onChanged();
            }}
          />
        </div>
      </div>

      <ProgressBar pct={goal.pct} tone={goal.status === "overdue" ? "over" : "ok"} />
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-mono text-zinc-600 dark:text-zinc-300">
          {t("savedOf", {
            saved: formatCurrency(goal.saved, locale),
            target: formatCurrency(goal.target_amount, locale),
          })}
        </span>
        <span className="font-mono text-zinc-500">{Math.round(goal.pct)}%</span>
      </div>
      {goal.perMonth !== null && goal.monthsLeft !== null && (
        <p className="text-xs text-zinc-500">
          {t("perMonthNeeded", {
            amount: formatCurrency(goal.perMonth, locale),
            months: goal.monthsLeft,
          })}
        </p>
      )}

      {mode === "topup" ? (
        <ContributionForm
          onSubmit={async (input) => {
            await addContribution(goal.id, input);
            setMode("view");
            await onChanged();
          }}
          onCancel={() => setMode("view")}
        />
      ) : (
        <div className="flex items-center justify-between">
          <Button size="sm" variant="secondary" onClick={() => setMode("topup")}>
            <Plus className="h-3.5 w-3.5" />
            {t("addTopUp")}
          </Button>
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {t("history")} ({goal.contributions.length})
            <ChevronDown className={cn("h-3 w-3 transition-transform", showHistory && "rotate-180")} />
          </button>
        </div>
      )}

      {showHistory &&
        (goal.contributions.length === 0 ? (
          <p className="text-xs text-zinc-400">{t("noTopUps")}</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
            {goal.contributions.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500">{formatDate(c.date, locale)}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(c.amount, locale)}
                  </span>
                  <ConfirmDelete
                    onConfirm={async () => {
                      await deleteContribution(c.id).catch(() => {});
                      await onChanged();
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
```

`src/components/planning/goals-tab.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { GoalView } from "@/lib/goal-progress";
import { createGoal, fetchGoals } from "@/lib/planning/api";
import { GoalForm } from "./goal-form";
import { GoalItem } from "./goal-item";
import { ListSkeleton } from "./list-skeleton";

export function GoalsTab() {
  const t = useTranslations("planning");
  const [items, setItems] = useState<GoalView[] | null>(null);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await fetchGoals());
    } catch {
      setError(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addButton = (
    <Button size="sm" onClick={() => setAdding(true)}>
      <Plus className="h-3.5 w-3.5" />
      {t("addGoal")}
    </Button>
  );

  return (
    <div className="space-y-3.5">
      {items !== null && items.length > 0 && !adding && (
        <div className="flex justify-end">{addButton}</div>
      )}
      {adding && (
        <GoalForm
          onSubmit={async (input) => {
            await createGoal(input);
            setAdding(false);
            await load();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {items === null ? (
        <ListSkeleton rows={2} />
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadError")}</p>
      ) : items.length === 0 ? (
        !adding && (
          <EmptyState
            icon={PiggyBank}
            title={t("goalsEmptyTitle")}
            subtitle={t("goalsEmptySub")}
            action={addButton}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {items.map((g) => (
            <GoalItem key={g.id} goal={g} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Register the tab**

In `src/app/(app)/planning/page.tsx`:
- `import { GoalsTab } from "@/components/planning/goals-tab";`
- `const TABS = ["budgets", "goals"] as const;`
- `const TAB_LABEL: Record<Tab, string> = { budgets: "tabBudgets", goals: "tabGoals" };`
- after `{tab === "budgets" && <BudgetsTab />}` add `{tab === "goals" && <GoalsTab />}`

- [ ] **Step 5: Dashboard goal card**

`src/components/dashboard/goal-card.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/planning/progress-bar";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";
import { pickFeaturedGoal, type GoalView } from "@/lib/goal-progress";
import { fetchGoals } from "@/lib/planning/api";

export function GoalCard({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations("dashboard");
  const tPlan = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [goals, setGoals] = useState<GoalView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGoals()
      .then((d) => {
        if (!cancelled) setGoals(d);
      })
      .catch(() => {
        if (!cancelled) setGoals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const goal = goals ? pickFeaturedGoal(goals) : null;

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{t("goalsTitle")}</h3>
        <Link
          href="/planning?tab=goals"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {tCommon("viewAll")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {goals === null ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-56" />
        </div>
      ) : !goal ? (
        <div className="py-4 text-center">
          <p className="text-sm text-zinc-500">{t("goalsEmpty")}</p>
          <Link
            href="/planning?tab=goals"
            className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {t("goalsCta")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{goal.name}</span>
            <span className="font-mono text-xs text-zinc-500">{Math.round(goal.pct)}%</span>
          </div>
          <ProgressBar pct={goal.pct} tone={goal.status === "overdue" ? "over" : "ok"} />
          <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
            {tPlan("savedOf", {
              saved: formatCurrency(goal.saved, locale),
              target: formatCurrency(goal.target_amount, locale),
            })}
          </p>
          {goal.perMonth !== null && goal.monthsLeft !== null && (
            <p className="text-xs text-zinc-500">
              {tPlan("perMonthNeeded", {
                amount: formatCurrency(goal.perMonth, locale),
                months: goal.monthsLeft,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

In `src/app/(app)/dashboard/page.tsx`: `import { GoalCard } from "@/components/dashboard/goal-card";` and add `<GoalCard refreshKey={dataVersion} />` inside the cards row after `<BudgetCard … />`.

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all exit 0.

Live: `npm run dev`, demo login. Dashboard shows the Goal card for "Laptop baru" at 54% with "Rp 1.375.000/month for 4 months". Planning → Goals: two cards. Add a top-up of 100000 with "Also record as a Savings expense" checked → Laptop saved rises by 100000, and Transactions shows a new "Laptop baru" savings expense. Expand History, delete that top-up → saved drops back. Create goal "Liburan" 3000000 with no date → appears with "No target date". Edit it, then delete it. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/components/planning src/components/dashboard/goal-card.tsx "src/app/(app)/planning/page.tsx" "src/app/(app)/dashboard/page.tsx" messages/en.json messages/id.json
git commit -m "feat: add savings goals tab and dashboard goal card" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

---

## Phase 5 — Recurring transactions

### Task 13: Recurring schedule math

**Files:**
- Create: `src/lib/recurring-due.ts`, `src/lib/recurring-due.test.ts`

**Interfaces:**
- Consumes: `CategoryKey`, `TransactionType` from `@/lib/mock-data`.
- Produces:
  - `type RecurringSchedule = { day_of_month: number; start_date: string; last_generated_month: string | null; active: boolean }`
  - `type RecurringRule = RecurringSchedule & { id: string; description: string; amount: number; type: TransactionType; category_key: CategoryKey }`
  - `occurrenceDate(month: string, day: number): string` — clamps day to the month's last day
  - `nextMonth(month: string): string`
  - `recurringDue(rule: RecurringSchedule, today: string): { dates: string[]; lastGeneratedMonth: string | null }`
  - `nextOccurrence(rule: RecurringSchedule, today: string): string | null` — first occurrence strictly after today (and ≥ start_date)

- [ ] **Step 1: Write the failing test**

`src/lib/recurring-due.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { occurrenceDate, nextMonth, recurringDue, nextOccurrence } from "./recurring-due";

const rule = (over: Partial<Parameters<typeof recurringDue>[0]> = {}) => ({
  day_of_month: 5,
  start_date: "2026-08-01",
  last_generated_month: null as string | null,
  active: true,
  ...over,
});

describe("occurrenceDate", () => {
  it("clamps to the last day of short months", () => {
    expect(occurrenceDate("2026-02", 31)).toBe("2026-02-28");
    expect(occurrenceDate("2028-02", 31)).toBe("2028-02-29");
    expect(occurrenceDate("2026-09", 31)).toBe("2026-09-30");
    expect(occurrenceDate("2026-10", 31)).toBe("2026-10-31");
    expect(occurrenceDate("2026-10", 1)).toBe("2026-10-01");
  });
});

describe("nextMonth", () => {
  it("rolls the year", () => {
    expect(nextMonth("2026-12")).toBe("2027-01");
    expect(nextMonth("2026-09")).toBe("2026-10");
  });
});

describe("recurringDue", () => {
  it("catches up every month from start to today", () => {
    expect(recurringDue(rule(), "2026-09-27")).toEqual({
      dates: ["2026-08-05", "2026-09-05"],
      lastGeneratedMonth: "2026-09",
    });
  });

  it("returns nothing once the current month is generated (idempotent)", () => {
    expect(recurringDue(rule({ last_generated_month: "2026-09" }), "2026-09-27")).toEqual({
      dates: [],
      lastGeneratedMonth: "2026-09",
    });
  });

  it("skips this month's occurrence until its day arrives", () => {
    expect(
      recurringDue(rule({ day_of_month: 28, last_generated_month: "2026-08" }), "2026-09-27")
    ).toEqual({ dates: [], lastGeneratedMonth: "2026-08" });
    expect(
      recurringDue(rule({ day_of_month: 28, last_generated_month: "2026-08" }), "2026-09-28").dates
    ).toEqual(["2026-09-28"]);
  });

  it("catches up across a year boundary", () => {
    expect(
      recurringDue(rule({ day_of_month: 25, last_generated_month: "2026-11" }), "2027-02-26").dates
    ).toEqual(["2026-12-25", "2027-01-25", "2027-02-25"]);
  });

  it("skips an occurrence before the start date in the start month", () => {
    expect(recurringDue(rule({ day_of_month: 5, start_date: "2026-09-10" }), "2026-10-06").dates)
      .toEqual(["2026-10-05"]);
  });

  it("uses the clamped date for day 31", () => {
    expect(
      recurringDue(rule({ day_of_month: 31, start_date: "2026-02-01" }), "2026-03-01").dates
    ).toEqual(["2026-02-28"]);
  });

  it("does nothing for a future start or an inactive rule", () => {
    expect(recurringDue(rule({ start_date: "2026-12-01" }), "2026-09-27").dates).toEqual([]);
    expect(recurringDue(rule({ active: false }), "2026-09-27")).toEqual({
      dates: [],
      lastGeneratedMonth: null,
    });
  });
});

describe("nextOccurrence", () => {
  it("is later this month when the day hasn't come yet", () => {
    expect(nextOccurrence(rule({ day_of_month: 28 }), "2026-09-27")).toBe("2026-09-28");
  });
  it("is next month when this month's day has passed or is today", () => {
    expect(nextOccurrence(rule({ day_of_month: 5 }), "2026-09-27")).toBe("2026-10-05");
    expect(nextOccurrence(rule({ day_of_month: 27 }), "2026-09-27")).toBe("2026-10-27");
  });
  it("respects a future start date", () => {
    expect(nextOccurrence(rule({ start_date: "2026-12-10" }), "2026-09-27")).toBe("2027-01-05");
  });
  it("is null for inactive rules", () => {
    expect(nextOccurrence(rule({ active: false }), "2026-09-27")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/recurring-due.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/recurring-due.ts`**

```ts
import type { CategoryKey, TransactionType } from "./mock-data";

export type RecurringSchedule = {
  day_of_month: number;
  start_date: string; // YYYY-MM-DD
  last_generated_month: string | null; // YYYY-MM
  active: boolean;
};

export type RecurringRule = RecurringSchedule & {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_key: CategoryKey;
};

const MAX_MONTHS = 120; // safety bound for very old start dates

// Day 31 in a 30-day month (or February) falls on the month's last day.
export function occurrenceDate(month: string, day: number): string {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

export function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

// Occurrences that are due (date ≤ today) and not generated yet.
export function recurringDue(
  rule: RecurringSchedule,
  today: string
): { dates: string[]; lastGeneratedMonth: string | null } {
  const unchanged = { dates: [], lastGeneratedMonth: rule.last_generated_month };
  if (!rule.active) return unchanged;

  const startMonth = rule.start_date.slice(0, 7);
  const afterLast = rule.last_generated_month ? nextMonth(rule.last_generated_month) : startMonth;
  let month = afterLast > startMonth ? afterLast : startMonth;
  const thisMonth = today.slice(0, 7);

  const dates: string[] = [];
  for (let i = 0; month <= thisMonth && i < MAX_MONTHS; i++) {
    const date = occurrenceDate(month, rule.day_of_month);
    if (date >= rule.start_date && date <= today) dates.push(date);
    month = nextMonth(month);
  }
  if (dates.length === 0) return unchanged;
  return { dates, lastGeneratedMonth: dates[dates.length - 1].slice(0, 7) };
}

// For display: the next date this rule will add a transaction.
export function nextOccurrence(rule: RecurringSchedule, today: string): string | null {
  if (!rule.active) return null;
  const startMonth = rule.start_date.slice(0, 7);
  let month = today.slice(0, 7) > startMonth ? today.slice(0, 7) : startMonth;
  for (let i = 0; i < 24; i++) {
    const date = occurrenceDate(month, rule.day_of_month);
    if (date > today && date >= rule.start_date) return date;
    month = nextMonth(month);
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/recurring-due.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/recurring-due.ts src/lib/recurring-due.test.ts
git commit -m "feat: add recurring transaction schedule calculations" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 14: Recurring API, catch-up run, and client helpers

**Files:**
- Create: `src/app/api/recurring/route.ts`
- Create: `src/app/api/recurring/run/route.ts`
- Modify: `src/lib/planning/api.ts` (append recurring section)

**Interfaces:**
- Consumes: `recurringDue`, `RecurringRule` (Task 13); `isValidYmd` (Task 1); `todayYmd` (Task 2); `CATEGORY_KEYS`, `CategoryKey`, `TransactionType` (existing); `send`, `jsonInit` (Task 7).
- Produces:
  - `GET /api/recurring` → `{ data: RecurringRule[] }` (amount as number, ordered by `day_of_month`)
  - `POST /api/recurring RuleInput` → 201 `{ data }`; `PATCH /api/recurring { id, ...Partial<RuleInput>, active? }` → `{ data }`; `DELETE /api/recurring?id=` → `{ ok: true }`
  - `POST /api/recurring/run` → `{ created: number }`
  - Client: `type RuleInput = { description: string; amount: number; type: TransactionType; category_key: CategoryKey; day_of_month: number; start_date: string }`, `fetchRecurring(): Promise<RecurringRule[]>`, `createRecurring(input: RuleInput): Promise<void>`, `updateRecurring(id: string, patch: Partial<RuleInput> & { active?: boolean }): Promise<void>`, `deleteRecurring(id: string): Promise<void>`, `runRecurring(): Promise<number>`

- [ ] **Step 1: Create `src/app/api/recurring/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/mock-data";
import { isValidYmd } from "@/lib/ymd";

const RuleInput = z.object({
  description: z.string().trim().min(1).max(120),
  amount: z.number().positive().max(1_000_000_000_000),
  type: z.enum(["income", "expense"]),
  category_key: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
  day_of_month: z.number().int().min(1).max(31),
  start_date: z.string().refine(isValidYmd),
});
const RulePatch = RuleInput.partial().extend({ id: z.uuid(), active: z.boolean().optional() });

// income ⇔ category "income"; an expense can never carry the income category.
function fixCategory<T extends { type?: string; category_key?: CategoryKey }>(r: T): T {
  if (r.type === "income") return { ...r, category_key: "income" };
  if (r.type === "expense" && r.category_key === "income") return { ...r, category_key: "shopping" };
  return r;
}

async function getUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("recurring_rules")
    .select("id, description, amount, type, category_key, day_of_month, start_date, last_generated_month, active")
    .eq("user_id", user.id)
    .order("day_of_month", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })),
  });
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = RuleInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data, error } = await supabase
    .from("recurring_rules")
    .insert({ user_id: user.id, ...fixCategory(parsed.data) })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = RulePatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id, ...fields } = fixCategory(parsed.data);
  const { data, error } = await supabase
    .from("recurring_rules")
    .update(fields)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Generated transactions stay (FK is ON DELETE SET NULL).
  const { error } = await supabase.from("recurring_rules").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create `src/app/api/recurring/run/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { todayYmd } from "@/lib/ai/dates";
import { recurringDue, type RecurringSchedule } from "@/lib/recurring-due";

// Materialize every due occurrence of the user's active recurring rules.
// Idempotent: the (recurring_rule_id, date) unique index + ignoreDuplicates
// means two tabs running this at once can't create duplicates.
export async function POST() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rules, error } = await supabase
    .from("recurring_rules")
    .select("id, description, amount, type, category_key, day_of_month, start_date, last_generated_month, active")
    .eq("user_id", user.id)
    .eq("active", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const today = todayYmd();
  let created = 0;
  for (const rule of rules ?? []) {
    const { dates, lastGeneratedMonth } = recurringDue(rule as RecurringSchedule, today);
    if (dates.length === 0) continue;

    const { data: inserted, error: insErr } = await supabase
      .from("transactions")
      .upsert(
        dates.map((date) => ({
          user_id: user.id,
          amount: rule.amount,
          type: rule.type,
          description: rule.description,
          category_key: rule.category_key,
          date,
          recurring_rule_id: rule.id,
        })),
        { onConflict: "recurring_rule_id,date", ignoreDuplicates: true }
      )
      .select("id");
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    created += inserted?.length ?? 0;

    await supabase
      .from("recurring_rules")
      .update({ last_generated_month: lastGeneratedMonth })
      .eq("id", rule.id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ created });
}
```

- [ ] **Step 3: Append recurring helpers to `src/lib/planning/api.ts`**

Add imports:
```ts
import type { CategoryKey, TransactionType } from "@/lib/mock-data";
import type { RecurringRule } from "@/lib/recurring-due";
```
Append:
```ts
// ---- Recurring ----

export type RuleInput = {
  description: string;
  amount: number;
  type: TransactionType;
  category_key: CategoryKey;
  day_of_month: number;
  start_date: string;
};

export async function fetchRecurring(): Promise<RecurringRule[]> {
  return (await send<{ data: RecurringRule[] }>("/api/recurring")).data;
}

export async function createRecurring(input: RuleInput): Promise<void> {
  await send("/api/recurring", jsonInit("POST", input));
}

export async function updateRecurring(
  id: string,
  patch: Partial<RuleInput> & { active?: boolean }
): Promise<void> {
  await send("/api/recurring", jsonInit("PATCH", { id, ...patch }));
}

export async function deleteRecurring(id: string): Promise<void> {
  await send(`/api/recurring?id=${id}`, { method: "DELETE" });
}

// Generate due occurrences now; returns how many transactions were added.
export async function runRecurring(): Promise<number> {
  return (await send<{ created: number }>("/api/recurring/run", { method: "POST" })).created;
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/recurring src/lib/planning/api.ts
git commit -m "feat: add recurring rules API and catch-up endpoint" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 15: Recurring tab, app-open runner, and live refresh

**Files:**
- Create: `src/lib/events.ts`
- Create: `src/components/planning/switch.tsx`, `recurring-form.tsx`, `recurring-tab.tsx`
- Create: `src/components/recurring-runner.tsx`
- Modify: `src/app/(app)/planning/page.tsx` (register tab)
- Modify: `src/app/(app)/layout.tsx` (mount runner)
- Modify: `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/transactions/page.tsx` (refetch on event)
- Modify: `messages/en.json`, `messages/id.json`

**Interfaces:**
- Consumes: recurring client helpers + `RuleInput` (Task 14); `RecurringRule`, `nextOccurrence` (Task 13); `EXPENSE_CATEGORY_KEYS`, `ExpenseCategoryKey`, `isValidYmd`, `localToday` (Task 1); `Field`, `fieldClass`, `AmountInput`, `ConfirmDelete`, `ListSkeleton` (Task 8).
- Produces: `TRANSACTIONS_CHANGED = "sft:transactions-changed"` (window event name) — Task 19 dispatches nothing new but relies on pages listening; `<RecurringTab />`, `<RecurringRunner />`, `<Switch checked onChange label />`.

- [ ] **Step 1: Add i18n keys**

en, inside `"planning"`:
```json
"tabRecurring": "Recurring",
"addRecurring": "New recurring",
"recDescription": "Description",
"recDescriptionPlaceholder": "e.g. Spotify Premium",
"recAmount": "Amount",
"recType": "Type",
"recCategory": "Category",
"recDay": "Day of month",
"recStartDate": "Start date",
"recurringEmptyTitle": "No recurring transactions",
"recurringEmptySub": "Add salary, rent, or subscriptions once — they're recorded every month automatically.",
"everyDay": "Every month on day {day}",
"nextOn": "Next: {date}",
"active": "Active",
"paused": "Paused",
"recurringAdded": "{count, plural, one {# recurring transaction added} other {# recurring transactions added}}"
```
id, inside `"planning"`:
```json
"tabRecurring": "Berulang",
"addRecurring": "Transaksi berulang baru",
"recDescription": "Deskripsi",
"recDescriptionPlaceholder": "mis. Spotify Premium",
"recAmount": "Jumlah",
"recType": "Tipe",
"recCategory": "Kategori",
"recDay": "Tanggal tiap bulan",
"recStartDate": "Mulai tanggal",
"recurringEmptyTitle": "Belum ada transaksi berulang",
"recurringEmptySub": "Tambahkan gaji, sewa kos, atau langganan sekali saja — akan tercatat otomatis setiap bulan.",
"everyDay": "Setiap tanggal {day}",
"nextOn": "Berikutnya: {date}",
"active": "Aktif",
"paused": "Jeda",
"recurringAdded": "{count} transaksi berulang ditambahkan"
```

- [ ] **Step 2: Event name, switch, form**

`src/lib/events.ts`:
```ts
// Fired on window when transactions were added outside the current page's own
// flow (recurring catch-up), so the dashboard and transactions list refetch.
export const TRANSACTIONS_CHANGED = "sft:transactions-changed";
```

`src/components/planning/switch.tsx`:
```tsx
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-8 items-center"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
```

`src/components/planning/recurring-form.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";
import type { TransactionType } from "@/lib/mock-data";
import type { RuleInput } from "@/lib/planning/api";
import { isValidYmd, localToday } from "@/lib/ymd";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function RecurringForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: RuleInput;
  onSubmit: (input: RuleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tTx = useTranslations("transactions");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [category, setCategory] = useState<ExpenseCategoryKey>(
    initial && initial.category_key !== "income" ? initial.category_key : "bills"
  );
  const [day, setDay] = useState(String(initial?.day_of_month ?? new Date().getDate()));
  const [start, setStart] = useState(initial?.start_date ?? localToday());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = Number(amount) || 0;
  const dayNum = Number(day);
  const valid =
    description.trim().length > 0 &&
    num > 0 &&
    Number.isInteger(dayNum) &&
    dayNum >= 1 &&
    dayNum <= 31 &&
    isValidYmd(start);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        description: description.trim(),
        amount: num,
        type,
        category_key: type === "income" ? "income" : category,
        day_of_month: dayNum,
        start_date: start,
      });
    } catch {
      setError(t("saveError"));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <Field label={t("recDescription")}>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
          autoFocus
          placeholder={t("recDescriptionPlaceholder")}
          className={fieldClass}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("recAmount")}>
          <AmountInput value={amount} onChange={setAmount} />
        </Field>
        <Field label={t("recType")}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className={fieldClass}
          >
            <option value="expense">{tTx("typeExpense")}</option>
            <option value="income">{tTx("typeIncome")}</option>
          </select>
        </Field>
        {type === "expense" && (
          <Field label={t("recCategory")}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey)}
              className={fieldClass}
            >
              {EXPENSE_CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {tCat(k)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t("recDay")}>
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={t("recStartDate")}>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
        </Field>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={!valid || saving}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Recurring tab**

`src/components/planning/recurring-tab.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryBadge } from "@/components/category-badge";
import { useLocale } from "@/i18n/locale-provider";
import { TRANSACTIONS_CHANGED } from "@/lib/events";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { nextOccurrence, type RecurringRule } from "@/lib/recurring-due";
import { localToday } from "@/lib/ymd";
import {
  createRecurring,
  deleteRecurring,
  fetchRecurring,
  runRecurring,
  updateRecurring,
  type RuleInput,
} from "@/lib/planning/api";
import { ConfirmDelete } from "./confirm-delete";
import { ListSkeleton } from "./list-skeleton";
import { RecurringForm } from "./recurring-form";
import { Switch } from "./switch";

export function RecurringTab() {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [items, setItems] = useState<RecurringRule[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // "new" or a rule id
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await fetchRecurring());
    } catch {
      setError(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A new/edited/re-activated rule may already have due dates: generate them now.
  async function catchUp() {
    try {
      const created = await runRecurring();
      if (created > 0) {
        window.dispatchEvent(new Event(TRANSACTIONS_CHANGED));
        setNotice(t("recurringAdded", { count: created }));
        setTimeout(() => setNotice(null), 4000);
      }
    } catch {
      // retried on next app open
    }
  }

  async function save(input: RuleInput) {
    if (editing && editing !== "new") await updateRecurring(editing, input);
    else await createRecurring(input);
    setEditing(null);
    await catchUp();
    await load();
  }

  async function toggle(rule: RecurringRule, active: boolean) {
    setItems((prev) => prev?.map((r) => (r.id === rule.id ? { ...r, active } : r)) ?? prev);
    await updateRecurring(rule.id, { active }).catch(() => {});
    if (active) await catchUp();
    await load();
  }

  async function remove(id: string) {
    await deleteRecurring(id).catch(() => {});
    await load();
  }

  const today = localToday();

  return (
    <div className="space-y-3.5">
      {notice && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}
      {items !== null && items.length > 0 && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            {t("addRecurring")}
          </Button>
        </div>
      )}
      {editing === "new" && <RecurringForm onSubmit={save} onCancel={() => setEditing(null)} />}

      {items === null ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadError")}</p>
      ) : items.length === 0 ? (
        editing === null && (
          <EmptyState
            icon={Repeat}
            title={t("recurringEmptyTitle")}
            subtitle={t("recurringEmptySub")}
            action={
              <Button size="sm" onClick={() => setEditing("new")}>
                <Plus className="h-3.5 w-3.5" />
                {t("addRecurring")}
              </Button>
            }
          />
        )
      ) : (
        <div className="animate-slide-up divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[var(--shadow-sm)] dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((r) => {
            if (editing === r.id) {
              return (
                <div key={r.id} className="p-3">
                  <RecurringForm
                    initial={r}
                    onSubmit={save}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              );
            }
            const next = nextOccurrence(r, today);
            return (
              <div
                key={r.id}
                className={cn("flex items-center gap-3 px-4 py-3", !r.active && "opacity-60")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{r.description}</span>
                    <CategoryBadge categoryKey={r.category_key} className="hidden sm:inline-flex" />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {t("everyDay", { day: r.day_of_month })}
                    {next ? ` · ${t("nextOn", { date: formatDate(next, locale) })}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm font-semibold",
                    r.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {r.type === "income" ? "+" : "-"}
                  {formatCurrency(r.amount, locale)}
                </span>
                <Switch
                  checked={r.active}
                  label={r.active ? t("active") : t("paused")}
                  onChange={(v) => toggle(r, v)}
                />
                <button
                  type="button"
                  onClick={() => setEditing(r.id)}
                  aria-label={tCommon("edit")}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <ConfirmDelete onConfirm={() => remove(r.id)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: App-open runner**

`src/components/recurring-runner.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { runRecurring } from "@/lib/planning/api";
import { TRANSACTIONS_CHANGED } from "@/lib/events";

const SESSION_KEY = "sft:recurring-ran";

// Once per browser session, add any recurring transactions that came due.
export function RecurringRunner() {
  const t = useTranslations("planning");
  const [created, setCreated] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // storage blocked: still run, the server side is idempotent
    }
    runRecurring()
      .then((n) => {
        if (n > 0) {
          setCreated(n);
          window.dispatchEvent(new Event(TRANSACTIONS_CHANGED));
          setTimeout(() => setCreated(0), 4000);
        }
      })
      .catch((e) => console.error("recurring run failed", e));
  }, []);

  if (created === 0) return null;
  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-white dark:text-zinc-900 lg:bottom-6"
    >
      {t("recurringAdded", { count: created })}
    </div>
  );
}
```

`src/app/(app)/layout.tsx`: add `import { RecurringRunner } from "@/components/recurring-runner";` and render `<RecurringRunner />` right after `<AccentInit />`.

- [ ] **Step 5: Register tab and listen for the event**

`src/app/(app)/planning/page.tsx`:
- `import { RecurringTab } from "@/components/planning/recurring-tab";`
- `const TABS = ["budgets", "goals", "recurring"] as const;`
- `const TAB_LABEL: Record<Tab, string> = { budgets: "tabBudgets", goals: "tabGoals", recurring: "tabRecurring" };`
- add `{tab === "recurring" && <RecurringTab />}`

`src/app/(app)/dashboard/page.tsx`: `import { TRANSACTIONS_CHANGED } from "@/lib/events";` and after the `useEffect(() => { fetchData(); }, [fetchData]);` block add:
```ts
useEffect(() => {
  const onChanged = () => fetchData();
  window.addEventListener(TRANSACTIONS_CHANGED, onChanged);
  return () => window.removeEventListener(TRANSACTIONS_CHANGED, onChanged);
}, [fetchData]);
```

`src/app/(app)/transactions/page.tsx`: same import, and after `useEffect(() => { loadTransactions(); }, [loadTransactions]);` add:
```ts
useEffect(() => {
  const onChanged = () => loadTransactions();
  window.addEventListener(TRANSACTIONS_CHANGED, onChanged);
  return () => window.removeEventListener(TRANSACTIONS_CHANGED, onChanged);
}, [loadTransactions]);
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all exit 0.

Live: `npm run dev`, demo login.
1. Planning → Recurring shows 3 seeded rules (Bayar kos day 1, Spotify day 5, Gaji day 25) with "Next:" dates in October 2026. No toast appears (nothing due).
2. Add a rule "Tes langganan", Rp 10000, expense, Entertainment, day 1, start date 2026-09-01 → toast/notice "1 recurring transaction added"; Transactions shows "Tes langganan" on 2026-09-01.
3. Pause it, then re-activate it → no new transaction (already generated for September).
4. Delete the rule → the generated transaction stays in Transactions; delete that transaction manually to keep the demo clean.
Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/events.ts src/components/planning src/components/recurring-runner.tsx "src/app/(app)/planning/page.tsx" "src/app/(app)/layout.tsx" "src/app/(app)/dashboard/page.tsx" "src/app/(app)/transactions/page.tsx" messages/en.json messages/id.json
git commit -m "feat: add recurring transactions with catch-up on app open" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

---

## Phase 6 — Bank CSV import

### Task 16: CSV parser

**Files:**
- Create: `src/lib/csv/parse.ts`, `src/lib/csv/parse.test.ts`

**Interfaces:**
- Produces: `type Delimiter = "," | ";" | "\t"`, `detectDelimiter(line: string): Delimiter`, `parseCsv(text: string): string[][]` (cells trimmed; fully empty rows dropped; `[]` for empty input)

- [ ] **Step 1: Write the failing test**

`src/lib/csv/parse.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { detectDelimiter, parseCsv } from "./parse";

describe("detectDelimiter", () => {
  it("picks the most frequent delimiter outside quotes", () => {
    expect(detectDelimiter("a,b,c")).toBe(",");
    expect(detectDelimiter("Tanggal;Keterangan;Jumlah")).toBe(";");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
    expect(detectDelimiter('"a;b;c",d')).toBe(",");
    expect(detectDelimiter("single")).toBe(",");
  });
});

describe("parseCsv", () => {
  it("parses comma CSV with CRLF and a BOM", () => {
    expect(parseCsv("﻿Date,Desc,Amount\r\n2026-09-01,Kopi,25000\r\n")).toEqual([
      ["Date", "Desc", "Amount"],
      ["2026-09-01", "Kopi", "25000"],
    ]);
  });

  it("parses semicolon CSV with Indonesian decimals", () => {
    expect(parseCsv("Tanggal;Keterangan;Jumlah\n01/09/2026;Kopi;25.000,00")).toEqual([
      ["Tanggal", "Keterangan", "Jumlah"],
      ["01/09/2026", "Kopi", "25.000,00"],
    ]);
  });

  it("handles quoted fields with delimiters, escaped quotes, and newlines", () => {
    expect(parseCsv('a,b\n"Makan, minum","He said ""hi"""\n"line1\nline2",x')).toEqual([
      ["a", "b"],
      ["Makan, minum", 'He said "hi"'],
      ["line1\nline2", "x"],
    ]);
  });

  it("drops blank lines and returns [] for empty input", () => {
    expect(parseCsv("a,b\n\n , \n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\n\n")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/csv/parse.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/csv/parse.ts`**

```ts
export type Delimiter = "," | ";" | "\t";

const DELIMITERS: Delimiter[] = [",", ";", "\t"];

// Indonesian bank exports often use ";" (because "," is the decimal mark).
export function detectDelimiter(line: string): Delimiter {
  const counts: Record<Delimiter, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (DELIMITERS as string[]).includes(ch)) counts[ch as Delimiter]++;
  }
  return DELIMITERS.reduce((best, d) => (counts[d] > counts[best] ? d : best), ",");
}

// RFC-4180-style parser: quoted fields, "" escapes, CRLF/LF, BOM.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const delim = detectDelimiter(src.split(/\r?\n/, 1)[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/csv/parse.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv/parse.ts src/lib/csv/parse.test.ts
git commit -m "feat: add CSV parser for bank imports" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 17: CSV column mapping, value parsing, and duplicate detection

**Files:**
- Create: `src/lib/csv/map.ts`, `src/lib/csv/map.test.ts`

**Interfaces:**
- Consumes: `isValidYmd` (Task 1).
- Produces:
  - `type DateFormat = "dmy" | "mdy" | "ymd"`
  - `type ColumnMapping = { date: number | null; description: number | null; amount: number | null; debit: number | null; credit: number | null }`
  - `type ParsedAmount = { value: number; dir: "in" | "out" | null }`
  - `parseAmount(raw: string): ParsedAmount | null` — `value` is absolute and rounded
  - `parseDate(raw: string, format: DateFormat): string | null`
  - `guessDateFormat(values: string[]): DateFormat`
  - `guessMapping(headers: string[], rows: string[][]): ColumnMapping`
  - `type CsvRow = { index: number; date: string | null; description: string; amount: number; type: "income" | "expense"; error: "date" | "amount" | "description" | null }`
  - `rowsToDrafts(rows: string[][], mapping: ColumnMapping, format: DateFormat): CsvRow[]`
  - `findDuplicates(rows: CsvRow[], existing: { date: string; amount: number | string; description: string }[]): Set<number>` — indices of rows matching an existing transaction (same date, amount, normalized description); rows are never compared with each other

- [ ] **Step 1: Write the failing test**

`src/lib/csv/map.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  parseAmount,
  parseDate,
  guessDateFormat,
  guessMapping,
  rowsToDrafts,
  findDuplicates,
} from "./map";

describe("parseAmount", () => {
  it("parses ID and EN number formats", () => {
    expect(parseAmount("1.234.567,00")).toEqual({ value: 1234567, dir: null });
    expect(parseAmount("1,234,567.00")).toEqual({ value: 1234567, dir: null });
    expect(parseAmount("25.000")).toEqual({ value: 25000, dir: null });
    expect(parseAmount("12,50")).toEqual({ value: 13, dir: null });
    expect(parseAmount("Rp 50.000")).toEqual({ value: 50000, dir: null });
  });
  it("reads direction from sign, parentheses, and CR/DB markers", () => {
    expect(parseAmount("-25000")).toEqual({ value: 25000, dir: "out" });
    expect(parseAmount("(25.000)")).toEqual({ value: 25000, dir: "out" });
    expect(parseAmount("+25000")).toEqual({ value: 25000, dir: "in" });
    expect(parseAmount("150,000.00 DB")).toEqual({ value: 150000, dir: "out" });
    expect(parseAmount("8,500,000.00 CR")).toEqual({ value: 8500000, dir: "in" });
  });
  it("rejects non-numbers", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("01/09/2026")).toBeNull();
    expect(parseAmount("1.2.3")).toBeNull();
  });
});

describe("parseDate", () => {
  it("parses each format and validates the result", () => {
    expect(parseDate("01/09/2026", "dmy")).toBe("2026-09-01");
    expect(parseDate("09/01/2026", "mdy")).toBe("2026-09-01");
    expect(parseDate("2026-09-01", "ymd")).toBe("2026-09-01");
    expect(parseDate("1-9-26", "dmy")).toBe("2026-09-01");
    expect(parseDate("2026-09-01 10:22:00", "ymd")).toBe("2026-09-01");
    expect(parseDate("31/02/2026", "dmy")).toBeNull();
    expect(parseDate("hello", "dmy")).toBeNull();
  });
});

describe("guessDateFormat", () => {
  it("detects ymd, mdy, and defaults to dmy", () => {
    expect(guessDateFormat(["2026-09-01"])).toBe("ymd");
    expect(guessDateFormat(["09/25/2026", "09/01/2026"])).toBe("mdy");
    expect(guessDateFormat(["25/09/2026"])).toBe("dmy");
    expect(guessDateFormat(["01/02/2026"])).toBe("dmy");
    expect(guessDateFormat([])).toBe("dmy");
  });
});

describe("guessMapping", () => {
  it("maps Indonesian headers", () => {
    expect(guessMapping(["Tanggal", "Keterangan", "Cabang", "Jumlah"], [])).toEqual({
      date: 0,
      description: 1,
      amount: 3,
      debit: null,
      credit: null,
    });
  });
  it("maps English debit/credit headers without confusing 'Description' with CR", () => {
    expect(
      guessMapping(["Transaction Date", "Transaction Description", "Debit", "Credit", "Balance"], [])
    ).toEqual({ date: 0, description: 1, amount: null, debit: 2, credit: 3 });
  });
  it("falls back to value patterns for unknown headers", () => {
    expect(
      guessMapping(
        ["A", "B", "C"],
        [
          ["01/09/2026", "Kopi susu", "25.000"],
          ["02/09/2026", "Nasi padang", "45.000"],
        ]
      )
    ).toEqual({ date: 0, description: 1, amount: 2, debit: null, credit: null });
  });
});

describe("rowsToDrafts", () => {
  const mapping = { date: 0, description: 1, amount: 2, debit: null, credit: null };

  it("treats unsigned amounts as expenses when nothing marks direction", () => {
    const [r] = rowsToDrafts([["01/09/2026", "Kopi", "25.000"]], mapping, "dmy");
    expect(r).toEqual({
      index: 0,
      date: "2026-09-01",
      description: "Kopi",
      amount: 25000,
      type: "expense",
      error: null,
    });
  });

  it("treats unsigned amounts as income when the file uses minus for expenses", () => {
    const out = rowsToDrafts(
      [
        ["01/09/2026", "Kopi", "-25000"],
        ["25/09/2026", "Gaji", "8500000"],
      ],
      mapping,
      "dmy"
    );
    expect(out.map((r) => r.type)).toEqual(["expense", "income"]);
  });

  it("uses debit/credit columns", () => {
    const out = rowsToDrafts(
      [
        ["01/09/2026", "Kopi", "25000", ""],
        ["25/09/2026", "Gaji", "", "8500000"],
      ],
      { date: 0, description: 1, amount: null, debit: 2, credit: 3 },
      "dmy"
    );
    expect(out.map((r) => [r.type, r.amount])).toEqual([
      ["expense", 25000],
      ["income", 8500000],
    ]);
  });

  it("flags invalid rows", () => {
    const out = rowsToDrafts(
      [
        ["xx", "Kopi", "25000"],
        ["01/09/2026", "Kopi", "abc"],
        ["01/09/2026", "", "25000"],
      ],
      mapping,
      "dmy"
    );
    expect(out.map((r) => r.error)).toEqual(["date", "amount", "description"]);
  });
});

describe("findDuplicates", () => {
  it("matches existing transactions by date, amount, and normalized description only", () => {
    const rows = rowsToDrafts(
      [
        ["01/09/2026", "Kopi  Susu", "25000"],
        ["01/09/2026", "Kopi Susu", "25000"],
        ["02/09/2026", "Kopi Susu", "25000"],
      ],
      { date: 0, description: 1, amount: 2, debit: null, credit: null },
      "dmy"
    );
    const dups = findDuplicates(rows, [{ date: "2026-09-01", amount: "25000", description: "kopi susu" }]);
    expect([...dups].sort()).toEqual([0, 1]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/csv/map.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/csv/map.ts`**

```ts
import { isValidYmd } from "@/lib/ymd";

export type DateFormat = "dmy" | "mdy" | "ymd";

export type ColumnMapping = {
  date: number | null;
  description: number | null;
  amount: number | null;
  debit: number | null;
  credit: number | null;
};

export type ParsedAmount = { value: number; dir: "in" | "out" | null };

export type CsvRow = {
  index: number;
  date: string | null;
  description: string;
  amount: number;
  type: "income" | "expense";
  error: "date" | "amount" | "description" | null;
};

// "1.234.567,00" (ID) and "1,234,567.00" (EN): when both separators appear the
// last one is the decimal mark; a lone separator followed by groups of exactly
// three digits is a thousands separator.
function parseLocaleNumber(s: string): number | null {
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let normalized = s;
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? "." : ",";
    const thousands = dec === "." ? "," : ".";
    normalized = s.split(thousands).join("").replace(dec, ".");
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastComma >= 0 ? "," : ".";
    const grouped = new RegExp(`^\\d{1,3}(\\${sep}\\d{3})+$`).test(s);
    normalized = grouped ? s.split(sep).join("") : s.replace(sep, ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function parseAmount(raw: string): ParsedAmount | null {
  let s = raw.trim();
  if (!s) return null;
  let dir: ParsedAmount["dir"] = null;

  const marker = s.match(/\s*(CR|DB|DR)\.?$/i);
  if (marker) {
    dir = marker[1].toUpperCase() === "CR" ? "in" : "out";
    s = s.slice(0, marker.index).trim();
  }
  s = s.replace(/rp\.?/gi, "").trim();
  if (/^\(.*\)$/.test(s)) {
    dir = "out";
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("-")) {
    dir = "out";
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    dir = "in";
    s = s.slice(1);
  }
  s = s.replace(/\s/g, "");
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;

  const value = parseLocaleNumber(s);
  return value === null ? null : { value: Math.round(value), dir };
}

const DATE_RE = /^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})/;

export function parseDate(raw: string, format: DateFormat): string | null {
  const m = raw.trim().match(DATE_RE);
  if (!m) return null;
  const [a, b, c] = [m[1], m[2], m[3]];
  let y: string, mo: string, d: string;
  if (format === "ymd") [y, mo, d] = [a, b, c];
  else if (format === "dmy") [d, mo, y] = [a, b, c];
  else [mo, d, y] = [a, b, c];
  if (y.length === 2) y = `20${y}`;
  if (y.length !== 4) return null;
  const out = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return isValidYmd(out) ? out : null;
}

export function guessDateFormat(values: string[]): DateFormat {
  let firstOver12 = false;
  let secondOver12 = false;
  for (const v of values) {
    const m = v.trim().match(DATE_RE);
    if (!m) continue;
    if (m[1].length === 4) return "ymd";
    if (Number(m[1]) > 12) firstOver12 = true;
    if (Number(m[2]) > 12) secondOver12 = true;
  }
  return secondOver12 && !firstOver12 ? "mdy" : "dmy";
}

const KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  date: ["tanggal", "tgl", "date"],
  description: ["keterangan", "deskripsi", "description", "uraian", "remark", "berita", "details"],
  amount: ["jumlah", "amount", "nominal", "mutasi", "nilai"],
  debit: ["debit", "debet", "db", "keluar", "withdrawal"],
  credit: ["kredit", "credit", "cr", "masuk", "deposit"],
};
// Debit/credit before amount so "Debit Amount" maps to debit.
const ORDER: (keyof ColumnMapping)[] = ["date", "debit", "credit", "amount", "description"];

function headerMatches(header: string, keyword: string, exact: boolean): boolean {
  if (exact) return header === keyword;
  // Short keywords ("cr", "db", "tgl") must be whole words: "description" contains "cr".
  if (keyword.length <= 3) return header.split(/[^a-z]+/).includes(keyword);
  return header.includes(keyword);
}

export function guessMapping(headers: string[], rows: string[][]): ColumnMapping {
  const mapping: ColumnMapping = { date: null, description: null, amount: null, debit: null, credit: null };
  const used = new Set<number>();
  const norm = headers.map((h) => h.toLowerCase().trim());

  for (const exact of [true, false]) {
    for (const field of ORDER) {
      if (mapping[field] !== null) continue;
      const idx = norm.findIndex(
        (h, i) => !used.has(i) && KEYWORDS[field].some((k) => headerMatches(h, k, exact))
      );
      if (idx >= 0) {
        mapping[field] = idx;
        used.add(idx);
      }
    }
  }

  // Fallback: infer from values in the first rows.
  const sample = rows.slice(0, 20);
  const share = (i: number, test: (v: string) => boolean) => {
    const vals = sample.map((r) => r[i] ?? "").filter((v) => v !== "");
    return vals.length ? vals.filter(test).length / vals.length : 0;
  };
  const free = () => headers.map((_, i) => i).filter((i) => !used.has(i));

  if (mapping.date === null) {
    const i = free().find((i) => share(i, (v) => parseDate(v, guessDateFormat([v])) !== null) >= 0.6);
    if (i !== undefined) {
      mapping.date = i;
      used.add(i);
    }
  }
  if (mapping.amount === null && mapping.debit === null && mapping.credit === null) {
    const i = free().find((i) => share(i, (v) => parseAmount(v) !== null) >= 0.6);
    if (i !== undefined) {
      mapping.amount = i;
      used.add(i);
    }
  }
  if (mapping.description === null) {
    let best = -1;
    let bestLen = 0;
    for (const i of free()) {
      const avg = sample.reduce((s, r) => s + (r[i]?.length ?? 0), 0) / Math.max(1, sample.length);
      if (share(i, (v) => parseAmount(v) === null) >= 0.6 && avg > bestLen) {
        best = i;
        bestLen = avg;
      }
    }
    if (best >= 0) mapping.description = best;
  }
  return mapping;
}

export function rowsToDrafts(rows: string[][], mapping: ColumnMapping, format: DateFormat): CsvRow[] {
  const cell = (r: string[], i: number | null) => (i === null ? "" : (r[i] ?? "").trim());
  const splitColumns = mapping.debit !== null || mapping.credit !== null;

  const parsed: (ParsedAmount | null)[] = rows.map((r) => {
    if (!splitColumns) return parseAmount(cell(r, mapping.amount));
    const out = parseAmount(cell(r, mapping.debit));
    if (out && out.value > 0) return { value: out.value, dir: "out" };
    const inn = parseAmount(cell(r, mapping.credit));
    if (inn && inn.value > 0) return { value: inn.value, dir: "in" };
    return null;
  });
  // Files that mark expenses with "-" leave income unsigned; files with no
  // direction markers at all are treated as expenses.
  const fileMarksOut = parsed.some((p) => p?.dir === "out");

  return rows.map((r, index) => {
    const p = parsed[index];
    const date = parseDate(cell(r, mapping.date), format);
    const description = cell(r, mapping.description).replace(/\s+/g, " ").slice(0, 120);
    const amount = p?.value ?? 0;
    const dir = p?.dir ?? (fileMarksOut ? "in" : "out");
    const error: CsvRow["error"] = !date
      ? "date"
      : !p || amount <= 0
        ? "amount"
        : !description
          ? "description"
          : null;
    return { index, date, description, amount, type: dir === "in" ? "income" : "expense", error };
  });
}

const dupKey = (date: string, amount: number, description: string) =>
  `${date}|${Math.round(amount)}|${description.toLowerCase().replace(/\s+/g, " ").trim()}`;

// Rows matching an already-saved transaction. Identical rows inside the file are
// NOT flagged — two identical coffees on one day are normal bank statement lines.
export function findDuplicates(
  rows: CsvRow[],
  existing: { date: string; amount: number | string; description: string }[]
): Set<number> {
  const seen = new Set(existing.map((e) => dupKey(e.date, Number(e.amount), e.description)));
  const dups = new Set<number>();
  for (const r of rows) {
    if (r.date && seen.has(dupKey(r.date, r.amount, r.description))) dups.add(r.index);
  }
  return dups;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/csv/map.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv/map.ts src/lib/csv/map.test.ts
git commit -m "feat: add CSV column mapping, amount/date parsing, and duplicate detection" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 18: Batch categorization and import endpoint

**Files:**
- Create: `src/lib/csv/batch.ts`, `src/lib/csv/batch.test.ts`
- Create: `src/app/api/transactions/import/route.ts`
- Modify: `src/lib/api.ts` (append `importTransactions`)

**Interfaces:**
- Consumes: `extractJson` (Task 2); `EXPENSE_CATEGORY_KEYS`, `ExpenseCategoryKey` (Task 1); `isValidYmd` (Task 1); `askLLM`; `clearAnomalyCache` (existing in `src/lib/api.ts`).
- Produces:
  - `CATEGORIZE_BATCH_SIZE = 50`, `chunk<T>(items: T[], size: number): T[][]`, `buildCategorizePrompt(descriptions: string[]): string`, `parseCategoryBatch(raw: string, expected: number): ExpenseCategoryKey[]`
  - `POST /api/transactions/import { rows: { date, description, amount, type }[] }` (1–500 rows) → 201 `{ inserted: number }`
  - `type ImportRow = { date: string; description: string; amount: number; type: "income" | "expense" }`, `importTransactions(rows: ImportRow[]): Promise<number>`

- [ ] **Step 1: Write the failing test**

`src/lib/csv/batch.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { chunk, parseCategoryBatch, buildCategorizePrompt } from "./batch";

describe("chunk", () => {
  it("splits into fixed-size batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 50)).toEqual([]);
    expect(chunk(Array.from({ length: 120 }, (_, i) => i), 50).map((b) => b.length)).toEqual([50, 50, 20]);
  });
});

describe("parseCategoryBatch", () => {
  it("accepts a valid array (case-insensitive)", () => {
    expect(parseCategoryBatch('["food", "Transport"]', 2)).toEqual(["food", "transport"]);
  });
  it("replaces unknown or income keys with shopping", () => {
    expect(parseCategoryBatch('["food","groceries","income"]', 3)).toEqual(["food", "shopping", "shopping"]);
  });
  it("falls back entirely on wrong length or non-JSON", () => {
    expect(parseCategoryBatch('["food"]', 2)).toEqual(["shopping", "shopping"]);
    expect(parseCategoryBatch("sorry, I can't", 2)).toEqual(["shopping", "shopping"]);
    expect(parseCategoryBatch('{"a":1}', 1)).toEqual(["shopping"]);
  });
});

describe("buildCategorizePrompt", () => {
  it("includes the count and JSON-encoded descriptions", () => {
    const p = buildCategorizePrompt(['Kopi "Tuku"', "Grab"]);
    expect(p).toContain("2 category keys");
    expect(p).toContain(JSON.stringify(['Kopi "Tuku"', "Grab"]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/csv/batch.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/csv/batch.ts`**

```ts
import { extractJson } from "@/lib/llm-json";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";

// 500 rows → at most 10 AI calls, well inside the free daily quota.
export const CATEGORIZE_BATCH_SIZE = 50;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function buildCategorizePrompt(descriptions: string[]): string {
  return `You categorize bank transaction descriptions (all are expenses).
Categories: food, transport, entertainment, shopping, bills, health, education, savings.
Return ONLY a JSON array of ${descriptions.length} category keys, in the same order as the input.

Input:
${JSON.stringify(descriptions)}`;
}

export function parseCategoryBatch(raw: string, expected: number): ExpenseCategoryKey[] {
  const fallback: ExpenseCategoryKey[] = Array(expected).fill("shopping");
  const parsed = extractJson(raw);
  if (!Array.isArray(parsed) || parsed.length !== expected) return fallback;
  return parsed.map((v) => {
    const k = typeof v === "string" ? v.toLowerCase().trim() : "";
    return (EXPENSE_CATEGORY_KEYS as string[]).includes(k) ? (k as ExpenseCategoryKey) : "shopping";
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/csv/batch.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/app/api/transactions/import/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { askLLM } from "@/lib/llm";
import { isValidYmd } from "@/lib/ymd";
import type { ExpenseCategoryKey } from "@/lib/draft";
import {
  CATEGORIZE_BATCH_SIZE,
  buildCategorizePrompt,
  chunk,
  parseCategoryBatch,
} from "@/lib/csv/batch";

const Row = z.object({
  date: z.string().refine(isValidYmd),
  description: z.string().trim().min(1).max(120),
  amount: z.number().positive().max(1_000_000_000_000),
  type: z.enum(["income", "expense"]),
});
const Body = z.object({ rows: z.array(Row).min(1).max(500) });

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid rows" }, { status: 400 });
  const { rows } = parsed.data;

  const expenses = rows.filter((r) => r.type === "expense");
  const batches = chunk(expenses, CATEGORIZE_BATCH_SIZE);
  const results = await Promise.all(
    batches.map(async (batch): Promise<ExpenseCategoryKey[]> => {
      try {
        const raw = await askLLM(buildCategorizePrompt(batch.map((r) => r.description)), {
          maxOutputTokens: 1024,
        });
        return parseCategoryBatch(raw, batch.length);
      } catch {
        return batch.map(() => "shopping");
      }
    })
  );
  const categories = results.flat();

  let e = 0;
  const inserts = rows.map((r) => ({
    user_id: user.id,
    amount: r.amount,
    type: r.type,
    description: r.description,
    date: r.date,
    category_key: r.type === "income" ? "income" : categories[e++],
  }));

  const { error, count } = await supabase.from("transactions").insert(inserts, { count: "exact" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: count ?? inserts.length }, { status: 201 });
}
```

- [ ] **Step 6: Append the client helper to `src/lib/api.ts`**

```ts
export type ImportRow = {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
};

// Bank CSV import: bulk insert; the server categorizes expenses in batches.
export async function importTransactions(rows: ImportRow[]): Promise<number> {
  const res = await fetch("/api/transactions/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error("import_failed");
  const json = await res.json();
  clearAnomalyCache();
  return json.inserted;
}
```

- [ ] **Step 7: Verify**

Run: `npx vitest run src/lib/csv && npm run typecheck && npm run lint`
Expected: all exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/lib/csv/batch.ts src/lib/csv/batch.test.ts src/app/api/transactions/import/route.ts src/lib/api.ts
git commit -m "feat: add bank CSV import endpoint with batched AI categorization" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 19: CSV import modal on the Transactions page

**Files:**
- Create: `src/components/transactions/csv-import-modal.tsx`
- Modify: `src/app/(app)/transactions/page.tsx`
- Modify: `messages/en.json`, `messages/id.json` (new `csvImport` namespace)

**Interfaces:**
- Consumes: `parseCsv` (Task 16); `guessMapping`, `guessDateFormat`, `rowsToDrafts`, `findDuplicates`, `ColumnMapping`, `DateFormat` (Task 17); `importTransactions` (Task 18); `formatCurrency`, `formatDateShort`, `useLocale`, `Button`, `cn` (existing).
- Produces: `<CsvImportModal open onClose existing onImported />` where `existing: { date: string; amount: number; description: string }[]` and `onImported: (count: number) => void`.

- [ ] **Step 1: Add i18n keys**

en, new top-level namespace after `"planning"`:
```json
"csvImport": {
  "button": "Import",
  "title": "Import bank CSV",
  "subtitle": "Upload a CSV exported from your bank. AI will categorize the rows.",
  "choose": "Choose CSV file",
  "hint": "Max 1 MB. The first row must be column headers.",
  "chooseAnother": "Choose another file",
  "tooLarge": "File is larger than 1 MB.",
  "empty": "No data rows found in this file.",
  "truncated": "Only the first 500 rows are shown.",
  "fieldDate": "Date",
  "fieldDescription": "Description",
  "fieldAmount": "Amount",
  "fieldDebit": "Debit (money out)",
  "fieldCredit": "Credit (money in)",
  "dateFormat": "Date format",
  "none": "—",
  "errDate": "Invalid date",
  "errAmount": "Invalid amount",
  "errDescription": "No description",
  "duplicate": "Duplicate?",
  "selected": "{count} selected",
  "importN": "Import {count}",
  "importing": "Importing…",
  "importError": "Import failed. Try again.",
  "imported": "{count, plural, one {# transaction imported} other {# transactions imported}}"
},
```
id:
```json
"csvImport": {
  "button": "Impor",
  "title": "Impor CSV bank",
  "subtitle": "Unggah CSV hasil ekspor dari bank kamu. AI akan mengkategorikan setiap baris.",
  "choose": "Pilih file CSV",
  "hint": "Maks 1 MB. Baris pertama harus berisi judul kolom.",
  "chooseAnother": "Pilih file lain",
  "tooLarge": "Ukuran file lebih dari 1 MB.",
  "empty": "Tidak ada baris data di file ini.",
  "truncated": "Hanya 500 baris pertama yang ditampilkan.",
  "fieldDate": "Tanggal",
  "fieldDescription": "Deskripsi",
  "fieldAmount": "Jumlah",
  "fieldDebit": "Debit (uang keluar)",
  "fieldCredit": "Kredit (uang masuk)",
  "dateFormat": "Format tanggal",
  "none": "—",
  "errDate": "Tanggal tidak valid",
  "errAmount": "Jumlah tidak valid",
  "errDescription": "Tanpa deskripsi",
  "duplicate": "Duplikat?",
  "selected": "{count} dipilih",
  "importN": "Impor {count}",
  "importing": "Mengimpor…",
  "importError": "Impor gagal. Coba lagi.",
  "imported": "{count} transaksi diimpor"
},
```

- [ ] **Step 2: Create `src/components/transactions/csv-import-modal.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { importTransactions } from "@/lib/api";
import { parseCsv } from "@/lib/csv/parse";
import {
  findDuplicates,
  guessDateFormat,
  guessMapping,
  rowsToDrafts,
  type ColumnMapping,
  type DateFormat,
} from "@/lib/csv/map";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 500;

const FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "date", label: "fieldDate" },
  { key: "description", label: "fieldDescription" },
  { key: "amount", label: "fieldAmount" },
  { key: "debit", label: "fieldDebit" },
  { key: "credit", label: "fieldCredit" },
];

const selectClass =
  "h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function CsvImportModal({
  open,
  onClose,
  existing,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  existing: { date: string; amount: number; description: string }[];
  onImported: (count: number) => void;
}) {
  const t = useTranslations("csvImport");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [format, setFormat] = useState<DateFormat>("dmy");
  const [truncated, setTruncated] = useState(false);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [fileError, setFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function reset() {
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setTruncated(false);
    setExcluded(new Set());
    setFileError(null);
    setImportError(null);
  }

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const drafts = useMemo(
    () => (mapping ? rowsToDrafts(rows, mapping, format) : []),
    [rows, mapping, format]
  );
  const duplicates = useMemo(() => findDuplicates(drafts, existing), [drafts, existing]);

  // Invalid rows and likely duplicates start unchecked whenever parsing changes.
  useEffect(() => {
    setExcluded(new Set(drafts.filter((d) => d.error || duplicates.has(d.index)).map((d) => d.index)));
  }, [drafts, duplicates]);

  const selected = drafts.filter((d) => !d.error && !excluded.has(d.index));

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_BYTES) {
      setFileError(t("tooLarge"));
      return;
    }
    const all = parseCsv(await file.text());
    if (all.length < 2) {
      setFileError(t("empty"));
      return;
    }
    const [head, ...body] = all;
    const data = body.slice(0, MAX_ROWS);
    const guessed = guessMapping(head, data);
    setTruncated(body.length > MAX_ROWS);
    setHeaders(head);
    setRows(data);
    setMapping(guessed);
    setFormat(guessDateFormat(guessed.date === null ? [] : data.map((r) => r[guessed.date!] ?? "")));
  }

  function toggleRow(index: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function doImport() {
    if (selected.length === 0 || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const count = await importTransactions(
        selected.map((d) => ({
          date: d.date!,
          description: d.description,
          amount: d.amount,
          type: d.type,
        }))
      );
      onImported(count);
      onClose();
    } catch {
      setImportError(t("importError"));
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-zinc-900/50 animate-backdrop-in" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-5">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto flex max-h-[calc(100dvh-2.5rem)] w-full max-w-[760px] animate-modal-in flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[var(--shadow-lg)] dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between px-6 pb-2 pt-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
              <p className="mt-1 text-[13px] text-zinc-400">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tCommon("cancel")}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {!mapping ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
                <Upload className="mb-2 h-6 w-6 text-zinc-400" />
                <span className="text-sm font-medium">{t("choose")}</span>
                <span className="mt-1 text-xs text-zinc-400">{t("hint")}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {FIELDS.map((f) => (
                    <label key={f.key} className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                      {t(f.label)}
                      <select
                        value={mapping[f.key] ?? ""}
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            [f.key]: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className={cn(selectClass, "mt-1 normal-case tracking-normal")}
                      >
                        <option value="">{t("none")}</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `#${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    {t("dateFormat")}
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as DateFormat)}
                      className={cn(selectClass, "mt-1 normal-case tracking-normal")}
                    >
                      <option value="dmy">DD/MM/YYYY</option>
                      <option value="mdy">MM/DD/YYYY</option>
                      <option value="ymd">YYYY-MM-DD</option>
                    </select>
                  </label>
                </div>

                {truncated && <p className="text-xs text-amber-600 dark:text-amber-400">{t("truncated")}</p>}

                <div className="max-h-[45vh] overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {drafts.map((d) => {
                        const checked = !d.error && !excluded.has(d.index);
                        return (
                          <tr key={d.index} className={cn(d.error && "opacity-50")}>
                            <td className="w-8 px-2 py-1.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!!d.error}
                                onChange={() => toggleRow(d.index)}
                                className="h-4 w-4 accent-emerald-600"
                              />
                            </td>
                            <td className="whitespace-nowrap px-2 py-1.5 font-mono text-zinc-500">
                              {d.date ? formatDateShort(d.date, locale) : "—"}
                            </td>
                            <td className="max-w-[240px] truncate px-2 py-1.5">{d.description || "—"}</td>
                            <td
                              className={cn(
                                "whitespace-nowrap px-2 py-1.5 text-right font-mono",
                                d.type === "income"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              )}
                            >
                              {d.type === "income" ? "+" : "-"}
                              {formatCurrency(d.amount, locale)}
                            </td>
                            <td className="whitespace-nowrap px-2 py-1.5 text-right">
                              {d.error ? (
                                <span className="text-rose-600 dark:text-rose-400">
                                  {t(d.error === "date" ? "errDate" : d.error === "amount" ? "errAmount" : "errDescription")}
                                </span>
                              ) : duplicates.has(d.index) ? (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                  {t("duplicate")}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {fileError && <p className="text-sm text-rose-600 dark:text-rose-400">{fileError}</p>}
            {importError && <p className="text-sm text-rose-600 dark:text-rose-400">{importError}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              {mapping ? t("selected", { count: selected.length }) : ""}
            </span>
            <div className="flex gap-2.5">
              {mapping && (
                <Button type="button" variant="secondary" size="sm" onClick={reset}>
                  {t("chooseAnother")}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={!mapping || selected.length === 0 || importing}
                onClick={doImport}
              >
                {importing ? t("importing") : t("importN", { count: selected.length })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire it into the Transactions page**

In `src/app/(app)/transactions/page.tsx`:
- add `Upload` to the lucide import; add `import { CsvImportModal } from "@/components/transactions/csv-import-modal";`
- add translator and state:
```ts
const tCsv = useTranslations("csvImport");
const [csvOpen, setCsvOpen] = useState(false);
const [notice, setNotice] = useState<string | null>(null);
```
- replace the `actions={...}` Button with:
```tsx
actions={
  <>
    <Button variant="secondary" size="sm" onClick={() => setCsvOpen(true)}>
      <Upload className="h-3.5 w-3.5" />
      {tCsv("button")}
    </Button>
    <Button size="sm" onClick={() => setModalOpen(true)}>
      <Plus className="h-3.5 w-3.5" />
      {t("addNew")}
    </Button>
  </>
}
```
- directly after `</PageHeader>`'s self-closing tag (before the sticky filter bar) add:
```tsx
{notice && (
  <div
    role="status"
    className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
  >
    {notice}
  </div>
)}
```
- next to `<TransactionModal … />` add:
```tsx
<CsvImportModal
  open={csvOpen}
  onClose={() => setCsvOpen(false)}
  existing={items}
  onImported={(count) => {
    setNotice(tCsv("imported", { count }));
    setTimeout(() => setNotice(null), 4000);
    loadTransactions();
  }}
/>
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all exit 0.

Create `<scratchpad>/bank-sample.csv`:
```
Tanggal;Keterangan;Mutasi
20/09/2026;KOPI KENANGAN SENAYAN;35.000,00 DB
21/09/2026;GRAB* RIDE;28.500,00 DB
22/09/2026;TRSF E-BANKING CR DARI BUDI;250.000,00 CR
07/09/2026;Internet rumah;350.000,00 DB
```
Live: `npm run dev`, demo login, Transactions → **Import** → choose the file. Expected: mapping Date=Tanggal, Description=Keterangan, Amount=Mutasi, format DD/MM/YYYY; 4 rows; the Internet rumah row (matches the seeded 2026-09-07 row) shows "Duplicate?" and is unchecked; button reads "Import 3". Import → notice "3 transactions imported"; the rows appear with AI categories (food, transport, income). Delete the 3 imported rows afterwards to keep the demo clean. Also try a `.csv` with only a header row → "No data rows found in this file." Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/transactions/csv-import-modal.tsx "src/app/(app)/transactions/page.tsx" messages/en.json messages/id.json
git commit -m "feat: import bank CSV files on the transactions page" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

---

## Phase 7 — Chat tools, verification, docs

### Task 20: Chat advisor budget and goal tools

**Files:**
- Modify: `src/lib/ai/tools.ts`
- Modify: `src/lib/ai/prompts.ts`
- Modify: `src/app/(app)/chat/page.tsx` (`TOOL_LABEL_KEYS`)
- Modify: `messages/en.json`, `messages/id.json` (`chat` keys)

**Interfaces:**
- Consumes: `loadBudgetsWithSpent` (Task 7), `loadGoals` (Task 11), `todayYmd` (Task 2), `currentMonth` (existing import in tools.ts).
- Produces: chat tools `getBudgets({ month? })` → `{ month, budgets }` and `getGoals()` → `{ goals }` (contributions replaced by `contributionCount`).

- [ ] **Step 1: Add the tools**

In `src/lib/ai/tools.ts`:
- add `todayYmd` to the existing import from `./dates`
- add imports:
```ts
import { loadBudgetsWithSpent } from "@/lib/planning/budgets-server";
import { loadGoals } from "@/lib/planning/goals-server";
```
- add inside the object returned by `buildChatTools`, after `compareMonths`:
```ts
    getBudgets: tool({
      description:
        "Get the user's monthly category budgets with amount spent, percent used, remaining, and status (ok, warn at 80%+, over above 100%). Use for any question about budgets, spending limits, or whether a category is overspent.",
      inputSchema: z.object({
        month: z
          .string()
          .optional()
          .describe("Month in YYYY-MM format. Defaults to the current month."),
      }),
      execute: async ({ month }) => {
        const target = month || currentMonth();
        try {
          return { month: target, budgets: await loadBudgetsWithSpent(supabase, userId, target) };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
    }),

    getGoals: tool({
      description:
        "Get the user's savings goals with amount saved, target, percent, target date, status, and the monthly amount needed to reach each goal on time. Use for questions about savings goals or when a goal will be reached.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const goals = await loadGoals(supabase, userId, todayYmd());
          return {
            goals: goals.map(({ contributions, ...g }) => ({
              ...g,
              contributionCount: contributions.length,
            })),
          };
        } catch (e) {
          return { error: (e as Error).message };
        }
      },
    }),
```

- [ ] **Step 2: Prompt line and UI labels**

`src/lib/ai/prompts.ts`: add this line inside the template string, right after the `When you break spending down by category, …` line:
```
For questions about budgets or spending limits call getBudgets; for savings goals call getGoals.
```

`src/app/(app)/chat/page.tsx`: add to `TOOL_LABEL_KEYS`:
```ts
  getBudgets: "toolGetBudgets",
  getGoals: "toolGetGoals",
```

Messages, inside `"chat"` next to `toolCompareMonths`:
- en: `"toolGetBudgets": "budget data", "toolGetGoals": "savings goals",`
- id: `"toolGetBudgets": "data anggaran", "toolGetGoals": "target tabungan",`

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all exit 0.

Live: `npm run dev`, demo login, Chat advisor:
- "Am I over budget this month?" → a "budget data" tool chip, and an answer naming Entertainment as over and Food near its limit.
- "Kapan target laptop saya tercapai?" (with language ID) → "target tabungan" chip; answer mentions ~Rp 1.375.000/bulan until December 2026.
Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/tools.ts src/lib/ai/prompts.ts "src/app/(app)/chat/page.tsx" messages/en.json messages/id.json
git commit -m "feat: let the chat advisor read budgets and savings goals" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

### Task 21: End-to-end browser verification and handoff docs

**Files:**
- Modify: `handoff.md`, `progress.md`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Full quality gate**

Run: `npm test && npm run typecheck && npm run lint && npm run build`
Expected: all exit 0; record the test count (31 before this plan + all new tests).

- [ ] **Step 2: i18n parity check**

Run:
```bash
node -e "const a=require('./messages/en.json'),b=require('./messages/id.json');const k=(o,p='')=>Object.entries(o).flatMap(([x,v])=>typeof v==='object'?k(v,p+x+'.'):[p+x]);const A=new Set(k(a)),B=new Set(k(b));const miss=[...A].filter(x=>!B.has(x)).concat([...B].filter(x=>!A.has(x)));console.log(miss.length?miss:'OK')"
```
Expected: `OK`.

- [ ] **Step 3: Browser pass (Claude in Chrome)**

Start `npm run dev`. In Chrome (desktop width, then resize to 375×812), log in via **Try the demo** and check:
1. Dashboard: Budgets card + Goal card render; no layout break at 375px.
2. Transactions → Add: quick-add text fills the form; camera button present; Import opens the CSV modal.
3. Planning: all three tabs render with seeded data; tab switch updates `?tab=`; at 375px the tab bar and rows don't overflow horizontally.
4. Settings: Planning section link works (the mobile route into Planning).
5. Switch language to EN/ID: every new string translates (no raw keys like `planning.tabGoals`).
6. Reports → Export downloads a PDF (leftover check from the previous session).
Note anything broken, fix it (with a test when it's logic), re-run Step 1.

- [ ] **Step 4: Update `handoff.md` and `progress.md`**

Rewrite both files in their existing structure to describe this session: the 6 features + chat tools, the commit list (`git log --oneline` since `9405889`), the SQL files the user ran, the key decisions (draft-then-confirm AI inputs, lazy recurring materialization + non-partial unique index, manual goal top-ups, CSV auto-guess + editable mapping, batch-of-50 categorization), test count, and what still needs a human (production check after the user pushes; mobile receipt camera on a real phone).

- [ ] **Step 5: Commit**

```bash
git add handoff.md progress.md
git commit -m "docs: update handoff and progress for planning and smart input" -m "Claude-Session: https://claude.ai/code/session_013HqVRTkcqXQDPeXVoyhqbK"
```

- [ ] **Step 6: Hand back to the user**

Tell the user: all commits are on local `main`; they need to `git push` (Vercel deploys automatically); no new environment variables are needed; then ask them to spot-check production with the demo account.
