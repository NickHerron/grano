-- Social Cards ("Share Your Grano Story") — Phase 1: tracking table only, no app
-- code reads or writes this yet. Every generate/share/download action a business
-- takes on its own social card gets one row here — business-level counts only, no
-- personal information, matching the explicit ask ("track... don't track unnecessary
-- personal information"). No user_id column: the goal is "how many times was this
-- card shared," not who did it.
--
-- Deliberately NOT modeled on notifications' SECURITY DEFINER-trigger pattern —
-- notifications exist because some OTHER row's insert/update causes them (a message
-- arrives, an inquiry is accepted). Here there's no other-table event: the signed-in
-- business owner performing the generate/share/download action IS the actor, so a
-- plain owner-gated insert policy is the right, simpler shape. owns_business() is
-- reused as-is from schema_business_network.sql — no new helper needed.

create table if not exists social_card_events (
  id uuid primary key default gen_random_uuid(),
  business_type text not null check (business_type in ('farm', 'restaurant')),
  business_id uuid not null,
  card_type text not null check (card_type in
    ('local_network', 'sourcing', 'product_story', 'our_suppliers', 'who_we_supply',
     'work_with_us', 'upcoming_events', 'business_discovery', 'profile_milestone')),
  format text not null check (format in ('story', 'portrait', 'square')),
  event_type text not null check (event_type in ('generated', 'shared', 'downloaded')),
  product_id uuid references products(id) on delete set null, -- only set for product_story
  created_at timestamptz not null default now()
);

create index if not exists social_card_events_business_idx on social_card_events(business_type, business_id);

alter table social_card_events enable row level security;

create policy "social_card_events_insert_own" on social_card_events for insert
  with check (public.owns_business(business_type, business_id));

create policy "social_card_events_select_own_or_admin" on social_card_events for select
  using (public.owns_business(business_type, business_id) or public.is_admin());

-- No update/delete policy — an event log is append-only by design; nothing in this
-- feature ever needs to edit or remove a past event row.
