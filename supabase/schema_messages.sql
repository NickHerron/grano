-- Grano messages — run this AFTER schema.sql, once, in the Supabase SQL Editor.
-- Lets restaurants message a specific producer, or post an "open" sourcing
-- request (farm_id null) that every producer can see in their dashboard.

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  farm_id uuid references farms(id) on delete cascade, -- null = open message, visible to all producers
  text text not null,
  created_at timestamptz not null default now()
);

create index messages_farm_id_idx on messages(farm_id);
create index messages_sender_id_idx on messages(sender_id);

-- ============ ROW LEVEL SECURITY ============

alter table messages enable row level security;

-- Visible to: the sender, the addressed farm's owner, any producer (if it's an open message), or admin
create policy "messages_select" on messages for select using (
  auth.uid() = sender_id
  or public.is_admin()
  or (farm_id is null and exists (select 1 from profiles where id = auth.uid() and role = 'producer'))
  or (farm_id is not null and auth.uid() = (select owner_id from farms where farms.id = messages.farm_id))
);

create policy "messages_insert_own_buyer" on messages for insert
  with check (
    auth.uid() = sender_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'buyer')
  );
