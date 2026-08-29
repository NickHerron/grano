-- Lets a producer skip an individual occurrence of an otherwise-recurring weekly or
-- biweekly "Find Us" schedule (e.g. "every Saturday, except this one") — toggled via
-- the calendar picker in the Find Us form, rather than having to change or delete the
-- whole recurring schedule.

alter table farm_locations add column if not exists schedule_exceptions date[] not null default '{}';
comment on column farm_locations.schedule_exceptions is 'Individual dates to skip within an otherwise-recurring weekly/biweekly schedule.';
