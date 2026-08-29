import { redirect } from 'next/navigation'

export default function ProducerGalleryRedirect() {
  redirect('/dashboard/profile?section=producer&tab=photos')
}
