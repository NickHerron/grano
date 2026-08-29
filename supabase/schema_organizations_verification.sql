-- Phase 4 of the Organization Network plan.
--
-- Adds a third verification state (owners can now request verification, not just
-- land in unverified-or-verified) and — the reason this needs to be a migration and
-- not just an app-code change — adds the protective trigger organizations were
-- missing. Farms and restaurants both already have one (protect_verification_status(),
-- protect_restaurant_verification_status()) stopping an owner from self-setting
-- verification_status='verified'; organizations never got the equivalent. Not
-- currently exploitable through the UI (no field exposes it), but adding a real
-- "Request verification" button that owners are SUPPOSED to use makes the trigger
-- load-bearing rather than optional.

alter table organizations drop constraint if exists organizations_verification_status_check;
alter table organizations add constraint organizations_verification_status_check
  check (verification_status in ('unverified', 'pending_verification', 'verified'));

-- Owner may request verification (unverified -> pending_verification) and withdraw
-- the request (pending_verification -> unverified). Every other transition —
-- including the actual approval to 'verified' — is admin-only, same rule farms and
-- restaurants already enforce for their own verification_status.
create or replace function public.protect_organization_verification_status()
returns trigger as $$
begin
  if new.verification_status is distinct from old.verification_status and not public.is_admin() then
    if not (
      (old.verification_status = 'unverified' and new.verification_status = 'pending_verification') or
      (old.verification_status = 'pending_verification' and new.verification_status = 'unverified')
    ) then
      new.verification_status := old.verification_status;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists organizations_protect_verification_status on organizations;
create trigger organizations_protect_verification_status
  before update on organizations
  for each row execute procedure public.protect_organization_verification_status();
