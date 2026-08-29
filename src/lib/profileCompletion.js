export function computeProfileCompletion(farm, { productCount = 0, photoCount = 0, locationCount = 0, hasSeasonalProduct = false } = {}) {
  const checklist = [
    { label: 'Business name', done: Boolean(farm.name) },
    { label: 'Location', done: Boolean(farm.location) },
    { label: 'Story', done: Boolean(farm.bio || farm.story) },
    { label: 'Profile photo', done: Boolean(farm.logo_url || farm.profile_photo_url) },
    { label: 'Cover photo', done: Boolean(farm.cover_photo_url) },
    { label: 'Products', done: productCount > 0 },
    { label: 'Social links', done: Boolean(farm.website || farm.instagram || farm.facebook || farm.tiktok) },
    { label: 'Add farm photos', done: photoCount > 0 },
    { label: 'Add seasonal availability', done: hasSeasonalProduct },
    { label: 'Add market locations', done: locationCount > 0 },
  ]
  const percent = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)
  return { percent, checklist }
}

// Feeds the onboarding wizard's Review step — a richer list than computeProfileCompletion
// above (which the dashboard's bare-percentage widget keeps using unchanged), pairing
// each item with `why` (what it actually enables, never a ranking/traffic promise —
// see the onboarding spec's explicit instruction) and `stepKey` (where to go fix it).
// `ctx` is the same shape firstIncompleteStep() takes: productCount, locationCount,
// eventCount, networkCount, workOptionCount, documentCount.
export function buildProfileRecommendations(farm, ctx = {}) {
  return [
    {
      key: 'intro', label: 'Short intro', done: Boolean(farm.bio), stepKey: 'intro',
      why: 'Shows in a larger type at the top of your story and in preview cards across Grano.',
    },
    {
      key: 'story', label: 'Full story', done: Boolean(farm.story), stepKey: 'story',
      why: "Producers say a real story is what turns a passing look into a follow, a message, or an order.",
    },
    {
      key: 'offerings', label: 'What you offer', done: Boolean(farm.offerings?.length), stepKey: 'offerings',
      why: 'Tailors what shows on your profile and pre-fills your Work With Us options.',
    },
    {
      key: 'wholesale', label: 'Wholesale', done: Boolean(farm.sells_wholesale || farm.buys_wholesale), stepKey: 'wholesale',
      why: "Whether you sell wholesale, buy it, or both — never assumed from what kind of business you are.",
    },
    {
      key: 'products', label: 'Products', done: Boolean(ctx.productCount > 0), stepKey: 'products',
      why: 'A product is what turns a profile visit into a follow, a message, or an order.',
    },
    {
      key: 'find-us', label: 'Where to find you', done: Boolean(ctx.locationCount > 0), stepKey: 'find-us',
      why: 'Powers the "Where to Find Us" section on your public profile with real dates buyers can plan around.',
    },
    {
      key: 'network', label: 'Local network', done: Boolean(ctx.networkCount > 0), stepKey: 'network',
      why: 'Shows the real relationships behind your business — who you source from, who you supply.',
    },
    {
      key: 'work-with-us', label: 'Work With Us options', done: Boolean(ctx.workOptionCount > 0), stepKey: 'work-with-us',
      why: 'Lets people send exactly the kind of request you want, instead of a generic contact form.',
    },
    {
      key: 'verification', label: 'Business verification', done: Boolean(ctx.documentCount > 0), stepKey: 'verification',
      why: "Verified businesses get a badge — a signal to buyers that Grano has confirmed who you are.",
    },
  ]
}
