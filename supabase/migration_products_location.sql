-- Run once in Supabase SQL Editor.

alter table public.products
  add column if not exists location text;

comment on column public.products.location is 'Listing pickup/meet-up area, e.g. "Daun Penh, Phnom Penh, Cambodia". Falls back to seller profile location in UI when null.';

-- Backfill the seven oldest listings (e.g. demo seed) to Phnom Penh, Cambodia.
update public.products p
set location = 'Phnom Penh, Cambodia'
from (
  select id
  from public.products
  order by created_at asc
  limit 7
) oldest
where p.id = oldest.id;
