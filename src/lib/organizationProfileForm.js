// Mirrors farmProfileForm.js's pattern — one definition of "what does a fresh
// organization form look like" and "what does a save payload look like." Organizations
// reuse farm_locations' exact schedule column names/semantics (see
// schema_organizations.sql), so the schedule fields here are handled the same way
// LocationsManager.jsx handles them for a farm_locations row.
export function initialOrganizationForm(org) {
  return {
    name: org.name || '',
    org_type: org.org_type || 'other',
    description: org.description || '',
    location: org.location || '',
    neighborhood: org.neighborhood || '',
    address: org.address || '',
    city: org.city || '',
    state: org.state || '',
    city_geography_id: org.city_geography_id || null,
    website: org.website || '',
    hours: org.hours || '',
    days: org.days || '',
    schedule_type: org.schedule_type || 'custom',
    schedule_days: org.schedule_days || [],
    schedule_anchor_date: org.schedule_anchor_date || '',
    schedule_dates: org.schedule_dates || [],
    schedule_exceptions: org.schedule_exceptions || [],
    starts_on: org.starts_on || '',
    ends_on: org.ends_on || '',
    // Legacy month-based season fields — carried through untouched, same reasoning as
    // LocationsManager.jsx: no UI here edits these, but saving shouldn't blow them away.
    seasonal_start: org.seasonal_start || '',
    seasonal_end: org.seasonal_end || '',
  }
}

// Only the fields relevant to the active schedule_type get written — same rule
// LocationsManager.jsx applies to farm_locations, so switching schedule types doesn't
// leave stale data from a previous type sitting in unrelated columns.
export function organizationUpdatePayload(form) {
  return {
    name: form.name,
    org_type: form.org_type,
    description: form.description || null,
    // Auto-fills the free-text display location from structured city/state when the
    // owner used the new fields instead of the old one — same rule farmProfileForm.js
    // applies.
    location: form.location || (form.city && form.state ? `${form.city}, ${form.state}` : form.location) || null,
    neighborhood: form.neighborhood || null,
    address: form.address || null,
    city: form.city || null,
    state: form.state || null,
    city_geography_id: form.city_geography_id || null,
    website: form.website || null,
    hours: form.hours || null,
    schedule_type: form.schedule_type,
    schedule_days: form.schedule_type === 'weekly' || form.schedule_type === 'biweekly' ? form.schedule_days : [],
    schedule_anchor_date: form.schedule_type === 'biweekly' ? (form.schedule_anchor_date || null) : null,
    schedule_dates: form.schedule_type === 'specific_dates' ? form.schedule_dates : [],
    schedule_exceptions: form.schedule_type === 'weekly' || form.schedule_type === 'biweekly' ? form.schedule_exceptions : [],
    days: form.schedule_type === 'custom' ? (form.days || null) : null,
    starts_on: form.starts_on || null,
    ends_on: form.ends_on || null,
    seasonal_start: form.seasonal_start || null,
    seasonal_end: form.seasonal_end || null,
  }
}
