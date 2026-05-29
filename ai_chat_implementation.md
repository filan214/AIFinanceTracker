# Smart Finn Track — AI Chat Advisor Implementation Prompt
# Vercel AI SDK + OpenRouter + Supabase Tool Calls

> Paste everything below into a fresh Claude conversation.

---

## Context

I'm building **Smart Finn Track** — a personal finance web app using Next.js 15 App Router, TypeScript, Tailwind CSS, and Supabase (PostgreSQL).

I need to implement the **AI Chat Advisor** feature from scratch using:
- **Vercel AI SDK** (`ai` package) for streaming and tool calls
- **OpenRouter** as the AI provider (OpenAI-compatible, access to multiple models)
- **Supabase** tool calls so the AI fetches real user data on demand
- **`useChat` hook** from `@ai-sdk/react` for the frontend

This replaces the old approach of sending all transaction data upfront in the prompt.

---

## Database schema (Supabase)

```sql
-- transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  amount numeric NOT NULL,
  type text NOT NULL, -- 'income' | 'expense'
  description text,
  category_key text, -- 'food' | 'transport' | 'entertainment' | 'shopping' | 'bills' | 'health' | 'education' | 'savings' | 'income'
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- user_profiles table
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  language text DEFAULT 'id', -- 'id' | 'en'
  updated_at timestamptz DEFAULT now()
);

-- RLS: users can only access their own data
```

---

## What to build

### 1. Install dependencies

```bash
pnpm add ai @ai-sdk/openai @ai-sdk/react zod
```

---

