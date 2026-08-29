-- Fixes a real bug found while verifying Phase 7 (Accept -> Add to Local Network):
-- work_inquiries.resulting_relationship_id references business_relationships(id) on
-- delete set null — so removing a network relationship that an inquiry created
-- makes Postgres run an UPDATE ... SET resulting_relationship_id = null on the
-- referencing work_inquiries row as part of enforcing that FK. That UPDATE has no
-- owns_business()/sender_id context (there's no signed-in "actor" during an FK
-- cascade), so enforce_work_inquiry_update_rules() rejected it with "Not authorized
-- to update this inquiry" — which meant the entire relationship deletion failed.
-- In other words: any business owner clicking "Remove" on a network connection that
-- came from an accepted inquiry would have hit this and been unable to remove it.
--
-- Fix: let the trigger recognize this one narrow shape — resulting_relationship_id
-- going from some value to null, with every other column unchanged — and allow it
-- through before the ownership checks, since it can't carry any other unauthorized
-- change riding along with it.

create or replace function public.enforce_work_inquiry_update_rules()
returns trigger as $$
begin
  new.updated_at := now();

  if new.resulting_relationship_id is null and old.resulting_relationship_id is not null
     and new.to_type is not distinct from old.to_type
     and new.to_id is not distinct from old.to_id
     and new.sender_id is not distinct from old.sender_id
     and new.from_type is not distinct from old.from_type
     and new.from_id is not distinct from old.from_id
     and new.inquiry_type is not distinct from old.inquiry_type
     and new.subject is not distinct from old.subject
     and new.message is not distinct from old.message
     and new.quantity is not distinct from old.quantity
     and new.frequency is not distinct from old.frequency
     and new.desired_date is not distinct from old.desired_date
     and new.event_type is not distinct from old.event_type
     and new.event_start_time is not distinct from old.event_start_time
     and new.event_end_time is not distinct from old.event_end_time
     and new.event_location is not distinct from old.event_location
     and new.guest_count is not distinct from old.guest_count
     and new.budget is not distinct from old.budget
     and new.sourcing_request_id is not distinct from old.sourcing_request_id
     and new.farm_location_id is not distinct from old.farm_location_id
     and new.legacy_wholesale_inquiry_id is not distinct from old.legacy_wholesale_inquiry_id
     and new.status is not distinct from old.status
     and new.response_note is not distinct from old.response_note
     and new.opened_at is not distinct from old.opened_at
     and new.responded_at is not distinct from old.responded_at
     and new.closed_at is not distinct from old.closed_at
  then
    new.updated_at := old.updated_at;
    return new;
  end if;

  if public.owns_business(old.to_type, old.to_id) then
    if new.status not in ('new', 'responded', 'in_discussion', 'accepted', 'declined', 'closed') then
      raise exception 'Invalid status.';
    end if;
    new.to_type := old.to_type;
    new.to_id := old.to_id;
    new.sender_id := old.sender_id;
    new.from_type := old.from_type;
    new.from_id := old.from_id;
    new.inquiry_type := old.inquiry_type;
    new.subject := old.subject;
    new.message := old.message;
    new.quantity := old.quantity;
    new.frequency := old.frequency;
    new.desired_date := old.desired_date;
    new.event_type := old.event_type;
    new.event_start_time := old.event_start_time;
    new.event_end_time := old.event_end_time;
    new.event_location := old.event_location;
    new.guest_count := old.guest_count;
    new.budget := old.budget;
    new.sourcing_request_id := old.sourcing_request_id;
    new.legacy_wholesale_inquiry_id := old.legacy_wholesale_inquiry_id;
    new.created_at := old.created_at;
    new.responded_at := case when old.status = 'new' and new.status <> 'new' then now() else old.responded_at end;
    new.closed_at := case when new.status = 'closed' and old.status <> 'closed' then now() else old.closed_at end;
  elsif old.sender_id = (select auth.uid()) or (old.from_type is not null and public.owns_business(old.from_type, old.from_id)) then
    if old.status = 'closed' then
      raise exception 'This inquiry is already closed.';
    end if;
    if new.status <> 'closed' then
      raise exception 'You can only withdraw (close) your own inquiry.';
    end if;
    new.to_type := old.to_type;
    new.to_id := old.to_id;
    new.sender_id := old.sender_id;
    new.from_type := old.from_type;
    new.from_id := old.from_id;
    new.inquiry_type := old.inquiry_type;
    new.subject := old.subject;
    new.message := old.message;
    new.quantity := old.quantity;
    new.frequency := old.frequency;
    new.desired_date := old.desired_date;
    new.event_type := old.event_type;
    new.event_start_time := old.event_start_time;
    new.event_end_time := old.event_end_time;
    new.event_location := old.event_location;
    new.guest_count := old.guest_count;
    new.budget := old.budget;
    new.sourcing_request_id := old.sourcing_request_id;
    new.legacy_wholesale_inquiry_id := old.legacy_wholesale_inquiry_id;
    new.response_note := old.response_note;
    new.resulting_relationship_id := old.resulting_relationship_id;
    new.opened_at := old.opened_at;
    new.responded_at := old.responded_at;
    new.created_at := old.created_at;
    new.closed_at := now();
  else
    raise exception 'Not authorized to update this inquiry.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;
