export const metadata = {
  title: 'Terms of Service | Grano',
  description: "Grano's Terms of Service.",
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

export default function TermsPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      <p className="text-[12px] font-semibold tracking-wide uppercase text-stone mb-2">Legal</p>
      <h1 className="font-serif text-[32px] sm:text-[40px] font-semibold text-soil tracking-tight mb-1">Grano Terms of Service</h1>
      <p className="text-[13px] text-stone mb-10">Last Updated: August 9, 2026</p>

      <div className="flex flex-col gap-3 text-[14px] text-soil/90 leading-relaxed mb-10">
        <p>
          Welcome to Grano ("Grano," "we," "us," or "our"). Grano is a platform designed to help consumers, producers, food and beverage vendors, restaurants, buyers, and other local food businesses discover one another, share information, build business relationships, and, where available, buy and sell products and services.
        </p>
        <p>
          By accessing or using Grano, including our website, marketplace, business profiles, messaging tools, wholesale tools, and other services (collectively, the "Services"), you agree to these Terms of Service ("Terms").
        </p>
        <p>If you do not agree to these Terms, you should not use the Services.</p>
      </div>

      <Section number={1} title="Who Can Use Grano">
        <p>You must be at least 18 years old, or the age of majority in your jurisdiction, to create a business or purchasing account on Grano.</p>
        <p>By using Grano, you represent that:</p>
        <List items={[
          'You have the legal capacity to enter into these Terms.',
          'The information you provide is accurate and current.',
          'You will maintain the accuracy of your account information.',
          'You will comply with all applicable federal, state, and local laws and regulations.',
          'You are authorized to act on behalf of any business you represent.',
        ]} />
        <p>If you create an account for a business, you represent that you have authority to act on behalf of that business.</p>
      </Section>

      <Section number={2} title="What Grano Is">
        <p>Grano provides technology that allows local food businesses and consumers to discover and connect with one another.</p>
        <p>Depending on the features available, Grano may allow users to:</p>
        <List items={[
          'Create personal and business profiles.',
          'Discover local producers, vendors, restaurants, and other businesses.',
          'List products and services.',
          'Browse products.',
          'Communicate with businesses.',
          'Submit and respond to inquiries.',
          'Create wholesale relationships.',
          'Create sourcing requests.',
          'Establish business network relationships.',
          'Display business events.',
          'Follow businesses.',
          'Submit reviews.',
          'Buy or sell products through the platform.',
          'Upload business licenses, permits, certifications, and other documentation.',
          'Participate in local food-related events and activities.',
        ]} />
        <p>Not all features may be available to all users or in all locations.</p>
      </Section>

      <Section number={3} title="Grano Is a Platform, Not the Seller">
        <p>Unless explicitly stated otherwise, Grano is not the producer, manufacturer, restaurant, retailer, distributor, or seller of products listed by users.</p>
        <p>Businesses using Grano are generally responsible for:</p>
        <List items={[
          'Their products.', 'Their prices.', 'Product descriptions.', 'Ingredients and allergens.',
          'Inventory.', 'Availability.', 'Licenses and permits.', 'Food safety.', 'Packaging.',
          'Fulfillment.', 'Pickup and delivery.', 'Taxes.', 'Refunds and cancellations.',
          'Compliance with applicable laws.',
        ]} />
        <p>When you purchase from another Grano user, you are generally purchasing from that business rather than from Grano.</p>
        <p>Grano does not guarantee the quality, safety, legality, authenticity, availability, or accuracy of products or services offered by users.</p>
      </Section>

      <Section number={4} title="Business Profiles">
        <p>Businesses may create profiles that contain information such as:</p>
        <List items={[
          'Business name.', 'Business description.', 'Story.', 'Location.', 'Contact information.',
          'Products.', 'Events.', 'Business hours.', 'Photos.', 'Social media links.',
          'Business categories.', 'Wholesale information.', 'Certifications and licenses.',
          'Business relationships.',
        ]} />
        <p>Businesses are responsible for ensuring that their profile information is accurate and does not mislead users.</p>
        <p>You may not impersonate another business or create a profile for a business without authorization.</p>
      </Section>

      <Section number={5} title="Business Verification and Documents">
        <p>Grano may allow businesses to submit documents such as:</p>
        <List items={[
          'Business licenses.', 'Food permits.', 'Cottage food licenses.', 'Certifications.',
          'Insurance documentation.', 'Tax or registration documents.', 'Other business-related records.',
        ]} />
        <p>Submitting a document does not necessarily mean that Grano has independently verified the information contained within it.</p>
        <p>Where Grano verifies information, we may display an appropriate verification indicator.</p>
        <p>A Grano verification badge does not constitute a guarantee that a business is safe, compliant, insured, licensed, or otherwise suitable for a particular transaction.</p>
        <p>Businesses remain responsible for maintaining all licenses, permits, certifications, insurance, and other requirements applicable to their activities.</p>
      </Section>

      <Section number={6} title="Products and Listings">
        <p>Businesses may list products or services on Grano.</p>
        <p>Businesses are responsible for ensuring that listings:</p>
        <List items={[
          'Accurately describe the product.', 'Display accurate pricing.', 'Accurately describe availability.',
          'Include legally required information.', 'Do not contain deceptive claims.',
          'Comply with applicable food, labeling, advertising, and consumer protection laws.',
        ]} />
        <p>Grano may remove or restrict listings that violate these Terms or applicable law.</p>
      </Section>

      <Section number={7} title="Food Safety and Allergens">
        <p>Food businesses are solely responsible for complying with applicable food safety, labeling, allergen, licensing, preparation, storage, and transportation requirements.</p>
        <p>Grano does not independently inspect or certify food products unless expressly stated.</p>
        <p>Consumers with allergies, dietary restrictions, or other health-related concerns should contact the business directly before purchasing or consuming a product.</p>
        <p>Businesses are responsible for providing accurate ingredient and allergen information where required by law.</p>
      </Section>

      <Section number={8} title="Orders and Payments">
        <p>Where Grano offers purchasing or payment functionality, additional terms may apply.</p>
        <p>Businesses are responsible for fulfilling accepted orders accurately and on time.</p>
        <p>Users are responsible for providing accurate payment, contact, pickup, and delivery information.</p>
        <p>Grano may use third-party payment processors to process transactions.</p>
        <p>Grano does not store complete payment card information when payment processing is handled by a third-party payment provider.</p>
        <p>Payment processing may be subject to the terms and privacy policies of the applicable payment provider.</p>
      </Section>

      <Section number={9} title="Wholesale Transactions">
        <p>Grano may allow restaurants, retailers, and other buyers to discover producers and vendors for wholesale purchasing.</p>
        <p>Businesses participating in wholesale transactions are responsible for agreeing on:</p>
        <List items={[
          'Price.', 'Quantity.', 'Minimum order requirements.', 'Delivery or pickup.', 'Payment terms.',
          'Product specifications.', 'Timing.', 'Returns or cancellations.',
        ]} />
        <p>Grano may facilitate communications and transactions but does not guarantee that either party will fulfill its obligations.</p>
      </Section>

      <Section number={10} title="Local Network">
        <p>Grano may allow businesses to publicly display their relationships with other businesses through features such as Our Local Network.</p>
        <p>Businesses may indicate that they:</p>
        <List items={['Source from another business.', 'Supply another business.', 'Work with another business.']} />
        <p>Businesses may also link specific products to these relationships.</p>
        <p>Businesses may not falsely claim a relationship with another business.</p>
        <p>Where Grano requires approval from both parties, a relationship will not be displayed as a confirmed relationship until the other business accepts it.</p>
        <p>Businesses are responsible for ensuring that their network relationships are accurate.</p>
      </Section>

      <Section number={11} title="Events">
        <p>Businesses may create and display events, including:</p>
        <List items={[
          'Farmers markets.', 'Pop-ups.', 'Coffee cart appearances.', 'Matcha events.', 'Tastings.',
          'Catering events.', 'Community events.', 'Other local food events.',
        ]} />
        <p>Businesses are responsible for the accuracy of event information and for complying with applicable laws and venue requirements.</p>
        <p>Grano does not guarantee that an event will occur as listed.</p>
      </Section>

      <Section number={12} title="User Content">
        <p>You may submit content to Grano, including:</p>
        <List items={[
          'Photos.', 'Videos.', 'Reviews.', 'Business descriptions.', 'Product information.', 'Messages.',
          'Comments.', 'Events.', 'Network relationships.', 'Other materials.',
        ]} />
        <p>You retain ownership of content you submit.</p>
        <p>However, by submitting content to Grano, you grant Grano a non-exclusive, worldwide, royalty-free license to host, reproduce, display, distribute, modify for formatting purposes, and otherwise use that content as necessary to operate, promote, and improve the Services.</p>
        <p>You represent that you have the rights necessary to submit the content.</p>
      </Section>

      <Section number={13} title="Reviews">
        <p>Users may be able to review businesses or products.</p>
        <p>Reviews must reflect genuine experiences.</p>
        <p>You may not:</p>
        <List items={[
          'Post fake reviews.', 'Pay for or solicit misleading reviews.',
          'Review a business in which you have a financial interest without appropriate disclosure.',
          'Threaten someone with a negative review.', 'Use reviews to harass or discriminate against another person or business.',
          'Post knowingly false information.',
        ]} />
        <p>Grano may remove reviews that violate these Terms.</p>
      </Section>

      <Section number={14} title="Messaging">
        <p>Grano may provide messaging and inquiry functionality.</p>
        <p>You may not use Grano messaging to:</p>
        <List items={[
          'Spam users.', 'Harass users.', 'Send malicious content.', 'Conduct fraudulent activity.',
          'Distribute illegal content.', 'Send unauthorized advertising.', 'Collect sensitive personal information without authorization.',
        ]} />
        <p>Grano may take action against accounts that misuse messaging functionality.</p>
      </Section>

      <Section number={15} title="Prohibited Activities">
        <p>You may not use Grano to:</p>
        <List items={[
          'Violate applicable law.', 'Commit fraud.', 'Impersonate another person or business.',
          'Create false business information.', 'Sell prohibited or illegal products.',
          'Misrepresent products or ingredients.', 'Upload fraudulent licenses or certifications.',
          'Manipulate reviews.', 'Scrape or systematically copy Grano content without permission.',
          "Attempt to access another user's account.", 'Interfere with the operation of the Services.',
          'Introduce malware or malicious code.', 'Circumvent security measures.',
          'Use Grano to discriminate unlawfully.', 'Engage in harassment, threats, or abuse.',
          'Use Grano for transactions that violate applicable regulations.',
        ]} />
        <p>Grano may suspend or terminate accounts involved in prohibited activity.</p>
      </Section>

      <Section number={16} title="Intellectual Property">
        <p>The Grano name, logo, website design, software, graphics, trademarks, and other Grano-owned materials are owned by or licensed to Grano and are protected by applicable intellectual property laws.</p>
        <p>You may not copy, modify, distribute, sell, or create derivative works from Grano's proprietary materials without permission.</p>
        <p>User-submitted content remains subject to Section 12.</p>
      </Section>

      <Section number={17} title="Third-Party Services">
        <p>Grano may integrate with third-party services, including:</p>
        <List items={[
          'Payment processors.', 'Hosting providers.', 'Mapping services.', 'Analytics providers.',
          'Authentication services.', 'Communication providers.', 'Other technology providers.',
        ]} />
        <p>Third-party services may have their own terms and privacy policies.</p>
        <p>Grano is not responsible for the availability or performance of third-party services.</p>
      </Section>

      <Section number={18} title="Availability of the Services">
        <p>We work to keep Grano available and reliable, but we do not guarantee that:</p>
        <List items={[
          'Grano will always be available.', 'The Services will be error-free.', 'Listings will always be accurate.',
          'Products will always be available.', 'Businesses will respond to inquiries.',
          'Transactions will be completed.', 'Events will occur.', "The Services will meet every user's requirements.",
        ]} />
        <p>We may modify, suspend, or discontinue portions of the Services.</p>
      </Section>

      <Section number={19} title="Account Suspension and Termination">
        <p>You may stop using Grano at any time.</p>
        <p>Grano may suspend or terminate an account if we reasonably believe that the user:</p>
        <List items={[
          'Violated these Terms.', 'Violated applicable law.', 'Engaged in fraudulent or harmful activity.',
          'Created a safety risk.', 'Misused the platform.', 'Provided materially false information.',
        ]} />
        <p>Where appropriate, we may provide notice before taking action.</p>
      </Section>

      <Section number={20} title="Disclaimers">
        <p className="uppercase text-[13px] tracking-wide">
          To the maximum extent permitted by law, Grano provides the Services "as is" and "as available."
        </p>
        <p className="uppercase text-[13px] tracking-wide">
          Grano disclaims warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranties arising from course of dealing or usage of trade.
        </p>
        <p className="uppercase text-[13px] tracking-wide">
          Grano does not guarantee the quality, safety, legality, or accuracy of user-provided products, services, businesses, reviews, or information.
        </p>
      </Section>

      <Section number={21} title="Limitation of Liability">
        <p className="uppercase text-[13px] tracking-wide">
          To the maximum extent permitted by law, Grano and its owners, employees, contractors, and affiliates will not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the Services.
        </p>
        <p className="uppercase text-[13px] tracking-wide">
          To the maximum extent permitted by law, Grano's total liability arising from your use of the Services will not exceed the greater of:
        </p>
        <ol className="flex flex-col gap-1.5 pl-5 list-decimal marker:text-stone uppercase text-[13px] tracking-wide">
          <li>The amount you paid to Grano during the preceding 12 months; or</li>
          <li>$100.</li>
        </ol>
        <p>Some jurisdictions do not allow certain limitations of liability, so portions of this section may not apply to you.</p>
      </Section>

      <Section number={22} title="Indemnification">
        <p>To the extent permitted by law, you agree to defend, indemnify, and hold harmless Grano and its owners, employees, contractors, and affiliates from claims, damages, liabilities, losses, and expenses arising from:</p>
        <List items={[
          'Your use of the Services.', 'Your violation of these Terms.', 'Your violation of applicable law.',
          'Your products or services.', 'Your business activities.', 'Your content.',
          'Your transactions with other users.',
        ]} />
      </Section>

      <Section number={23} title="Changes to These Terms">
        <p>We may update these Terms from time to time.</p>
        <p>When we make material changes, we may provide notice through the Services or by other reasonable means.</p>
        <p>Your continued use of Grano after updated Terms become effective constitutes acceptance of the updated Terms.</p>
      </Section>

      <Section number={24} title="Governing Law">
        <p>These Terms will be governed by the laws of the State of Illinois, without regard to its conflict-of-law principles, unless applicable law requires otherwise.</p>
        <p>Any dispute that cannot be resolved informally will be handled in a court of competent jurisdiction as permitted by applicable law.</p>
      </Section>
    </div>
  )
}
