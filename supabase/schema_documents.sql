-- Grano: Business Document Center — private document vault + a configurable
-- requirements engine (which documents are needed depends on role/business type/
-- wholesale status, not one hard-coded list), plus admin review. Used by both
-- producers and restaurants.
--
-- Documents are PRIVATE: stored in a non-public bucket, readable only by the owning
-- account or an admin. The public profile only ever shows "✓ Verified on Grano" —
-- never the underlying documents.
--
-- Run this AFTER schema_wholesale_inquiries.sql.

-- ============ DOCUMENT TYPES (Grano's catalog) ============

create table if not exists document_types (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  category text not null check (category in ('business', 'food_production', 'insurance', 'tax', 'certifications')),
  description text,
  typically_expires boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ REQUIREMENTS ENGINE ============
-- Each row is one condition under which a document type is required. A document type
-- with no matching row is simply optional (available to attach, never required).
-- null on a condition column means "matches regardless" (e.g. applies to any business
-- type). This is what makes it configurable instead of hard-coded: adding, removing, or
-- narrowing a requirement is a data change here, not a code change.

create table if not exists document_requirements (
  id uuid primary key default gen_random_uuid(),
  document_type_id uuid not null references document_types(id) on delete cascade,
  applies_to_role user_role not null check (applies_to_role in ('producer', 'restaurant')),
  applies_to_business_type text,     -- e.g. 'Farm', 'Home Bakery' — null = any type for that role
  applies_to_wholesale_only boolean, -- true = only when the account sells wholesale; null = regardless
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists document_requirements_role_idx on document_requirements(applies_to_role);

-- ============ UPLOADED DOCUMENTS ============

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('farm', 'restaurant')),
  farm_id uuid references farms(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  document_type_id uuid not null references document_types(id) on delete cascade,
  storage_path text not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'under_review', 'verified', 'needs_attention')),
  issue_date date,
  expiration_date date,
  notes text,           -- from the uploader
  admin_notes text,     -- Grano's feedback, e.g. why it needs attention
  uploaded_at timestamptz not null default now(),
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_owner_matches_type check (
    (owner_type = 'farm' and farm_id is not null and restaurant_id is null)
    or (owner_type = 'restaurant' and restaurant_id is not null and farm_id is null)
  )
);

create index if not exists documents_farm_id_idx on documents(farm_id);
create index if not exists documents_restaurant_id_idx on documents(restaurant_id);

drop trigger if exists documents_set_updated_at on documents;
create trigger documents_set_updated_at
  before update on documents
  for each row execute procedure set_updated_at();

-- Only an admin can move status to 'verified' or write admin_notes — same column-level
-- protection trick used elsewhere, since RLS can't restrict individual columns.
create or replace function public.protect_document_review_fields()
returns trigger as $$
begin
  if not public.is_admin() then
    if new.status is distinct from old.status and old.status = 'verified' then
      new.status := old.status; -- owners can't un-verify by re-editing other fields
    end if;
    if new.status = 'verified' and old.status <> 'verified' then
      new.status := 'under_review'; -- owners can request review, not self-verify
    end if;
    new.admin_notes := old.admin_notes;
    new.verified_at := old.verified_at;
    new.verified_by := old.verified_by;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists documents_protect_review_fields on documents;
create trigger documents_protect_review_fields
  before update on documents
  for each row execute procedure public.protect_document_review_fields();

alter table document_types enable row level security;
alter table document_requirements enable row level security;
alter table documents enable row level security;

-- Types and requirements are Grano's own catalog — publicly readable (needed to render
-- the checklist), admin-only to write.
drop policy if exists "document_types_select_all" on document_types;
create policy "document_types_select_all" on document_types for select using (true);
drop policy if exists "document_types_admin_write" on document_types;
create policy "document_types_admin_write" on document_types for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "document_requirements_select_all" on document_requirements;
create policy "document_requirements_select_all" on document_requirements for select using (true);
drop policy if exists "document_requirements_admin_write" on document_requirements;
create policy "document_requirements_admin_write" on document_requirements for all
  using (public.is_admin()) with check (public.is_admin());

-- Documents themselves are private: owner or admin only, in both directions.
drop policy if exists "documents_select_own_or_admin" on documents;
create policy "documents_select_own_or_admin" on documents for select
  using (
    public.is_admin()
    or (farm_id is not null and auth.uid() = (select owner_id from farms where farms.id = documents.farm_id))
    or (restaurant_id is not null and auth.uid() = (select owner_id from restaurants where restaurants.id = documents.restaurant_id))
  );

drop policy if exists "documents_insert_own" on documents;
create policy "documents_insert_own" on documents for insert
  with check (
    (farm_id is not null and auth.uid() = (select owner_id from farms where farms.id = documents.farm_id))
    or (restaurant_id is not null and auth.uid() = (select owner_id from restaurants where restaurants.id = documents.restaurant_id))
  );

drop policy if exists "documents_update_own_or_admin" on documents;
create policy "documents_update_own_or_admin" on documents for update
  using (
    public.is_admin()
    or (farm_id is not null and auth.uid() = (select owner_id from farms where farms.id = documents.farm_id))
    or (restaurant_id is not null and auth.uid() = (select owner_id from restaurants where restaurants.id = documents.restaurant_id))
  );

drop policy if exists "documents_delete_own_or_admin" on documents;
create policy "documents_delete_own_or_admin" on documents for delete
  using (
    public.is_admin()
    or (farm_id is not null and auth.uid() = (select owner_id from farms where farms.id = documents.farm_id))
    or (restaurant_id is not null and auth.uid() = (select owner_id from restaurants where restaurants.id = documents.restaurant_id))
  );

