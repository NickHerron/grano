// Shared display labels for feedback_submissions.category/status — kept separate from
// FeedbackPanel.jsx's QUICK_OPTIONS (which pairs a *button label* like "I can't find
// something" with a category, and two buttons can share one category) so "My Feedback"
// and the admin inbox show one consistent noun per category/status instead of
// re-deriving labels from button copy.

export const CATEGORY_LABELS = {
  bug: 'Bug',
  confusing_ux: 'Confusing',
  feature_request: 'Feature Request',
  missing_feature: 'Missing Feature',
  business_need: 'Business Need',
  customer_need: 'Customer Need',
  suggestion: 'Suggestion',
  positive: 'Positive Feedback',
  other: 'Other',
}

export const PRIORITY_LABELS = {
  nice_to_have: 'Would be nice',
  important: 'Important',
  really_important: 'Really important',
  blocking: 'Blocking',
}

export const STATUS_LABELS = {
  received: 'Received',
  reviewing: 'Reviewing',
  planned: 'Planned',
  in_development: 'In Development',
  completed: 'Completed',
}

// Rough progression order, used for status badge coloring (later = more resolved).
export const STATUS_ORDER = ['received', 'reviewing', 'planned', 'in_development', 'completed']
