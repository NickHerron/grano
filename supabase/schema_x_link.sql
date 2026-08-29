-- Adds an X (formerly Twitter) handle field, matching the existing Instagram/TikTok
-- handle-style pattern (not a full URL like website/facebook) on both farms and
-- restaurants — same social-links precedent, no new architecture.
alter table farms add column if not exists x text;
alter table restaurants add column if not exists x text;

comment on column farms.x is 'X (formerly Twitter) handle, e.g. "@yourfarm" — same convention as instagram/tiktok, converted to a full profile URL only at display time.';
comment on column restaurants.x is 'X (formerly Twitter) handle — see farms.x.';
