// The configurable requirements engine: given an account's role/business type/wholesale
// status, which document types are actually required is a data question (rows in
// document_requirements), not something hard-coded here. This just does the matching.

export const CATEGORY_LABELS = {
  business: 'Business',
  food_production: 'Food / Production',
  insurance: 'Insurance',
  tax: 'Tax',
  certifications: 'Certifications',
}

export const CATEGORY_ORDER = ['business', 'food_production', 'insurance', 'tax', 'certifications']

export const STATUS_LABELS = {
  not_uploaded: 'Not uploaded',
  uploaded: 'Uploaded',
  under_review: 'Under review',
  verified: 'Verified',
  needs_attention: 'Needs attention',
  expired: 'Expired',
}

// documentTypes: all rows from document_types
// requirements: all rows from document_requirements
// Returns a Set of document_type ids required for this role/businessType/wholesaleOnly.
export function requiredTypeIds(requirements, role, businessType, wholesaleOnly) {
  const ids = new Set()
  for (const r of requirements) {
    if (r.applies_to_role !== role) continue
    if (r.applies_to_business_type && r.applies_to_business_type !== businessType) continue
    if (r.applies_to_wholesale_only === true && !wholesaleOnly) continue
    ids.add(r.document_type_id)
  }
  return ids
}

// Combines a document type with its most relevant uploaded document (if any) into one
// row for display: { type, document, effectiveStatus, expiringWithinDays }
export function buildDocumentRows(documentTypes, documents, requiredIds) {
  const byType = new Map()
  for (const d of documents) {
    // keep the most recently uploaded document per type
    const existing = byType.get(d.document_type_id)
    if (!existing || new Date(d.uploaded_at) > new Date(existing.uploaded_at)) byType.set(d.document_type_id, d)
  }

  return documentTypes.map(type => {
    const document = byType.get(type.id) || null
    let effectiveStatus = document ? document.status : 'not_uploaded'
    let expiringWithinDays = null

    if (document?.expiration_date) {
      const days = Math.ceil((new Date(document.expiration_date) - new Date()) / 86400000)
      if (days < 0) effectiveStatus = 'expired'
      else if (days <= 30) expiringWithinDays = days
    }

    return {
      type,
      document,
      required: requiredIds.has(type.id),
      effectiveStatus,
      expiringWithinDays,
    }
  })
}
