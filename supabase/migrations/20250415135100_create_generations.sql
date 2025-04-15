-- Migration: Create `generations` table
-- Created at: 2025-04-15 13:51:00 UTC
-- Purpose: Stores metadata of AI-generated content
-- Author: AI Assistant
-- Affected table: generations

-- 1. Create table `generations`
create table if not exists public.generations (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  model varchar not null,
  generated_count integer not null,
  accepted_unedited_count integer,
  accepted_edited_count integer,
  source_text_hash varchar not null,
  source_text_length integer not null check (source_text_length between 1000 and 10000),
  generation_duration integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.generations enable row level security;

-- 3. RLS Policies
create policy "select_own_generations" on public.generations
  for select using (user_id = auth.uid());

create policy "insert_own_generations" on public.generations
  for insert with check (user_id = auth.uid());

create policy "update_own_generations" on public.generations
  for update using (user_id = auth.uid());

create policy "delete_own_generations" on public.generations
  for delete using (user_id = auth.uid());

-- 4. Index
create index if not exists idx_generations_user_id on public.generations(user_id);

-- 5. Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger generations_updated_at_trigger
before update on public.generations
for each row
execute procedure public.set_updated_at();