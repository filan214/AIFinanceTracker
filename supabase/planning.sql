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