### 2. Environment variable

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxx
```

Get from: openrouter.ai → Keys → Create key (free, no credit card needed for free models)

---

### 3. API route — `app/api/ai/chat/route.ts`

Build a **streaming POST route** using Vercel AI SDK with the following requirements:

**Provider setup:**
```ts
import { createOpenAI } from '@ai-sdk/openai'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
})
```

**Model:** `google/gemini-2.5-flash` (free on OpenRouter, change anytime without touching other code)

**Auth:** Extract authenticated user from Supabase session on every request. Reject unauthenticated requests with 401.

**Language:** Read `user_profiles.language` from Supabase for the current user.

**System prompt:**
```
You are Smart Finn Track AI, a personal finance advisor.
You have access to tools that fetch the user's real transaction data from the database.
ALWAYS use tools to get accurate, up-to-date data before answering.
Never guess, estimate, or make up numbers.
User's language: {language}
Respond in {language === 'en' ? 'English' : 'Bahasa Indonesia'}.
Tone: informal, friendly, specific, actionable.
Format currency as: Rp X.XXX.XXX (Indonesian Rupiah).
When comparing periods, always show the percentage change.
```

**Tool definitions (use Zod schemas):**

Define all 6 tools below. Each tool must:
1. Have a clear `description` that helps the AI decide when to use it
2. Use Zod for parameter validation
3. Execute a Supabase query using the authenticated `user_id`
4. Return structured data

```ts
tools: {

  // Tool 1: Get raw transactions
  getTransactions: {
    description: 'Fetch user transactions. Use when user asks about specific transactions, wants to see their spending list, or needs raw data.',
    parameters: z.object({
      period: z.enum(['this_month', 'last_month', 'last_3_months', 'last_6_months', 'this_year'])
        .describe('Time period to fetch'),
      category: z.string().optional()
        .describe('Filter by category key (food, transport, etc). Omit for all categories.'),
      type: z.enum(['income', 'expense']).optional()
        .describe('Filter by transaction type. Omit for both.'),
      limit: z.number().min(1).max(50).default(10)
        .describe('Number of transactions to return'),
    }),
    execute: async ({ period, category, type, limit }) => {
      // Build date range from period
      // Query Supabase transactions table
      // Filter by user_id, date range, optional category, optional type
      // Order by date DESC
      // Return array of { id, amount, type, description, category_key, date }
    }
  },

  // Tool 2: Get monthly summary
  getMonthlySummary: {
    description: 'Get total income, total expense, and net balance for a specific month. Use when user asks about monthly totals or overall financial summary.',
    parameters: z.object({
      month: z.string()
        .describe('Month in YYYY-MM format. Use current month if not specified.'),
    }),
    execute: async ({ month }) => {
      // Query: SELECT type, SUM(amount) FROM transactions
      // WHERE user_id = X AND date >= first_day AND date <= last_day
      // GROUP BY type
      // Return: { month, totalIncome, totalExpense, balance, transactionCount }
    }
  },

  // Tool 3: Get category breakdown
  getCategoryBreakdown: {
    description: 'Get spending broken down by category. Use when user asks where their money went, which category is most expensive, or wants a spending breakdown.',
    parameters: z.object({
      month: z.string().optional()
        .describe('Month in YYYY-MM format. Defaults to current month.'),
      period: z.enum(['this_month', 'last_month', 'last_3_months']).optional()
        .describe('Alternative to month — use a relative period.'),
    }),
    execute: async ({ month, period }) => {
      // Query: SELECT category_key, SUM(amount) as total, COUNT(*) as count
      // FROM transactions WHERE user_id = X AND type = 'expense' AND [date filter]
      // GROUP BY category_key ORDER BY total DESC
      // Return: array of { category_key, total, count, percentage }
    }
  },

  // Tool 4: Get spending trend
  getSpendingTrend: {
    description: 'Get monthly spending trend over multiple months. Use when user asks about trends, whether spending is increasing/decreasing, or wants historical comparison.',
    parameters: z.object({
      months: z.number().min(2).max(12).default(3)
        .describe('Number of months to look back'),
    }),
    execute: async ({ months }) => {
      // For each of the last N months:
      // Query total income and expense per month
      // Return: array of { month, totalIncome, totalExpense, balance }
      // Ordered oldest to newest
    }
  },

  // Tool 5: Get top expenses
  getTopExpenses: {
    description: 'Get the largest individual expenses. Use when user asks what their biggest expenses were, or wants to know where most money was spent.',
    parameters: z.object({
      limit: z.number().min(1).max(20).default(5)
        .describe('Number of top expenses to return'),
      month: z.string().optional()
        .describe('Month in YYYY-MM format. Defaults to current month.'),
    }),
    execute: async ({ limit, month }) => {
      // Query transactions WHERE type = 'expense' AND [month filter]
      // ORDER BY amount DESC LIMIT N
      // Return: array of { amount, description, category_key, date }
    }
  },

  // Tool 6: Get balance comparison
  getBalance: {
    description: 'Get current balance and compare with previous month. Use when user asks about their financial health, savings rate, or how this month compares to last month.',
    parameters: z.object({
      month: z.string().optional()
        .describe('Month to check in YYYY-MM format. Defaults to current month.'),
    }),
    execute: async ({ month }) => {
      // Get summary for requested month AND previous month
      // Calculate: percentageChange, savingsRate
      // Return: { currentMonth, previousMonth, change, changePercent, savingsRate }
    }
  },

}
```

**Streaming config:**
```ts
return streamText({
  model: openrouter('google/gemini-2.5-flash'),
  system: systemPrompt,
  messages,          // from request body
  tools,
  maxSteps: 5,       // allow multi-step tool calls
  onFinish: ({ usage }) => {
    console.log('Tokens used:', usage)
  }
}).toDataStreamResponse()
```

**Full route structure:**
```ts
export async function POST(req: Request) {
  // 1. Auth check — get user from Supabase session
  // 2. Read user language from user_profiles
  // 3. Parse messages from request body
  // 4. Build system prompt with language
  // 5. Define all 6 tools with user_id in closure
  // 6. Call streamText and return streaming response
}
```

---

### 4. Frontend — Chat component

Build a full chat UI component using `useChat` from `@ai-sdk/react`.

**Design system (match existing Dashboard.html):**
- CSS variables: `--surface`, `--bg-soft`, `--ink`, `--ink-3`, `--accent`, `--border`
- Font: Inter (body), JetBrains Mono (amounts)
- Animations: `fadeIn`, `slideUp` keyframes already defined globally

**Layout:**
```
┌──────────────────────────────────────────┐
│  Smart Finn Track AI         [Clear]     │  ← sticky header
├──────────────────────────────────────────┤
│                                          │
│  [Welcome message + suggested prompts]   │  ← empty state
│                                          │
│  ┌────────────────────────────────┐      │
│  │ 🤖 AI bubble (left aligned)   │      │  ← messages area
│  └────────────────────────────────┘      │    overflow-y: scroll
│                                          │
│         ┌──────────────────────────────┐ │
│         │ User bubble (right aligned) │ │
│         └──────────────────────────────┘ │
│                                          │
│  [Tool call indicator when fetching DB]  │
│                                          │
├──────────────────────────────────────────┤
│  [ Ask about your finances...  ] [Send]  │  ← sticky input
└──────────────────────────────────────────┘
```

**`useChat` setup:**
```ts
const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
  api: '/api/ai/chat',
  initialMessages: [],
  onError: (error) => console.error('Chat error:', error),
})
```

**Message rendering:**
- Role `user`: right-aligned bubble, `background: var(--ink)`, `color: #fff`, `border-radius: 12px 12px 0 12px`
- Role `assistant`: left-aligned bubble, `background: var(--bg-soft)`, `color: var(--ink)`, `border-radius: 12px 12px 12px 0`
- Small label above AI bubble: "Smart Finn Track AI" — `font-size: 11px; color: var(--ink-5)`
- Animate each message in with `fadeIn` on mount

