import SourcingRequestsManager from './SourcingRequestsManager'

export default function SourcingContent({ ownerType, ownerId, requests }) {
  return (
    <div>
      <p className="text-[13px] text-stone mb-5">Tell Grano what you want to buy — other businesses can find you by what you need, not just where they sell.</p>
      <SourcingRequestsManager ownerType={ownerType} ownerId={ownerId} initialRequests={requests} />
    </div>
  )
}
