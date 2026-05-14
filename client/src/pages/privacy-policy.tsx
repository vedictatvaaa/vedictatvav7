import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="w-full pb-20 bg-[#FAFAF7] min-h-screen">
      <div className="bg-[#6D2B35] text-white py-10 md:py-14">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-serif mb-2" data-testid="text-privacy-heading">Privacy Policy</h1>
          <p className="text-white/50 text-sm">How we collect, use, and protect your data</p>
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
              Vedic Tatva Private Limited ("Company", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website vedictatva.com, use our services, or purchase our products. By using our Platform, you consent to the data practices described in this policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">2. Information We Collect</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">We may collect the following types of information:</p>
            <div className="space-y-3 pl-1">
              <div className="border-l-2 border-[#D4AF37]/30 pl-4">
                <h3 className="text-sm font-semibold text-[#6D2B35] mb-1">a) Personal Information</h3>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">Name, email address, phone number, shipping address, billing address, date of birth, and gotra (when voluntarily provided for puja or donation services).</p>
              </div>
              <div className="border-l-2 border-[#D4AF37]/30 pl-4">
                <h3 className="text-sm font-semibold text-[#6D2B35] mb-1">b) Payment Information</h3>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">Payment details are processed securely through our payment gateway partners (such as Razorpay). We do not store credit card numbers, debit card numbers, or UPI IDs on our servers.</p>
              </div>
              <div className="border-l-2 border-[#D4AF37]/30 pl-4">
                <h3 className="text-sm font-semibold text-[#6D2B35] mb-1">c) Usage Data</h3>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">IP address, browser type, device type, operating system, pages visited, time spent on pages, referral URLs, and other diagnostic data collected through cookies and analytics tools.</p>
              </div>
              <div className="border-l-2 border-[#D4AF37]/30 pl-4">
                <h3 className="text-sm font-semibold text-[#6D2B35] mb-1">d) Communication Data</h3>
                <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">Records of correspondence if you contact us via email, phone, or any communication channel on the Platform.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">3. How We Use Your Information</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">We use the collected information for the following purposes:</p>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li>To process and fulfil your orders and service bookings.</li>
              <li>To communicate with you about your orders, bookings, and account.</li>
              <li>To provide customer support and respond to your inquiries.</li>
              <li>To personalize your experience and deliver relevant content and product recommendations.</li>
              <li>To send promotional communications (with your consent), including offers, discounts, and new product announcements.</li>
              <li>To improve our website, products, and services based on usage patterns and feedback.</li>
              <li>To detect, prevent, and address fraud, security issues, or technical problems.</li>
              <li>To comply with legal obligations and enforce our terms of service.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">4. Cookies & Tracking Technologies</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand user behaviour. You can control cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">5. Data Sharing & Disclosure</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li><strong>Service Providers:</strong> Logistics partners, payment processors, and cloud service providers who assist in operating our Platform.</li>
              <li><strong>Pandits & Astrologers:</strong> Limited information necessary to facilitate your booked services (e.g., name, address for home visits).</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, acquisition, or sale of company assets.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">6. Data Security</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These include SSL encryption, secure payment gateways, access controls, and regular security audits. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">7. Data Retention</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              We retain your personal information only for as long as necessary to fulfil the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements. Order and transaction data may be retained for up to 7 years for tax and regulatory compliance purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">8. Your Rights</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-6 text-sm text-[#5a4a3a]/70 leading-relaxed space-y-1.5">
              <li>Access and obtain a copy of your personal data held by us.</li>
              <li>Request correction of inaccurate or incomplete personal data.</li>
              <li>Request deletion of your personal data (subject to legal retention requirements).</li>
              <li>Withdraw consent for promotional communications at any time.</li>
              <li>Lodge a complaint with the relevant data protection authority.</li>
            </ul>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              To exercise any of these rights, please contact us at <a href="mailto:ecom@vedictatva.com" className="text-[#6D2B35] underline">ecom@vedictatva.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">9. Third-Party Links</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Our Platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those external sites. We encourage you to review the privacy policies of any third-party services before providing your personal information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">10. Children's Privacy</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              Our Platform is not intended for children under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have inadvertently collected data from a child, we will take steps to delete that information promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">11. Changes to This Policy</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised "Last updated" date. We encourage you to review this policy periodically to stay informed about how we are protecting your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-serif text-[#6D2B35]">12. Governing Law & Jurisdiction</h2>
            <p className="text-sm text-[#5a4a3a]/70 leading-relaxed">
              This Privacy Policy is governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with this policy shall be subject to the exclusive jurisdiction of the courts at Delhi, specifically the Hon'ble Delhi High Court and courts subordinate thereto.
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