**Tool call indicator** (show while AI is fetching data):
```tsx
// When a message has toolInvocations with state 'call'
{message.toolInvocations?.map(tool => (
  tool.state === 'call' && (
    <div class="tool-indicator">
      <span class="pulse-dot" />
      Fetching {toolLabel[tool.toolName]}...
    </div>
  )
))}
```

Tool labels:
```ts
const toolLabel: Record<string, string> = {
  getTransactions: 'your transactions',
  getMonthlySummary: 'monthly summary',
  getCategoryBreakdown: 'spending breakdown',
  getSpendingTrend: 'spending trend',
  getTopExpenses: 'top expenses',
  getBalance: 'balance data',
}
```

**Suggested prompts (empty state):**

Bahasa Indonesia:
```
"Berapa pengeluaran saya bulan ini?"
"Kategori apa yang paling boros?"
"Bandingkan bulan ini dengan bulan lalu"
"Apa 5 pengeluaran terbesar saya?"
```

English:
```
"How much did I spend this month?"
"Which category am I spending most on?"
"Compare this month to last month"
"What are my top 5 expenses?"
```

Show as clickable cards in a 2x2 grid. On click: set input + submit.

**AI typing indicator:**
```tsx
{isLoading && (
  <div className="typing-indicator">
    <span /><span /><span />  {/* 3 dots with staggered pulse animation */}
  </div>
)}
```

**Clear chat button:**
```tsx
<button onClick={() => setMessages([])}>
  {lang === 'id' ? 'Hapus percakapan' : 'Clear chat'}
</button>
```

**Input bar:**
- `onKeyDown`: submit on Enter (not Shift+Enter)
- Disable input and button while `isLoading`
- Auto-focus input on page load
- Send button: `background: var(--accent)` when active, dimmed when loading

---

### 5. Bilingual support

The chat component receives `lang: 'id' | 'en'` as a prop. Use it for:
- Placeholder text
- Suggested prompts (show ID or EN set based on lang)
- Clear button label
- Tool indicator text ("Mengambil data..." vs "Fetching...")
- Empty state copy

The AI itself responds in the correct language via the system prompt — no extra work needed on the frontend.

---

### 6. Error handling

- If API returns non-ok: show error message in chat as a system message styled differently (red border)
- If tool call fails (Supabase error): AI should gracefully handle and tell user data couldn't be fetched
- Network timeout: show retry option

---

### 7. File structure

```
app/
  api/
    ai/
      chat/
        route.ts          ← streaming API route with tools
  (app)/
    chat/
      page.tsx            ← chat page (layout wrapper)
      components/
        ChatWindow.tsx    ← main chat component (useChat)
        MessageBubble.tsx ← individual message with tool indicators
        SuggestedPrompts.tsx ← empty state suggested prompts
        TypingIndicator.tsx  ← loading dots
lib/
  supabase/
    server.ts             ← server-side Supabase client (for API route)
    client.ts             ← client-side Supabase client
  ai/
    tools.ts              ← all 6 tool definitions (importable)
    prompts.ts            ← system prompt builder
```

---

### 8. Deliverable order

Please implement in this order:
1. `lib/ai/tools.ts` — all 6 tool definitions with Supabase queries
2. `lib/ai/prompts.ts` — system prompt builder function
3. `app/api/ai/chat/route.ts` — full streaming route
4. `app/(app)/chat/components/MessageBubble.tsx`
5. `app/(app)/chat/components/SuggestedPrompts.tsx`
6. `app/(app)/chat/components/TypingIndicator.tsx`
7. `app/(app)/chat/components/ChatWindow.tsx` — main component using useChat
8. `app/(app)/chat/page.tsx` — page wrapper

Write complete, production-ready TypeScript for each file.
Use proper error handling throughout.
All Supabase queries must be server-side only (in the API route, never in the browser).
