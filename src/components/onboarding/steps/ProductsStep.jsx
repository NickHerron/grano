'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProductForm from '@/app/dashboard/producer/ProductForm'
import SourcedFromEditor from '@/components/SourcedFromEditor'
import WizardShell from '@/components/onboarding/WizardShell'
import QuickPulse, { ONBOARDING_PULSE_OPTIONS } from '@/components/feedback/QuickPulse'
import { advancePayload, nextDestination, previousDestination } from '@/lib/onboardingProgress'
import { onboardingExamples } from '@/lib/onboardingEmphasis'

export default function ProductsStep({ farm, initialProducts }) {
  const router = useRouter()
  const supabase = createClient()
  const [products, setProducts] = useState(initialProducts)
  const [showForm, setShowForm] = useState(initialProducts.length === 0)
  const [continuing, setContinuing] = useState(false)
  const [error, setError] = useState('')
  const [sourcesOpenFor, setSourcesOpenFor] = useState(null)

  // ProductForm inserts the row itself and hands nothing back — reload this farm's
  // products so the list reflects what it just added.
  async function handleAdded() {
    const { data } = await supabase.from('products').select('*').eq('farm_id', farm.id).order('created_at', { ascending: false })
    setProducts(data || [])
    setShowForm(false)
  }

  async function save() {
    setContinuing(true)
    setError('')
    const dest = nextDestination('products')
    const { error: dbError } = await supabase.from('farms').update(advancePayload(farm, 'products', dest.nextKey)).eq('id', farm.id)
    setContinuing(false)
    if (dbError) { setError(dbError.message); return }
    router.push(dest.href)
  }

  const dest = nextDestination('products')
  const examples = onboardingExamples(farm)

  return (
    <WizardShell
      stepKey="products"
      title="What are you selling?"
      subtitle="Add a product or two to start — you can always add more later from your dashboard."
      explain="A product is what turns a profile visit into a follow, a message, or an order. Even one listed item gives people something concrete to react to."
      onBack={() => router.push(previousDestination('products'))}
      onSkip={save}
      skipLabel="Skip for now"
      onContinue={save}
      continuing={continuing}
      continueLabel={dest.implemented ? 'Continue' : 'Continue to dashboard'}
      error={error}
    >
      <div className="flex flex-col gap-4">
        {products.length > 0 && (
          <div className="flex flex-col gap-2">
            {products.map(p => (
              <div key={p.id} className="flex flex-col gap-2">
                <div className="bg-linen rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-soil">{p.name}</div>
                    <div className="text-[12px] text-stone capitalize">{p.category || 'Uncategorized'} · ${p.price} / {p.unit}</div>
                  </div>
                  <button type="button" onClick={() => setSourcesOpenFor(sourcesOpenFor === p.id ? null : p.id)}
                    className="text-[12px] font-semibold text-rust hover:underline flex-shrink-0">
                    {sourcesOpenFor === p.id ? 'Hide sources' : 'Sourced from →'}
                  </button>
                </div>
                {sourcesOpenFor === p.id && (
                  <SourcedFromEditor productId={p.id} farmId={farm.id} farmName={farm.name} />
                )}
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <div className="bg-white border border-[#ECEAE4] rounded-xl p-5">
            <ProductForm farmId={farm.id} onSaved={handleAdded} namePlaceholder={examples.product} />
          </div>
        ) : (
          <button type="button" onClick={() => setShowForm(true)}
            className="self-start text-[13px] font-semibold text-rust hover:underline">
            + Add {products.length ? 'another' : 'a'} product
          </button>
        )}

        {products.length > 0 && (
          <QuickPulse question="Is anything confusing about adding your products?" options={ONBOARDING_PULSE_OPTIONS}
            context={{ accountType: 'producer', businessKind: 'farm', businessId: farm.id, businessType: farm.producer_type }} />
        )}
      </div>
    </WizardShell>
  )
}
