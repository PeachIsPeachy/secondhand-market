-- Run once in Supabase SQL Editor (after schema.sql).
-- Tracks when each viewer last opened a thread so we can show unread counts.

create table if not exists public.conversation_seen (
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  peer_id uuid not null references public.profiles (id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  primary key (viewer_id, product_id, peer_id),
  constraint conversation_seen_peer_ne_self check (viewer_id <> peer_id)
);

create index if not exists conversation_seen_viewer_idx
  on public.conversation_seen (viewer_id);

alter table public.conversation_seen enable row level security;

create policy "conversation_seen_select_own"
  on public.conversation_seen for select
  using (auth.uid() = viewer_id);

create policy "conversation_seen_insert_own"
  on public.conversation_seen for insert
  with check (auth.uid() = viewer_id);

create policy "conversation_seen_update_own"
  on public.conversation_seen for update
  using (auth.uid() = viewer_id);

create policy "conversation_seen_delete_own"
  on public.conversation_seen for delete
  using (auth.uid() = viewer_id);
