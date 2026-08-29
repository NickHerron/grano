import { redirect } from 'next/navigation'

export default function ProducerPostsRedirect() {
  redirect('/dashboard/profile?section=producer&tab=posts')
}
