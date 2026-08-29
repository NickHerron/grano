-- Replaces the month-name season picker ("Season start: May" / "Season end: September")
-- with actual start/end dates for a Find Us location — a producer can now say a
-- market runs May 3, 2026 through September 27, 2026, not just "May through
-- September" with no year or exact day. Additive: seasonal_start/seasonal_end (the
-- old month-text columns) are untouched and still work as a fallback for any location
-- that never gets its new starts_on/ends_on set — see inActiveRange() in schedule.js.

alter table farm_locations add column if not exists starts_on date;
alter table farm_locations add column if not exists ends_on date;
comment on column farm_locations.starts_on is 'First date this schedule is active (inclusive). Null = no start boundary. Takes priority over the legacy seasonal_start month text.';
comment on column farm_locations.ends_on is 'Last date this schedule is active (inclusive). Null = no end boundary. Takes priority over the legacy seasonal_end month text.';
