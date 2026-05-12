-- Secondhand marketplace schema for Supabase (run in SQL Editor)
-- After running: create Storage bucket "product-images" (public) OR use policies below.

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Listings
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  category text not null,
  condition text not null check (condition in ('new', 'like_new', 'used', 'damaged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_created_at_idx on public.products (created_at desc);
create index products_category_idx on public.products (category);
create index products_condition_idx on public.products (condition);
create index products_price_idx on public.products (price);
create index products_seller_idx on public.products (seller_id);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Images (paths relative to bucket root, e.g. "{userId}/{productId}/0.jpg")
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  sort_order smallint not null default 0
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- Simple messaging
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.messages enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "products_select_all"
  on public.products for select
  using (true);

create policy "products_insert_own"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "products_update_own"
  on public.products for update
  using (auth.uid() = seller_id);

create policy "products_delete_own"
  on public.products for delete
  using (auth.uid() = seller_id);

create policy "product_images_select_all"
  on public.product_images for select
  using (true);

create policy "product_images_insert_owner"
  on public.product_images for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

create policy "product_images_update_owner"
  on public.product_images for update
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

create policy "product_images_delete_owner"
  on public.product_images for delete
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

create policy "messages_select_participant"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "messages_insert_as_sender"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_auth_update"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_auth_delete"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
