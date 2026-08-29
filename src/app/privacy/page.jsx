export const metadata = {
  title: 'Privacy Policy | Grano',
  description: "Grano's Privacy Policy.",
}

function Section({ number, title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif text-[20px] sm:text-[22px] font-semibold text-soil mb-3">
        {number}. {title}
      </h2>
      <div className="flex flex-col gap-3 text-[14px] text-soil/90 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function List({ items }) {
  return (
    <ul className="flex flex-col gap-1.5 pl-5 list-disc marker:text-stone">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

function SubHeading({ children }) {
  return <p className="text-[12px] font-semibold uppercase tracking-wide text-rust mt-1">{children}</p>
}

function Example({ children }) {
  return <div className="bg-linen rounded-lg px-4 py-3 text-[13px] text-soil">{children}</div>
}

export default function PrivacyPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      <p className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">Legal</p>
      <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold text-soil tracking-tight mb-1">Grano Privacy Policy</h1>
      <p className="text-[13px] text-stone mb-10">Last Updated: August 9, 2026</p>

      <div className="flex flex-col gap-3 text-[14px] text-soil/90 leading-relaxed mb-10">
        <p>
          Grano ("Grano," "we," "us," or "our") respects your privacy and is committed to protecting the information you provide when using Grano.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, disclose, and protect information when you use the Grano website, applications, marketplace, business profiles, messaging services, and other services we provide (collectively, the "Services").
        </p>
        <p>By using Grano, you acknowledge the practices described in this Privacy Policy.</p>
      </div>

      <Section number={1} title="Information We Collect">
        <p>We collect information you provide directly, information generated through your use of Grano, and, where permitted, information received from third parties.</p>
        <SubHeading>A. Account Information</SubHeading>
        <p>When you create a Grano account, we may collect:</p>
        <List items={[
          'Name', 'Email address', 'Phone number', 'Password or authentication information',
          'Profile photo', 'Account type', 'User preferences', 'Location information',
          'Other information you choose to provide',
        ]} />
      </Section>

      <Section number={2} title="Business Profile Information">
        <p>If you create a business profile, we may collect information including:</p>
        <List items={[
          'Business name', 'Business description', 'Business story', 'Business category', 'Business type',
          'Business location', 'Business hours', 'Website', 'Social media accounts', 'Contact information',
          'Business logo', 'Business photos', 'Products', 'Prices', 'Availability', 'Events',
          'Wholesale information', 'Business relationships', 'Other information you choose to make available through your profile',
        ]} />
        <p>Some of this information may be publicly visible.</p>
        <p>You are responsible for determining what information you publish through your business profile.</p>
      </Section>

      <Section number={3} title="Business Verification and Documents">
        <p>Grano may allow businesses to submit documents for verification, including:</p>
        <List items={[
          'Business licenses', 'Food permits', 'Cottage food licenses', 'Certifications',
          'Insurance documentation', 'Business registration documents', 'Other business-related documentation',
        ]} />
        <p>These documents may contain personal or sensitive business information.</p>
        <p>Documents submitted for verification are not automatically made public.</p>
        <p>Grano may use submitted documents to:</p>
        <List items={[
          'Verify business information', 'Confirm licenses or permits', 'Determine eligibility for certain Grano features',
          'Maintain business verification status', 'Protect the integrity of the Grano marketplace', 'Comply with legal obligations',
        ]} />
        <p>Where appropriate, Grano may display a verification indicator on a public business profile without displaying the underlying document.</p>
        <p>For example:</p>
        <Example>
          <div className="flex items-center gap-1.5"><span aria-hidden="true">✓</span> Business Verified</div>
          <div className="flex items-center gap-1.5"><span aria-hidden="true">✓</span> Cottage Food License Verified</div>
        </Example>
        <p>We may retain verification information for as long as reasonably necessary to maintain the integrity of the platform and comply with applicable legal requirements.</p>
      </Section>

      <Section number={4} title="Products and Listings">
        <p>When a business creates a product listing, we may collect:</p>
        <List items={[
          'Product name', 'Description', 'Ingredients', 'Allergen information', 'Photos', 'Price',
          'Inventory', 'Availability', 'Wholesale information', 'Pickup and delivery information',
          'Product categories', 'Other product information',
        ]} />
        <p>Product information that a business chooses to publish may be publicly visible.</p>
      </Section>

      <Section number={5} title="Orders and Transactions">
        <p>If you purchase or sell through Grano, we may collect information associated with the transaction, including:</p>
        <List items={[
          'Buyer information', 'Seller information', 'Products purchased', 'Order quantity', 'Order amount',
          'Order status', 'Pickup information', 'Delivery information', 'Transaction date', 'Refunds',
          'Cancellations', 'Related communications',
        ]} />
        <p>Payment card information may be processed by third-party payment processors.</p>
        <p>Where payment processing is provided by a third party, Grano may not receive or store your complete payment card number.</p>
      </Section>

      <Section number={6} title="Messages and Inquiries">
        <p>Grano may provide messaging, inquiries, and communication features.</p>
        <p>Depending on how you use these features, we may collect:</p>
        <List items={[
          'Messages', 'Inquiries', 'Attachments', 'Recipient information', 'Sender information',
          'Dates and times', 'Business requests', 'Other communications submitted through Grano',
        ]} />
        <p>We use this information to provide communication functionality, facilitate business relationships, prevent abuse, and maintain the security of the platform.</p>
      </Section>

      <Section number={7} title="Our Local Network">
        <p>Grano allows businesses to create business relationships through features such as Our Local Network.</p>
        <p>Businesses may identify other businesses that:</p>
        <List items={['They source from', 'They supply', 'They work with']} />
        <p>Businesses may also associate specific products with these relationships.</p>
        <p>Once a relationship is accepted and designated as public, information about that relationship may appear publicly on the participating businesses' profiles.</p>
        <p>For example:</p>
        <Example>
          <div className="font-semibold">24 Karat Bakery</div>
          <div className="text-stone">We source from</div>
          <div>Midwest Farm — Organic Wheat Flour</div>
        </Example>
        <p>Businesses can manage the visibility of eligible relationships through their account settings.</p>
        <p>The purpose of this feature is to help users understand and discover the local businesses that make up their food ecosystem.</p>
      </Section>

      <Section number={8} title="Reviews">
        <p>If you submit a review, we may collect:</p>
        <List items={[
          'Review content', 'Rating', 'Business or product reviewed', 'Date of review',
          'Your public profile name', 'Other information associated with the review',
        ]} />
        <p>Reviews may be publicly visible.</p>
        <p>Do not include sensitive personal information in a public review.</p>
      </Section>

      <Section number={9} title="Events">
        <p>Businesses may create events through Grano.</p>
        <p>Event information may include:</p>
        <List items={[
          'Event name', 'Date and time', 'Location', 'Description', 'Business hosting the event',
          'Photos', 'Links', 'Other event information',
        ]} />
        <p>Public event information may be visible to anyone visiting Grano.</p>
      </Section>

      <Section number={10} title="Location Information">
        <p>Grano may collect location information in several ways.</p>
        <p>You may voluntarily provide:</p>
        <List items={['Business address', 'Pickup location', 'Event location', 'Delivery area', 'General business location']} />
        <p>Where permitted and necessary for certain features, Grano may also collect approximate or precise device location if you grant permission.</p>
        <p>You can control device location permissions through your device settings.</p>
        <p>We may use location information to:</p>
        <List items={[
          'Show nearby businesses', 'Show local producers', 'Display relevant events', 'Improve search results',
          'Facilitate pickup or delivery', 'Provide location-based features',
        ]} />
        <p>We do not require precise location information for basic account functionality unless specifically necessary for a feature.</p>
      </Section>

      <Section number={11} title="Information We Collect Automatically">
        <p>When you use Grano, we may automatically collect information such as:</p>
        <List items={[
          'IP address', 'Browser type', 'Device type', 'Operating system', 'Pages visited', 'Referring pages',
          'Time spent on pages', 'Approximate location', 'Search activity', 'Interactions with features',
          'Error and diagnostic information',
        ]} />
        <p>This information helps us operate, secure, and improve Grano.</p>
      </Section>

      <Section number={12} title="Cookies and Similar Technologies">
        <p>Grano may use cookies, local storage, pixels, and similar technologies.</p>
        <p>These technologies may be used to:</p>
        <List items={[
          'Keep you signed in', 'Remember preferences', 'Maintain security', 'Understand how users interact with Grano',
          'Improve performance', 'Analyze traffic', 'Measure marketing effectiveness',
        ]} />
        <p>You may be able to control cookies through your browser settings.</p>
        <p>Disabling certain cookies may affect the functionality of Grano.</p>
      </Section>

      <Section number={13} title="How We Use Information">
        <p>We may use information we collect to:</p>

        <SubHeading>Provide Grano</SubHeading>
        <List items={[
          'Create and manage accounts', 'Display profiles', 'Process orders', 'Facilitate payments',
          'Connect businesses', 'Provide messaging', 'Facilitate wholesale transactions', 'Display products',
          'Manage events', 'Provide customer support',
        ]} />

        <SubHeading>Improve Grano</SubHeading>
        <List items={[
          'Analyze platform usage', 'Improve search', 'Improve recommendations', 'Develop new features',
          'Understand how businesses and consumers use Grano', 'Troubleshoot technical issues',
        ]} />

        <SubHeading>Protect Grano</SubHeading>
        <List items={[
          'Detect fraud', 'Prevent abuse', 'Protect accounts', 'Investigate suspicious activity',
          'Enforce our Terms', 'Maintain platform security',
        ]} />

        <SubHeading>Communicate with you</SubHeading>
        <p>We may send:</p>
        <List items={[
          'Account notifications', 'Order updates', 'Business inquiries', 'Network invitations',
          'Security alerts', 'Service announcements', 'Other transactional communications',
        ]} />
        <p>Where required by law, we will obtain appropriate consent before sending marketing communications.</p>
      </Section>

      <Section number={14} title="How We Share Information">
        <p>We do not sell your personal information simply because you use Grano.</p>
        <p>We may share information in the following circumstances.</p>

        <SubHeading>A. Public Information</SubHeading>
        <p>Information you intentionally publish may be publicly available.</p>
        <p>This may include:</p>
        <List items={[
          'Business name', 'Business profile', 'Business story', 'Business location', 'Products', 'Events',
          'Public reviews', 'Public network relationships', 'Business contact information you choose to publish',
          'Public photos', 'Social links',
        ]} />
        <p>Before publishing information, consider whether you want it to be publicly accessible.</p>

        <SubHeading>B. Other Grano Users</SubHeading>
        <p>Information may be shared with other users when necessary to provide Grano's features.</p>
        <p>For example:</p>
        <p>A restaurant may see information about a producer when contacting that producer about wholesale products.</p>
        <p>A producer may see information associated with a restaurant inquiry.</p>
        <p>A business may see information associated with an accepted Local Network relationship.</p>

        <SubHeading>C. Service Providers</SubHeading>
        <p>We may share information with companies that help us operate Grano, including providers for:</p>
        <List items={[
          'Hosting', 'Database services', 'Authentication', 'Payments', 'Email', 'Messaging', 'Analytics',
          'Security', 'Customer support', 'Infrastructure', 'File storage',
        ]} />
        <p>These providers are permitted to use information only as necessary to provide services to Grano or as otherwise permitted by applicable law.</p>

        <SubHeading>D. Legal Requirements</SubHeading>
        <p>We may disclose information when reasonably necessary to:</p>
        <List items={[
          'Comply with applicable law', 'Respond to legal requests', 'Protect the rights or safety of Grano',
          'Protect users', 'Investigate fraud or abuse', 'Enforce our Terms',
        ]} />

        <SubHeading>E. Business Transfers</SubHeading>
        <p>If Grano is involved in a merger, acquisition, financing, restructuring, sale of assets, or similar transaction, information may be transferred as part of that transaction, subject to applicable law.</p>
      </Section>

      <Section number={15} title="We Do Not Sell Your Business Documents">
        <p>Business verification documents are treated differently from public business profile information.</p>
        <p>Grano does not make uploaded licenses, permits, insurance documents, or similar verification documents publicly available simply because they were uploaded.</p>
        <p>We use those documents for legitimate business verification and platform operations.</p>
        <p>We may share information from those documents with service providers or third parties where reasonably necessary for verification, security, legal compliance, or operation of the Services.</p>
      </Section>

      <Section number={16} title="Data Retention">
        <p>We retain information for as long as reasonably necessary to:</p>
        <List items={[
          'Provide the Services', 'Maintain accounts', 'Complete transactions', 'Maintain business records',
          'Resolve disputes', 'Prevent fraud', 'Maintain security', 'Comply with legal obligations',
        ]} />
        <p>Retention periods may vary depending on the type of information and how it is used.</p>
        <p>When information is no longer reasonably necessary, we may delete, anonymize, or securely dispose of it, subject to legal and operational requirements.</p>
      </Section>

      <Section number={17} title="Account and Profile Controls">
        <p>Depending on the features available, you may be able to:</p>
        <List items={[
          'Edit your account information', 'Edit your business profile', 'Delete or archive products',
          'Manage public information', 'Manage network relationships', 'Change communication preferences',
          'Delete your account',
        ]} />
        <p>Some information may remain in our records where required for legal, security, fraud prevention, transaction, or legitimate business purposes.</p>
      </Section>

      <Section number={18} title="Business Network Visibility">
        <p>Businesses can manage the visibility of eligible Local Network relationships.</p>
        <p>A business relationship may be:</p>
        <SubHeading>Public</SubHeading>
        <p>Visible on the business profile.</p>
        <SubHeading>Private</SubHeading>
        <p>Visible to participating businesses but not displayed publicly.</p>
        <p>A pending network invitation is not displayed as a confirmed public relationship until accepted.</p>
      </Section>

      <Section number={19} title="Security">
        <p>We use reasonable administrative, technical, and organizational safeguards designed to protect information.</p>
        <p>These measures may include:</p>
        <List items={[
          'Access controls', 'Authentication', 'Encryption where appropriate', 'Secure hosting', 'Monitoring',
          'Security updates', 'Restricted access to sensitive information',
        ]} />
        <p>However, no internet transmission or storage system can be guaranteed to be completely secure.</p>
        <p>You are responsible for protecting your account credentials and should notify us if you believe your account has been compromised.</p>
      </Section>

      <Section number={20} title="Children's Privacy">
        <p>Grano is not intended for children under 13.</p>
        <p>We do not knowingly collect personal information from children under 13.</p>
        <p>If we learn that we have collected personal information from a child under 13, we will take reasonable steps to delete it.</p>
      </Section>

      <Section number={21} title="Third-Party Links">
        <p>Grano may contain links to third-party websites, including:</p>
        <List items={['Business websites', 'Social media', 'Payment providers', 'Event websites', 'Other external services']} />
        <p>We are not responsible for the privacy practices of third-party websites.</p>
        <p>We encourage you to review their privacy policies before providing personal information.</p>
      </Section>

      <Section number={22} title="Third-Party Services">
        <p>Grano may use third-party services to provide certain functionality.</p>
        <p>These may include:</p>
        <List items={['Payment processing', 'Hosting', 'Authentication', 'Analytics', 'Email', 'Maps', 'File storage', 'Security']} />
        <p>Those services may collect or process information according to their own privacy policies.</p>
      </Section>

      <Section number={23} title="Your Privacy Rights">
        <p>Depending on where you live, you may have rights regarding your personal information.</p>
        <p>These may include the right to:</p>
        <List items={[
          'Know what personal information we collect.', 'Request access to personal information.',
          'Request correction of inaccurate information.', 'Request deletion of certain information.',
          'Request a copy of certain information.', 'Opt out of certain forms of data processing.',
          'Withdraw consent where processing is based on consent.', 'Appeal certain privacy decisions.',
        ]} />
        <p>The availability of these rights depends on applicable law.</p>
        <p>To exercise a privacy right, contact us using the information below.</p>
        <p>We may need to verify your identity before completing certain requests.</p>
      </Section>

      <Section number={24} title="California Residents">
        <p>If you are a California resident, you may have additional rights under the California Consumer Privacy Act and other applicable California privacy laws.</p>
        <p>Subject to applicable exceptions, California residents may have rights to:</p>
        <List items={[
          'Know what personal information is collected.', 'Access personal information.', 'Request deletion.',
          'Request correction.', 'Opt out of certain sales or sharing of personal information.',
          'Limit certain uses of sensitive personal information where applicable.',
          'Receive equal treatment when exercising privacy rights.',
        ]} />
        <p>Grano does not sell personal information for monetary consideration.</p>
        <p>If our data practices change in a way that constitutes a sale or sharing under applicable law, we will update this Privacy Policy and provide any legally required opt-out mechanisms.</p>
      </Section>

      <Section number={25} title="Illinois Residents">
        <p>Grano is based in Illinois and may collect information from Illinois residents.</p>
        <p>We process personal information in accordance with applicable Illinois law.</p>
        <p>Illinois residents may contact us regarding questions or requests concerning their personal information using the contact information below.</p>
      </Section>

      <Section number={26} title="International Users">
        <p>Grano may be accessed from outside the United States.</p>
        <p>If you access Grano from another country, your information may be transferred to and processed in the United States or other jurisdictions where our service providers operate. Privacy laws in those jurisdictions may differ from those in your country.</p>
      </Section>

      <Section number={27} title="Changes to This Privacy Policy">
        <p>We may update this Privacy Policy from time to time.</p>
        <p>If we make material changes, we may provide notice through Grano or by other reasonable means. The "Last Updated" date at the top of this policy indicates when it was most recently revised.</p>
      </Section>
    </div>
  )
}
