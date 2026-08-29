// Copy/ordering hints layered on the category data Grano already collects — NOT a new
// taxonomy and NOT a separate onboarding system per category (explicitly out of scope
// per the onboarding spec). Same wizard, same steps, same fields for everyone; this
// just swaps which example text a step shows, using the exact producer_type →
// secondary_types → business_types precedence defaultWorkOptionKeys() already
// uses in workOptions.js, so a Bakery sees a bread example instead of a produce one.
const CATEGORY_GROUP_BY_TYPE = {
  'Farm': 'farm', 'Garden / Urban Farm': 'farm', 'Flower Farm': 'farm', 'Mushroom Grower': 'farm', 'Apiary / Honey Producer': 'farm',
  'Bakery': 'bakery', 'Home Bakery': 'bakery', 'Mill / Grain Company': 'bakery',
  'Coffee Roaster': 'coffee',
  'Tea Company': 'beverage', 'Matcha Brand': 'beverage', 'Beverage Producer': 'beverage',
  'Cheesemaker': 'specialty', 'Butcher / Meat Producer': 'specialty', 'Preserver / Jam Maker': 'specialty',
  'Chocolate / Candy Maker': 'specialty', 'Ice Cream Maker': 'specialty', 'Granola / Snack Company': 'specialty', 'Specialty Food': 'specialty',
  'Cottage Food Business': 'specialty',
  // Broader signup-time checkboxes (business_types) — fallback only, see categoryGroupFor().
  'Farm & Grower': 'farm', 'Bakery & Baked Goods': 'bakery', 'Coffee & Roaster': 'coffee', 'Matcha & Tea': 'beverage', 'Beverage Producer ': 'beverage',
  'Specialty Foods': 'specialty', 'Farmers Market Vendor': 'farm', 'Cottage Food Business ': 'specialty',
}

const EXAMPLES = {
  farm: { intro: 'We grow heirloom vegetables just outside Chicago.', product: 'Heirloom Tomatoes' },
  bakery: { intro: 'We bake naturally leavened bread in small batches.', product: 'Sourdough Loaf' },
  coffee: { intro: 'We roast single-origin coffee in small batches.', product: 'Ethiopia Yirgacheffe' },
  beverage: { intro: 'We craft small-batch beverages from real ingredients.', product: 'Ceremonial Matcha' },
  specialty: { intro: 'We make small-batch specialty foods by hand.', product: 'Strawberry Preserves' },
}

// producer_type (the detailed primary/secondary picker) wins when set; falls back to
// the broader business_types checkboxes chosen at signup for an account that hasn't
// filled in Basics yet — same precedence defaultWorkOptionKeys() uses.
export function categoryGroupFor(farm) {
  const candidates = [farm.producer_type, ...(farm.secondary_types || []), ...(farm.business_types || [])]
  for (const c of candidates) {
    if (c && CATEGORY_GROUP_BY_TYPE[c]) return CATEGORY_GROUP_BY_TYPE[c]
  }
  return 'farm'
}

export function onboardingExamples(farm) {
  return EXAMPLES[categoryGroupFor(farm)] || EXAMPLES.farm
}
