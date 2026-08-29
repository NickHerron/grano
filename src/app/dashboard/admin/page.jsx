import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import RoleCheckboxes from './RoleCheckboxes'
import VerificationSelect from './VerificationSelect'
import CategorySelect from './CategorySelect'
import DeleteRow from './DeleteRow'
import DeleteAccountButton from './DeleteAccountButton'
import DocumentReviewControl from './DocumentReviewControl'
import LiveMarketplaceToggle from './LiveMarketplaceToggle'
import MarketBackfillRow from './MarketBackfillRow'
import GeographyBackfillPanel from './GeographyBackfillPanel'
import MarketAreasPanel from './MarketAreasPanel'
import { STATUS_LABELS } from '@/lib/documentRequirements'

const ROLE_LABELS = { producer: 'Producer', restaurant: 'Restaurant', customer: 'Consumer', admin: 'Admin' }
const ROLE_BADGE_STYLES = {
  producer: 'bg-[#FDF0E8] text-rust',
  restaurant: 'bg-[#EBF3EC] text-sage',
  customer: 'bg-linen text-stone',
  admin: 'bg-soil text-white',
}

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (myProfile?.role !== 'admin') redirect('/dashboard')

  const [
    { data: profiles }, { data: farms }, { data: products }, { data: restaurants }, { data: pendingDocuments },
    { data: accountRoles }, { data: siteSettings }, { data: openRequests },
    { count: newFeedbackCount }, { count: totalFeedbackCount },
    { data: marketAreas }, { data: unlinkedMarketLocations }, { data: organizations },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('farms').select('*, profiles(full_name)').order('created_at', { ascending: false }),
    supabase.from('products').select('*, farms(name)').order('created_at', { ascending: false }),
    supabase.from('restaurants').select('*, profiles(full_name)').order('created_at', { ascending: false }),
    supabase.from('documents').select('*, document_type:document_types(name), farm:farms(name), restaurant:restaurants(name)').neq('status', 'verified').order('uploaded_at', { ascending: false }),
    supabase.from('account_roles').select('user_id, role'),
    supabase.from('site_settings').select('live_marketplace_enabled').eq('id', true).maybeSingle(),
    // Open requests: broadcast messages visible to every producer (farm_id null) —
    // the ones an admin needs to be able to pull down if someone posts something
    // they shouldn't.
    supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(full_name, restaurant_name)').is('farm_id', null).order('created_at', { ascending: false }),
    supabase.from('feedback_submissions').select('id', { count: 'exact', head: true }).eq('status', 'received'),
    supabase.from('feedback_submissions').select('id', { count: 'exact', head: true }),
    supabase.from('market_areas').select('*').order('created_at', { ascending: true }),
    // Phase 10 of the Network Layer plan: every farm's own free-text "farmers
    // market" location that hasn't been linked to a real organizations row yet —
    // grouped below by exact name so an admin can match "Logan Square Farmers
    // Market" (spelled the same way by several producers) to one real org in a
    // single action.
    supabase.from('farm_locations').select('id, name, farm:farms(name)').eq('location_type', 'farmers_market').is('organization_id', null),
    // Widened for the new Organizations verification section below — additive, since
    // MarketBackfillRow (the only other consumer of this array) only reads id/name.
    supabase.from('organizations').select('id, name, slug, org_type, location, verification_status, owner_id, profiles(full_name)').order('name'),
  ])

  const admin = createAdminClient()
  const { data: authUsers } = await admin.auth.admin.listUsers()
  const emailById = Object.fromEntries((authUsers?.users || []).map(u => [u.id, u.email]))

  // Pending verification requests surface first — that's the actionable queue.
  const VERIFICATION_SORT_ORDER = { pending_verification: 0, unverified: 1, verified: 2 }
  const sortedOrganizations = [...(organizations || [])].sort((a, b) =>
    (VERIFICATION_SORT_ORDER[a.verification_status] ?? 1) - (VERIFICATION_SORT_ORDER[b.verification_status] ?? 1))

  const rolesByUser = (accountRoles || []).reduce((acc, r) => {
    (acc[r.user_id] = acc[r.user_id] || []).push(r.role)
    return acc
  }, {})

  const marketNameGroups = Object.values((unlinkedMarketLocations || []).reduce((acc, loc) => {
    const key = loc.name?.trim()
    if (!key) return acc
    if (!acc[key]) acc[key] = { name: key, locationIds: [], farmNames: [] }
    acc[key].locationIds.push(loc.id)
    acc[key].farmNames.push(loc.farm?.name || '—')
    return acc
  }, {})).sort((a, b) => b.locationIds.length - a.locationIds.length)

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-[28px] font-semibold text-soil mb-1">Admin Panel</h1>
        <p className="text-[14px] text-stone">{profiles?.length || 0} accounts · {farms?.length || 0} farms · {products?.length || 0} products</p>
      </div>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Marketplace</h2>
        <LiveMarketplaceToggle enabled={siteSettings?.live_marketplace_enabled ?? true} />
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Geography</h2>
        <p className="text-[13px] text-stone mb-3">Structured city/state on top of existing free-text locations — powers /locations discovery. Purely additive; nothing existing changes.</p>
        <GeographyBackfillPanel />
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-1">Market Areas</h2>
        <p className="text-[13px] text-stone mb-3">Areas Grano tracks as a distinct market. Toggling "Marketplace On" controls ONLY that area's /locations "Shop Local" presentation — the real checkout gate above is unaffected.</p>
        <MarketAreasPanel areas={marketAreas || []} />
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Feedback</h2>
        <Link href="/dashboard/admin/feedback"
          className="flex items-center justify-between gap-4 bg-white border border-[#ECEAE4] rounded-xl px-5 py-4 hover:border-wheat transition-colors">
          <div>
            <div className="text-[14px] font-semibold text-soil">{totalFeedbackCount || 0} submission{totalFeedbackCount === 1 ? '' : 's'} from "Help Improve Grano"</div>
            <div className="text-[12px] text-stone">{newFeedbackCount || 0} not yet reviewed</div>
          </div>
          <span className="text-[13px] font-semibold text-rust">Open inbox →</span>
        </Link>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Accounts</h2>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {profiles?.map(p => {
            // account_roles is the source of truth for what an account can actually
            // do (an account can hold several); profiles.role is just the original
            // signup choice, kept below as a fallback for accounts predating that system.
            const roles = rolesByUser[p.id]?.length ? rolesByUser[p.id] : (p.role ? [p.role] : [])
            return (
              <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-soil truncate">{p.full_name || 'Unnamed'}</div>
                  <div className="text-[11px] text-stone truncate mb-1">{emailById[p.id] || p.id}</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {roles.length ? roles.map(r => (
                      <span key={r} className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${ROLE_BADGE_STYLES[r] || 'bg-linen text-stone'}`}>
                        {ROLE_LABELS[r] || r}
                      </span>
                    )) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-linen text-stone">No role set</span>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-shrink-0">
                  <RoleCheckboxes userId={p.id} initialRoles={roles} disabled={p.id === user.id} />
                  <DeleteAccountButton userId={p.id} disabled={p.id === user.id} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Farms</h2>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {farms?.length ? farms.map(f => (
            <div key={f.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-soil truncate">{f.name}</div>
                <div className="text-[11px] text-stone truncate">{f.location} · owner: {f.profiles?.full_name || '—'} · {f.sell_on_grano ? 'selling' : 'not selling'}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <VerificationSelect farmId={f.id} status={f.verification_status || 'unverified'} />
                <DeleteRow table="farms" id={f.id} />
              </div>
            </div>
          )) : <div className="px-5 py-6 text-[13px] text-stone">No farms yet.</div>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Restaurants</h2>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {restaurants?.length ? restaurants.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-soil truncate">{r.name}</div>
                <div className="text-[11px] text-stone truncate">{r.location || '—'} · owner: {r.profiles?.full_name || '—'}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <VerificationSelect farmId={r.id} status={r.verification_status || 'unverified'} table="restaurants" />
                <DeleteRow table="restaurants" id={r.id} />
              </div>
            </div>
          )) : <div className="px-5 py-6 text-[13px] text-stone">No restaurants yet.</div>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Organizations</h2>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {sortedOrganizations.length ? sortedOrganizations.map(o => (
            <div key={o.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-soil truncate">{o.name}</span>
                  {o.verification_status === 'pending_verification' && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-rust bg-[#FDF0E8] px-1.5 py-0.5 rounded flex-shrink-0">Requested</span>
                  )}
                </div>
                <div className="text-[11px] text-stone truncate">{o.location || '—'} · owner: {o.profiles?.full_name || '—'}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <VerificationSelect farmId={o.id} status={o.verification_status || 'unverified'} table="organizations" />
                <DeleteRow table="organizations" id={o.id} />
              </div>
            </div>
          )) : <div className="px-5 py-6 text-[13px] text-stone">No organizations yet.</div>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Documents Pending Review</h2>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {pendingDocuments?.length ? pendingDocuments.map(d => (
            <div key={d.id} className="px-5 py-4 border-b border-[#F0EDE7] last:border-0">
              <div className="flex items-center justify-between gap-4 mb-1">
                <div className="text-[13px] font-semibold text-soil">{d.document_type?.name}</div>
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-linen text-stone px-2 py-0.5 rounded">{STATUS_LABELS[d.status]}</span>
              </div>
              <div className="text-[11px] text-stone mb-1">{d.farm?.name || d.restaurant?.name || '—'}</div>
              {d.notes && <div className="text-[12px] text-soil mb-1">"{d.notes}"</div>}
              <DocumentReviewControl documentId={d.id} status={d.status} adminNotes={d.admin_notes} />
            </div>
          )) : <div className="px-5 py-6 text-[13px] text-stone">Nothing pending review.</div>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Products</h2>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {products?.length ? products.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-soil truncate">{p.name}</div>
                <div className="text-[11px] text-stone truncate">{p.farms?.name || '—'} · ${p.price} / {p.unit} · stock: {p.stock ?? '—'}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <CategorySelect productId={p.id} category={p.category} />
                <DeleteRow table="products" id={p.id} />
              </div>
            </div>
          )) : <div className="px-5 py-6 text-[13px] text-stone">No products yet.</div>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Farmers Markets — Claim / Backfill</h2>
        <p className="text-[13px] text-stone mb-3">Free-text market names producers have already entered in Find Us, not yet linked to a real organization profile. Linking one connects every producer using that exact spelling at once.</p>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {marketNameGroups.length ? marketNameGroups.map(g => (
            <MarketBackfillRow key={g.name} name={g.name} locationIds={g.locationIds} farmNames={g.farmNames} organizations={organizations || []} />
          )) : <div className="px-5 py-6 text-[13px] text-stone">Nothing unlinked right now.</div>}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-[20px] font-semibold text-soil mb-3">Open Requests</h2>
        <p className="text-[13px] text-stone mb-3">Broadcast messages visible to every producer — remove anything that shouldn't be there.</p>
        <div className="bg-white border border-[#ECEAE4] rounded-xl overflow-hidden">
          {openRequests?.length ? openRequests.map(m => (
            <div key={m.id} className="flex items-start justify-between gap-4 px-5 py-3 border-b border-[#F0EDE7] last:border-0">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-soil truncate">
                  {m.sender?.restaurant_name || m.sender?.full_name || 'Unknown sender'}
                </div>
                <div className="text-[11px] text-stone mb-1">{new Date(m.created_at).toLocaleDateString()}</div>
                <p className="text-[13px] text-soil">{m.text}</p>
              </div>
              <DeleteRow table="messages" id={m.id} />
            </div>
          )) : <div className="px-5 py-6 text-[13px] text-stone">No open requests posted.</div>}
        </div>
      </section>
    </div>
  )
}
