// Explicit locale + UTC timezone so server-rendered HTML always matches what the
// client re-renders during hydration — using the runtime's default locale/timezone
// (e.g. plain toLocaleDateString()) can differ between server and browser and causes
// React hydration mismatches.
export function formatDate(dateString, options = { month: 'long', day: 'numeric', year: 'numeric' }) {
  return new Date(dateString).toLocaleDateString('en-US', { timeZone: 'UTC', ...options })
}
