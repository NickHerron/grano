// Maps the current pathname to a human-readable feature name and an opening prompt for
// the feedback panel — nothing else in the codebase does this today (confirmed: no
// breadcrumb/analytics pathname map exists anywhere), so this is a fresh, small lookup
// rather than an extension of something else. Checked most-specific-prefix-first.
// Onboarding is special-cased below so its step labels come from the single source of
// truth (onboardingSteps.js) instead of a second, parallel copy of the same names.

const ROUTE_FEATURE_MAP = [
  ['/dashboard/admin', 'Admin', "What's on your mind?"],
  ['/dashboard/wholesale', 'Wholesale', 'Is anything missing that would make buying or selling wholesale easier?'],
  ['/dashboard/following', 'Local Network', 'Is it clear how your Local Network works?'],
  ['/dashboard/inquiries', 'Messages', "What's on your mind?"],
  ['/dashboard/messages', 'Messages', "What's on your mind?"],
  ['/dashboard/settings', 'Settings', "What's on your mind?"],
  ['/dashboard/producer/profile', 'Profile', 'Does your profile represent your business the way you want it to?'],
  ['/dashboard/producer/locations', 'Where to Find You', "Is it clear how to set up where you'll be?"],
  ['/dashboard/producer/gallery', 'Photos', "What's on your mind?"],
  ['/dashboard/producer/documents', 'Verification', "What's on your mind?"],
  ['/dashboard/producer/reviews', 'Reviews', "What's on your mind?"],
  ['/dashboard/producer/new', 'Products', 'Is anything confusing about adding your products?'],
  ['/dashboard/producer', 'Products', 'Is anything confusing about adding your products?'],
  ['/dashboard/restaurant/sourcing', 'Sourcing', "What's on your mind?"],
  ['/dashboard/restaurant/profile', 'Profile', 'Does your profile represent your business the way you want it to?'],
  ['/dashboard/restaurant', 'Restaurant Dashboard', "What's on your mind?"],
  ['/dashboard/profile', 'Work With Us', 'Does this section accurately represent the ways people can work with you?'],
  ['/dashboard', 'Dashboard Overview', "What's on your mind?"],
  ['/producers', 'Producers', 'Did you find what you were looking for?'],
  ['/restaurants', 'Restaurants', 'Did you find what you were looking for?'],
  ['/products', 'Products', 'Did you find what you were looking for?'],
  ['/wholesale', 'Wholesale Marketplace', 'Is anything missing that would make buying or selling wholesale easier?'],
  ['/sourcing-requests', 'Sourcing', "What's on your mind?"],
  ['/seasonal', 'Seasonal', 'Did you find what you were looking for?'],
  ['/group-buys', 'Group Buys', "What's on your mind?"],
  ['/cart', 'Cart', "What's on your mind?"],
  ['/orders', 'Orders', "What's on your mind?"],
]

const DEFAULT_FEATURE = { feature: 'Marketplace', prompt: "What's on your mind?", onboardingStep: null }

export function featureForPath(pathname) {
  if (!pathname) return DEFAULT_FEATURE

  if (pathname.startsWith('/onboarding')) {
    const step = pathname.split('/')[2] || null
    return { feature: 'Onboarding', prompt: 'How is setting up your profile going?', onboardingStep: step }
  }

  const match = ROUTE_FEATURE_MAP.find(([prefix]) => pathname.startsWith(prefix))
  if (match) return { feature: match[1], prompt: match[2], onboardingStep: null }

  if (pathname === '/') return { feature: 'Marketplace', prompt: 'Did you find what you were looking for?', onboardingStep: null }

  return DEFAULT_FEATURE
}
