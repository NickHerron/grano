-- Wholesale Available to All Business Types — Phase 2: sourcing_requests becomes
-- polymorphic (any business type can post a "what we're looking for" want-ad, not
-- just restaurants), and the Work With Us vocabulary gains a new inquiry type for
-- the direction that's never existed: someone offering to SUPPLY a business, rather
-- than someone asking to buy from one.
--
-- restaurant_id stays in the table afterward, frozen and unused by app code going
-- forward — mirrors this project's own established precedent from the
-- wholesale_inquiries -> work_inquiries cutover (freeze the old column, don't drop it).

alter table sourcing_requests
  add column if not exists owner_type text check (owner_type in ('farm', 'restaurant')),
  add column if not exists owner_id uuid;

update sourcing_requests
set owner_type = 'restaurant', owner_id = restaurant_id
where owner_type is null;

alter table sourcing_requests
  alter column owner_type set not null,
  alter column owner_id set not null;

create index if not exists sourcing_requests_owner_idx on sourcing_requests(owner_type, owner_id);

comment on column sourcing_requests.restaurant_id is 'Deprecated — kept for historical/FK integrity only. App code reads/writes owner_type/owner_id instead as of the wholesale-capability rework.';

-- Rewrite the three write policies to check ownership via owns_business(), the same
-- polymorphic helper business_relationships/product_sources already use, instead of
-- the old hardcoded "must own a restaurants row" check.
drop policy if exists "sourcing_requests_insert_own_or_admin" on sourcing_requests;
create policy "sourcing_requests_insert_own_or_admin" on sourcing_requests for insert
  with check (
    public.is_admin() or public.owns_business(owner_type, owner_id)
  );

drop policy if exists "sourcing_requests_update_own_or_admin" on sourcing_requests;
create policy "sourcing_requests_update_own_or_admin" on sourcing_requests for update
  using (
    public.is_admin() or public.owns_business(owner_type, owner_id)
  );

drop policy if exists "sourcing_requests_delete_own_or_admin" on sourcing_requests;
create policy "sourcing_requests_delete_own_or_admin" on sourcing_requests for delete
  using (
    public.is_admin() or public.owns_business(owner_type, owner_id)
  );

-- New inquiry type: 'supplier_pitch' — the direction that's never existed in this
-- vocabulary before. Every existing key ('wholesale', 'product_inquiry', 'sourcing',
-- etc.) means "I want something FROM you." supplier_pitch means "I'd like to supply
-- YOU" — shown on a business that buys wholesale, sent by a business that sells.
--
-- Both CHECK constraints below were created inline in their original CREATE TABLE
-- statements (schema_work_options.sql, schema_work_inquiries.sql), so Postgres
-- auto-named them <table>_<column>_check — the standard convention. If either DROP
-- CONSTRAINT below errors with "constraint does not exist," the constraint has a
-- different name than expected; stop and report back rather than guessing further.
alter table business_work_options drop constraint if exists business_work_options_option_key_check;
alter table business_work_options add constraint business_work_options_option_key_check
  check (option_key in ('wholesale', 'product_inquiry', 'event', 'collaboration', 'custom_order', 'sourcing', 'general', 'supplier_pitch'));

alter table work_inquiries drop constraint if exists work_inquiries_inquiry_type_check;
alter table work_inquiries add constraint work_inquiries_inquiry_type_check
  check (inquiry_type in ('wholesale', 'product_inquiry', 'event', 'collaboration', 'custom_order', 'sourcing', 'general', 'supplier_pitch'));
