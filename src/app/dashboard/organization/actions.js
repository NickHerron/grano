'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ORG_TYPE_LABELS } from '@/lib/businessNetwork'
import { findSimilarOrganizations, insertOrganizationWithSlug } from '@/lib/organizationNames'

// Deliberately does not touch account_roles — creating an organization is not a new
// account role, it's a business row anyone signed in can create, same as how a farm
// or restaurant row is the real object behind the producer/restaurant roles, minus
// the role.
//
// The slug-retry insert lives in organizationNames.js now, shared with
// dashboard/profiles/actions.js's createProfileFromRoles() — the two had already
// diverged into separate copies of the identical logic before that file existed.
export async function createOrganization(formData, confirmedDuplicate = false) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const name = formData.get('name')?.toString().trim()
  const orgType = formData.get('org_type')?.toString()
  if (!name) return { error: 'Organization name is required.' }
  if (!Object.keys(ORG_TYPE_LABELS).includes(orgType)) return { error: 'Choose a valid organization type.' }

  // Advisory, never blocking — surfaced once, skipped on the confirmed retry.
  if (!confirmedDuplicate) {
    const duplicates = await findSimilarOrganizations(supabase, name)
    if (duplicates.length) return { duplicates }
  }

  const { data, error } = await insertOrganizationWithSlug(supabase, { ownerId: user.id, name, orgType })
  if (error) return { error: error.message || 'Could not create organization.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/organization')
  revalidatePath('/dashboard/settings')
  return { success: true, id: data.id, slug: data.slug }
}
