export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cart', '/dashboard', '/onboarding', '/orders'],
    },
  }
}
