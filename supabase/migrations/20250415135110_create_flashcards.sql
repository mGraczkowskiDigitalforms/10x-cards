-- Migration: Create `flashcards` table
-- Created at: 2025-04-15 13:51:10 UTC
-- Purpose: Stores flashcards generated manually or via AI
-- Author: AI Assistant
-- Affected table: flashcards

-- 1. Create table `flashcards`
create table if not exists public.flashcards (
  id bigserial primary key,
  front varchar(200) not null,
  back varchar(500) not null,
  source varchar not null check (source in ('ai-full', 'ai-edited', 'manual')),
  generation_id bigint,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_generation foreign key (generation_id) references generations(id) on delete set null
);

-- 2. Enable Row Level Security
alter table public.flashcards enable row level security;

-- 3. RLS Policies
create policy "select_own_flashcards" on public.flashcards
  for select using (user_id = auth.uid());

create policy "insert_own_flashcards" on public.flashcards
  for insert with check (user_id = auth.uid());

create policy "update_own_flashcards" on public.flashcards
  for update using (user_id = auth.uid());

create policy "delete_own_flashcards" on public.flashcards
  for delete using (user_id = auth.uid());

-- 4. Indexes
create index if not exists idx_flashcards_user_id on public.flashcards(user_id);
create index if not exists idx_flashcards_generation_id on public.flashcards(generation_id);

-- 5. Trigger for updated_at
create trigger flashcards_updated_at_trigger
before update on public.flashcards
for each row
execute procedure public.set_updated_at();