-- ==================================================
-- Dalimgari — Supabase Schema
-- ==================================================
-- Run this once in Supabase SQL Editor
-- (Project → SQL Editor → New query → paste → Run)
-- ==================================================


-- --------------------------------------------------
-- 1. Content storage table
-- --------------------------------------------------
-- Stores the site's data as key/value documents.
-- key = 'site'     -> matches data/site.json structure
-- key = 'settings' -> matches data/settings.json structure
-- (Also used transparently as a cache for logs/backups
--  if the app writes those keys too.)

create table if not exists public.dalimgari_data (
    key text primary key,
    value text not null,
    updated_at timestamptz not null default now()
);

alter table public.dalimgari_data enable row level security;

-- Anyone (including anonymous visitors) can read site content
create policy "Public read access"
    on public.dalimgari_data
    for select
    using (true);

-- Only logged-in users (admin/manager) can write
create policy "Authenticated write access"
    on public.dalimgari_data
    for insert
    with check (auth.role() = 'authenticated');

create policy "Authenticated update access"
    on public.dalimgari_data
    for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');


-- --------------------------------------------------
-- 2. Keep updated_at fresh automatically
-- --------------------------------------------------

create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dalimgari_data_updated_at on public.dalimgari_data;

create trigger trg_dalimgari_data_updated_at
    before update on public.dalimgari_data
    for each row
    execute function public.set_updated_at();


-- --------------------------------------------------
-- 3. Auth users (create manually — see below)
-- --------------------------------------------------
-- This schema does NOT create login accounts. After running
-- this file, go to:
--   Supabase Dashboard → Authentication → Users → Add user
--
-- Create exactly two users:
--   Email: admin@dalimgari.local     Password: <choose a strong one>
--   Email: manager@dalimgari.local   Password: <choose a strong one>
--
-- The website logs users in with the username "admin" or
-- "manager" (as before) and maps it to these fixed emails
-- behind the scenes — no visible change for whoever logs in.
