// "Ready to Sell" is deliberately a separate measure from profile completion — a farm
// can have a beautiful, 100%-complete public profile and still not be ready to sell
// (no documents verified, toggle off). This only applies to producers; there's no
// equivalent commerce gate for restaurants today.

export function computeSellingReadiness(farm, { hasProducts, requiredDocRows }) {
  const checklist = [
    { label: 'Business information', done: Boolean(farm.name && farm.location && farm.producer_type) },
    { label: 'Public profile', done: Boolean(farm.bio || farm.story) },
    { label: 'Products listed', done: Boolean(hasProducts) },
    {
      label: 'Required documents uploaded',
      done: requiredDocRows.length === 0 || requiredDocRows.every(r => r.effectiveStatus !== 'not_uploaded'),
    },
    {
      label: 'Required documents verified',
      done: requiredDocRows.length === 0 || requiredDocRows.every(r => r.effectiveStatus === 'verified'),
    },
    { label: 'Selling turned on', done: Boolean(farm.sell_on_grano) },
  ]

  const percent = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)
  return { percent, checklist }
}
