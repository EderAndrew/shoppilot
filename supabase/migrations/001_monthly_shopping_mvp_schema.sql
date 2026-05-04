create extension if not exists "pgcrypto";

create type public.shopping_list_status as enum (
  'active',
  'completed',
  'archived'
);

create type public.user_event_type as enum (
  'SHOPPING_LIST_CREATED',
  'SHOPPING_LIST_COMPLETED',
  'PRODUCT_CREATED',
  'ITEM_ADDED',
  'ITEM_UPDATED',
  'ITEM_REMOVED',
  'ITEM_CHECKED',
  'PRICE_RECORDED'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  budget numeric(12, 2) not null,
  status public.shopping_list_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  archived_at timestamptz null,
  constraint shopping_lists_id_user_id_key unique (id, user_id),
  constraint shopping_lists_name_not_blank check (length(btrim(name)) > 0),
  constraint shopping_lists_budget_positive check (budget > 0),
  constraint shopping_lists_completed_at_matches_status check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed')
  ),
  constraint shopping_lists_archived_at_matches_status check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived')
  )
);

create trigger shopping_lists_set_updated_at
before update on public.shopping_lists
for each row
execute function public.set_updated_at();

create index shopping_lists_user_status_created_idx
on public.shopping_lists (user_id, status, created_at desc);

create index shopping_lists_user_created_idx
on public.shopping_lists (user_id, created_at desc);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brand text null,
  barcode text null,
  unit text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_id_user_id_key unique (id, user_id),
  constraint products_name_not_blank check (length(btrim(name)) > 0),
  constraint products_brand_not_blank check (brand is null or length(btrim(brand)) > 0),
  constraint products_barcode_not_blank check (barcode is null or length(btrim(barcode)) > 0),
  constraint products_unit_not_blank check (unit is null or length(btrim(unit)) > 0)
);

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create index products_user_name_idx
on public.products (user_id, lower(name));

create index products_user_barcode_idx
on public.products (user_id, barcode)
where barcode is not null;

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shopping_list_id uuid not null,
  product_id uuid not null,
  quantity numeric(12, 3) not null,
  unit_price numeric(12, 2) not null,
  total_price numeric(12, 2) not null,
  bought boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_list_items_id_user_id_key unique (id, user_id),
  constraint shopping_list_items_list_owner_fk foreign key (shopping_list_id, user_id)
    references public.shopping_lists (id, user_id) on delete cascade,
  constraint shopping_list_items_product_owner_fk foreign key (product_id, user_id)
    references public.products (id, user_id),
  constraint shopping_list_items_quantity_positive check (quantity > 0),
  constraint shopping_list_items_unit_price_non_negative check (unit_price >= 0),
  constraint shopping_list_items_total_price_non_negative check (total_price >= 0)
);

create trigger shopping_list_items_set_updated_at
before update on public.shopping_list_items
for each row
execute function public.set_updated_at();

create index items_user_list_idx
on public.shopping_list_items (user_id, shopping_list_id);

create index items_user_product_idx
on public.shopping_list_items (user_id, product_id);

create index items_list_created_idx
on public.shopping_list_items (shopping_list_id, created_at);

create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null,
  shopping_list_id uuid not null,
  shopping_list_item_id uuid null references public.shopping_list_items(id) on delete set null,
  price numeric(12, 2) not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint price_history_product_owner_fk foreign key (product_id, user_id)
    references public.products (id, user_id),
  constraint price_history_list_owner_fk foreign key (shopping_list_id, user_id)
    references public.shopping_lists (id, user_id) on delete cascade,
  constraint price_history_price_positive check (price > 0)
);

create index price_history_user_product_recorded_idx
on public.price_history (user_id, product_id, recorded_at desc);

create index price_history_user_list_recorded_idx
on public.price_history (user_id, shopping_list_id, recorded_at desc);

create table public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type public.user_event_type not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint user_events_entity_type_not_blank check (length(btrim(entity_type)) > 0),
  constraint user_events_metadata_is_object check (jsonb_typeof(metadata) = 'object')
);

create index user_events_user_type_created_idx
on public.user_events (user_id, event_type, created_at desc);

create index user_events_user_entity_created_idx
on public.user_events (user_id, entity_type, entity_id, created_at desc);
