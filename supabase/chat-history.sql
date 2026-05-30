-- Smart Finn Track — Chat history (v1.5)
-- Run this in the Supabase SQL Editor. Additive only — does not touch existing tables.

-- 1. chat_sessions
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. chat_messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  -- Structured AI SDK message parts (text + tool outputs, e.g. category-breakdown
  -- chart data) so charts re-render when an old conversation is reopened.
  parts jsonb,
  created_at timestamptz not null default now()
);

-- Backfill column for installs created before v1.5 (no-op on fresh installs).
alter table public.chat_messages add column if not exists parts jsonb;

-- Indexes
create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index if not exists idx_chat_sessions_updated_at on public.chat_sessions(updated_at desc);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);

-- RLS
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Users access own sessions" on public.chat_sessions;
create policy "Users access own sessions"
  on public.chat_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users access own messages" on public.chat_messages;
create policy "Users access own messages"
  on public.chat_messages for all
  using (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
  )
  with check (
    session_id in (select id from public.chat_sessions where user_id = auth.uid())
  );
