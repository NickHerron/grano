-- Performance fixes for the two Supabase Advisor warning categories that account for
-- most of the noise in this project: bare auth.uid()/auth.role() calls in RLS
-- policies (re-evaluated per row instead of once per query — "Auth RLS Initplan"),
-- and a handful of foreign-key columns that never got an index. Nothing here changes
-- who can see or write what — every policy keeps the exact same logic, just rewritten
-- so Postgres evaluates the auth call once via a scalar subquery instead of per row.

-- === Part 1: rewrite every RLS policy's auth.uid()/auth.role() to (select auth.x()) ===
-- Reads straight from pg_policies (the live catalog) rather than hand-editing each of
-- the ~19 migration files, so this is correct regardless of how those files layered on
-- top of each other over the project's history. Safe to run more than once — a policy
-- with nothing left to rewrite is skipped.
do $$
declare
  pol record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for pol in
    select schemaname, tablename, policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_qual := pol.qual;
    new_check := pol.with_check;

    if new_qual is not null then
      new_qual := regexp_replace(new_qual, '(?<!select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '(?<!select )auth\.role\(\)', '(select auth.role())', 'g');
    end if;

    if new_check is not null then
      new_check := regexp_replace(new_check, '(?<!select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_check := regexp_replace(new_check, '(?<!select )auth\.role\(\)', '(select auth.role())', 'g');
    end if;

    if (pol.qual is not distinct from new_qual) and (pol.with_check is not distinct from new_check) then
      continue; -- nothing to rewrite on this policy
    end if;

    stmt := format('alter policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;

    execute stmt;
    raise notice 'Rewrote policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
  end loop;
end $$;

-- === Part 2: index the foreign-key columns that were missing one ===
create index if not exists business_relationships_created_by_idx on business_relationships(created_by);
create index if not exists documents_document_type_id_idx on documents(document_type_id);
create index if not exists documents_verified_by_idx on documents(verified_by);
create index if not exists document_requirements_document_type_id_idx on document_requirements(document_type_id);
create index if not exists cart_items_product_id_idx on cart_items(product_id);
create index if not exists reviews_order_id_idx on reviews(order_id);
create index if not exists reviews_invite_id_idx on reviews(invite_id);
create index if not exists reviews_buyer_id_idx on reviews(buyer_id);
create index if not exists order_items_product_id_idx on order_items(product_id);
create index if not exists wholesale_inquiries_product_id_idx on wholesale_inquiries(product_id);
