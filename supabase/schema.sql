-- Smart Finn Track — Database Schema
-- Run this in the Supabase SQL Editor to set up the database.

-- 1. user_profiles
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'id' check (language in ('id', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users access own profile"
  on public.user_profiles for all
  using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, language)
  values (new.id, 'id');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  description text not null,
  category_key text not null default 'shopping',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users access own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);

create index idx_transactions_user_date on public.transactions(user_id, date desc);

-- 3. ai_insights
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('anomaly', 'monthly_report')),
  content text not null,
  language text not null default 'id',
  month text, -- 'YYYY-MM'
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.ai_insights enable row level security;

create policy "Users access own insights"
  on public.ai_insights for all
  using (auth.uid() = user_id);
