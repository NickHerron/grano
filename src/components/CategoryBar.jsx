// The full set of individual category values a product can actually have — used
// wherever a specific value is required (e.g. the product-category select when a
// producer adds a listing).
export const categories = [
  { key: 'all',        label: 'All' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruit',      label: 'Fruit' },
  { key: 'bakery',     label: 'Bakery' },
  { key: 'grains',     label: 'Grains & Flour' },
  { key: 'dairy',      label: 'Dairy & Eggs' },
  { key: 'mushrooms',  label: 'Mushrooms' },
  { key: 'honey',      label: 'Honey & Preserves' },
  { key: 'meat',       label: 'Meat & Poultry' },
  { key: 'coffee',     label: 'Coffee' },
  { key: 'matcha',     label: 'Matcha' },
  { key: 'tea',        label: 'Tea' },
  { key: 'beverages',  label: 'Other Beverages' },
  { key: 'pantry',     label: 'Ferments & Pantry' },
  { key: 'flowers',    label: 'Flowers & Herbs' },
]

// The filter bar groups a few of those individual categories under one chip so the
// row doesn't sprawl — Coffee/Matcha/Tea browse together as one chip even though a
// product's own category value is still one of the specific ones above. `match` is
// the set of underlying category values a chip should include; `all` matches every
// category (null instead of listing them out).
export const filterCategories = [
  { key: 'all',              label: 'All',                  match: null },
  { key: 'vegetables',       label: 'Vegetables',            match: ['vegetables'] },
  { key: 'fruit',            label: 'Fruit',                 match: ['fruit'] },
  { key: 'bakery',           label: 'Bakery',                match: ['bakery'] },
  { key: 'grains',           label: 'Grains & Flour',        match: ['grains'] },
  { key: 'dairy',            label: 'Dairy & Eggs',          match: ['dairy'] },
  { key: 'mushrooms',        label: 'Mushrooms',             match: ['mushrooms'] },
  { key: 'honey',            label: 'Honey & Preserves',     match: ['honey'] },
  { key: 'meat',             label: 'Meat & Poultry',        match: ['meat'] },
  { key: 'coffee_matcha_tea',label: 'Coffee, Matcha & Tea',  match: ['coffee', 'matcha', 'tea'] },
  { key: 'beverages',        label: 'Beverages',             match: ['beverages'] },
  { key: 'pantry',           label: 'Ferments & Pantry',     match: ['pantry'] },
  { key: 'flowers',          label: 'Flowers & Herbs',       match: ['flowers'] },
]

export default function CategoryBar({ active, onChange }) {
  return (
    <div className="bg-white border-b border-[#ECEAE4] px-4 sm:px-8 flex gap-1 overflow-x-auto scrollbar-hide">
      {filterCategories.map(c => (
        <button key={c.key} onClick={() => onChange(c.key)}
          className={`text-[13px] font-medium whitespace-nowrap px-3.5 py-3 border-b-2 transition-colors ${
            active === c.key ? 'text-rust border-rust font-semibold' : 'text-stone border-transparent hover:text-soil'
          }`}>
          {c.label}
        </button>
      ))}
    </div>
  )
}
