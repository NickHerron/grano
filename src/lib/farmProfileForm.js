// Shared between the flat dashboard profile form (ProfileForm.jsx) and the onboarding
// wizard's Basics/Short Intro/Story steps — one definition of "what does a fresh form
// look like" and "what does a save payload look like," so the two surfaces can never
// drift out of sync with each other. Deliberately does not include photos (handled by
// ImageUploadField, which saves itself immediately on upload) or practices/offerings/
// commerce (those belong to their own steps, not the identity/story fields here).
export function initialFarmForm(farm) {
  return {
    name: farm.name || '',
    producer_type: farm.producer_type || '',
    secondary_types: farm.secondary_types || [],
    location: farm.location || '',
    neighborhood: farm.neighborhood || '',
    county: farm.county || '',
    city: farm.city || '',
    state: farm.state || '',
    city_geography_id: farm.city_geography_id || null,
    location_hidden: farm.location_hidden || false,
    founded_year: farm.founded_year || '',
    years_operating: farm.years_operating || '',
    business_email: farm.business_email || '',
    phone: farm.phone || '',
    website: farm.website || '',
    instagram: farm.instagram || '',
    facebook: farm.facebook || '',
    tiktok: farm.tiktok || '',
    x: farm.x || '',
    bio: farm.bio || '',
    story: farm.story || '',
  }
}

// Mirrors the parseInt handling ProfileForm's handleSubmit already did — the only
// fields that need coercion before hitting a numeric column.
export function farmUpdatePayload(form) {
  return {
    ...form,
    founded_year: form.founded_year ? parseInt(form.founded_year, 10) : null,
    years_operating: form.years_operating ? parseInt(form.years_operating, 10) : null,
    // If the free-text "Display location" is blank but structured city/state are
    // set, auto-fill it so the public profile never shows a blank location line
    // just because the owner used the new fields instead of the old one.
    location: form.location || (form.city && form.state ? `${form.city}, ${form.state}` : form.location),
  }
}
