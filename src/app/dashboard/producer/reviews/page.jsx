import { redirect } from 'next/navigation'

// Reviews now lives at Profile → Producer Profile → Reviews.
export default function ProducerReviewsRedirect() {
  redirect('/dashboard/profile?section=producer&tab=reviews')
}
