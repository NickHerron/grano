# Grano — Chicago's Digital Farmers Market

A farm-to-restaurant marketplace connecting Chicago restaurants directly with local producers.

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Pages

| Route | Page |
|-------|------|
| `/` | Marketplace — in season, group buys, producers, trending |
| `/producers` | All producers |
| `/producers/[slug]` | Producer profile — story, products, reviews |
| `/products/[slug]` | Product detail page |
| `/cart` | Shopping cart |
| `/newsletter` | Weekly market newsletter signup |

## Project Structure

```
src/
  app/                    # Next.js pages (App Router)
    page.jsx              # Marketplace homepage
    producers/
      page.jsx            # All producers
      [slug]/page.jsx     # Producer profile
    products/
      [slug]/page.jsx     # Product detail
    cart/page.jsx         # Cart
    newsletter/page.jsx   # Newsletter
  components/             # Reusable UI components
  data/index.js           # Mock data — replace with real DB
```

## Next Steps to Make It Real

### 1. Add a database (Supabase recommended)
Replace `src/data/index.js` with Supabase queries:
```bash
npm install @supabase/supabase-js
```

Tables to create: `farms`, `products`, `orders`, `order_items`, `reviews`, `group_buys`

### 2. Add authentication (Supabase Auth)
- Restaurants sign up → get a buyer account
- Farms sign up → get a producer dashboard
- Use Supabase's built-in auth with email/password or Google

### 3. Add payments (Stripe)
```bash
npm install stripe @stripe/stripe-js
```
- Create a Stripe account at stripe.com
- Add `STRIPE_SECRET_KEY` to `.env.local`
- Checkout route: `src/app/api/checkout/route.js`

### 4. Deploy (Vercel — free)
```bash
npm install -g vercel
vercel
```
Connect your GitHub repo and Vercel auto-deploys on every push.

### 5. Environment variables needed
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `soil` | #1E1509 | Primary text, buttons |
| `rust` | #C0622E | Accents, CTAs, links |
| `sage` | #4A7A51 | Success states, fresh badges |
| `wheat` | #C8943A | Highlights, trending |
| `stone` | #6B6355 | Secondary text |
| `linen` | #F7F5F1 | Card backgrounds, inputs |
