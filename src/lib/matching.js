// Lightweight producer <-> restaurant matching: does a product a producer sells look
// like something a restaurant is asking for? Deliberately simple (case-insensitive
// substring match in either direction, plus a category match) rather than a real
// search/ranking system — this is meant to surface plausible opportunities to look at,
// not a guaranteed match.

function normalize(text) {
  return (text || '').toLowerCase().trim()
}

export function isLikelyMatch(productName, productCategory, requestedName) {
  const a = normalize(productName)
  const b = normalize(requestedName)
  if (!a || !b) return false
  if (a.includes(b) || b.includes(a)) return true
  // word-level overlap catches e.g. "Heirloom Tomatoes" vs "Tomatoes"
  const aWords = new Set(a.split(/\s+/).filter(w => w.length > 3))
  const bWords = b.split(/\s+/).filter(w => w.length > 3)
  if (bWords.some(w => aWords.has(w))) return true
  return normalize(productCategory) === b
}

// products: [{ name, category }], requests: [{ product_name, ... }]
// Returns requests grouped with which of the producer's products matched each one.
export function findOpportunitiesForProducer(products, requests) {
  const results = []
  for (const req of requests) {
    const matchedProducts = products.filter(p => isLikelyMatch(p.name, p.category, req.product_name))
    if (matchedProducts.length) results.push({ request: req, matchedProducts })
  }
  return results
}

// restaurantRequests: [{ product_name }], producers: [{ farm, products: [{name, category}] }]
// Returns producers with which of their products matched which of the restaurant's requests.
export function findVendorsForRestaurant(restaurantRequests, producers) {
  const results = []
  for (const producer of producers) {
    const matches = []
    for (const p of producer.products) {
      const matchedRequest = restaurantRequests.find(r => isLikelyMatch(p.name, p.category, r.product_name))
      if (matchedRequest) matches.push(p.name)
    }
    if (matches.length) results.push({ farm: producer.farm, matchedProducts: [...new Set(matches)] })
  }
  return results
}
