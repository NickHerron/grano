-- Admin-controlled kill switch for the whole marketplace's buy/checkout flow, for
-- use until a real payment network is wired up. A single settings row (id is always
-- `true`, which — being a boolean primary key — guarantees there can only ever be
-- one row) that every product/checkout page checks and admin alone can flip.
--
-- Individual farms keep their own "Sell on Grano" toggle and individual products
-- keep their own "for sale" toggle — this switch OVERRIDES those (AND's against
-- them), it doesn't replace them. Turn it back on and every farm's own settings
-- apply again exactly as they were.

create table if not exists site_settings (
  id boolean primary key default true,
  live_marketplace_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into site_settings (id) values (true) on conflict (id) do nothing;
comment on column site_settings.live_marketplace_enabled is 'Master switch for Add to Cart / checkout sitewide. Off = every product shows "Not sold on Grano yet" regardless of its own or its farm''s toggle. Defaults true (current behavior) until an admin turns it off.';

alter table site_settings enable row level security;
create policy "site_settings_select_all" on site_settings for select using (true);
create policy "site_settings_update_admin" on site_settings for update using (public.is_admin());

-- Lets an admin delete an inappropriate message — most importantly an "open request"
-- broadcast (farm_id is null, visible to every producer) that someone posted something
-- they shouldn't have in. There was no delete policy on messages at all before this.
create policy "messages_delete_admin" on messages for delete using (public.is_admin());