-- ============ PRIVATE STORAGE BUCKET ============
-- Unlike product-photos (public), this bucket is private — files are only reachable via
-- a short-lived signed URL the owner (or an admin) requests, never a public URL. Path
-- convention: {farm|restaurant}/{owner_id}/{document_type_key}-{timestamp}-{filename}

insert into storage.buckets (id, name, public)
values ('business-documents', 'business-documents', false)
on conflict (id) do nothing;

-- NOTE: both farms and restaurants have their own `name` column, which shadows the
-- outer storage.objects.name inside these correlated subqueries unless explicitly
-- qualified — an unqualified `name` in `select ... from farms where ... = (storage.
-- foldername(name))[2]` silently resolves to farms.name (the business's name), not
-- the file path. Every outer reference below is qualified as storage.objects.name to
-- avoid that trap.
drop policy if exists "business_documents_owner_or_admin_all" on storage.objects;
create policy "business_documents_owner_or_admin_all" on storage.objects for all
  using (
    storage.objects.bucket_id = 'business-documents' and (
      public.is_admin()
      or (
        (storage.foldername(storage.objects.name))[1] = 'farm'
        and auth.uid() = (select owner_id from farms where id::text = (storage.foldername(storage.objects.name))[2])
      )
      or (
        (storage.foldername(storage.objects.name))[1] = 'restaurant'
        and auth.uid() = (select owner_id from restaurants where id::text = (storage.foldername(storage.objects.name))[2])
      )
    )
  )
  with check (
    storage.objects.bucket_id = 'business-documents' and (
      public.is_admin()
      or (
        (storage.foldername(storage.objects.name))[1] = 'farm'
        and auth.uid() = (select owner_id from farms where id::text = (storage.foldername(storage.objects.name))[2])
      )
      or (
        (storage.foldername(storage.objects.name))[1] = 'restaurant'
        and auth.uid() = (select owner_id from restaurants where id::text = (storage.foldername(storage.objects.name))[2])
      )
    )
  );

-- ============ SEED: A REASONABLE STARTING CATALOG ============
-- Not exhaustive — this is meant to be extended by an admin later, not the final word.

insert into document_types (key, name, category, description, typically_expires) values
  ('business_license', 'Business License', 'business', 'Local or state business license.', false),
  ('business_registration', 'Business Registration', 'business', 'Formal registration of your business entity (LLC, DBA, etc).', false),
  ('food_establishment_license', 'Food Establishment License', 'food_production', 'Required for most commercial food production or preparation.', false),
  ('cottage_food_registration', 'Cottage Food License / Registration', 'food_production', 'For home-based food businesses operating under cottage food rules.', false),
  ('health_department_docs', 'Health Department Documentation', 'food_production', 'Local health department inspection or approval records.', false),
  ('farmers_market_permit', 'Farmers Market Permit', 'food_production', 'Permit to sell at farmers markets, if applicable.', false),
  ('general_liability', 'Certificate of Insurance (General Liability)', 'insurance', null, true),
  ('product_liability', 'Product Liability Insurance', 'insurance', 'Typically required to sell wholesale.', true),
  ('sales_tax_registration', 'Sales Tax Registration', 'tax', null, false),
  ('resale_certificate', 'Resale Certificate', 'tax', null, false),
  ('organic_certification', 'Organic Certification', 'certifications', 'Optional — only if you are certified organic.', true)
on conflict (key) do nothing;

-- Safe to re-run: this table is entirely owned by this seed, so reset it each time
-- rather than trying to dedupe row-by-row.
delete from document_requirements;

insert into document_requirements (document_type_id, applies_to_role, applies_to_business_type, applies_to_wholesale_only)
select id, 'producer'::user_role, null::text, null::boolean from document_types where key = 'business_license'
union all select id, 'restaurant'::user_role, null::text, null::boolean from document_types where key = 'business_license'
union all select id, 'producer'::user_role, null::text, null::boolean from document_types where key = 'general_liability'
union all select id, 'restaurant'::user_role, null::text, null::boolean from document_types where key = 'general_liability'
union all select id, 'producer'::user_role, null::text, null::boolean from document_types where key = 'sales_tax_registration'
union all select id, 'restaurant'::user_role, null::text, null::boolean from document_types where key = 'resale_certificate'
union all select id, 'producer'::user_role, 'Farm'::text, null::boolean from document_types where key = 'farmers_market_permit'
union all select id, 'producer'::user_role, 'Home Bakery'::text, null::boolean from document_types where key = 'cottage_food_registration'
union all select id, 'producer'::user_role, 'Cottage Food Business'::text, null::boolean from document_types where key = 'cottage_food_registration'
union all select id, 'producer'::user_role, 'Bakery'::text, null::boolean from document_types where key = 'food_establishment_license'
union all select id, 'producer'::user_role, 'Food Producer'::text, null::boolean from document_types where key = 'food_establishment_license'
union all select id, 'producer'::user_role, 'Cheesemaker'::text, null::boolean from document_types where key = 'food_establishment_license'
union all select id, 'producer'::user_role, 'Butcher'::text, null::boolean from document_types where key = 'food_establishment_license'
union all select id, 'producer'::user_role, 'Beverage Producer'::text, null::boolean from document_types where key = 'food_establishment_license'
union all select id, 'producer'::user_role, 'Preserver / Jam Maker'::text, null::boolean from document_types where key = 'food_establishment_license'
union all select id, 'producer'::user_role, 'Specialty Food'::text, null::boolean from document_types where key = 'food_establishment_license'
union all select id, 'producer'::user_role, null::text, true::boolean from document_types where key = 'product_liability';
