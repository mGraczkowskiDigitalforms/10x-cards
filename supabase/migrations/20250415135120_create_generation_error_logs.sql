-- Migration: Create `generation_error_logs` table
-- Created at: 2025-04-15 13:51:20 UTC
-- Purpose: Stores error logs related to AI generation failures
-- Author: AI Assistant
-- Affected table: generation_error_logs

-- 1. Create table
create table if not exists public.generation_error_logs (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.generation_error_logs enable row level security;

-- 3. RLS Policies
create policy "select_own_generation_errors" on public.generation_error_logs
  for select using (user_id = auth.uid());

create policy "insert_own_generation_errors" on public.generation_error_logs
  for insert with check (user_id = auth.uid());

-- 4. Index
create index if not exists idx_generation_error_logs_user_id on public.generation_error_logs(user_id);
