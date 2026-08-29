export const RESTAURANT_TYPES = [
  'Restaurant',
  'Cafe',
  'Coffee Shop',
  'Tea Shop',
  'Bakery',
  'Bar',
  'Catering Company',
  'Hotel',
  'Grocery Store',
  'Specialty Retailer',
  'Food Truck',
  'Institution',
  'School / University',
  'Other',
]

// Broader self-classification checkboxes — chosen at signup ("what kind of
// restaurant/buyer are you?") and editable later from the profile. Separate from
// RESTAURANT_TYPES above (a single detailed value); this is the quick, multi-select
// version meant for a fast signup decision. Stored in restaurants.business_types.
export const RESTAURANT_BUSINESS_TYPES = [
  'Restaurant & Dining',
  'Cafe & Coffee',
  'Grocery & Retail',
  'Hospitality & Events',
  'Catering',
  'Foodservice & Wholesale',
  'Other',
]
