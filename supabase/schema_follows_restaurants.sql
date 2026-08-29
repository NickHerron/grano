-- Grano: let follows target restaurants too (not just farms), fix a real pre-existing
-- bug where public follower counts were always wrong, and make a restaurant's own
-- "who they follow" (their vendors) publicly visible as a "Sourced From" cross-
-- discovery signal on their profile — closing the producer <-> restaurant <-> consumer
-- loop the spec calls out explicitly.
--
-- THE BUG: the original follows RLS only allowed `auth.uid() = follower_id` — so every
-- "Followers" count shown on a public producer profile was silently wrong for anyone
-- except the one follower being counted (an anonymous visitor always saw 0, and even
-- the producer's own dashboard analytics always showed 0 followers, since a producer
-- isn't the follower of their own farm). Fixed with a public aggregate view — the
-- underlying follow rows themselves stay private except for the restaurant-vendor case
-- below, which is intentionally public.
--
-- Run this AFTER schema_documents.sql.

alter table follows alter column farm_id drop not null;
alter table follows add column if not exists restaurant_id uuid references restaurants(id) on delete cascade;

alter table follows drop constraint if exists follows_target_check;
alter table follows add constraint follows_target_check check (
  (farm_id is not null and restaurant_id is null) or (farm_id is null and restaurant_id is not null)
);

create unique index if not exists follows_unique_restaurant on follows(follower_id, restaurant_id) where restaurant_id is not null;

-- Public aggregate counts — exposes only a count per farm/restaurant, never who follows.
create or replace view follow_counts as
select farm_id, restaurant_id, count(*) as follower_count
from follows
group by farm_id, restaurant_id;

grant select on follow_counts to anon, authenticated;

-- A restaurant following a farm is a business relationship the spec wants public (its
-- "Sourced From" list); an individual consumer's follows stay private to them. Same
-- table, different visibility depending on who the follower is.
drop policy if exists "follows_select_own" on follows;
drop policy if exists "follows_select_own_or_public_restaurant_vendor" on follows;
create policy "follows_select_own_or_public_restaurant_vendor" on follows for select
  using (
    auth.uid() = follower_id
    or (farm_id is not null and exists (select 1 from restaurants r where r.owner_id = follows.follower_id))
  );

drop policy if exists "follows_insert_own" on follows;
create policy "follows_insert_own" on follows for insert with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on follows;
create policy "follows_delete_own" on follows for delete using (auth.uid() = follower_id);
