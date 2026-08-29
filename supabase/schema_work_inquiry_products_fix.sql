-- Fixes a real bug found while live-testing Phase 6 (Respond to Sourcing Need): a
-- producer responding to a restaurant's sourcing request, attaching one of their own
-- products, got silently dropped — work_inquiry_products' insert policy required the
-- product's farm to match either to_id (recipient is that farm) or from_id (sender
-- explicitly picked "Sending as [farm]" in the panel). Leaving "Sending as" on
-- "Myself" while still attaching your own farm's product is a completely reasonable
-- thing to do — the policy shouldn't require both.
--
-- Rewritten to allow either of the two real cases: (a) the product belongs to the
-- farm being messaged (the original wholesale/product-inquiry case — a restaurant
-- picking one of the producer's own products), or (b) the product belongs to a farm
-- the sender actually owns, regardless of whether they declared "acting as" it.

drop policy if exists "wip_insert" on work_inquiry_products;
create policy "wip_insert" on work_inquiry_products for insert
  with check (
    exists (
      select 1 from work_inquiries i join products p on p.id = product_id
      where i.id = inquiry_id
      and i.sender_id = (select auth.uid())
      and ( (i.to_type = 'farm' and i.to_id = p.farm_id) or public.owns_business('farm', p.farm_id) )
    )
  );
