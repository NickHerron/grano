// Locked public copy overlays for producers whose live DB row is still empty.
// Applied in the UI only — never written back to Supabase.

export const EL_MOLCAJETE_CARD_BIO =
  'Oaxacan moles and salsas, cooked small-batch in Evanston by chef Ernesto Rodriguez. Traditional recipes, no preservatives, vegan and gluten-free.'

export const EL_MOLCAJETE_STORY =
  'Ernesto Rodriguez never meant to start a sauce company. He was a chef preserving his mother’s mole, ran out of freezer space, and learned to can it. He named the business after the volcanic-stone molcajete used to grind spices in Oaxaca. He started in San Francisco in 2017, then moved the family to Evanston after Covid, for the schools and the lake. Five moles, plus tomatillo, estofado, and a hot chili oil. Weekly salsas from whatever urban farms like Evanston Grows have that week. Small batches, plant-based, gluten-free, no preservatives. Find him at the Evanston Farmers Market, at co-ops like Wild Onion in Rogers Park, and on elmolcajetesauces.com. He also does cooking demos, classes, and farm-to-table dinners.'

export function isElMolcajete(farm = {}) {
  return `${farm.slug || ''} ${farm.name || ''}`.toLowerCase().includes('molcajete')
}

function present(value) {
  return Boolean(value && String(value).trim())
}

// Fill empty identity fields for El Molcajete so the card and profile never look
// unfinished. Real DB values always win.
export function overlayProducerCopy(farm) {
  if (!farm || !isElMolcajete(farm)) return farm
  return {
    ...farm,
    location: present(farm.location) ? farm.location : 'Evanston, IL',
    city: present(farm.city) ? farm.city : 'Evanston',
    state: present(farm.state) ? farm.state : 'IL',
    bio: present(farm.bio) ? farm.bio : EL_MOLCAJETE_CARD_BIO,
    story: present(farm.story) ? farm.story : EL_MOLCAJETE_STORY,
  }
}

export function displayLocation(farm) {
  if (!farm) return ''
  const citySt = [farm.city, farm.state].filter(present).join(', ')
  if (citySt) return citySt
  return present(farm.location) ? farm.location : ''
}
