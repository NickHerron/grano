// Grano represents the whole local food & beverage ecosystem, not just farms —
// grouped so the profile-edit dropdown and directory filters can present related
// business types together (e.g. all beverage makers) instead of one long flat list.
// A business picks one PRIMARY type from this full list, plus any number of
// secondary types (see secondary_types on farms) — e.g. 24 Karat Bakery is
// primarily a Bakery, and secondarily a Granola Producer + Cottage Food Business.
export const PRODUCER_TYPE_GROUPS = [
  {
    group: 'Farm & Agriculture',
    types: ['Farm', 'Garden / Urban Farm', 'Flower Farm', 'Mushroom Grower', 'Apiary / Honey Producer'],
  },
  {
    group: 'Bakery & Grain',
    types: ['Bakery', 'Home Bakery', 'Mill / Grain Company'],
  },
  {
    group: 'Beverage',
    types: ['Coffee Roaster', 'Tea Company', 'Matcha Brand', 'Beverage Producer'],
  },
  {
    group: 'Specialty Food',
    types: [
      'Cheesemaker', 'Butcher / Meat Producer', 'Preserver / Jam Maker', 'Chocolate / Candy Maker',
      'Ice Cream Maker', 'Granola / Snack Company', 'Specialty Food',
    ],
  },
  {
    group: 'Other',
    types: ['Cottage Food Business', 'Food Producer', 'Restaurant', 'Cooperative', 'Other'],
  },
]

// Flat list — kept for existing code (filters, badges, form fallbacks) that just
// needs "is this a valid producer type" without caring about grouping.
export const PRODUCER_TYPES = PRODUCER_TYPE_GROUPS.flatMap(g => g.types)

// Broader self-classification checkboxes — chosen at signup ("what kind of
// producer/vendor are you?") and editable later from the profile. Deliberately
// coarser than PRODUCER_TYPE_GROUPS above (which stays as the detailed
// primary/secondary type picker on the profile form) — this is the quick,
// multi-select version meant for a fast signup decision. Stored in
// farms.business_types.
export const PRODUCER_BUSINESS_TYPES = [
  'Farm & Grower',
  'Bakery',
  'Food Producer',
  'Coffee',
  'Matcha & Tea',
  'Beverage',
  'Specialty Foods',
  'Mobile Food & Beverage',
  'Farmers Market Vendor',
  'Cottage Food Business',
  'Other',
]

// key -> label shown on the profile as a practice/ownership badge
export const PRACTICE_OPTIONS = [
  ['organic_certified', 'Certified Organic'],
  ['regenerative', 'Regenerative Practices'],
  ['sustainable', 'Sustainable Practices'],
  ['family_owned', 'Family Owned'],
  ['worker_owned', 'Worker Owned'],
  ['woman_owned', 'Woman Owned'],
  ['minority_owned', 'Minority Owned'],
  ['veteran_owned', 'Veteran Owned'],
  ['cooperative', 'Cooperative'],
  ['pickup_available', 'Pickup Available'],
  ['restaurant_sales', 'Sells to Restaurants'],
  ['csa_available', 'CSA Available'],
  // wholesale_available intentionally removed from this list — sells_wholesale
  // (schema_wholesale_capabilities.sql) is the source of truth now, set via the
  // dedicated Wholesale tab/step, not this generic practices checklist. The practices
  // column itself is untouched (frozen, not dropped) for any historical reads.
]

export const LOCATION_TYPES = [
  ['farmers_market', 'Farmers Market'],
  ['retail', 'Retail Store'],
  ['restaurant', 'Restaurant'],
  ['farm_stand', 'Farm Stand'],
  ['csa', 'CSA'],
  ['event', 'Event'],
  ['pickup', 'Pickup Location'],
]

export const SEASONS = [
  { key: 'spring', label: 'Spring', months: [3, 4, 5] },
  { key: 'summer', label: 'Summer', months: [6, 7, 8] },
  { key: 'fall',   label: 'Fall',   months: [9, 10, 11] },
  { key: 'winter', label: 'Winter', months: [12, 1, 2] },
]

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function seasonLabel(startMonth, endMonth) {
  if (!startMonth || !endMonth) return null
  if (startMonth === endMonth) return monthNames[startMonth - 1]
  return `${monthNames[startMonth - 1]} – ${monthNames[endMonth - 1]}`
}

export function isInSeasonNow(startMonth, endMonth, now = new Date()) {
  if (!startMonth || !endMonth) return false
  const m = now.getMonth() + 1
  if (startMonth <= endMonth) return m >= startMonth && m <= endMonth
  return m >= startMonth || m <= endMonth // wraps across year end
}

export const VERIFICATION_LABELS = {
  unverified: 'Unverified',
  profile_complete: 'Profile Complete',
  verified: 'Verified Producer',
}
