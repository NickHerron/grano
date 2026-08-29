-- Replaces the follow_counts view (flagged by Supabase Advisor: "View defined with
-- the SECURITY DEFINER property") with a security definer FUNCTION instead.
--
-- Why the view triggered this: Postgres views run with the permissions of their
-- owner for underlying-table access, not the querying user — which is exactly why
-- follow_counts worked at all (the raw `follows` table's RLS restricts each row to
-- its own follower or the business owner; a public aggregate count needs to see past
-- that). But a bare view doing this is an *implicit*, easy-to-miss elevation — anyone
-- who later adds a column to it could accidentally leak data. A SECURITY DEFINER
-- function is the explicit, reviewable version of the same idea: it declares its
-- elevation up front and returns exactly one integer, nothing else — same pattern
-- already used for is_admin()/has_role()/owns_business() elsewhere in this project.
-- Supabase's linter does not flag security definer functions the same way; the
-- elevation is expected to be intentional and scoped there.
create or replace function public.get_follow_count(p_farm_id uuid default null, p_restaurant_id uuid default null)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer
  from follows
  where (p_farm_id is not null and farm_id = p_farm_id)
     or (p_restaurant_id is not null and restaurant_id = p_restaurant_id)
$$;

grant execute on function public.get_follow_count(uuid, uuid) to anon, authenticated;

drop view if exists public.follow_counts;
