// Single source of truth for "what roles does this signed-in user have." The exact
// same account_roles-fetch-plus-profiles.role-fallback logic was previously
// duplicated across 7 call sites (dashboard/layout.jsx, dashboard/page.jsx,
// dashboard/settings/page.jsx, dashboard/profile/page.jsx, onboarding/layout.jsx,
// src/app/layout.jsx, src/middleware.js), with one deliberate behavioral difference
// between two of them that this helper preserves rather than silently resolving.
//
// account_roles is the real source of truth for multi-role accounts (producer AND
// restaurant, etc.); profiles.role is just the original signup choice, kept only as a
// fallback for accounts that predate account_roles. Two fallback modes exist because
// of one real edge case: an account promoted to admin directly via the one-time SQL
// statement (see schema.sql) has no account_roles row at all, and every is_admin() RLS
// check keys off profiles.role, not account_roles — so middleware's own admin-route
// gate must fold profiles.role in unconditionally, or a SQL-promoted admin would be
// locked out of /dashboard/admin despite every RLS policy still treating them as one.
// Every other call site only needs the fallback for the ordinary case (account_roles
// entirely empty) — folding profiles.role in unconditionally there could, in
// principle, resurrect a role the user has since left via account_roles, so that's the
// safer default and stays the default here too.
export function computeRoles(roleRows, profileRole, { alwaysIncludeProfileRole = false } = {}) {
  const roles = new Set((roleRows || []).map(r => r.role))
  if (alwaysIncludeProfileRole) {
    if (profileRole) roles.add(profileRole)
  } else if (roles.size === 0 && profileRole) {
    roles.add(profileRole)
  }
  return roles
}

// Convenience wrapper for a standalone lookup (fetches account_roles itself). Callers
// that already fetch account_roles as part of a larger Promise.all alongside other
// data should call computeRoles() directly instead, to avoid a second round-trip.
export async function getUserRoles(supabase, userId, profileRole, options) {
  const { data: roleRows } = await supabase.from('account_roles').select('role').eq('user_id', userId)
  return computeRoles(roleRows, profileRole, options)
}
