-- Migration: Drop all RLS policies for flashcards, generations, and generation_error_logs
-- Created at: 2025-04-15 17:00:00 UTC
-- Purpose: Removes existing Row-Level Security policies and disables RLS for all listed tables
-- Author: AI Assistant
-- Affected tables: flashcards, generations, generation_error_logs

-- ========================
-- FLASHCARDS POLICIES
-- ========================
drop policy if exists select_own_flashcards on public.flashcards;
drop policy if exists insert_own_flashcards on public.flashcards;
drop policy if exists update_own_flashcards on public.flashcards;
drop policy if exists delete_own_flashcards on public.flashcards;

alter table public.flashcards disable row level security;

-- ========================
-- GENERATIONS POLICIES
-- ========================
drop policy if exists select_own_generations on public.generations;
drop policy if exists insert_own_generations on public.generations;
drop policy if exists update_own_generations on public.generations;
drop policy if exists delete_own_generations on public.generations;

alter table public.generations disable row level security;

-- ==================================
-- GENERATION_ERROR_LOGS POLICIES
-- ==================================
drop policy if exists select_own_generation_errors on public.generation_error_logs;
drop policy if exists insert_own_generation_errors on public.generation_error_logs;
drop policy if exists update_own_generation_errors on public.generation_error_logs;
drop policy if exists delete_own_generation_errors on public.generation_error_logs;

alter table public.generation_error_logs disable row level security;

-- Notes:
-- This file clears all previously defined RLS policies for the listed tables
-- and disables Row Level Security entirely. Useful for resetting or replacing policies.
-- These drops are safe and idempotent thanks to "if exists".
-- Supabase blocks access by default when RLS is enabled without any active policies.
-- This migration ensures full access is restored unless new policies are defined.