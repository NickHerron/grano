export const FREQUENCY_OPTIONS = [
  ['weekly', 'Weekly'],
  ['biweekly', 'Every other week'],
  ['monthly', 'Monthly'],
  ['seasonal', 'Seasonal'],
  ['one_time', 'One-time'],
]

export const DELIVERY_OPTIONS = [
  ['either', 'Pickup or delivery'],
  ['pickup', 'Pickup only'],
  ['delivery', 'Delivery only'],
]

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function seasonRangeLabel(startMonth, endMonth) {
  if (!startMonth || !endMonth) return null
  if (startMonth === endMonth) return monthNames[startMonth - 1]
  return `${monthNames[startMonth - 1]} – ${monthNames[endMonth - 1]}`
}

// sourcing_requests references its poster by (owner_type, owner_id) now that any
// business type can post one, so PostgREST can't embed it the way `restaurant:
// restaurants(...)` used to. Same batch-fetch-then-join-in-JS approach as
// hydrateInquiryBusinesses() in inquiryQueries.js — attaches `owner: {id, name, slug,
// type}` to each request.
export async function hydrateSourcingRequestOwners(supabase, requests) {
  const farmIds = new Set()
  const restaurantIds = new Set()
  for (const r of requests) {
    if (r.owner_type === 'farm') farmIds.add(r.owner_id)
    else if (r.owner_type === 'restaurant') restaurantIds.add(r.owner_id)
  }

  const [{ data: farms }, { data: restaurants }] = await Promise.all([
    farmIds.size ? supabase.from('farms').select('id, name, slug').in('id', [...farmIds]) : Promise.resolve({ data: [] }),
    restaurantIds.size ? supabase.from('restaurants').select('id, name, slug').in('id', [...restaurantIds]) : Promise.resolve({ data: [] }),
  ])
  const farmById = new Map((farms || []).map(f => [f.id, f]))
  const restaurantById = new Map((restaurants || []).map(r => [r.id, r]))

  return requests.map(r => {
    const owner = r.owner_type === 'farm' ? farmById.get(r.owner_id) : restaurantById.get(r.owner_id)
    return { ...r, owner: owner ? { ...owner, type: r.owner_type } : null }
  })
}
