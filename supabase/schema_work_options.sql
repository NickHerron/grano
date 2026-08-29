-- "Work With Us" — Phase 1: per-business capability settings ("which ways can people
-- work with this business"). Polymorphic (business_type, business_id) pair, same shape
-- as business_relationships, reusing owns_business()/is_admin() from
-- schema_business_network.sql rather than inventing new ownership logic.
--
-- Absence of a row for a given option_key means "use the default" (computed in JS from
-- business_types/practices/producer_type — see src/lib/workOptions.js), not "disabled."
-- A business only gets an explicit row here once it actually opens the settings tab and
-- changes something from its default. This keeps every existing farm/restaurant working
-- with sensible defaults on day one with zero backfill.

create table if not exists business_work_options (
  id uuid primary key default gen_random_uuid(),
  business_type text not null check (business_type in ('farm', 'restaurant')),
  business_id uuid not null,
  option_key text not null check (option_key in
    ('wholesale', 'product_inquiry', 'event', 'collaboration', 'custom_order', 'sourcing', 'general')),
  enabled boolean not null default true,
  headline text,          -- shown as the description under this option in the picker, e.g. "Wholesale flour, 25lb+ bags"
  instructions text,      -- optional longer note shown above the form for this option
  lead_time_days integer,
  min_order text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_type, business_id, option_key)
);

create index if not exists bwo_business_idx on business_work_options(business_type, business_id);

create trigger business_work_options_set_updated_at
  before update on business_work_options
  for each row execute procedure set_updated_at();

alter table business_work_options enable row level security;

-- Public read — a visitor needs to see which options a business accepts before (or
-- without ever) signing in.
create policy "bwo_select_all" on business_work_options for select using (true);

create policy "bwo_insert_own" on business_work_options for insert
  with check (public.owns_business(business_type, business_id) or public.is_admin());
create policy "bwo_update_own" on business_work_options for update
  using (public.owns_business(business_type, business_id) or public.is_admin());
create policy "bwo_delete_own" on business_work_options for delete
  using (public.owns_business(business_type, business_id) or public.is_admin());
