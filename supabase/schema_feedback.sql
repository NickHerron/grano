-- Help Improve Grano — Phase 1: feedback submissions + optional attachments.
--
-- USER -> GRANO only. Deliberately separate from messages/work_inquiries (BUSINESS <->
-- BUSINESS) and sourcing_requests (posted want-ads) — this is a private note to the
-- Grano team, never visible to any other business, never part of the messaging or
-- inquiry systems. No AI involved anywhere: category is the user's own quick-option
-- pick (or 'other' if they just typed), never inferred.
--
-- Modeled directly on documents' owner-or-admin shape (schema_documents.sql) — same
-- private-storage-bucket idiom, same is_admin() gate — except simpler, since feedback
-- has exactly one owner (a person, not a farm/restaurant dual-owner branch) and is
-- never editable by its owner after submission (the "My Feedback" view is read-only
-- history; only an admin moves status or writes a response).

create table if not exists feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,

  category text not null check (category in
    ('bug', 'confusing_ux', 'feature_request', 'missing_feature', 'business_need', 'customer_need', 'suggestion', 'positive', 'other')),
  message text not null,
  priority text check (priority in ('nice_to_have', 'important', 'really_important', 'blocking')),

  -- Automatic context, captured at submission time — never asked of the user. A
  -- snapshot, not a live reference: if a farm/restaurant is later deleted or the
  -- user's roles change, this row still shows what was true when they wrote it.
  account_type text,
  business_kind text check (business_kind in ('farm', 'restaurant')),
  business_id uuid,
  business_type text,
  page_path text,
  feature text,
  onboarding_step text,
  device_type text check (device_type in ('mobile', 'desktop')),

  status text not null default 'received'
    check (status in ('received', 'reviewing', 'planned', 'in_development', 'completed')),
  admin_response text,   -- shown to the user if set
  admin_notes text,      -- private, admin-only, never shown to the user

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_submissions_user_id_idx on feedback_submissions(user_id);
create index if not exists feedback_submissions_status_idx on feedback_submissions(status);
create index if not exists feedback_submissions_category_idx on feedback_submissions(category);
create index if not exists feedback_submissions_created_at_idx on feedback_submissions(created_at desc);

drop trigger if exists feedback_submissions_set_updated_at on feedback_submissions;
create trigger feedback_submissions_set_updated_at
  before update on feedback_submissions
  for each row execute procedure set_updated_at();

create table if not exists feedback_attachments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references feedback_submissions(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_attachments_feedback_id_idx on feedback_attachments(feedback_id);

alter table feedback_submissions enable row level security;
alter table feedback_attachments enable row level security;

-- Owner can see and create their own feedback; only an admin can change it (move
-- status, write a response). No owner-update policy at all — submissions are
-- write-once from the sender's side, matching "My Feedback" being a read-only history.
create policy "feedback_submissions_select_own_or_admin" on feedback_submissions for select
  using (public.is_admin() or (select auth.uid()) = user_id);

create policy "feedback_submissions_insert_own" on feedback_submissions for insert
  with check ((select auth.uid()) = user_id);

create policy "feedback_submissions_update_admin" on feedback_submissions for update
  using (public.is_admin());

create policy "feedback_submissions_delete_admin" on feedback_submissions for delete
  using (public.is_admin());

-- Attachments follow their parent submission's ownership — no separate owner column,
-- just a join back to feedback_submissions.user_id.
create policy "feedback_attachments_select_own_or_admin" on feedback_attachments for select
  using (
    public.is_admin()
    or (select auth.uid()) = (select user_id from feedback_submissions where feedback_submissions.id = feedback_attachments.feedback_id)
  );

create policy "feedback_attachments_insert_own" on feedback_attachments for insert
  with check (
    (select auth.uid()) = (select user_id from feedback_submissions where feedback_submissions.id = feedback_attachments.feedback_id)
  );

create policy "feedback_attachments_delete_admin" on feedback_attachments for delete
  using (public.is_admin());

-- ============ PRIVATE STORAGE BUCKET ============
-- Same private-bucket idiom as business-documents: no public URL, only short-lived
-- signed URLs for the owner or an admin. Path convention: {user_id}/{timestamp}-
-- {filename} — one owner column, no farm/restaurant type branch needed here.

insert into storage.buckets (id, name, public)
values ('feedback-attachments', 'feedback-attachments', false)
on conflict (id) do nothing;

create policy "feedback_attachments_owner_or_admin_all" on storage.objects for all
  using (
    storage.objects.bucket_id = 'feedback-attachments' and (
      public.is_admin()
      or (select auth.uid())::text = (storage.foldername(storage.objects.name))[1]
    )
  )
  with check (
    storage.objects.bucket_id = 'feedback-attachments' and (
      public.is_admin()
      or (select auth.uid())::text = (storage.foldername(storage.objects.name))[1]
    )
  );
