-- "Work With Us" — Phase 5: wholesale cutover. Re-runs the idempotent backfill from
-- schema_work_inquiries.sql to catch anything sent through the old wholesale form
-- between Phase 2 and now, then retires the old table's own notification triggers so
-- it stops firing duplicate notifications once the app switches to reading/writing
-- work_inquiries for wholesale too. wholesale_inquiries itself is kept — not dropped —
-- as a read-only archive.
--
-- Safe to run even if nothing changed since the Phase 2 backfill: every insert here is
-- `on conflict (legacy_wholesale_inquiry_id) do nothing`.

alter table work_inquiries disable trigger on_work_inquiry_created;

insert into work_inquiries (
  to_type, to_id, sender_id, from_type, from_id, inquiry_type, subject, message,
  quantity, frequency, desired_date, response_note, status,
  legacy_wholesale_inquiry_id, created_at, updated_at
)
select
  'farm', w.farm_id, r.owner_id, 'restaurant', w.restaurant_id, 'wholesale', w.product_name, w.message,
  w.quantity, w.frequency, w.start_date, w.producer_response,
  case w.status
    when 'pending' then 'new'
    when 'accepted' then 'accepted'
    when 'declined' then 'declined'
    when 'info_requested' then 'responded'
    else 'new'
  end,
  w.id, w.created_at, w.updated_at
from wholesale_inquiries w
join restaurants r on r.id = w.restaurant_id
where r.owner_id is not null
on conflict (legacy_wholesale_inquiry_id) do nothing;

insert into work_inquiry_products (inquiry_id, product_id)
select i.id, w.product_id
from work_inquiries i
join wholesale_inquiries w on w.id = i.legacy_wholesale_inquiry_id
where w.product_id is not null
on conflict do nothing;

alter table work_inquiries enable trigger on_work_inquiry_created;

-- The old table stops being written to going forward (sendWholesaleInquiry is removed
-- from the app in this same deploy) — disable its notification triggers so it can
-- never fire a duplicate notification for something work_inquiries already notified.
-- Not dropped: this only stops future notifications, the archived data and its RLS
-- stay exactly as they were.
drop trigger if exists on_wholesale_inquiry_created on wholesale_inquiries;
drop trigger if exists on_wholesale_inquiry_updated on wholesale_inquiries;
