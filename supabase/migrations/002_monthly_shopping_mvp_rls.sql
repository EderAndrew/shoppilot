alter table public.shopping_lists enable row level security;
alter table public.products enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.price_history enable row level security;
alter table public.user_events enable row level security;

alter table public.shopping_lists force row level security;
alter table public.products force row level security;
alter table public.shopping_list_items force row level security;
alter table public.price_history force row level security;
alter table public.user_events force row level security;

create policy "shopping_lists_select_own"
on public.shopping_lists
for select
to authenticated
using (user_id = auth.uid());

create policy "products_select_own"
on public.products
for select
to authenticated
using (user_id = auth.uid());

create policy "shopping_list_items_select_own"
on public.shopping_list_items
for select
to authenticated
using (user_id = auth.uid());

create policy "price_history_select_own"
on public.price_history
for select
to authenticated
using (user_id = auth.uid());

create policy "user_events_select_own"
on public.user_events
for select
to authenticated
using (user_id = auth.uid());

create policy "shopping_lists_insert_own"
on public.shopping_lists
for insert
to authenticated
with check (user_id = auth.uid());

create policy "products_insert_own"
on public.products
for insert
to authenticated
with check (user_id = auth.uid());

create policy "shopping_list_items_insert_own"
on public.shopping_list_items
for insert
to authenticated
with check (user_id = auth.uid());

create policy "price_history_insert_own"
on public.price_history
for insert
to authenticated
with check (user_id = auth.uid());

create policy "user_events_insert_own"
on public.user_events
for insert
to authenticated
with check (user_id = auth.uid());

create policy "shopping_lists_update_own"
on public.shopping_lists
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "products_update_own"
on public.products
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "shopping_list_items_update_own"
on public.shopping_list_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "products_delete_own"
on public.products
for delete
to authenticated
using (user_id = auth.uid());

create policy "shopping_list_items_delete_own"
on public.shopping_list_items
for delete
to authenticated
using (user_id = auth.uid());

comment on table public.price_history is
  'Append-only price records. Normal application roles may insert/select owned rows but do not get update/delete policies.';

comment on table public.user_events is
  'Append-only audit records. Normal application roles may insert/select owned rows but do not get update/delete policies.';
