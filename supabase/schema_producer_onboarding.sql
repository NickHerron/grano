-- Producer Onboarding Wizard — Phase 1: progress-tracking columns only, no app code
-- reads these yet. Lets the wizard (built in later phases) know which step a producer
-- left off on, and lets the dashboard show a "finish setting up" prompt for producers
-- who never went through it.
--
-- The profile stays publicly live throughout onboarding — same as every farm on Grano
-- today — so `onboarding_status` is a milestone flag for the producer's own benefit,
-- never something any query filters public visibility on. Confirmed: no existing RLS
-- policy or the `protect_verification_status` trigger (schema_producer_platform.sql)
-- touches anything but verification_status, so these new columns are freely writable
-- by the owning producer under the existing farms_update_own_or_admin policy.

alter table farms
  add column if not exists onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'in_progress', 'published')),
  add column if not exists onboarding_step text,
  add column if not exists onboarding_completed_steps text[] not null default '{}',
  add column if not exists onboarding_started_at timestamptz,
  add column if not exists onboarding_published_at timestamptz;

comment on column farms.onboarding_status is 'Wizard progress milestone only — never gates public visibility. not_started = never entered the wizard (includes every farm that existed before this feature).';
comment on column farms.onboarding_step is 'Key of the step to resume on, from src/lib/onboardingSteps.js. Null means "compute the first incomplete step."';
comment on column farms.onboarding_completed_steps is 'Step keys the producer has explicitly completed or skipped, for the progress indicator.';

-- "What You Offer" — new vocabulary, deliberately separate from the existing
-- PRACTICE_OPTIONS badges (wholesale_available, pickup_available, csa_available, etc.
-- in farms.practices) rather than folded into them, since those are public trust/
-- ownership badges and this is "what kind of engagement is this business open to" —
-- a different question, even though a few options overlap by design (see
-- onboardingSteps.js OfferingsStep, which writes back into practices for the keys
-- that already exist there instead of asking twice).
alter table farms add column if not exists offerings text[] not null default '{}';
alter table farms add column if not exists serves text[] not null default '{}';
comment on column farms.offerings is 'What the business is available for — e.g. Retail, Wholesale, Custom Orders, Events. Collected in onboarding Step 4.';
comment on column farms.serves is 'Who the business works with — e.g. Restaurants, Cafes, Other Producers. Collected in onboarding Step 4.';

-- Backfill: every farm that exists before this migration runs is already live and
-- fully "onboarded" as far as Grano is concerned — mark it published so the dashboard
-- never shows a "finish setting up" prompt for an account that's been using Grano
-- since before this feature existed.
update farms
set onboarding_status = 'published',
    onboarding_published_at = coalesce(onboarding_published_at, created_at)
where onboarding_status = 'not_started';
