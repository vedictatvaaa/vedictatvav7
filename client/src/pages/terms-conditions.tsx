import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsConditions() {
  return (
    <div className="w-full pb-20 bg-[#FAFAF7] min-h-screen">
      <div className="bg-[#6D2B35] text-white py-10 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-serif mb-2" data-testid="text-terms-heading">Terms & Conditions</h1>
          <p className="text-white/50 text-sm">Governing the use of vedictatva.com</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 md:mt-8 max-w-3xl">
        <Link href="/">
          <button className="flex items-center gap-2 text-[#6D2B35] hover:text-[#D4AF37] text-sm mb-8 transition-colors" data-testid="btn-back-home">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </Link>

        <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-12 shadow-sm border border-[#6D2B35]/5 space-y-6 md:space-y-8">
          <div className="text-center border-b border-[#6D2B35]/5 pb-6">
            <p className="text-xs text-[#5a4a3a]/40 uppercase tracking-wider">Vedic Tatva Private Limited</p>
            <p className="text-xs text-[#5a4a3a]/30 mt-1">Last updated: February 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">1. Introduction</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Welcome to vedictatva.com, operated by Vedic Tatva Private Limited ("Company", "we", "us", "our"). By accessing or using our website, mobile application, or any of our services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must discontinue use of our platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">2. Definitions</h2>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li><strong>"Platform"</strong> refers to the website vedictatva.com and any associated mobile applications.</li>
              <li><strong>"User"</strong> or <strong>"You"</strong> refers to any individual or entity accessing or using the Platform.</li>
              <li><strong>"Products"</strong> refers to physical goods listed for sale on the Platform, including but not limited to rudraksha, incense, puja samagri, idols, and spiritual wearables.</li>
              <li><strong>"Services"</strong> refers to pandit bookings, puja bookings, astrology consultations, donations, and any other service offerings on the Platform.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">3. Eligibility</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              You must be at least 18 years of age to use this Platform. By using the Platform, you represent and warrant that you are of legal age and have the legal capacity to enter into binding agreements. If you are accessing the Platform on behalf of an organization, you represent that you have the authority to bind that organization to these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">4. Account Registration</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Certain features of the Platform may require account registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. Vedic Tatva Private Limited reserves the right to suspend or terminate accounts that contain inaccurate or fraudulent information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">5. Products & Pricing</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              We make every effort to display accurate product descriptions, images, and pricing on the Platform. However, we do not warrant that product descriptions, images, pricing, or other content on the Platform is accurate, complete, reliable, current, or error-free. All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated. We reserve the right to modify prices at any time without prior notice. In the event of a pricing error, we reserve the right to cancel any orders placed at the incorrect price.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">6. Orders & Payment</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Placing an order on the Platform constitutes an offer to purchase the product(s). All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including suspected fraudulent activity. Payment is processed through secure third-party payment gateways (including Razorpay). We do not store your payment card details on our servers. Cash on Delivery (COD) is available for select pin codes and may carry additional handling charges.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">7. Shipping & Delivery</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              We aim to deliver products within the estimated delivery timelines displayed at checkout. Delivery timelines are estimates and not guarantees. Vedic Tatva Private Limited shall not be liable for delays caused by logistics partners, natural calamities, strikes, or other events beyond our reasonable control. Risk of loss and title for products passes to you upon delivery to the shipping carrier.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">8. Service Bookings</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Pandit bookings, puja services, and astrology consultations are facilitated through the Platform. While we verify the credentials of pandits and astrologers listed on our Platform, we act as an intermediary and do not guarantee the outcome or quality of any ritual or consultation. Service bookings are subject to availability and may be rescheduled in case of unforeseen circumstances. Service-related payments are non-refundable unless explicitly stated otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">9. Intellectual Property</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              All content on the Platform, including but not limited to text, graphics, logos, images, audio clips, digital downloads, data compilations, and software, is the property of Vedic Tatva Private Limited or its content suppliers and is protected by Indian and international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any content on the Platform without our prior written consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">10. User Conduct</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">You agree not to:</p>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li>Use the Platform for any unlawful purpose or in violation of any applicable law or regulation.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
              <li>Interfere with or disrupt the Platform or servers or networks connected to the Platform.</li>
              <li>Attempt to gain unauthorized access to any portion of the Platform or any systems or networks.</li>
              <li>Submit false reviews, ratings, or feedback on the Platform.</li>
              <li>Use automated systems (bots, scrapers, etc.) to access or interact with the Platform without permission.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">11. Limitation of Liability</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              To the fullest extent permitted by law, Vedic Tatva Private Limited, its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of (or inability to access or use) the Platform. Our total liability to you for any claims arising from your use of the Platform shall not exceed the amount paid by you for the specific product or service giving rise to the claim.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">12. Indemnification</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              You agree to indemnify, defend, and hold harmless Vedic Tatva Private Limited, its directors, officers, employees, and agents from and against any and all claims, liabilities, damages, losses, and expenses (including reasonable attorney's fees) arising out of or in any way connected with your access to or use of the Platform, your violation of these Terms, or your infringement of any intellectual property or other rights of any third party.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">13. Modifications to Terms</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Vedic Tatva Private Limited reserves the right to update, modify, or replace these Terms & Conditions at any time. Changes will be effective immediately upon posting on the Platform. Your continued use of the Platform after any such changes constitutes your acceptance of the revised terms. It is your responsibility to review these terms periodically for any updates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">14. Governing Law & Jurisdiction</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              These Terms & Conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts at Delhi, specifically the Hon'ble Delhi High Court and courts subordinate thereto.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-[#6D2B35]/5">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">Contact Us</h2>
            <div className="text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1">
              <p><strong>Vedic Tatva Private Limited</strong></p>
              <p>Email: <a href="mailto:ecom@vedictatva.com" className="text-[#6D2B35] underline">ecom@vedictatva.com</a></p>
              <p>Phone: <a href="tel:+918447844702" className="text-[#6D2B35] underline">8447-8447-02</a></p>
              <p>Website: <a href="https://vedictatva.com" className="text-[#6D2B35] underline">vedictatva.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
