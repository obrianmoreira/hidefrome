-- Hide MVP - Supabase Schema
-- Run this in your Supabase SQL editor

create table if not exists vaults (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  name text not null,
  amount numeric(12,2) not null,
  currency text not null default 'EUR',
  unlock_date date not null,
  category text not null default 'other',
  status text not null default 'locked' check (status in ('locked', 'unlocked', 'emergency')),
  notes text,
  created_at timestamp with time zone default now(),
  unlocked_at timestamp with time zone
);

-- Row Level Security
alter table vaults enable row level security;

create policy "Users can only see their own vaults"
  on vaults for select
  using (auth.jwt() ->> 'sub' = user_id);

create policy "Users can insert their own vaults"
  on vaults for insert
  with check (auth.jwt() ->> 'sub' = user_id);

create policy "Users can update their own vaults"
  on vaults for update
  using (auth.jwt() ->> 'sub' = user_id);

create policy "Users can delete their own vaults"
  on vaults for delete
  using (auth.jwt() ->> 'sub' = user_id);

-- Index
create index vaults_user_id_idx on vaults(user_id);
create index vaults_unlock_date_idx on vaults(unlock_date);
