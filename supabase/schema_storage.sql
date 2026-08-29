-- Grano storage — run this AFTER schema.sql, once, in the Supabase SQL Editor.
-- IMPORTANT: open the "Storage" tab in the Supabase dashboard sidebar at least once
-- BEFORE running this — that's what provisions the storage schema on new projects.
-- If you skip that and run this anyway, it will fail with:
--   ERROR: relation "storage.buckets" does not exist

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

create policy "product_photos_authenticated_upload"
  on storage.objects for insert
  with check (bucket_id = 'product-photos' and auth.role() = 'authenticated');

create policy "product_photos_owner_update"
  on storage.objects for update
  using (bucket_id = 'product-photos' and auth.uid() = owner);

create policy "product_photos_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'product-photos' and auth.uid() = owner);
